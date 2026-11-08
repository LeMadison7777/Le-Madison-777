import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPoolQuery, mockClientQuery, mockConnect, mockRelease, mockClient, mockJwtVerify, mockSetVapidDetails, mockSendNotification } = vi.hoisted(() => {
  const poolQuery = vi.fn();
  const clientQuery = vi.fn();
  const connect = vi.fn();
  const release = vi.fn();
  const client = { query: clientQuery, release };
  return {
    mockPoolQuery: poolQuery,
    mockClientQuery: clientQuery,
    mockConnect: connect,
    mockRelease: release,
    mockClient: client,
    mockJwtVerify: vi.fn(async () => ({ payload: { sub: "auth-subject" } })),
    mockSetVapidDetails: vi.fn(),
    mockSendNotification: vi.fn(),
  };
});

vi.mock("../../server/database.js", () => ({
  pool: { query: mockPoolQuery, connect: mockConnect },
}));

vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(() => ({})),
  jwtVerify: mockJwtVerify,
}));

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: mockSetVapidDetails,
    sendNotification: mockSendNotification,
  },
}));

import { handleApi } from "../../server/api.js";
import { sendPushToProfile } from "../../server/push.js";

const profileId = "11111111-1111-4111-8111-111111111111";
const otherProfileId = "22222222-2222-4222-8222-222222222222";
const endpoint = "https://fcm.googleapis.com/fcm/send/opaque-endpoint-token";
const p256dh = `B${"A".repeat(86)}`;
const auth = "A".repeat(22);
const subscription = { endpoint, keys: { p256dh, auth } };

function result(rows: unknown[] = []) {
  return { rows, rowCount: rows.length };
}

function setupDatabase(options: { count?: number; active?: boolean; subscriptions?: unknown[] } = {}) {
  const { count = 0, active = true, subscriptions = [] } = options;
  mockPoolQuery.mockImplementation(async (query: string) => {
    if (query.includes("FROM profiles WHERE auth_subject")) {
      return result([{ id: profileId, role: "member", status: active ? "active" : "suspended" }]);
    }
    if (query.includes("push_subscriptions") && query.includes("DELETE")) return result([{ endpoint }]);
    if (query.includes("push_subscriptions") && query.includes("SELECT")) return result(subscriptions as unknown[]);
    return result();
  });
  mockClientQuery.mockImplementation(async (query: string) => {
    if (query.toLowerCase().includes("count(*)") && query.includes("push_subscriptions")) return result([{ count }]);
    if (query.includes("INSERT INTO push_subscriptions")) return result([{ profile_id: profileId }]);
    if (query.includes("SELECT endpoint, p256dh, auth")) return result(subscriptions as unknown[]);
    return result();
  });
  mockConnect.mockResolvedValue(mockClient);
}

function request(method: "POST" | "DELETE", payload: unknown, authenticated = true) {
  return handleApi(new Request("http://localhost:8080/api/push-subscriptions", {
    method,
    headers: {
      ...(authenticated ? { authorization: "Bearer test-token" } : {}),
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  }));
}

describe("API de souscriptions Web Push", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("DATABASE_URL", "postgres://test.invalid/madclothes");
    vi.stubEnv("NEON_AUTH_JWKS_URL", "https://auth.example.invalid/jwks");
    vi.stubEnv("VAPID_PUBLIC_KEY", "server-public-key");
    vi.stubEnv("VAPID_PRIVATE_KEY", "server-private-key");
    vi.stubEnv("VAPID_SUBJECT", "mailto:push@example.invalid");
    setupDatabase();
  });

  afterEach(() => vi.unstubAllEnvs());

  it("enregistre une souscription validée pour le profil actif authentifié", async () => {
    const response = await request("POST", { subscription });

    expect(response.status).toBe(201);
    expect(mockPoolQuery).toHaveBeenCalledWith(
      "SELECT id, role, status FROM profiles WHERE auth_subject = $1",
      ["auth-subject"],
    );
    expect(mockClientQuery.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO push_subscriptions"))).toBe(true);
    expect(mockClientQuery).toHaveBeenCalledWith("COMMIT");
    expect(mockClientQuery.mock.calls.some(([sql]) => String(sql).includes("pg_advisory_xact_lock"))).toBe(true);
  });

  it("refuse les requêtes non authentifiées et les profils inactifs avant toute écriture", async () => {
    const missingAuth = await request("POST", { subscription }, false);
    expect(missingAuth.status).toBe(401);
    expect(mockConnect).not.toHaveBeenCalled();

    setupDatabase({ active: false });
    const inactive = await request("POST", { subscription });
    expect(inactive.status).toBe(403);
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it.each([
    "http://fcm.googleapis.com/fcm/send/token",
    "https://fcm.googleapis.com.attacker.invalid/fcm/send/token",
    "https://127.0.0.1/fcm/send/token",
    "https://user:pass@fcm.googleapis.com/fcm/send/token",
    "https://fcm.googleapis.com:8443/fcm/send/token",
    "https://unknown-push.invalid/token",
  ])("rejette l’endpoint non sûr %s avant la base et web-push", async (badEndpoint) => {
    const response = await request("POST", { subscription: { ...subscription, endpoint: badEndpoint } });
    expect(response.status).toBe(400);
    expect(mockConnect).not.toHaveBeenCalled();
    expect(mockSetVapidDetails).not.toHaveBeenCalled();
    expect(mockSendNotification).not.toHaveBeenCalled();
    expect(await response.text()).not.toContain(badEndpoint);
  });

  it("rejette les clés p256dh/auth mal formées ou hors limites sans les exposer", async () => {
    const secretKey = "not-a-valid-public-key-secret";
    const response = await request("POST", { subscription: { ...subscription, keys: { p256dh: secretKey, auth } } });

    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain(secretKey);
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("applique la limite de dix abonnements sous verrou transactionnel", async () => {
    setupDatabase({ count: 10 });
    const response = await request("POST", { subscription });

    expect(response.status).toBe(409);
    expect(mockClientQuery.mock.calls.some(([sql]) => String(sql).includes("pg_advisory_xact_lock"))).toBe(true);
    expect(mockClientQuery.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO push_subscriptions"))).toBe(false);
    expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
  });

  it("supprime uniquement l’endpoint du profil authentifié", async () => {
    const response = await request("DELETE", { endpoint });

    expect(response.status).toBe(200);
    const deletion = mockPoolQuery.mock.calls.find(([sql]) => String(sql).includes("DELETE FROM push_subscriptions"));
    expect(deletion?.[1]).toEqual([profileId, endpoint]);
    expect(String(deletion?.[0])).toContain("profile_id = $1");
  });

  it("laisse sendPushToProfile inactif sans configuration VAPID serveur", async () => {
    vi.stubEnv("VAPID_PUBLIC_KEY", "");
    vi.stubEnv("VAPID_PRIVATE_KEY", "");
    vi.stubEnv("VAPID_SUBJECT", "");

    await expect(sendPushToProfile(profileId, { title: "Notification", body: "Événement" })).resolves.toBeUndefined();
    expect(mockPoolQuery).not.toHaveBeenCalled();
    expect(mockSetVapidDetails).not.toHaveBeenCalled();
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("n’expose ni ne propage les erreurs fournisseur, et purge seulement un 404/410 pour ce profil", async () => {
    const privateEndpoint = "https://fcm.googleapis.com/fcm/send/private-token";
    const privateKey = "private-p256dh-value";
    const logError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const pushSubscription = { endpoint: privateEndpoint, p256dh: privateKey, auth: "private-auth-value" };
    setupDatabase({ subscriptions: [pushSubscription] });
    mockSendNotification.mockRejectedValueOnce(Object.assign(new Error("provider leaked detail"), { statusCode: 410 }));

    await expect(sendPushToProfile(profileId, { title: "Notification", body: "Événement" })).resolves.toBeUndefined();

    const purge = mockPoolQuery.mock.calls.find(([sql]) => String(sql).includes("DELETE FROM push_subscriptions"));
    expect(purge?.[1]).toEqual([profileId, privateEndpoint]);
    expect(JSON.stringify(logError.mock.calls)).not.toContain(privateEndpoint);
    expect(JSON.stringify(logError.mock.calls)).not.toContain(privateKey);
    expect(JSON.stringify(logError.mock.calls)).not.toContain("provider leaked detail");
  
    logError.mockRestore();
  });

  it("n’efface pas l’abonnement pour une erreur fournisseur non définitive", async () => {
    const pushSubscription = { endpoint, p256dh, auth };
    setupDatabase({ subscriptions: [pushSubscription] });
    mockSendNotification.mockRejectedValueOnce(Object.assign(new Error("temporary failure"), { statusCode: 503 }));

    await expect(sendPushToProfile(profileId, { title: "Notification", body: "Événement" })).resolves.toBeUndefined();
    expect(mockPoolQuery.mock.calls.some(([sql]) => String(sql).includes("DELETE FROM push_subscriptions"))).toBe(false);
  });
});
