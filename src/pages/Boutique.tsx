import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, ArrowUpRight, MapPin, SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundFX from "@/components/BackgroundFX";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CATEGORIES, SIZES, CITIES, PRODUCTS, conditionStyles } from "@/data/products";

const PRICE_MAX = 30000;

const Boutique = () => {
  const [category, setCategory] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [price, setPrice] = useState<[number, number]>([0, PRICE_MAX]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      if (category && p.category !== category) return false;
      if (size && p.size !== size) return false;
      if (city && p.city !== city) return false;
      if (p.price < price[0] || p.price > price[1]) return false;
      return true;
    });
  }, [category, size, city, price]);

  const reset = () => {
    setCategory(null);
    setSize(null);
    setCity(null);
    setPrice([0, PRICE_MAX]);
  };

  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-full text-xs border transition-all " +
        (active
          ? "bg-primary text-primary-foreground border-primary glow-shadow"
          : "bg-white/5 text-foreground/80 border-white/10 hover:border-primary/50")
      }
    >
      {children}
    </button>
  );

  const Filters = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-sm">Filtres</h3>
          <button onClick={reset} className="text-xs text-muted-foreground hover:text-primary">Réinitialiser</button>
        </div>
      </div>

      <div>
        <p className="text-mono text-[10px] text-primary mb-2 uppercase">Catégorie</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(category === c ? null : c)}>{c}</Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-mono text-[10px] text-primary mb-2 uppercase">Taille</p>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <Chip key={s} active={size === s} onClick={() => setSize(size === s ? null : s)}>{s}</Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-mono text-[10px] text-primary mb-2 uppercase">Ville</p>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <Chip key={c} active={city === c} onClick={() => setCity(city === c ? null : c)}>{c}</Chip>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-mono text-[10px] text-primary uppercase">Prix (FCFA)</p>
          <p className="text-xs text-muted-foreground">
            {price[0].toLocaleString("fr-FR")} – {price[1].toLocaleString("fr-FR")}
          </p>
        </div>
        <Slider
          value={price}
          onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])}
          min={0}
          max={PRICE_MAX}
          step={500}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundFX />
      <Navbar />

      <main className="container mx-auto px-4 pt-28 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-mono text-xs text-primary mb-3">— Boutique</p>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-3">
            Tous les <span className="text-gradient">articles</span>
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Parcourez l'ensemble des pièces disponibles sur Madclothes.
          </p>
        </motion.div>

        <div className="lg:hidden mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} article{filtered.length > 1 ? "s" : ""}</p>
          <Button onClick={() => setMobileOpen(true)} variant="outline" size="sm" className="rounded-full border-white/15 gap-2">
            <SlidersHorizontal size={14} /> Filtres
          </Button>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          <aside className="hidden lg:block glass glass-border-glow rounded-2xl p-6 h-fit sticky top-24">
            {Filters}
          </aside>

          <div>
            <p className="hidden lg:block text-sm text-muted-foreground mb-6">
              {filtered.length} article{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
            </p>

            {filtered.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <p className="text-muted-foreground">Aucun article ne correspond à vos filtres.</p>
                <Button onClick={reset} variant="outline" className="mt-4 rounded-full border-white/15">Réinitialiser</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filtered.map((p) => (
                  <motion.article
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    className="group glass glass-border-glow rounded-[16px] overflow-hidden hover-glow-orange flex flex-col"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <motion.img
                        src={p.img}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover saturate-[0.9] group-hover:saturate-100 transition-all duration-700"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                      <span className={`absolute top-3 left-3 text-[10px] md:text-xs px-2.5 py-1 rounded-full border backdrop-blur-md ${conditionStyles[p.condition]}`}>
                        {p.condition}
                      </span>
                      <button
                        aria-label="Ajouter aux favoris"
                        className="absolute top-3 right-3 w-9 h-9 rounded-full glass-strong flex items-center justify-center text-foreground/80 hover:text-primary hover:scale-110 transition-all"
                      >
                        <Heart size={16} />
                      </button>
                    </div>

                    <div className="p-4 flex-1 flex flex-col gap-2">
                      <h3 className="font-display font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs text-muted-foreground text-mono">{p.brand} • Taille {p.size}</p>
                      <p className="font-display text-lg font-bold text-primary neon-orange mt-1">
                        {p.price.toLocaleString("fr-FR")} <span className="text-xs text-muted-foreground font-body font-normal">FCFA</span>
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-auto">
                        <MapPin size={12} />
                        <span className="line-clamp-1">{p.location}</span>
                      </div>
                      <button className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl bg-white/5 hover:bg-primary hover:text-primary-foreground border border-white/10 hover:border-primary transition-all duration-300 shine">
                        Voir l'article
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile filters drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto glass-strong border-t border-white/10 rounded-t-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">Filtres</h2>
              <button onClick={() => setMobileOpen(false)} className="p-2 -mr-2"><X size={20} /></button>
            </div>
            {Filters}
            <Button onClick={() => setMobileOpen(false)} className="w-full mt-6 rounded-full glow-shadow">
              Voir {filtered.length} article{filtered.length > 1 ? "s" : ""}
            </Button>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Boutique;