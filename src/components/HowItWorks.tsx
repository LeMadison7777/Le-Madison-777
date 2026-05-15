import { Camera, CreditCard, Package, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { icon: Camera, title: "Publie ton article", description: "Prends des photos, fixe ton prix et publie en quelques secondes." },
  { icon: ShieldCheck, title: "Paiement sécurisé", description: "L'acheteur paie en toute sécurité. L'argent est bloqué jusqu'à la réception." },
  { icon: Package, title: "Envoie le colis", description: "Expédie l'article. L'acheteur confirme la réception sous 48h." },
  { icon: CreditCard, title: "Reçois tes gains", description: "Retrait sur Mobile Money ou compte bancaire en un clic." },
];

const HowItWorks = () => {
  return (
    <section id="how" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Comment ça <span className="text-gradient">marche</span> ?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Vendre et acheter n'a jamais été aussi simple.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              variants={{
                hidden: { opacity: 0, y: 40 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative rounded-2xl bg-card border border-border p-8 hover:border-primary/40 transition-colors duration-300 card-shadow overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-[0.06] transition-opacity"
              />
              <motion.div
                whileHover={{ rotate: -8, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="mb-6 inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-primary text-primary-foreground"
              >
                <step.icon className="h-6 w-6" />
              </motion.div>
              <span className="absolute top-6 right-6 text-5xl font-display font-black text-border/60 group-hover:text-primary/30 transition-colors">
                {i + 1}
              </span>
              <h3 className="font-display text-xl font-bold mb-2 relative">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed relative">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
