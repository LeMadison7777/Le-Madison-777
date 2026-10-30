import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const categories = [
  { emoji: "👗", name: "Robes & Tenues", img: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=70&auto=format&fit=crop" },
  { emoji: "👔", name: "Chemises & Hauts", img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=70&auto=format&fit=crop" },
  { emoji: "👖", name: "Pantalons & Jeans", img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=70&auto=format&fit=crop" },
  { emoji: "👟", name: "Chaussures", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=70&auto=format&fit=crop" },
  { emoji: "👜", name: "Sacs & Maroquinerie", img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=70&auto=format&fit=crop" },
  { emoji: "⌚", name: "Montres & Bijoux", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=70&auto=format&fit=crop" },
  { emoji: "🧢", name: "Casquettes & Chapeaux", img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=70&auto=format&fit=crop" },
  { emoji: "🕶️", name: "Lunettes & Accessoires", img: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&q=70&auto=format&fit=crop" },
];

const CategoriesSection = () => {
  const navigate = useNavigate();
  return <section id="categories" className="py-24 relative"><div className="container mx-auto px-4">
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center"><p className="text-mono text-xs text-primary mb-3">Catégories</p><h2 className="font-display text-3xl md:text-5xl font-bold">Explorez par <span className="text-gradient">catégorie</span></h2></motion.div>
    <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={{ hidden: {}, show: { transition: { staggerChildren: .06 } } }} className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
      {categories.map((category) => <motion.button key={category.name} type="button" onClick={() => navigate(`/boutique?category=${encodeURIComponent(category.name)}`)} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: .5 } } }} whileHover={{ y: -5 }} className="group relative shrink-0 w-[78%] sm:w-[55%] md:w-auto aspect-[4/5] rounded-2xl overflow-hidden glass snap-start text-left">
        <img src={category.img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" /><div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" /><span className="absolute top-4 left-4 text-3xl">{category.emoji}</span><div className="absolute bottom-5 left-5 right-5"><h3 className="font-display text-lg font-bold leading-tight group-hover:text-primary">{category.name}</h3><p className="text-xs text-muted-foreground mt-1">Explorer les articles</p></div>
      </motion.button>)}
    </motion.div>
  </div></section>;
};

export default CategoriesSection;
