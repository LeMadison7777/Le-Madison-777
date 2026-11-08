import { useEffect, useState } from "react";
import { Bell, BellOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushStatus,
  type PushStatus,
} from "@/lib/push-notifications";

export default function PushNotificationSettings() {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setStatus(await getPushStatus());
    } catch {
      setError("Impossible de vérifier les réglages Push de cet appareil.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function togglePush() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (status?.subscribed) {
        await disablePushNotifications();
        setNotice("Les notifications Push sont désactivées sur cet appareil.");
      } else {
        await enablePushNotifications();
        setNotice("Les notifications Push sont activées sur cet appareil.");
      }
      setStatus(await getPushStatus());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La modification des notifications Push a échoué.");
      try { setStatus(await getPushStatus()); } catch { /* Garder le dernier état connu. */ }
    } finally {
      setBusy(false);
    }
  }

  const blocked = !status || !status.supported || !status.configured || !status.serviceWorkerReady || status.permission === "denied";
  const explanatoryText = status?.subscribed
    ? "Cet appareil est abonné. Les alertes restent génériques et n’incluent pas le contenu de vos messages."
    : status?.reason || (status?.permission === "denied"
      ? "L’autorisation est refusée dans les paramètres du navigateur."
      : "Recevez une alerte générique lorsque Madclothes vous adresse une notification.");

  return (
    <section aria-labelledby="push-notification-title" className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {status?.subscribed ? <Bell size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" /> : <BellOff size={18} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />}
          <div>
            <h3 id="push-notification-title" className="font-semibold">Notifications sur cet appareil</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground" role="status" aria-live="polite">
              {loading ? "Vérification de la disponibilité…" : explanatoryText}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {error && (
            <Button type="button" variant="ghost" size="sm" onClick={() => void refresh()} aria-label="Réessayer de vérifier les notifications Push">
              <RefreshCw size={15} aria-hidden="true" />
            </Button>
          )}
          <Button
            type="button"
            variant={status?.subscribed ? "outline" : "default"}
            disabled={loading || busy || (!status?.subscribed && blocked)}
            onClick={() => void togglePush()}
            aria-describedby="push-notification-title"
          >
            {busy ? "Mise à jour…" : status?.subscribed ? "Désactiver les notifications Push" : "Activer les notifications Push"}
          </Button>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-primary">{notice}</p>}
    </section>
  );
}
