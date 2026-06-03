import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import MagneticButton from "./MagneticButton";
import ParticleSphere from "./ParticleSphere";

const titleLines = ["La Mode de", "Seconde Main", "en Afrique."];

const stats = [
  { value: "2,400+", label: "Articles" },
  { value: "1,200+", label: "Vendeurs" },
  { value: "48h", label: "Livraison" },
  { value: "100%", label: "Sécurisé" },
];

const HeroSection = () => {
  const reduce = useReducedMotion();

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* 3D Particle Sphere — visible on all screens */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Mobile: centered behind content, lower opacity */}
        <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[90vw] w-[90vw] opacity-90">
          <ParticleSphere />
        </div>
        {/* Tablet/Desktop: large, right-anchored */}
        <div className="hidden md:block absolute right-[-12%] top-1/2 -translate-y-1/2 h-[110vh] w-[110vh] max-w-[1100px] max-h-[1100px] opacity-90">
          <ParticleSphere />
        </div>
      </div>

      {/* Floating abstract shapes */}
      {!reduce && (
        <>
          <motion.div
            aria-hidden
            className="absolute right-[6%] top-[18%] hidden xl:block h-40 w-40 rounded-3xl glass glass-border-glow"
            style={{ rotate: 18 }}
            animate={{ y: [0, -20, 0], rotate: [18, 22, 18] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="absolute left-[2%] bottom-[14%] hidden xl:block h-28 w-28 rounded-[2.5rem] glass rotate-12"
            animate={{ y: [0, -14, 0], rotate: [12, 8, 12] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="container relative mx-auto px-4 py-20">
        <div className="max-w-4xl space-y-8 md:space-y-10">
          {/* Pré-titre */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-3 rounded-full glass px-4 py-1.5 text-mono text-[10px] sm:text-xs text-foreground/80"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            La Marketplace Africaine
          </motion.div>

          {/* Titre principal — révélation lettre par lettre, 3 lignes, réduit -30% mobile */}
          <h1 className="font-display font-extrabold leading-[0.92] tracking-[-0.04em] text-[clamp(2rem,7.5vw,7rem)]">
            {titleLines.map((line, li) => {
              const words = line.split(" ");
              const isAccent = li === 2; // "en Afrique."
              return (
                <span key={li} className="block">
                  {words.map((word, wi) => {
                    return (
                      <span key={wi} className="inline-block mr-[0.25em] whitespace-nowrap">
                        {word.split("").map((char, ci) => {
                          const globalIdx = li * 20 + wi * 6 + ci;
                          return (
                            <motion.span
                              key={ci}
                              initial={{ opacity: 0, y: 60, rotateX: -90 }}
                              animate={{ opacity: 1, y: 0, rotateX: 0 }}
                              transition={{
                                delay: 0.15 + globalIdx * 0.04,
                                duration: 0.7,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                              className={"inline-block " + (isAccent ? "text-gradient" : "")}
                            >
                              {char}
                            </motion.span>
                          );
                        })}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </h1>

          {/* Sous-titre */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed"
          >
            Achetez, vendez et redonnez vie à vos vêtements et accessoires.
            Rejoignez la communauté Madclothes à Pointe-Noire et partout en Afrique.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <MagneticButton>
              <Button
                size="lg"
                onClick={() => document.querySelector("#categories")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto text-base gap-2 glow-shadow shine rounded-full px-7"
              >
                Explorer la boutique <ArrowRight className="h-4 w-4" />
              </Button>
            </MagneticButton>
            <MagneticButton strength={0.25}>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.querySelector("#cta-vendre")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto text-base rounded-full px-7 glass border-white/15 bg-transparent hover:bg-white/5"
              >
                Vendre un article
              </Button>
            </MagneticButton>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.8 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 pt-6 max-w-2xl"
          >
            {stats.map((s, i) => (
              <div key={s.label} className="relative pl-4 sm:pl-5">
                <span className="absolute left-0 top-1 bottom-1 w-px bg-gradient-to-b from-primary/60 to-transparent" />
                <span className="block text-2xl sm:text-3xl font-bold text-foreground font-display">
                  {s.value}
                </span>
                <span className="text-mono text-[10px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      {!reduce && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-mono text-[10px] text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 1 }}
        >
          <span>Défiler</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown className="h-4 w-4 text-primary" />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

export default HeroSection;
