import { useEffect, useState } from "react";
import { ArrowUpRight, Heart, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { conditionStyles, type Product } from "@/data/products";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const [favorite, setFavorite] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user) void api<{ id: string }[]>("/api/favorites").then((items) => setFavorite(items.some((item) => item.id === product.id))).catch(() => {});
    else setFavorite(false);
  }, [user, product.id]);
  async function toggleFavorite(event: React.MouseEvent) {
    event.preventDefault(); event.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await api(`/api/favorites/${product.id}`, { method: favorite ? "DELETE" : "POST" });
      setFavorite(!favorite);
    } catch { window.dispatchEvent(new CustomEvent("madclothes:auth-required")); }
    finally { setBusy(false); }
  }
  return <motion.article layout className="group glass glass-border-glow rounded-2xl overflow-hidden flex flex-col">
    <div className="relative aspect-square overflow-hidden">
      <Link to={`/article/${product.id}`} aria-label={`Voir ${product.name}`}><img src={product.img} alt={product.name} loading="lazy" className="w-full h-full object-cover bg-white/5 transition-transform duration-700 group-hover:scale-105" /></Link>
      <span className={`absolute top-3 left-3 text-[10px] md:text-xs px-2.5 py-1 rounded-full border backdrop-blur-md ${conditionStyles[product.condition]}`}>{product.condition}</span>
      <button type="button" aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={favorite} disabled={busy} onClick={toggleFavorite} className={`absolute top-3 right-3 w-9 h-9 rounded-full glass-strong flex items-center justify-center transition-colors ${favorite ? "text-primary" : "text-foreground/80 hover:text-primary"}`}><Heart size={16} fill={favorite ? "currentColor" : "none"} /></button>
    </div>
    <div className="p-4 flex-1 flex flex-col gap-2">
      <Link to={`/article/${product.id}`} className="font-display font-semibold text-sm md:text-base leading-tight line-clamp-1 group-hover:text-primary">{product.name}</Link>
      <p className="text-xs text-muted-foreground">{product.brand || product.category}{product.size ? ` · Taille ${product.size}` : ""}</p>
      <p className="font-display text-lg font-bold text-primary mt-1">{product.price.toLocaleString("fr-FR")} <span className="text-xs text-muted-foreground font-body font-normal">FCFA</span></p>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-auto"><MapPin size={12} /><span className="line-clamp-1">{product.location}</span></div>
      <Link to={`/article/${product.id}`} className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl bg-white/5 hover:bg-primary hover:text-primary-foreground border border-white/10 hover:border-primary transition-colors">Voir l'article <ArrowUpRight size={14} /></Link>
    </div>
  </motion.article>;
}
