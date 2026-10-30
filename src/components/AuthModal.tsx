import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { authClient, resetPasswordWithEmailOTP } from "@/lib/auth";

type Mode = "signin" | "signup" | "verify" | "recover";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultMode?: "signin" | "signup";
}

function getError(result: { error?: { message?: string } | null }) {
  return result.error?.message;
}

const AuthModal = ({ open, onOpenChange, defaultMode = "signup" }: Props) => {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  useEffect(() => {
    if (open) {
      setMode(defaultMode);
      setError("");
      setRecoverySent(false);
      setVerificationEmail("");
    }
  }, [open, defaultMode]);

  async function resendVerificationCode() {
    if (!verificationEmail) return;
    setBusy(true);
    setError("");
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({ email: verificationEmail, type: "email-verification" });
      const message = getError(result);
      if (message) throw new Error(message);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(/failed to fetch|networkerror|fetch failed/i.test(message)
        ? "Impossible de joindre le service de compte. Vérifiez votre connexion, puis réessayez."
        : message || "Impossible d'envoyer un nouveau code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    try {
      if (mode === "verify") {
        const result = await authClient.emailOtp.verifyEmail({ email, otp: String(data.get("otp") || "") });
        const message = getError(result);
        if (message) throw new Error(message);
        onOpenChange(false);
        return;
      }
      if (mode === "recover") {
        if (!recoverySent) {
          const result = await authClient.emailOtp.requestPasswordReset({ email });
          const message = getError(result);
          if (message) throw new Error(message);
          setRecoverySent(true);
          return;
        }
        await resetPasswordWithEmailOTP({ email, otp: String(data.get("otp") || ""), password });
        setMode("signin");
        setRecoverySent(false);
        setError("");
        return;
      }
      if (mode === "signup") {
        const result = await authClient.signUp.email({ email, password, name: String(data.get("name") || "").trim() });
        const message = getError(result);
        if (message) throw new Error(message);
        if (result.data?.user?.emailVerified === false) {
          setVerificationEmail(email);
          setMode("verify");
          const verification = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
          const verificationError = getError(verification);
          if (verificationError) throw new Error(verificationError);
          return;
        }
      } else {
        const result = await authClient.signIn.email({ email, password });
        const message = getError(result);
        if (message) throw new Error(message);
      }
      onOpenChange(false);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(/failed to fetch|networkerror|fetch failed/i.test(message)
        ? "Le service de compte ne répond pas. Vérifiez votre connexion internet, puis réessayez. Si vous consultez le site depuis un autre appareil du même réseau, ouvrez l'adresse du site autorisée par Madclothes."
        : message || "Impossible de terminer la demande.");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signup" ? "Créer un compte" : mode === "verify" ? "Vérifier votre email" : mode === "recover" ? "Réinitialiser le mot de passe" : "Se connecter";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          <DialogDescription>
            {mode === "signup" ? "Créez votre compte Madclothes." : mode === "verify" ? "Un code vient d'être envoyé à cette adresse. Saisissez-le pour activer votre compte." : mode === "recover" ? "Un code de réinitialisation sera envoyé à votre adresse." : "Retrouvez votre boutique, vos annonces et vos favoris."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {mode === "signup" && <div className="space-y-2"><Label htmlFor="auth-name">Nom complet</Label><Input id="auth-name" name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Ex. Marie N'Goma" className="bg-white/5 border-white/10" /></div>}
          <div className="space-y-2"><Label htmlFor="auth-email">Email</Label><Input id="auth-email" name="email" type="email" required readOnly={mode === "verify"} autoComplete="email" placeholder="vous@exemple.com" className="bg-white/5 border-white/10" /></div>
          {mode === "verify" && <div className="space-y-2"><Label htmlFor="auth-verify-otp">Code reçu par email</Label><Input id="auth-verify-otp" name="otp" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" required /><button type="button" disabled={busy} onClick={() => void resendVerificationCode()} className="text-sm text-primary hover:underline disabled:opacity-50">Renvoyer le code</button></div>}
          {mode === "recover" && recoverySent && <div className="space-y-2"><Label htmlFor="auth-otp">Code reçu par email</Label><Input id="auth-otp" name="otp" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" required /></div>}
          {(mode === "signin" || mode === "signup" || recoverySent) && <div className="space-y-2"><Label htmlFor="auth-password">{mode === "recover" ? "Nouveau mot de passe" : "Mot de passe"}</Label><PasswordInput id="auth-password" name="password" minLength={8} required autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder={mode === "signin" ? "Saisissez votre mot de passe" : "8 caractères minimum"} className="bg-white/5 border-white/10" />{mode !== "signin" && <p className="text-xs text-muted-foreground">Utilisez au moins 8 caractères.</p>}</div>}
          {error && <p role="alert" className="text-sm text-destructive">{error} <Link to="/aide" onClick={() => onOpenChange(false)} className="ml-1 underline underline-offset-4">Centre d'aide</Link></p>}
          {mode === "recover" && recoverySent && <p className="text-sm text-muted-foreground">Saisissez le code envoyé par email et choisissez un nouveau mot de passe.</p>}
          <Button type="submit" disabled={busy} className="w-full rounded-full glow-shadow shine">
            {busy ? "Patientez…" : mode === "verify" ? "Vérifier mon email" : mode === "recover" ? recoverySent ? "Changer le mot de passe" : "Envoyer le code" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
          </Button>
        </form>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {mode === "signin" && <button type="button" onClick={() => { setMode("recover"); setError(""); }} className="text-primary hover:underline">Mot de passe oublié ?</button>}
          {mode === "verify" ? <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="text-primary hover:underline">Retour à l'inscription</button> : mode !== "recover" ? <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }} className="text-primary hover:underline">{mode === "signup" ? "J'ai déjà un compte" : "Créer un compte"}</button> : <button type="button" onClick={() => { setMode("signin"); setRecoverySent(false); setError(""); }} className="text-primary hover:underline">Retour à la connexion</button>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
