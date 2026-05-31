import { UserPlus, Camera, Repeat } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: UserPlus,
    title: "Créez votre compte",
    description: "Inscrivez-vous gratuitement. Votre profil est votre boutique personnelle.",
  },
  {
    icon: Camera,
    title: "Publiez vos articles",
    description: "Prenez une photo, fixez votre prix. Votre article est visible en 5 minutes.",
  },
  {
    icon: Repeat,
    title: "Vendez & achetez en confiance",
    description: "Paiement sécurisé, livraison rapide. La communauté vous protège.",
  },
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
          <p className="text-mono text-xs text-primary mb-3">— Process</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Simple, rapide, <span className="text-gradient">sécurisé</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Rejoindre Madclothes prend moins de 2 minutes.
          </p>
        </motion.div>

        <div className="relative">
          {/* Animated connecting line (desktop) */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            style={{ transformOrigin: "left" }}
            className="hidden lg:block absolute top-[88px] left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          />

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 relative"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.2, delayChildren: 0.2 } } }}
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
                }}
                whileHover={{ y: -8 }}
                className="group relative rounded-2xl glass glass-border-glow p-8 text-center overflow-hidden hover-glow-orange"
              >
                <div className="relative mx-auto mb-6 inline-flex items-center justify-center">
                  <motion.div
                    whileHover={{ rotate: -8, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="h-20 w-20 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center glow-shadow"
                  >
                    <step.icon className="h-8 w-8" />
                  </motion.div>
                  <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full glass-strong text-mono text-xs flex items-center justify-center text-primary">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold mb-3 uppercase tracking-wide">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
