import { motion } from "framer-motion";
import { Heart, ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { PRODUCTS, conditionStyles } from "@/data/products";

const FeaturedProducts = () => {
  const products = PRODUCTS.slice(0, 8);
  return (
    <section id="featured" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <p className="text-mono text-xs text-primary mb-3">— Sélection</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-3">
            Découvertes du <span className="text-gradient">moment</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Les meilleures pièces sélectionnées pour vous.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {products.map((p) => (
            <motion.article
              key={p.id}
              variants={{
                hidden: { opacity: 0, y: 40, scale: 0.96 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="group glass glass-border-glow rounded-[16px] overflow-hidden hover-glow-orange flex flex-col"
            >
              <Link to={`/article/${p.id}`} className="relative aspect-square overflow-hidden block">
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
                  onClick={(e) => { e.preventDefault(); }}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full glass-strong flex items-center justify-center text-foreground/80 hover:text-primary hover:scale-110 transition-all"
                >
                  <Heart size={16} />
                </button>
              </Link>

              <div className="p-4 flex-1 flex flex-col gap-2">
                <h3 className="font-display font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                  {p.name}
                </h3>
                <p className="text-xs text-muted-foreground text-mono">
                  {p.brand} • Taille {p.size}
                </p>
                <p className="font-display text-lg font-bold text-primary neon-orange mt-1">
                  {p.price.toLocaleString("fr-FR")} <span className="text-xs text-muted-foreground font-body font-normal">FCFA</span>
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-auto">
                  <MapPin size={12} />
                  <span className="line-clamp-1">{p.location}</span>
                </div>
                <Link
                  to={`/article/${p.id}`}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl bg-white/5 hover:bg-primary hover:text-primary-foreground border border-white/10 hover:border-primary transition-all duration-300 shine"
                >
                  Voir l'article
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
