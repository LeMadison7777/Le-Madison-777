import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

type CommissionInfo = { configured: boolean; sellerBps: number };

const CommissionsSection = () => {
  const [commission, setCommission] = useState<CommissionInfo>({ configured: false, sellerBps: 0 });
  useEffect(() => { void api<CommissionInfo>("/api/commissions").then((result) => { if (result && typeof result.sellerBps === "number") setCommission(result); }).catch(() => {}); }, []);
  return <section id="commissions" className="py-20 relative"><div className="container mx-auto px-4">
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
      <p className="text-mono text-xs text-primary mb-3">Frais de service</p>
      <h2 className="font-display text-3xl md:text-5xl font-bold mb-5">Des frais <span className="text-gradient">transparents</span></h2>
      {commission.configured ? <div className="glass rounded-2xl p-8"><p className="text-muted-foreground">Commission vendeur</p><p className="font-display text-4xl font-bold text-primary mt-2">{(commission.sellerBps / 100).toLocaleString("fr-FR")} %</p><p className="text-xs text-muted-foreground mt-3">Le montant applicable est rappelé avant la mise en place d'un paiement.</p></div> : <div className="glass rounded-2xl p-8"><p className="text-muted-foreground">Le barème sera communiqué avant l'activation des paiements. Aucun frais n'est appliqué à une commande tant que le prestataire de paiement n'est pas activé.</p></div>}
    </motion.div>
  </div></section>;
};

export default CommissionsSection;
