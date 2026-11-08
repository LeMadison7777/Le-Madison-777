import { ArrowDown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import heroImage from "@/assets/hero-fashion.webp";
import HeroGarmentDecoration from "@/components/HeroGarmentDecoration";

const setHeroImagePriority = (image: HTMLImageElement | null) => {
  image?.setAttribute("fetchpriority", "high");
};

const HeroSection = () => {
  const reduce = useReducedMotion();
  const enter = reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: .55 } };
  return <section id="home" className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
    <div className="absolute inset-0 bg-gradient-page" aria-hidden="true" />
    <div className="absolute -top-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-[110px]" aria-hidden="true" />
    <HeroGarmentDecoration />
    <div className="container relative z-10 mx-auto grid items-center gap-10 px-4 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
      <motion.div {...enter} className="relative z-10 max-w-3xl space-y-7">
        <h1 className="font-display text-[clamp(2.7rem,7vw,6.5rem)] font-extrabold leading-[.94] tracking-[-.05em]">La mode reprend <span className="text-gradient">vie.</span></h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">Achetez et vendez des vêtements et accessoires d'occasion avec la communauté Madclothes.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/boutique" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 font-display font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">Explorer la boutique <ArrowRight size={17} /></Link>
          <Link to="/vendre" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-4 font-display font-semibold transition-colors hover:border-primary/60 hover:text-primary">Vendre un article</Link>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground"><span>Acheteurs et vendeurs</span><span>Vêtements et accessoires</span><span>Communauté congolaise</span></div>
      </motion.div>
      <motion.div {...(reduce ? {} : { initial: { opacity: 0, scale: .97 }, animate: { opacity: 1, scale: 1 }, transition: { duration: .7, delay: .12 } })} className="relative mx-auto w-full max-w-xl">
        <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-primary opacity-20 blur-2xl" aria-hidden="true" />
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-secondary shadow-2xl"><img ref={setHeroImagePriority} src={heroImage} alt="Pièce de mode à découvrir sur Madclothes" className="aspect-[4/4.4] w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent px-6 pb-6 pt-20"><p className="font-display text-xl font-bold">Une nouvelle histoire pour chaque pièce.</p><p className="text-sm text-muted-foreground mt-1">Parcourez les annonces disponibles près de chez vous.</p></div></div>
      </motion.div>
    </div>
    {!reduce && <a href="#categories" aria-label="Défiler vers les catégories" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-muted-foreground md:block"><ArrowDown size={18} /></a>}
  </section>;
};

export default HeroSection;
