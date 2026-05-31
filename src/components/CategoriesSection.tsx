import { motion } from "framer-motion";

const categories = [
  { emoji: "👗", name: "Robes & Tenues", count: 1240, img: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=70&auto=format&fit=crop" },
  { emoji: "👔", name: "Chemises & Hauts", count: 980, img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=70&auto=format&fit=crop" },
  { emoji: "👖", name: "Pantalons & Jeans", count: 890, img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=70&auto=format&fit=crop" },
  { emoji: "👟", name: "Chaussures", count: 2100, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=70&auto=format&fit=crop" },
  { emoji: "👜", name: "Sacs & Maroquinerie", count: 760, img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=70&auto=format&fit=crop" },
  { emoji: "⌚", name: "Montres & Bijoux", count: 540, img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=70&auto=format&fit=crop" },
  { emoji: "🧢", name: "Casquettes & Chapeaux", count: 320, img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=70&auto=format&fit=crop" },
  { emoji: "🕶️", name: "Lunettes & Accessoires", count: 410, img: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&q=70&auto=format&fit=crop" },
];

const CategoriesSection = () => {
  return (
    <section id="categories" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <p className="text-mono text-xs text-primary mb-3">— Catégories</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold">
            Explorez par <span className="text-gradient">catégorie</span>
          </h2>
        </motion.div>

        {/* Mobile: horizontal scroll. Desktop: grid */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none"
        >
          {categories.map((cat) => (
            <motion.button
              key={cat.name}
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{ y: -6 }}
              className="group relative shrink-0 w-[78%] sm:w-[55%] md:w-auto aspect-[4/5] rounded-2xl overflow-hidden glass glass-border-glow snap-start text-left hover-glow-orange"
            >
              <motion.img
                src={cat.img}
                alt={cat.name}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-500"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <div className="absolute top-4 left-4 text-3xl drop-shadow-lg">{cat.emoji}</div>
              <div className="absolute bottom-5 left-5 right-5">
                <h3 className="font-display text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 text-mono">
                  {cat.count.toLocaleString("fr-FR")} articles
                </p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default CategoriesSection;