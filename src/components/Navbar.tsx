import { Link } from "react-router-dom";
import { Menu, X, UserRound, LogOut, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import AuthModal from "./AuthModal";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [pwaInstalled, setPwaInstalled] = useState(() => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const { user, profile, signOut } = useAuth();
  const openAuth = (mode: "signin" | "signup") => { setAuthMode(mode); setAuthOpen(true); setOpen(false); };
  const requestInstall = () => window.dispatchEvent(new Event("madclothes:install-requested"));
  const navItems = [
    { href: "/boutique", label: "Boutique" },
    { href: "/categories", label: "Catégories" },
    { href: "/fonctionnement", label: "Comment ça marche" },
    { href: "/vendre-sur-madclothes", label: "Vendre" },
    { href: "/aide", label: "Aide" },
  ];

  useEffect(() => {
    const handleAuthRequired = () => openAuth("signin");
    window.addEventListener("madclothes:auth-required", handleAuthRequired);
    return () => window.removeEventListener("madclothes:auth-required", handleAuthRequired);
  }, []);

  useEffect(() => {
    const markInstalled = () => setPwaInstalled(true);
    window.addEventListener("appinstalled", markInstalled);
    return () => window.removeEventListener("appinstalled", markInstalled);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 backdrop-saturate-150">
      <div className="container mx-auto flex items-center justify-between h-[72px] px-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Madclothes, accueil">
          <img src="/brand/madclothes-logo.jpg" alt="" className="h-11 w-11 rounded-full object-cover bg-white" />
          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight">Mad<span className="text-gradient">clothes</span></span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => <Link key={item.label} to={item.href} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">{item.label}</Link>)}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {!pwaInstalled && <Button onClick={requestInstall} variant="outline" size="sm" className="rounded-full border-primary/40 text-primary"><Download size={15} />Installer</Button>}
          {user ? <>
            <Link to="/compte" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:border-primary/50"><UserRound size={15} />{profile?.displayName || "Mon compte"}</Link>
            <Button variant="ghost" size="icon" aria-label="Se déconnecter" title="Se déconnecter" onClick={() => void signOut()}><LogOut size={17} /></Button>
          </> : <>
            <Button onClick={() => openAuth("signin")} variant="outline" size="sm" className="rounded-full border-white/15 bg-transparent">Se connecter</Button>
            <Button onClick={() => openAuth("signup")} size="sm" className="rounded-full px-5 glow-shadow shine">Créer un compte</Button>
          </>}
        </div>

        <button className="lg:hidden text-foreground p-2" onClick={() => setOpen(!open)} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 32 }} className="lg:hidden fixed top-[72px] right-0 bottom-0 w-[82%] max-w-sm glass-strong border-l border-white/10 p-6 flex flex-col gap-4">
          {navItems.map((item, index) => <motion.div key={item.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .05 + index * .05 }}><Link to={item.href} onClick={() => setOpen(false)} className="text-lg font-display hover:text-primary">{item.label}</Link></motion.div>)}
          <div className="mt-auto flex flex-col gap-3">
            {user ? <>
              <Link to="/compte" onClick={() => setOpen(false)} className="text-center rounded-full border border-white/15 p-3">Mon compte</Link>
              <Button variant="outline" className="rounded-full" onClick={() => { setOpen(false); void signOut(); }}>Se déconnecter</Button>
            </> : <>
              <Button onClick={() => openAuth("signin")} variant="outline" className="rounded-full border-white/15">Se connecter</Button>
              <Button onClick={() => openAuth("signup")} className="rounded-full glow-shadow">Créer un compte</Button>
            </>}
            {!pwaInstalled && <Button variant="outline" className="rounded-full border-primary/40 text-primary" onClick={() => { setOpen(false); requestInstall(); }}><Download size={16} />Installer Madclothes</Button>}
          </div>
        </motion.div>}
      </AnimatePresence>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />
    </nav>
  );
};

export default Navbar;
