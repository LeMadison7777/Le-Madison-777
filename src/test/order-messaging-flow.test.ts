import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockPoolQuery,
  mockClientQuery,
  mockConnect,
  mockRelease,
  mockClient,
  mockSendPushToProfile,
} = vi.hoisted(() => {
  const poolQuery = vi.fn();
  const clientQuery = vi.fn();
  const release = vi.fn();
  const client = { query: clientQuery, release };
  const connect = vi.fn();
  const sendPushToProfile = vi.fn();

  return {
    mockPoolQuery: poolQuery,
    mockClientQuery: clientQuery,
    mockConnect: connect,
    mockRelease: release,
    mockClient: client,
    mockSendPushToProfile: sendPushToProfile,
  };
});

vi.mock("../../server/push.js", () => ({
  savePushSubscription: vi.fn(),
  deletePushSubscription: vi.fn(),
  sendPushToProfile: mockSendPushToProfile,
}));

vi.mock("../../server/database.js", () => ({
  pool: { query: mockPoolQuery, connect: mockConnect },
}));

vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(() => ({})),
  jwtVerify: vi.fn(async () => ({ payload: { sub: "auth-subject" } })),
}));

import { handleApi } from "../../server/api.js";

const buyerId = "11111111-1111-4111-8111-111111111111";
const sellerId = "22222222-2222-4222-8222-222222222222";
const listingId = "33333333-3333-4333-8333-333333333333";
const conversationId = "44444444-4444-4444-8444-444444444444";
const orderId = "55555555-5555-4555-8555-555555555555";

function databaseResult(rows: unknown[] = []) {
  return { rows, rowCount: rows.length };
}

function setupDatabase(options: { listingAvailable?: boolean; participant?: boolean } = {}) {
  const { listingAvailable = true, participant = true } = options;
  mockPoolQuery.mockImplementation(async (query: string) => {
    if (query.includes("FROM profiles WHERE auth_subject")) {
      return databaseResult([{ id: buyerId, role: "member", status: "active" }]);
    }
    if (query.includes("SELECT id,seller_id FROM listings")) {
      return databaseResult(listingAvailable ? [{ id: listingId, seller_id: sellerId }] : []);
    }
    if (query.includes("SELECT id,buyer_id,seller_id FROM conversations")) {
      return databaseResult(participant ? [{ id: conversationId, buyer_id: buyerId, seller_id: sellerId }] : []);
    }
    return databaseResult();
  });

  mockClientQuery.mockImplementation(async (query: string) => {
    if (query.includes("SELECT id,seller_id,price_xaf FROM listings")) {
      return databaseResult(listingAvailable ? [{ id: listingId, seller_id: sellerId, price_xaf: "15000" }] : []);
    }
    if (query.includes("SELECT value FROM platform_settings")) {
      return databaseResult([{ value: { seller_bps: 0 } }]);
    }
    if (query.includes("INSERT INTO orders")) {
      return databaseResult([{ id: orderId, status: "pending_payment", total: "15000" }]);
    }
    if (query.includes("INSERT INTO conversations")) {
      return databaseResult([{ id: conversationId }]);
    }
    if (query.includes("SELECT id,buyer_id,seller_id FROM conversations")) {
      return databaseResult(participant ? [{ id: conversationId, buyer_id: buyerId, seller_id: sellerId }] : []);
    }
    return databaseResult();
  });
  mockConnect.mockResolvedValue(mockClient);
}

async function post(path: string, body: Record<string, unknown>) {
  return handleApi(new Request(`http://localhost:8080${path}`, {
    method: "POST",
    headers: { authorization: "Bearer test-token", "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
}

describe("demandes d’article et livraison de messages", () => {
  beforeEach(() => {
  vi.resetAllMocks();

  mockSendPushToProfile.mockResolvedValue(undefined);

  vi.stubEnv("DATABASE_URL", "postgres://test.invalid/madclothes");
  vi.stubEnv("NEON_AUTH_JWKS_URL", "https://auth.example.invalid/jwks");
  setupDatabase();
});

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enregistre une demande et notifie le vendeur dans la même transaction", async () => {
    const response = await post("/api/orders", {
      listingId,
      deliveryMethod: "pickup",
      city: "Pointe-Noire",
      details: "Après-midi",
    });

    expect(response.status).toBe(201);
    expect(mockClientQuery).toHaveBeenCalledWith("COMMIT");
    expect(mockRelease).toHaveBeenCalledOnce();
    const notificationCall = mockClientQuery.mock.calls.find(([query]) => String(query).includes("'order_created'"));
    expect(notificationCall?.[1]).toEqual([sellerId, orderId]);
    expect(mockSendPushToProfile).toHaveBeenCalledOnce();
    expect(mockSendPushToProfile).toHaveBeenCalledWith(sellerId, {
      title: "Nouvelle commande",
      body: "Une nouvelle demande concerne l'un de vos articles.",
      url: "/commandes",
});
  });

  it("refuse une annonce indisponible et annule la transaction", async () => {
    setupDatabase({ listingAvailable: false });

    const response = await post("/api/orders", {
      listingId,
      deliveryMethod: "delivery",
      city: "Pointe-Noire",
    });

    expect(response.status).toBe(409);
    expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClientQuery.mock.calls.some(([query]) => String(query).includes("INSERT INTO orders"))).toBe(false);
  });

  it("retourne une erreur de validation lisible pour une ville vide ou composée d’espaces", async () => {
    const response = await post("/api/orders", {
      listingId,
      deliveryMethod: "delivery",
      city: "   ",
    });
    const result = await response.json() as { error: string };

    expect(response.status).toBe(400);
    expect(result.error).toContain("ville");
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("adresse le premier message au vendeur de l’annonce", async () => {
    const response = await post("/api/conversations", {
      listingId,
      message: "Bonjour, l’article est-il disponible ?",
    });

    expect(response.status).toBe(201);
    expect(mockClientQuery).toHaveBeenCalledWith("COMMIT");
    const notificationCall = mockClientQuery.mock.calls.find(([query]) => String(query).includes("'new_message'"));
    expect(notificationCall?.[1]).toEqual([sellerId, conversationId]);
  });

  it("refuse un message composé uniquement d’espaces avant toute écriture", async () => {
    const response = await post("/api/conversations", { listingId, message: "   " });
    const result = await response.json() as { error: string };

    expect(response.status).toBe(400);
    expect(result.error).toContain("message");
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("adresse un message de conversation à l’autre participant et valide la transaction", async () => {
    const response = await post(`/api/conversations/${conversationId}`, {
      message: "Bonjour, je vous réponds.",
    });

    expect(response.status).toBe(201);
    expect(mockConnect).toHaveBeenCalledOnce();
    expect(mockClientQuery).toHaveBeenCalledWith("BEGIN");
    expect(mockClientQuery).toHaveBeenCalledWith("COMMIT");
    const notificationCall = mockClientQuery.mock.calls.find(([query]) => String(query).includes("'new_message'"));
    expect(notificationCall?.[1]).toEqual([sellerId, conversationId]);
  });

  it("refuse un message dans une conversation dont le membre n’est pas participant", async () => {
    setupDatabase({ participant: false });

    const response = await post(`/api/conversations/${conversationId}`, {
      message: "Message hors conversation",
    });

    expect(response.status).toBe(404);
    expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClientQuery.mock.calls.some(([query]) => String(query).includes("INSERT INTO messages"))).toBe(false);
  });

  it("annule le message si sa notification échoue", async () => {
    const logError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockClientQuery.mockImplementation(async (query: string) => {
      if (query.includes("SELECT id,buyer_id,seller_id FROM conversations")) {
        return databaseResult([{ id: conversationId, buyer_id: buyerId, seller_id: sellerId }]);
      }
      if (query.includes("INSERT INTO notifications")) {
        throw Object.assign(new Error("notification write failed"), { code: "XX000" });
      }
      return databaseResult();
    });

    const response = await post(`/api/conversations/${conversationId}`, {
      message: "Message à ne pas laisser partiellement traité",
    });

    expect(response.status).toBe(500);
    expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    expect(logError).toHaveBeenCalled();
  });

  it("renvoie une référence de diagnostic sans exposer le détail interne d’une erreur serveur", async () => {
    const logError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockConnect.mockRejectedValue(new Error("sensitive database detail"));

    const response = await post("/api/orders", {
      listingId,
      deliveryMethod: "delivery",
      city: "Pointe-Noire",
    });
    const result = await response.json() as { error: string; reference: string };

    expect(response.status).toBe(500);
    expect(result.reference).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.error).toContain(result.reference);
    expect(JSON.stringify(result)).not.toContain("sensitive database detail");
    expect(logError).toHaveBeenCalled();
  });
});
