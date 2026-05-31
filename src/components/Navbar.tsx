import { ShoppingBag, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import AuthModal from "./AuthModal";

const links = [
  { href: "#home", label: "Accueil" },
  { href: "#categories", label: "Boutique" },
  { href: "#contact", label: "Vendre" },
  { href: "#how", label: "Comment ça marche" },
  { href: "#contact", label: "Contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("#home");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const openAuth = (m: "signin" | "signup") => { setAuthMode(m); setAuthOpen(true); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 " +
        (scrolled
          ? "glass border-b border-white/10 backdrop-saturate-150"
          : "bg-transparent border-b border-transparent")
      }
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="#home" className="flex items-center gap-2 group">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary">
            <ShoppingBag className="h-4 w-4 text-primary-foreground" />
            <span className="absolute -inset-1 rounded-full bg-primary/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            MAD<span className="text-gradient">CLOTHES</span>
          </span>
        </a>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={() => {
                setActive(l.href);
                document.querySelector(l.href)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="relative px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
              {active === l.href && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute left-3 right-3 -bottom-0.5 h-[2px] rounded-full bg-gradient-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Button onClick={() => openAuth("signin")} variant="outline" size="sm" className="rounded-full border-white/15 bg-transparent hover:bg-white/5">
            Se connecter
          </Button>
          <Button onClick={() => openAuth("signup")} size="sm" className="rounded-full px-5 glow-shadow shine">
            S'inscrire
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden text-foreground p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="lg:hidden fixed top-16 right-0 bottom-0 w-[82%] max-w-sm glass-strong border-l border-white/10 p-6 flex flex-col gap-4"
          >
            {links.map((l, i) => (
              <motion.a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                className="text-lg font-display text-foreground hover:text-primary transition-colors"
              >
                {l.label}
              </motion.a>
            ))}
            <div className="mt-auto flex flex-col gap-3">
              <Button onClick={() => { setOpen(false); openAuth("signin"); }} variant="outline" className="rounded-full border-white/15">Se connecter</Button>
              <Button onClick={() => { setOpen(false); openAuth("signup"); }} className="rounded-full glow-shadow">S'inscrire</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />
    </nav>
  );
};

export default Navbar;