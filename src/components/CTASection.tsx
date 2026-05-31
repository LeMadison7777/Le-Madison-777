import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import AuthModal from "./AuthModal";

const CTASection = () => {
  const [open, setOpen] = useState(false);

  return (
    <section id="cta-vendre" className="py-28 md:py-36 relative overflow-hidden">
      <motion.div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-32 w-[600px] h-[600px] rounded-full bg-accent/25 blur-[140px]"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 grid-lines opacity-30 pointer-events-none" />

      <motion.div
        className="container relative mx-auto px-4 text-center"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-mono text-xs text-primary mb-5">— Rejoignez-nous</p>
        <h2 className="font-display text-4xl md:text-7xl font-bold mb-6 leading-[1.05] max-w-4xl mx-auto">
          Prêt à rejoindre la <br className="hidden md:block" />
          <span className="text-gradient">communauté ?</span>
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-10">
          Chaque article que vous n'utilisez plus peut devenir de l'argent.
          Rejoignez 1 200 vendeurs actifs sur Madclothes — l'inscription est gratuite.
        </p>

        <motion.button
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="relative inline-flex items-center gap-3 px-8 py-5 rounded-full bg-primary text-primary-foreground font-display font-bold text-base md:text-lg shine glow-shadow"
        >
          <motion.span
            className="absolute inset-0 rounded-full bg-primary"
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative">Commencer à vendre — C'est gratuit</span>
          <ArrowRight className="relative h-5 w-5" />
        </motion.button>
      </motion.div>

      <AuthModal open={open} onOpenChange={setOpen} defaultMode="signup" />
    </section>
  );
};

export default CTASection;
