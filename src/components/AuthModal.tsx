import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

type Mode = "signin" | "signup";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultMode?: Mode;
}

const AuthModal = ({ open, onOpenChange, defaultMode = "signup" }: Props) => {
  const [mode, setMode] = useState<Mode>(defaultMode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: mode === "signup" ? "Compte créé !" : "Connexion réussie !",
      description: "Bienvenue sur Madclothes.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {mode === "signup" ? "Créer un compte" : "Se connecter"}
          </DialogTitle>
          <DialogDescription>
            {mode === "signup"
              ? "Rejoignez la communauté Madclothes en 30 secondes."
              : "Retrouvez votre boutique et vos favoris."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" required placeholder="Ex : Aïsha N." className="bg-white/5 border-white/10" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required placeholder="vous@email.com" className="bg-white/5 border-white/10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" required minLength={6} className="bg-white/5 border-white/10" />
          </div>
          <Button type="submit" className="w-full rounded-full glow-shadow shine">
            {mode === "signup" ? "S'inscrire" : "Se connecter"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-2">
          {mode === "signup" ? "Déjà un compte ?" : "Pas encore inscrit ?"}{" "}
          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-primary hover:underline"
          >
            {mode === "signup" ? "Se connecter" : "Créer un compte"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;