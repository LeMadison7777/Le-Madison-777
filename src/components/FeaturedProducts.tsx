import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { useListings } from "@/hooks/useListings";

const FeaturedProducts = () => {
  const { items, loading } = useListings("", 8);
  return <section id="featured" className="py-24 relative"><div className="container mx-auto px-4">
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center"><p className="text-mono text-xs text-primary mb-3">Sélection</p><h2 className="font-display text-3xl md:text-5xl font-bold mb-3">À découvrir <span className="text-gradient">en boutique</span></h2><p className="text-muted-foreground max-w-xl mx-auto">Les annonces actuellement publiées par la communauté.</p></motion.div>
    {loading ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[.8] rounded-2xl bg-white/5 animate-pulse" />)}</div> : items.length ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="glass rounded-2xl p-8 text-center"><p className="text-muted-foreground mb-4">Aucune annonce publiée pour l'instant.</p><Link to="/boutique" className="text-primary hover:underline">Parcourir la boutique</Link></div>}
  </div></section>;
};

export default FeaturedProducts;
