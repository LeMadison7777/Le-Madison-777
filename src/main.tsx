import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

if (import.meta.env.DEV && "serviceWorker" in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
    const removed = await Promise.all(registrations.map((registration) => registration.unregister()));
    if (hadController && removed.some(Boolean)) window.location.reload();
  }).catch(() => undefined);
}

createRoot(document.getElementById("root")!).render(<AppErrorBoundary><App /></AppErrorBoundary>);
