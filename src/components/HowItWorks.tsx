import { Camera, MessageCircle, UserPlus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const steps = [
  { icon: UserPlus, title: "Créez votre compte", description: "Connectez-vous pour enregistrer vos annonces, vos favoris et vos conversations." },
  { icon: Camera, title: "Publiez un article", description: "Ajoutez des photos, décrivez l'état de l'article et indiquez votre prix." },
  { icon: MessageCircle, title: "Échangez avec l'autre membre", description: "Discutez des détails et convenez ensemble des modalités de remise." },
];

const HowItWorks = () => {
  const reduce = useReducedMotion();
  return <section id="how" className="py-24 relative"><div className="container mx-auto px-4">
    <motion.div initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={reduce ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14"><p className="text-mono text-xs text-primary mb-3">Comment ça marche</p><h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Simple, à votre <span className="text-gradient">rythme</span></h2><p className="text-muted-foreground max-w-xl mx-auto">Madclothes met en relation les membres. Paiement et livraison restent à convenir jusqu'à l'activation des partenaires.</p></motion.div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">{steps.map(({ icon: Icon, title, description }, index) => <motion.article key={title} initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={reduce ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduce ? 0 : index * .08 }} className="glass rounded-2xl p-7 text-center"><div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground"><Icon size={27} /></div><p className="text-xs text-primary mb-2">0{index + 1}</p><h3 className="font-display text-xl font-bold mb-3">{title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{description}</p></motion.article>)}</div>
  </div></section>;
};

export default HowItWorks;
