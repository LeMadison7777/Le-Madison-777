import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-primary opacity-10"
        animate={{ opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="container relative mx-auto px-4 text-center"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9 }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <ShoppingBag className="h-16 w-16 text-primary mx-auto mb-6" />
        </motion.div>
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
          Prêt à rejoindre la <span className="text-gradient">communauté</span> ?
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-10">
          Rejoins des milliers de vendeurs et acheteurs en Afrique francophone.
          Inscription gratuite et rapide.
        </p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="inline-block">
          <Button size="lg" className="text-base gap-2 glow-shadow shine">
            Créer mon compte <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CTASection;
