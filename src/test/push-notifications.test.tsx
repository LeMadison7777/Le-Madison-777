import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PushNotificationSettings from "@/components/PushNotificationSettings";
import { api } from "@/lib/api";

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: apiMock }));

const vapidKey = (() => {
  const bytes = new Uint8Array(65);
  bytes[0] = 4;
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
})();

let subscription: {
  endpoint: string;
  toJSON: () => Record<string, unknown>;
  unsubscribe: ReturnType<typeof vi.fn>;
};
let registration: {
  active: object;
  pushManager: {
    getSubscription: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
};
let requestPermission: ReturnType<typeof vi.fn>;
let serviceWorker: { getRegistration: ReturnType<typeof vi.fn> };
let oldSecureContext: PropertyDescriptor | undefined;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("VITE_VAPID_PUBLIC_KEY", vapidKey);
  oldSecureContext = Object.getOwnPropertyDescriptor(window, "isSecureContext");
  Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
  vi.stubGlobal("PushManager", class PushManager {});

  requestPermission = vi.fn().mockResolvedValue("granted");
  vi.stubGlobal("Notification", { permission: "default", requestPermission });

  subscription = {
    endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
    toJSON: () => ({ endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint", keys: { p256dh: "test-key", auth: "test-auth" } }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };
  registration = {
    active: {},
    pushManager: {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue(subscription),
    },
  };
  registration.pushManager.subscribe.mockImplementation(async () => {
    registration.pushManager.getSubscription.mockResolvedValue(subscription);
    return subscription;
  });
  subscription.unsubscribe.mockImplementation(async () => {
    registration.pushManager.getSubscription.mockResolvedValue(null);
    return true;
  });
  serviceWorker = { getRegistration: vi.fn().mockResolvedValue(registration) };
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: serviceWorker });
  apiMock.mockResolvedValue({ subscribed: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  if (oldSecureContext) Object.defineProperty(window, "isSecureContext", oldSecureContext);
  else delete (window as Window & { isSecureContext?: boolean }).isSecureContext;
  delete (navigator as Navigator & { serviceWorker?: ServiceWorkerContainer }).serviceWorker;
});

describe("réglage frontend des notifications Push", () => {
  it("ne demande aucune permission au chargement et active l’abonnement après un clic explicite", async () => {
    render(<PushNotificationSettings />);

    expect(requestPermission).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /activer les notifications push/i }));

    await waitFor(() => expect(requestPermission).toHaveBeenCalledOnce());
    expect(registration.pushManager.subscribe).toHaveBeenCalledWith(expect.objectContaining({
      userVisibleOnly: true,
      applicationServerKey: expect.any(ArrayBuffer),
    }));
    await waitFor(() => expect(api).toHaveBeenCalledWith("/api/push-subscriptions", expect.objectContaining({ method: "POST" })));
    expect(apiMock.mock.calls[0][1]?.body).toContain(subscription.endpoint);
    expect(await screen.findByText(/notifications push sont activées/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /désactiver les notifications push/i })).toBeEnabled();
  });

  it("explique un navigateur non configuré et désactive le bouton sans demander la permission", async () => {
    vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "");
    render(<PushNotificationSettings />);

    expect(await screen.findByText(/clé publique VAPID/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /activer les notifications push/i })).toBeDisabled();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("n’interroge pas l’utilisateur si le service worker n’est pas actif", async () => {
    registration.active = null as unknown as object;
    render(<PushNotificationSettings />);

    expect(await screen.findByText(/service worker n’est pas actif/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /activer les notifications push/i })).toBeDisabled();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("refuse une clé VAPID malformée avant de demander la permission", async () => {
    vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "invalid-key");
    render(<PushNotificationSettings />);

    expect(await screen.findByText(/clé publique VAPID.*invalide/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /activer les notifications push/i })).toBeDisabled();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("explique un refus de permission et n’enregistre aucune souscription", async () => {
    requestPermission.mockResolvedValue("denied");
    render(<PushNotificationSettings />);
    fireEvent.click(await screen.findByRole("button", { name: /activer les notifications push/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/autorisation.*refusée/i);
    expect(api).not.toHaveBeenCalled();
    expect(registration.pushManager.subscribe).not.toHaveBeenCalled();
  });

  it("retire d’abord l’abonnement côté serveur puis le désactive sur cet appareil", async () => {
    registration.pushManager.getSubscription.mockResolvedValue(subscription);
    render(<PushNotificationSettings />);
    fireEvent.click(await screen.findByRole("button", { name: /désactiver les notifications push/i }));

    await waitFor(() => expect(api).toHaveBeenCalledWith("/api/push-subscriptions", {
      method: "DELETE",
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }));
    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
    expect(await screen.findByText(/notifications push sont désactivées/i)).toBeInTheDocument();
  });

  it("laisse désactiver un abonnement existant même si la clé publique manque", async () => {
    vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "");
    registration.pushManager.getSubscription.mockResolvedValue(subscription);
    render(<PushNotificationSettings />);

    fireEvent.click(await screen.findByRole("button", { name: /désactiver les notifications push/i }));
    await waitFor(() => expect(api).toHaveBeenCalledWith("/api/push-subscriptions", expect.objectContaining({ method: "DELETE" })));
    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
  });
});
