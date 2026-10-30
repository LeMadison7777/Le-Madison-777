import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Chargement de votre session…</div>;
  if (!user) return <>
    <Navbar />
    <main className="container mx-auto px-4 pt-36 pb-24 max-w-xl text-center">
      <h1 className="font-display text-3xl font-bold mb-3">Connectez-vous pour continuer</h1>
      <p className="text-muted-foreground mb-6">Cette page est réservée aux membres. Après connexion, revenez à votre demande.</p>
      <Button onClick={() => setOpen(true)} className="rounded-full">Se connecter</Button>
      <AuthModal open={open} onOpenChange={setOpen} defaultMode="signin" />
    </main>
    <Footer />
  </>;
  if (location.pathname === "/admin") return <>{children}</>;
  return <>{children}</>;
}

export function ProfileReady({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Chargement de votre espace…</div>;
  if (!profile) return <Navigate to="/compte" replace />;
  return <>{children}</>;
}
