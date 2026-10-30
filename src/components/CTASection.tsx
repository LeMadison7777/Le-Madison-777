import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

const CTASection = () => {
  const reduce = useReducedMotion();
  return <section id="cta-vendre" className="relative overflow-hidden py-24 md:py-32">
    <div className="absolute inset-0 bg-gradient-page" aria-hidden="true" />
    <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-accent/10 blur-[100px]" aria-hidden="true" />
    <motion.div initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={reduce ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true }} className="container relative mx-auto px-4 text-center">
      <p className="text-mono text-xs text-primary mb-5">Vendez sur Madclothes</p>
      <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">Votre placard a <span className="text-gradient">du potentiel.</span></h2>
      <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-9">Publiez vos articles, échangez avec les acheteurs et convenez ensemble de la remise.</p>
      <Link to="/vendre" className="inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 font-display font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">Commencer à vendre <ArrowRight size={18} /></Link>
    </motion.div>
  </section>;
};

export default CTASection;
