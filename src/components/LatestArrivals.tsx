import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { useListings } from "@/hooks/useListings";

const LatestArrivals = () => {
  const { items, loading } = useListings("", 4);
  return <section id="latest" className="py-24 relative"><div className="container mx-auto px-4">
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"><div><p className="text-mono text-xs text-primary mb-3">Nouveautés</p><h2 className="font-display text-3xl md:text-5xl font-bold">Dernières <span className="text-gradient">annonces</span></h2><p className="text-sm text-muted-foreground mt-3">Chargées depuis le catalogue Madclothes.</p></div></div>
    {loading ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[.8] rounded-2xl bg-white/5 animate-pulse" />)}</div> : items.length ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="glass rounded-2xl p-8 text-center text-muted-foreground">Les nouvelles annonces apparaîtront ici.</p>}
    <div className="text-center mt-10"><Link to="/boutique" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full glass-strong border border-white/15 hover:border-primary hover:text-primary font-display font-semibold transition-colors">Voir tous les articles <ArrowRight size={16} /></Link></div>
  </div></section>;
};

export default LatestArrivals;
