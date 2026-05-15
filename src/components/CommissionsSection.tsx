import { motion } from "framer-motion";
const tiers = [
  { range: "0 — 5 000 FCFA", seller: "8%", buyer: "5%", total: "13%" },
  { range: "5 001 — 20 000 FCFA", seller: "7%", buyer: "4%", total: "11%" },
  { range: "20 001 — 50 000 FCFA", seller: "6%", buyer: "4%", total: "10%" },
  { range: "50 001 — 100 000 FCFA", seller: "5%", buyer: "3%", total: "8%" },
  { range: "100 001+ FCFA", seller: "4%", buyer: "3%", total: "7%" },
];

const CommissionsSection = () => {
  return (
    <section id="commissions" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Tarifs <span className="text-gradient">transparents</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Des commissions dégressives — plus tu vends cher, moins tu paies.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto overflow-hidden rounded-2xl border border-border card-shadow bg-card/50 backdrop-blur-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left px-6 py-4 font-body font-semibold text-muted-foreground">Tranche de prix</th>
                  <th className="text-center px-4 py-4 font-body font-semibold text-muted-foreground">Vendeur</th>
                  <th className="text-center px-4 py-4 font-body font-semibold text-muted-foreground">Acheteur</th>
                  <th className="text-center px-4 py-4 font-body font-semibold text-primary">Total</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                    className="border-t border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">{t.range}</td>
                    <td className="text-center px-4 py-4 text-muted-foreground">{t.seller}</td>
                    <td className="text-center px-4 py-4 text-muted-foreground">{t.buyer}</td>
                    <td className="text-center px-4 py-4 font-bold text-primary">{t.total}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CommissionsSection;
