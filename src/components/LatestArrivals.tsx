import { motion } from "framer-motion";
import { Heart, ArrowUpRight, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

type Condition = "Neuf sans étiquette" | "Très bon état" | "Bon état";

const latest: {
  name: string; brand: string; size: string; price: number; location: string; condition: Condition; img: string;
}[] = [
  { name: "Pull en laine mérinos", brand: "Uniqlo", size: "M", price: 7200, location: "Pointe-Noire, Congo", condition: "Très bon état", img: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=700&q=70&auto=format&fit=crop" },
  { name: "Bottines en daim", brand: "Clarks", size: "39", price: 14500, location: "Abidjan, Côte d'Ivoire", condition: "Bon état", img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=700&q=70&auto=format&fit=crop" },
  { name: "Sac bandoulière", brand: "Coach", size: "Unique", price: 22000, location: "Dakar, Sénégal", condition: "Neuf sans étiquette", img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&q=70&auto=format&fit=crop" },
  { name: "Manteau long", brand: "COS", size: "L", price: 16800, location: "Brazzaville, Congo", condition: "Très bon état", img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&q=70&auto=format&fit=crop" },
];

const conditionStyles: Record<Condition, string> = {
  "Neuf sans étiquette": "bg-primary/20 text-primary border-primary/40",
  "Très bon état": "bg-accent/20 text-accent-foreground border-accent/40",
  "Bon état": "bg-white/10 text-foreground/80 border-white/15",
};

const LatestArrivals = () => {
  return (
    <section id="latest" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
        >
          <div>
            <p className="text-mono text-xs text-primary mb-3">— Live feed</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Arrivages du <span className="text-gradient">jour</span>
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-xs text-mono text-foreground/80">Mis à jour en temps réel</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {latest.map((p) => (
            <motion.article
              key={p.name}
              variants={{
                hidden: { opacity: 0, y: 40, scale: 0.96 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mt-12"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="inline-block">
            <Link
              to="/boutique"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full glass-strong border border-white/15 hover:border-primary hover:text-primary font-display font-semibold transition-colors duration-300 shine"
            >
              Voir tous les articles
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default LatestArrivals;