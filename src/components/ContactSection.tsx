import { Phone, Mail, MessageCircle, Facebook, Instagram } from "lucide-react";
import { motion } from "framer-motion";
import whatsappQr from "@/assets/whatsapp-qr.jpeg";

const socials = [
  {
    label: "WhatsApp",
    href: "https://wa.me/242066099427",
    Icon: MessageCircle,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1B37kmhtz7/",
    Icon: Facebook,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/ngoyi7777",
    Icon: Instagram,
  },
  {
    label: "Email",
    href: "mailto:ngoyiexauceroro@gmail.com",
    Icon: Mail,
  },
];

const ContactSection = () => {
  return (
    <section id="contact" className="py-16 sm:py-24 border-t border-border">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
        >
          Contactez-<span className="text-gradient">nous</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-muted-foreground mb-10 sm:mb-12 text-sm sm:text-base"
        >
          Une question, une suggestion ou un partenariat ? Notre équipe est à votre écoute.
        </motion.p>

        <motion.div
          className="grid sm:grid-cols-2 gap-4 sm:gap-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
        >
          {[
            { href: "tel:+242066099427", Icon: Phone, label: "Téléphone", value: "+242 06 609 94 27" },
            { href: "mailto:ngoyiexauceroro@gmail.com", Icon: Mail, label: "Email", value: "ngoyiexauceroro@gmail.com" },
          ].map(({ href, Icon, label, value }) => (
            <motion.a
              key={label}
              href={href}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group flex items-center gap-4 p-5 sm:p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors"
            >
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                <Icon className="h-6 w-6" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
                <div className="font-medium truncate">{value}</div>
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* WhatsApp QR */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 sm:mt-12 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-left ring-glow"
        >
          <motion.img
            whileHover={{ scale: 1.05, rotate: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            src={whatsappQr}
            alt="QR Code WhatsApp Madclothes"
            className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl object-cover shrink-0"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 text-primary mb-2">
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs uppercase tracking-wider font-semibold">WhatsApp</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold mb-2">
              Scannez le QR Code
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ouvrez l'appareil photo de WhatsApp et scannez ce code pour nous écrire directement.
            </p>
            <a
              href="https://wa.me/242066099427"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <MessageCircle className="h-4 w-4" /> Ouvrir WhatsApp
            </a>
          </div>
        </motion.div>

        <div className="mt-10 sm:mt-12">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-5">
            Suivez-nous
          </div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap"
          >
            {socials.map(({ label, href, Icon }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                variants={{ hidden: { opacity: 0, scale: 0.5 }, show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 260 } } }}
                whileHover={{ y: -4, scale: 1.15 }}
                whileTap={{ scale: 0.92 }}
                className="group flex items-center justify-center h-12 w-12 rounded-full border border-border bg-card text-muted-foreground hover:text-primary-foreground hover:bg-primary hover:border-primary transition-colors"
              >
                <Icon className="h-5 w-5" />
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;