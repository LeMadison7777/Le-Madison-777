import { motion } from "framer-motion";
import { Heart, ArrowUpRight, MapPin } from "lucide-react";

type Condition = "Neuf sans étiquette" | "Très bon état" | "Bon état";

const products: {
  name: string;
  brand: string;
  size: string;
  price: number;
  location: string;
  condition: Condition;
  img: string;
}[] = [
  { name: "Veste en cuir vintage", brand: "Zara", size: "M", price: 8500, location: "Pointe-Noire, Congo", condition: "Très bon état", img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&q=70&auto=format&fit=crop" },
  { name: "Robe fleurie d'été", brand: "Mango", size: "S", price: 6200, location: "Abidjan, Côte d'Ivoire", condition: "Neuf sans étiquette", img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&q=70&auto=format&fit=crop" },
  { name: "Sneakers blanches", brand: "Nike Air", size: "42", price: 12000, location: "Dakar, Sénégal", condition: "Bon état", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=70&auto=format&fit=crop" },
  { name: "Sac à main cuir", brand: "Michael Kors", size: "Unique", price: 18500, location: "Brazzaville, Congo", condition: "Très bon état", img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700&q=70&auto=format&fit=crop" },
  { name: "Jean droit délavé", brand: "Levi's 501", size: "32", price: 5500, location: "Yaoundé, Cameroun", condition: "Bon état", img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=700&q=70&auto=format&fit=crop" },
  { name: "Montre automatique", brand: "Seiko", size: "40mm", price: 24000, location: "Lomé, Togo", condition: "Très bon état", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=70&auto=format&fit=crop" },
  { name: "Lunettes de soleil", brand: "Ray-Ban", size: "Unique", price: 9800, location: "Cotonou, Bénin", condition: "Neuf sans étiquette", img: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=700&q=70&auto=format&fit=crop" },
  { name: "Chemise en lin", brand: "H&M", size: "L", price: 4200, location: "Pointe-Noire, Congo", condition: "Bon état", img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700&q=70&auto=format&fit=crop" },
];

const conditionStyles: Record<Condition, string> = {
  "Neuf sans étiquette": "bg-primary/20 text-primary border-primary/40",
  "Très bon état": "bg-accent/20 text-accent-foreground border-accent/40",
  "Bon état": "bg-white/10 text-foreground/80 border-white/15",
};

const FeaturedProducts = () => {
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
              key={p.name}
              variants={{
                hidden: { opacity: 0, y: 40, scale: 0.96 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.4 }}
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
                <button className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl bg-white/5 hover:bg-primary hover:text-primary-foreground border border-white/10 hover:border-primary transition-all duration-300 shine">
                  Voir l'article
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
