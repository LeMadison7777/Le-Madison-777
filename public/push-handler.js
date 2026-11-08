const MADCOLOTHES_PUSH_PATHS = [
  /^\/$/,
  /^\/compte$/,
  /^\/commandes$/,
  /^\/messages$/,
  /^\/messages\/[a-f0-9-]+$/i,
];

function safeMadclothesPath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/compte";

  try {
    const target = new URL(value, self.location.origin);
    if (target.origin !== self.location.origin || !MADCOLOTHES_PUSH_PATHS.some((pattern) => pattern.test(target.pathname))) {
      return "/compte";
    }
    return target.pathname;
  } catch {
    return "/compte";
  }
}

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    const parsed = event.data ? event.data.json() : {};
    payload = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    payload = {};
  }

  const title = typeof payload.title === "string" && payload.title.trim()
    ? payload.title.trim().slice(0, 80)
    : "Nouvelle notification Madclothes";
  const body = typeof payload.body === "string" && payload.body.trim()
    ? payload.body.trim().slice(0, 180)
    : "Vous avez une nouvelle notification.";

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { path: safeMadclothesPath(payload.url) },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = safeMadclothesPath(event.notification.data?.path);
  const target = new URL(path, self.location.origin).href;

  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const sameOriginWindow = windows.find((client) => {
      try { return new URL(client.url).origin === self.location.origin; }
      catch { return false; }
    });
    if (sameOriginWindow) {
      return sameOriginWindow.navigate(target).then((client) => (client || sameOriginWindow).focus());
    }
    return self.clients.openWindow(target);
  }));
});
