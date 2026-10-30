import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "madclothes-cookie-consent-v1";
type CookieChoice = { necessary: true; analytics: boolean; savedAt: string };

export default function CookieConsent() {
  const [choice, setChoice] = useState<CookieChoice | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CookieChoice;
        if (parsed.necessary === true && typeof parsed.analytics === "boolean") setChoice(parsed);
      }
    } catch {
      // Privacy settings may be unavailable when browser storage is disabled.
    }

    const openSettings = () => {
      setAnalyticsAllowed(choice?.analytics ?? false);
      setSettingsOpen(true);
    };
    window.addEventListener("madclothes:cookie-settings", openSettings);
    return () => window.removeEventListener("madclothes:cookie-settings", openSettings);
  }, [choice?.analytics]);

  function save(analytics: boolean) {
    const next: CookieChoice = { necessary: true, analytics, savedAt: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Keep the choice for this session even when persistent storage is unavailable.
    }
    setChoice(next);
    setSettingsOpen(false);
  }

  if (choice && !settingsOpen) return null;

  return (
    <aside aria-label="Préférences des cookies" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-2xl border border-white/15 bg-background/95 p-5 shadow-2xl backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl space-y-2">
          <h2 className="font-display text-lg font-bold">Vos choix de cookies</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Les cookies indispensables servent à la connexion et à la sécurité du compte. Madclothes n’active actuellement aucun outil de mesure d’audience ou de publicité.
          </p>
          <Link to="/confidentialite#cookies" className="text-sm text-primary underline underline-offset-4">En savoir plus</Link>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button variant="outline" size="sm" onClick={() => save(false)} className="rounded-full">Essentiels uniquement</Button>
          <Button variant="outline" size="sm" aria-expanded={settingsOpen} onClick={() => { setAnalyticsAllowed(choice?.analytics ?? false); setSettingsOpen((value) => !value); }} className="rounded-full">Personnaliser</Button>
          <Button size="sm" onClick={() => save(true)} className="rounded-full">Tout accepter</Button>
        </div>
      </div>
      {settingsOpen && <div className="mt-5 border-t border-border pt-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={analyticsAllowed} onChange={(event) => setAnalyticsAllowed(event.target.checked)} className="mt-1 accent-primary" />
          <span><span className="font-semibold">Mesure d’audience facultative</span><span className="mt-1 block text-muted-foreground">Ton choix sera mémorisé. Aucun outil de mesure d’audience n’est chargé pour le moment.</span></span>
        </label>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(false)} className="rounded-full">Fermer</Button>
          <Button size="sm" onClick={() => save(analyticsAllowed)} className="rounded-full">Enregistrer mon choix</Button>
        </div>
      </div>}
    </aside>
  );
}
