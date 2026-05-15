import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import heroImage from "@/assets/hero-fashion.jpg";

const stats = [
  { value: "10K+", label: "Articles en ligne" },
  { value: "5K+", label: "Vendeurs actifs" },
  { value: "98%", label: "Satisfaction" },
];

const HeroSection = () => {
  const reduce = useReducedMotion();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background image with parallax-like zoom */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.15, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <img src={heroImage} alt="Mode africaine" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
      </motion.div>

      {/* Floating orb */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute right-10 top-1/4 hidden lg:block h-72 w-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(24 95% 53% / 0.5), transparent 70%)" }}
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="container relative mx-auto px-4 py-20">
        <motion.div
          className="max-w-2xl space-y-8"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }}
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm text-primary backdrop-blur-sm"
          >
            <Smartphone className="h-4 w-4" />
            <span>Disponible au Congo</span>
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          </motion.div>

          <motion.h1
            variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl sm:text-5xl md:text-7xl font-black leading-[0.95] tracking-tight"
          >
            La Mode de{" "}
            <span className="text-gradient">Seconde Main</span>{" "}
            en Afrique
          </motion.h1>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.8 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-lg"
          >
            Achetez et vendez des vêtements tendance. Paiement sécurisé via
            Orange Money, MTN MoMo, Wave et carte bancaire.
          </motion.p>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" className="text-base gap-2 glow-shadow shine">
                Vendre un article <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button variant="outline" size="lg" className="text-base">
                Découvrir les articles
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.8 }}
            className="flex flex-wrap items-center gap-x-6 gap-y-4 sm:gap-8 pt-4 text-sm text-muted-foreground"
          >
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-6 sm:gap-8">
                {i > 0 && <div className="hidden sm:block w-px h-10 bg-border" />}
                <div>
                  <span className="block text-xl sm:text-2xl font-bold text-foreground">
                    {s.value}
                  </span>
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      {!reduce && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <span>Défiler</span>
          <motion.div
            className="h-10 w-px bg-gradient-to-b from-primary to-transparent"
            animate={{ scaleY: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ transformOrigin: "top" }}
          />
        </motion.div>
      )}
    </section>
  );
};

export default HeroSection;