import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type Review = { rating: number; comment: string; displayName: string; city: string | null; createdAt: string };

export default function Testimonials({ showEmpty = false }: { showEmpty?: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const reduce = useReducedMotion();
  useEffect(() => { void fetch("/api/reviews").then((response) => response.ok ? response.json() : []).then(setReviews).catch(() => setReviews([])); }, []);
  if (!reviews.length) return showEmpty ? <section className="py-20"><div className="container mx-auto px-4 text-center"><h2 className="font-display text-3xl font-bold">Avis de la communauté</h2><p className="mx-auto mt-5 max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 text-muted-foreground">Les avis des membres apparaîtront ici après les premières expériences sur Madclothes.</p></div></section> : null;
  return <section id="testimonials" className="py-20 relative"><div className="container mx-auto px-4"><div className="text-center mb-12"><p className="text-mono text-xs text-primary mb-3">Avis de la communauté</p><h2 className="font-display text-3xl md:text-5xl font-bold">Retours <span className="text-gradient">d'expérience</span></h2></div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{reviews.map((review, index) => <motion.article key={`${review.displayName}-${review.createdAt}`} initial={reduce ? false : { opacity: 0, y: 12 }} whileInView={reduce ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduce ? 0 : index * .04 }} className="glass rounded-2xl p-6"><div className="flex gap-1 text-primary mb-4">{Array.from({ length: review.rating }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div><p className="leading-relaxed">“{review.comment}”</p><p className="text-sm font-semibold mt-5">{review.displayName}</p><p className="text-xs text-muted-foreground">{review.city || "Membre Madclothes"}</p></motion.article>)}</div>
  </div></section>;
}
