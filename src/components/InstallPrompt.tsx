import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const REMINDER_INTERVAL_MS = 90_000;
const REMINDER_VISIBLE_MS = 12_000;
const REMINDERS_DISABLED_KEY = "madclothes-install-reminders-disabled";

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(isInstalled);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [manualRequest, setManualRequest] = useState(false);
  const [remindersDisabled, setRemindersDisabled] = useState(() => {
    try {
      return localStorage.getItem(REMINDERS_DISABLED_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (installed) return;

    const captureInstallEvent = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    const markInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setInstallEvent(null);
    };
    const handleManualRequest = () => {
      setManualRequest(true);
      setShowInstructions(!installEvent);
      setShowPrompt(true);
      if (installEvent) void install();
    };

    window.addEventListener("beforeinstallprompt", captureInstallEvent);
    window.addEventListener("appinstalled", markInstalled);
    window.addEventListener("madclothes:install-requested", handleManualRequest);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallEvent);
      window.removeEventListener("appinstalled", markInstalled);
      window.removeEventListener("madclothes:install-requested", handleManualRequest);
    };
  }, [installed, installEvent]);

  useEffect(() => {
    if (remindersDisabled || installed) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" && !isInstalled()) {
        setShowInstructions(false);
        setShowPrompt(true);
      }
    }, REMINDER_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [remindersDisabled, installed]);

  useEffect(() => {
    if (!showPrompt) return;
    const timeout = window.setTimeout(() => {
      setShowPrompt(false);
      setManualRequest(false);
    }, REMINDER_VISIBLE_MS);
    return () => window.clearTimeout(timeout);
  }, [showPrompt]);

  async function install() {
    if (!installEvent) {
      setShowInstructions(true);
      return;
    }

    const deferredEvent = installEvent;
    setInstallEvent(null);
    try {
      await deferredEvent.prompt();
      const choice = await deferredEvent.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setShowPrompt(false);
      }
    } catch {
      setShowInstructions(true);
    }
  }

  function stopReminders() {
    try {
      localStorage.setItem(REMINDERS_DISABLED_KEY, "true");
    } catch {
      // Keep the current tab preference even if browser storage is unavailable.
    }
    setRemindersDisabled(true);
    setShowPrompt(false);
    setManualRequest(false);
  }

  if ((remindersDisabled && !manualRequest) || installed || !showPrompt) return null;

  return (
    <aside
      aria-label="Installer Madclothes"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-[90] mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-background/95 p-4 shadow-xl backdrop-blur"
    >
      <Download className="shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm">Installez Madclothes pour retrouver la boutique comme une application.</p>
        {showInstructions && (
          <p className="mt-2 text-xs text-muted-foreground">
            Ouvrez le menu de votre navigateur, puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».
          </p>
        )}
      </div>
      <Button onClick={() => void install()} size="sm" className="rounded-full">
        {installEvent ? "Installer" : "Comment faire ?"}
      </Button>
      <button
        aria-label="Fermer ce rappel"
        onClick={() => { setShowPrompt(false); setManualRequest(false); }}
        className="p-2 text-muted-foreground"
      >
        <X size={16} />
      </button>
      <button
        onClick={stopReminders}
        className="w-full text-left text-xs text-muted-foreground underline underline-offset-4"
      >
        Ne plus me le rappeler
      </button>
    </aside>
  );
}
