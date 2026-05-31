import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useEffect, useState, useRef } from "react";

const testimonials = [
  { quote: "J'ai vendu 12 articles en un mois ! C'est simple et les acheteurs sont sérieux.", name: "Francine M.", city: "Pointe-Noire", initials: "FM" },
  { quote: "J'ai trouvé une veste Nike à 4000 FCFA. Ici on trouve des vraies pépites.", name: "Kevin T.", city: "Brazzaville", initials: "KT" },
  { quote: "Le concept africain me parle. On revalorise ce qu'on a, c'est intelligent.", name: "Aïsha D.", city: "Libreville", initials: "AD" },
  { quote: "Interface très jolie et facile à utiliser, même pour ma mère !", name: "Patrick N.", city: "Pointe-Noire", initials: "PN" },
  { quote: "Madclothes a changé ma façon de consommer la mode.", name: "Stella R.", city: "Kinshasa", initials: "SR" },
];

const Testimonials = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 4500);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section id="testimonials" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <p className="text-mono text-xs text-primary mb-3">— Témoignages</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold">
            Ils font confiance à <span className="text-gradient">Madclothes</span>
          </h2>
        </motion.div>

        <div
          ref={ref}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="relative max-w-3xl mx-auto"
        >
          <div className="overflow-hidden rounded-3xl glass glass-border-glow p-8 md:p-14 min-h-[280px] flex items-center">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={false}
                animate={{
                  opacity: i === index ? 1 : 0,
                  x: i === index ? 0 : i < index ? -40 : 40,
                  pointerEvents: i === index ? "auto" : "none",
                }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={`${i === index ? "relative" : "absolute inset-0 p-8 md:p-14 flex items-center"}`}
              >
                <div className="text-center w-full">
                  <div className="flex justify-center gap-1 mb-5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={16} className="fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="font-display text-xl md:text-2xl leading-snug mb-8 text-foreground/95">
                    “{t.quote}”
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center font-display font-bold text-primary-foreground">
                      {t.initials}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground text-mono">{t.city}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Aller au témoignage ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === index ? "w-8 bg-primary" : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;