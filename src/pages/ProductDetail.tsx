import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MapPin, MessageCircle, ShieldAlert } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import BackgroundFX from "@/components/BackgroundFX";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { conditionStyles, type Product } from "@/data/products";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useListings } from "@/hooks/useListings";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [delivery, setDelivery] = useState("delivery");
  const [city, setCity] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void api<Product & { images?: Product["images"] }>(`/api/listings/${id}`)
      .then((item) => setProduct({ ...item, img: item.images?.[0]?.url || "/images/product-placeholder.svg" }))
      .catch((cause) => setError((cause as Error).message))
      .finally(() => setLoading(false));
  }, [id]);
  useEffect(() => {
    if (!user || !id) { setFavorite(false); return; }
    void api<{ id: string }[]>("/api/favorites").then((items) => setFavorite(items.some((item) => item.id === id))).catch(() => {});
  }, [user, id]);

  const relatedQuery = product ? new URLSearchParams({ category: product.category }).toString() : "category=__none__";
  const { items: related } = useListings(relatedQuery, 4);

  async function toggleFavorite() {
    if (!user) { window.dispatchEvent(new CustomEvent("madclothes:auth-required")); return; }
    try { await api(`/api/favorites/${id}`, { method: favorite ? "DELETE" : "POST" }); setFavorite(!favorite); }
    catch (cause) { setNotice((cause as Error).message); }
  }
  async function placeOrder(event: React.FormEvent) {
    event.preventDefault();
    if (!user) { window.dispatchEvent(new CustomEvent("madclothes:auth-required")); return; }
    setBusy(true); setNotice("");
    try {
      const order = await api<{ id: string; message: string }>("/api/orders", { method: "POST", body: JSON.stringify({ listingId: id, deliveryMethod: delivery, city, details }) });
      setNotice(order.message); setOrderOpen(false); navigate("/commandes");
    } catch (cause) { setNotice((cause as Error).message); }
    finally { setBusy(false); }
  }
  async function contactSeller(event: React.FormEvent) {
    event.preventDefault();
    if (!user) { window.dispatchEvent(new CustomEvent("madclothes:auth-required")); return; }
    setBusy(true);
    try { const conversation = await api<{ id: string }>("/api/conversations", { method: "POST", body: JSON.stringify({ listingId: id, message }) }); navigate(`/messages/${conversation.id}`); }
    catch (cause) { setNotice((cause as Error).message); }
    finally { setBusy(false); }
  }
  async function report(event: React.FormEvent) {
    event.preventDefault();
    try { await api("/api/reports", { method: "POST", body: JSON.stringify({ targetType: "listing", targetId: id, reason: reportReason }) }); setNotice("Signalement envoyé à l'équipe de modération."); setReportOpen(false); }
    catch (cause) { setNotice((cause as Error).message); }
  }

  if (loading) return <div className="min-h-screen grid place-items-center">Chargement de l'annonce…</div>;
  if (!product) return <div className="min-h-screen bg-background"><Navbar /><main className="container mx-auto px-4 pt-36 pb-24 text-center"><h1 className="font-display text-3xl mb-4">Article introuvable</h1><p className="text-muted-foreground mb-6">{error || "Cette annonce n'est plus disponible."}</p><Link to="/boutique"><Button className="rounded-full">Retour à la boutique</Button></Link></main><Footer /></div>;

  return <div className="min-h-screen bg-background relative"><BackgroundFX /><Navbar />
    <main className="container mx-auto px-4 pt-32 pb-24"><BackButton fallbackTo="/boutique" />
      <div className="grid lg:grid-cols-2 gap-10"><motion.div initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} className="relative glass rounded-2xl overflow-hidden aspect-square"><img src={product.img} alt={product.name} className="w-full h-full object-cover bg-white/5" /><span className={`absolute top-4 left-4 text-xs px-3 py-1 rounded-full border backdrop-blur-md ${conditionStyles[product.condition]}`}>{product.condition}</span></motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col"><p className="text-mono text-xs text-primary mb-3">{product.category}</p><h1 className="font-display text-3xl md:text-5xl font-bold mb-3">{product.name}</h1><p className="text-muted-foreground mb-6">{product.brand || "Sans marque"}{product.size ? ` · Taille ${product.size}` : ""}</p><p className="font-display text-4xl font-bold text-primary mb-6">{product.price.toLocaleString("fr-FR")} <span className="text-base text-muted-foreground font-body font-normal">FCFA</span></p><p className="flex items-center gap-2 text-sm text-muted-foreground mb-5"><MapPin size={14} /> {product.location}</p>{product.description && <p className="whitespace-pre-line leading-relaxed mb-6">{product.description}</p>}<p className="text-sm text-muted-foreground mb-8">Vendu par {product.seller || "un membre Madclothes"}</p>
          {notice && <p role="status" className="mb-4 rounded-xl bg-primary/10 p-3 text-sm">{notice}</p>}
          <div className="flex flex-col sm:flex-row gap-3 mb-8"><Button onClick={() => setOrderOpen(!orderOpen)} className="rounded-full flex-1" size="lg">Demander cet article</Button><Button onClick={toggleFavorite} aria-pressed={favorite} variant="outline" size="lg" className="rounded-full border-white/15 gap-2"><Heart size={16} fill={favorite ? "currentColor" : "none"} />{favorite ? "Dans mes favoris" : "Ajouter aux favoris"}</Button><Button onClick={() => setMessageOpen(!messageOpen)} variant="outline" size="lg" className="rounded-full border-white/15 gap-2"><MessageCircle size={16} /> Écrire</Button></div>
          {orderOpen && <form onSubmit={placeOrder} className="glass rounded-2xl p-5 space-y-4 mb-6"><h2 className="font-display font-bold">Demande de commande</h2><div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="order-method">Remise</Label><select id="order-method" value={delivery} onChange={(e) => setDelivery(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="delivery">Livraison à convenir</option><option value="pickup">Remise en main propre</option></select></div><div className="space-y-2"><Label htmlFor="order-city">Ville souhaitée</Label><Input id="order-city" required maxLength={80} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Pointe-Noire" /></div></div><div className="space-y-2"><Label htmlFor="order-details">Précisions (facultatif)</Label><Textarea id="order-details" maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Indiquez vos disponibilités ou consignes…" /></div><p className="text-xs text-muted-foreground">La demande reste en attente : aucun paiement ni livraison n'est confirmé tant que ces prestataires ne sont pas configurés.</p><Button disabled={busy} type="submit" className="rounded-full">{busy ? "Envoi…" : "Envoyer la demande"}</Button></form>}
          {messageOpen && <form onSubmit={contactSeller} className="glass rounded-2xl p-5 space-y-3 mb-6"><Label htmlFor="seller-message">Votre message au vendeur</Label><Textarea id="seller-message" required maxLength={5000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Bonjour, cet article est-il toujours disponible ?" /><Button disabled={busy} type="submit" className="rounded-full">Ouvrir la conversation</Button></form>}
          <div className="grid grid-cols-2 gap-4"><div className="glass rounded-xl p-4"><p className="font-display font-semibold text-sm">Paiement</p><p className="text-xs text-muted-foreground mt-1">Moyens de paiement en cours de configuration.</p></div><div className="glass rounded-xl p-4"><p className="font-display font-semibold text-sm">Remise</p><p className="text-xs text-muted-foreground mt-1">À convenir entre acheteur et vendeur.</p></div></div>
          <button onClick={() => setReportOpen(!reportOpen)} className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary mt-5"><ShieldAlert size={14} /> Signaler cette annonce</button>
          {reportOpen && <form onSubmit={report} className="mt-3 space-y-3"><Textarea required minLength={3} maxLength={1000} value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Décrivez le problème" /><Button type="submit" size="sm">Envoyer le signalement</Button></form>}
        </motion.div>
      </div>
      {related.filter((item) => item.id !== product.id).length > 0 && <section className="mt-20"><h2 className="font-display text-2xl md:text-3xl font-bold mb-8">Articles similaires</h2><div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">{related.filter((item) => item.id !== product.id).map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    </main><Footer />
  </div>;
};

export default ProductDetail;
