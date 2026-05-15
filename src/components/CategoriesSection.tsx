import { motion } from "framer-motion";
import categoriesImage from "@/assets/categories-clothing.jpg";

const categories = [
  { name: "Robes", count: 1240 },
  { name: "Pantalons", count: 890 },
  { name: "Chaussures", count: 2100 },
  { name: "Sacs", count: 760 },
  { name: "T-Shirts", count: 1530 },
  { name: "Accessoires", count: 640 },
];

const CategoriesSection = () => {
  return (
    <section id="categories" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -60, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl overflow-hidden card-shadow aspect-square group"
          >
            <motion.img
              src={categoriesImage}
              alt="Vêtements de seconde main"
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <motion.div
              className="absolute bottom-6 left-6 right-6"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <p className="font-display text-2xl font-bold">Des milliers d'articles vous attendent</p>
            </motion.div>
          </motion.div>

          <div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="font-display text-3xl md:text-5xl font-bold mb-4"
            >
              Explore les <span className="text-gradient">catégories</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-muted-foreground mb-10 max-w-md"
            >
              Trouve des pièces uniques dans toutes les catégories de mode.
            </motion.p>

            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 gap-4"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            >
              {categories.map((cat) => (
                <motion.button
                  key={cat.name}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.9 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
                  }}
                  whileHover={{ y: -4, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group rounded-xl bg-card border border-border p-5 text-left hover:border-primary/40 hover:bg-secondary/50 transition-colors duration-200"
                >
                  <span className="block font-display text-lg font-bold group-hover:text-primary transition-colors">
                    {cat.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {cat.count.toLocaleString("fr-FR")} articles
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;