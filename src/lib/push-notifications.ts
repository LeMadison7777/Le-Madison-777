import { api } from "@/lib/api";

export type PushStatus = {
  supported: boolean;
  configured: boolean;
  serviceWorkerReady: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  reason?: string;
};

function publicVapidKey(): string {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim() ?? "";
}

function secureContextAvailable(): boolean {
  return window.isSecureContext || ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}

function unsupportedStatus(reason: string): PushStatus {
  return {
    supported: false,
    configured: Boolean(publicVapidKey()),
    serviceWorkerReady: false,
    permission: "unsupported",
    subscribed: false,
    reason,
  };
}

function prerequisites(): PushStatus | null {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return unsupportedStatus("Les notifications Push ne sont pas disponibles dans cet environnement.");
  }
  if (!secureContextAvailable()) {
    return unsupportedStatus("Les notifications Push nécessitent une connexion HTTPS sécurisée.");
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
    return unsupportedStatus("Ce navigateur ne prend pas en charge les notifications Push.");
  }
  return null;
}

export function urlBase64ToUint8Array(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("La clé publique VAPID est invalide.");
  }
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const decoded = window.atob(value.replace(/-/g, "+").replace(/_/g, "/") + padding);
  const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  if (bytes.length !== 65 || bytes[0] !== 4) {
    throw new Error("La clé publique VAPID doit être une clé P-256 valide.");
  }
  return bytes;
}

export async function getPushStatus(): Promise<PushStatus> {
  const unsupported = prerequisites();
  if (unsupported) return unsupported;

  let registration: ServiceWorkerRegistration | undefined;
  let subscribed = false;
  try {
    registration = await navigator.serviceWorker.getRegistration();
    subscribed = Boolean(await registration?.pushManager.getSubscription());
  } catch {
    return {
      supported: true,
      configured: Boolean(publicVapidKey()),
      serviceWorkerReady: false,
      permission: Notification.permission,
      subscribed: false,
      reason: "Impossible de vérifier le service worker. Réessayez après le chargement de la PWA.",
    };
  }

  const key = publicVapidKey();
  if (!key) {
    return {
      supported: true,
      configured: false,
      serviceWorkerReady: Boolean(registration?.active),
      permission: Notification.permission,
      subscribed,
      reason: "La clé publique VAPID n’est pas configurée pour cette version.",
    };
  }
  try {
    urlBase64ToUint8Array(key);
  } catch (cause) {
    return {
      supported: true,
      configured: false,
      serviceWorkerReady: Boolean(registration?.active),
      permission: Notification.permission,
      subscribed,
      reason: cause instanceof Error ? cause.message : "La clé publique VAPID est invalide.",
    };
  }

  return {
    supported: true,
    configured: true,
    serviceWorkerReady: Boolean(registration?.active),
    permission: Notification.permission,
    subscribed,
    reason: registration?.active
      ? undefined
      : "Le service worker n’est pas actif. Ouvrez la version PWA construite et prévisualisée pour utiliser Push.",
  };
}

export async function enablePushNotifications(): Promise<void> {
  const status = await getPushStatus();
  if (!status.supported) throw new Error(status.reason || "Les notifications Push ne sont pas disponibles.");
  if (!status.configured) throw new Error(status.reason || "La clé publique VAPID n’est pas configurée.");
  if (!status.serviceWorkerReady) {
    throw new Error(status.reason || "Le service worker n’est pas actif.");
  }
  if (status.permission === "denied") {
    throw new Error("L’autorisation des notifications est refusée dans le navigateur. Modifiez ce réglage dans les paramètres du site.");
  }

  const keyBytes = urlBase64ToUint8Array(publicVapidKey());
  const applicationServerKey = new ArrayBuffer(keyBytes.byteLength);
  new Uint8Array(applicationServerKey).set(keyBytes);
  const permission = status.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(permission === "denied"
      ? "L’autorisation des notifications a été refusée dans le navigateur."
      : "L’autorisation des notifications n’a pas été accordée.");
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.active) {
    throw new Error("Le service worker n’est pas actif. Utilisez la PWA construite et prévisualisée, puis réessayez.");
  }

  let subscription = await registration.pushManager.getSubscription();
  const createdHere = !subscription;
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  }

  try {
    await api("/api/push-subscriptions", {
      method: "POST",
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
  } catch (error) {
    if (createdHere) await subscription.unsubscribe().catch(() => false);
    throw error;
  }
}

export async function disablePushNotifications(): Promise<void> {
  const unsupported = prerequisites();
  if (unsupported) throw new Error(unsupported.reason);

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  // Supprimer l’enregistrement serveur d’abord : en cas d’échec, l’abonnement
  // local reste actif et l’interface peut afficher un échec sans état ambigu.
  await api("/api/push-subscriptions", {
    method: "DELETE",
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  const removed = await subscription.unsubscribe();
  if (!removed) throw new Error("L’abonnement local n’a pas pu être désactivé.");
}
