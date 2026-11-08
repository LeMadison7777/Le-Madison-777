import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import FeaturedProductRail from "@/components/FeaturedProductRail";
import { Button } from "@/components/ui/button";
import { useListings } from "@/hooks/useListings";
import { AlertCircle, RefreshCw } from "lucide-react";

const FeaturedProducts = () => {
  const { items, loading, error, retry } = useListings("", 8);

  return (
    <section id="featured" className="relative isolate py-24">
      <FeaturedProductRail />
      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <p className="text-mono text-xs text-primary mb-3">Sélection</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-3">
            À découvrir <span className="text-gradient">en boutique</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Les annonces actuellement publiées par la communauté.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[.8] rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="glass rounded-2xl p-8 max-w-md mx-auto text-center border-destructive/20">
            <AlertCircle className="mx-auto text-destructive mb-3" size={32} />
            <p className="text-sm text-destructive font-medium mb-2">Impossible de charger les annonces</p>
            <p className="text-xs text-muted-foreground mb-4">{error}</p>
            <Button onClick={retry} variant="outline" size="sm" className="rounded-full gap-2">
              <RefreshCw size={14} /> Réessayer
            </Button>
          </div>
        ) : items.length ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 text-center max-w-md mx-auto">
            <p className="text-muted-foreground mb-4">Aucune annonce publiée pour l'instant.</p>
            <Link to="/boutique" className="text-primary hover:underline text-sm font-medium">
              Parcourir la boutique
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
