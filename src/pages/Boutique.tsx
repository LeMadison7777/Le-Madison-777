import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import Footer from "@/components/Footer";
import BackgroundFX from "@/components/BackgroundFX";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CATEGORIES, SIZES, CITIES, CONDITIONS } from "@/data/products";
import { useListings } from "@/hooks/useListings";

const PRICE_MAX = 300000;

const Boutique = () => {
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<string | null>(searchParams.get("category"));
  const [size, setSize] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [term, setTerm] = useState(searchParams.get("q") || "");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [price, setPrice] = useState<[number, number]>([0, PRICE_MAX]);
  const [page, setPage] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);
  const limit = 24;
  const params = useMemo(() => {
    const value = new URLSearchParams();
    if (query) value.set("q", query);
    if (category) value.set("category", category);
    if (size) value.set("size", size);
    if (city) value.set("city", city);
    if (condition) value.set("condition", condition);
    value.set("min", String(price[0]));
    value.set("max", String(price[1]));
    value.set("page", String(page));
    return value.toString();
  }, [query, category, size, city, condition, price, page]);
  const { items, total, loading, error, retry } = useListings(params, limit);
  const pages = Math.max(1, Math.ceil(total / limit));
  const reset = () => { setCategory(null); setSize(null); setCity(null); setCondition(null); setPrice([0, PRICE_MAX]); setTerm(""); setQuery(""); setPage(1); };
  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => <button type="button" aria-pressed={active} onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-white/5 text-foreground/80 border-white/10 hover:border-primary/50"}`}>{children}</button>;
  const Filters = <div className="space-y-6">
    <div className="flex items-center justify-between"><h2 className="font-display font-semibold text-sm">Filtres</h2><button onClick={reset} className="text-xs text-muted-foreground hover:text-primary">Effacer</button></div>
    <div><p className="text-mono text-[10px] text-primary mb-2">Catégorie</p><div className="flex flex-wrap gap-2">{CATEGORIES.map((value) => <Chip key={value} active={category === value} onClick={() => { setCategory(category === value ? null : value); setPage(1); }}>{value}</Chip>)}</div></div>
    <div><p className="text-mono text-[10px] text-primary mb-2">Taille</p><div className="flex flex-wrap gap-2">{SIZES.map((value) => <Chip key={value} active={size === value} onClick={() => { setSize(size === value ? null : value); setPage(1); }}>{value}</Chip>)}</div></div>
    <div><p className="text-mono text-[10px] text-primary mb-2">Ville</p><div className="flex flex-wrap gap-2">{CITIES.map((value) => <Chip key={value} active={city === value} onClick={() => { setCity(city === value ? null : value); setPage(1); }}>{value}</Chip>)}</div></div>
    <div><p className="text-mono text-[10px] text-primary mb-2">État</p><div className="flex flex-wrap gap-2">{CONDITIONS.map((value) => <Chip key={value} active={condition === value} onClick={() => { setCondition(condition === value ? null : value); setPage(1); }}>{value}</Chip>)}</div></div>
    <div><div className="flex justify-between mb-3"><p className="text-mono text-[10px] text-primary">Prix (FCFA)</p><p className="text-xs text-muted-foreground">{price[0].toLocaleString("fr-FR")} – {price[1].toLocaleString("fr-FR")}</p></div><Slider value={price} onValueChange={(value) => { setPrice([value[0], value[1]] as [number,number]); setPage(1); }} min={0} max={PRICE_MAX} step={1000} aria-label="Fourchette de prix" /></div>
  </div>;

  return <div className="min-h-screen bg-background relative"><BackgroundFX /><Navbar />
    <main className="container mx-auto px-4 pt-32 pb-24">
      <BackButton fallbackTo="/" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8"><p className="text-mono text-xs text-primary mb-3">Boutique</p><h1 className="font-display text-4xl md:text-6xl font-bold mb-3">Articles <span className="text-gradient">disponibles</span></h1><p className="text-muted-foreground max-w-xl">Recherchez des vêtements et accessoires publiés par la communauté.</p></motion.div>
      <form onSubmit={(event) => { event.preventDefault(); setQuery(term.trim()); setPage(1); }} className="flex gap-2 mb-6 max-w-2xl"><input aria-label="Rechercher un article" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Rechercher un article ou une marque" className="h-11 flex-1 rounded-full border border-white/10 bg-white/5 px-5 text-sm outline-none focus:border-primary" /><Button type="submit" className="h-11 rounded-full px-5"><Search size={16} className="mr-2" /> Rechercher</Button></form>
      <div className="lg:hidden mb-6 flex items-center justify-between"><p className="text-sm text-muted-foreground">{total} article{total !== 1 ? "s" : ""}</p><Button onClick={() => setMobileOpen(true)} variant="outline" size="sm" className="rounded-full border-white/15 gap-2"><SlidersHorizontal size={14} /> Filtres</Button></div>
      <div className="grid lg:grid-cols-[280px_1fr] gap-8"><aside className="hidden lg:block glass rounded-2xl p-6 h-fit sticky top-24">{Filters}</aside><div>
        <p className="hidden lg:block text-sm text-muted-foreground mb-6">{loading ? "Recherche en cours…" : `${total} article${total !== 1 ? "s" : ""} trouvé${total !== 1 ? "s" : ""}`}</p>
        {error ? <div role="alert" className="glass rounded-2xl p-10 text-center"><p className="text-destructive mb-2 font-medium">{error}</p><Button onClick={retry} variant="outline" className="mt-4 rounded-full">Réessayer</Button></div> : loading ? <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[.8] rounded-2xl bg-white/5 animate-pulse" />)}</div> : items.length === 0 ? <div className="glass rounded-2xl p-12 text-center"><p className="text-muted-foreground">Aucune annonce ne correspond à votre recherche.</p><Button onClick={reset} variant="outline" className="mt-4 rounded-full border-white/15">Effacer les filtres</Button></div> : <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
        {!loading && pages > 1 && <div className="flex justify-center items-center gap-4 mt-8"><Button disabled={page <= 1} variant="outline" className="rounded-full" onClick={() => setPage(page - 1)}>Précédent</Button><span className="text-sm text-muted-foreground">Page {page} sur {pages}</span><Button disabled={page >= pages} variant="outline" className="rounded-full" onClick={() => setPage(page + 1)}>Suivant</Button></div>}
      </div></div>
    </main>
    {mobileOpen && <div className="lg:hidden fixed inset-0 z-[60]"><button aria-label="Fermer les filtres" className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} /><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto glass-strong border-t border-white/10 rounded-t-2xl p-6"><div className="flex items-center justify-between mb-4"><h2 className="font-display text-lg font-semibold">Filtres</h2><button onClick={() => setMobileOpen(false)} className="p-2"><X size={20} /></button></div>{Filters}<Button onClick={() => setMobileOpen(false)} className="w-full mt-6 rounded-full">Voir les {total} articles</Button></motion.div></div>}
    <Footer />
  </div>;
};

export default Boutique;
