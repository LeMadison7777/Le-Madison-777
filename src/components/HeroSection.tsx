import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

const SECTION_HEIGHT = 1500;

const HERO_IMAGES = {
  center:
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2000&auto=format&fit=crop",
  rack:
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1400&auto=format&fit=crop",
  denim:
    "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1600&auto=format&fit=crop",
  jacket:
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
  dress:
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1400&auto=format&fit=crop",
} as const;

const HeroSection = () => {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <section id="home" className="relative flex min-h-[90vh] items-center overflow-hidden bg-background pt-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGES.center})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-background/70" aria-hidden="true" />
        <div className="container relative z-10 mx-auto px-4 py-16">
          <HeroCopy />
        </div>
      </section>
    );
  }

  return (
    <section id="home" className="relative w-full bg-background">
      <div style={{ height: `calc(${SECTION_HEIGHT}px + 100vh)` }} className="relative w-full">
        <StickyHero />
        <ParallaxImages />
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-b from-background/0 to-background" />
      </div>
    </section>
  );
};

function HeroCopy() {
  return (
    <div className="max-w-3xl space-y-7">
      <h1 className="font-display text-[clamp(2.7rem,7vw,6.5rem)] font-extrabold leading-[.94] tracking-[-.05em]">
        La mode reprend <span className="text-gradient">vie.</span>
      </h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        Achetez et vendez des vêtements et accessoires d'occasion avec la communauté Madclothes.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/boutique" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 font-display font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">
          Explorer la boutique <ArrowRight size={17} />
        </Link>
        <Link to="/vendre" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-4 font-display font-semibold backdrop-blur-sm transition-colors hover:border-primary/60 hover:text-primary">
          Vendre un article
        </Link>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground">
        <span>Acheteurs et vendeurs</span>
        <span>Vêtements et accessoires</span>
        <span>Communauté congolaise</span>
      </div>
    </div>
  );
}

function StickyHero() {
  const { scrollY } = useScroll();
  const clip1 = useTransform(scrollY, [0, 1500], [25, 0]);
  const clip2 = useTransform(scrollY, [0, 1500], [75, 100]);
  const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;
  const backgroundSize = useTransform(scrollY, [0, SECTION_HEIGHT + 500], ["170%", "100%"]);
  const imageOpacity = useTransform(scrollY, [SECTION_HEIGHT, SECTION_HEIGHT + 500], [1, 0]);
  const copyOpacity = useTransform(scrollY, [0, 420], [1, 0]);

  return (
    <div className="sticky top-0 h-screen w-full">
      <motion.div
        role="img"
        aria-label="Sélection de vêtements d'occasion"
        className="absolute inset-0 bg-background"
        style={{
          clipPath,
          backgroundSize,
          opacity: imageOpacity,
          backgroundImage: `url(${HERO_IMAGES.center})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/45 to-background/20" aria-hidden="true" />
      <motion.div style={{ opacity: copyOpacity }} className="relative z-10 flex h-full items-center">
        <div className="container mx-auto px-4 pt-16">
          <HeroCopy />
        </div>
      </motion.div>
    </div>
  );
}

function ParallaxImages() {
  return (
    <div className="relative z-10 mx-auto max-w-5xl px-4 pt-[200px]">
      <ParallaxImg
        src={HERO_IMAGES.rack}
        alt="Rayon de vêtements d'occasion"
        start={-200}
        end={200}
        className="w-1/3 rounded-2xl border border-white/10 object-cover shadow-2xl"
      />
      <ParallaxImg
        src={HERO_IMAGES.denim}
        alt="Jean porté, prêt à trouver un nouvel usage"
        start={200}
        end={-250}
        className="mx-auto w-2/3 rounded-2xl border border-white/10 object-cover shadow-2xl"
      />
      <ParallaxImg
        src={HERO_IMAGES.jacket}
        alt="Veste de saison"
        start={-200}
        end={200}
        className="ml-auto w-1/3 rounded-2xl border border-white/10 object-cover shadow-2xl"
      />
      <ParallaxImg
        src={HERO_IMAGES.dress}
        alt="Robe mise en avant dans le catalogue"
        start={0}
        end={-500}
        className="ml-24 w-5/12 rounded-2xl border border-white/10 object-cover shadow-2xl"
      />
    </div>
  );
}

function ParallaxImg({
  className,
  alt,
  src,
  start,
  end,
}: {
  className: string;
  alt: string;
  src: string;
  start: number;
  end: number;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`${start}px end`, `end ${end * -1}px`],
  });
  const opacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0.85]);
  const y = useTransform(scrollYProgress, [0, 1], [start, end]);
  const transform = useMotionTemplate`translateY(${y}px) scale(${scale})`;

  return (
    <motion.img
      src={src}
      alt={alt}
      className={className}
      ref={ref}
      style={{ transform, opacity }}
    />
  );
}

export default HeroSection;
