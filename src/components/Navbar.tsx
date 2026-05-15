import { ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="/" className="flex items-center gap-2">
          <ShoppingBag className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold tracking-tight">
            MAD<span className="text-gradient">CLOTHES</span>
          </span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Comment ça marche</a>
          <a href="#categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Catégories</a>
          <a href="#commissions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tarifs</a>
          <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          <Button size="sm" asChild><a href="#contact">Nous contacter</a></Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-3">
          <a href="#how" className="block text-sm text-muted-foreground" onClick={() => setOpen(false)}>Comment ça marche</a>
          <a href="#categories" className="block text-sm text-muted-foreground" onClick={() => setOpen(false)}>Catégories</a>
          <a href="#commissions" className="block text-sm text-muted-foreground" onClick={() => setOpen(false)}>Tarifs</a>
          <a href="#contact" className="block text-sm text-muted-foreground" onClick={() => setOpen(false)}>Contact</a>
          <Button size="sm" className="w-full" asChild>
            <a href="#contact" onClick={() => setOpen(false)}>Nous contacter</a>
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
