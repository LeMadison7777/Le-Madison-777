import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { api, assertArray } from "@/lib/api";

type Favorite = { id: string; name: string; brand: string | null; size: string | null; price: number; city: string; category: string; img: string };
export default function Favorites() {
  const [items, setItems] = useState<Favorite[]>([]);
  const [error, setError] = useState("");
  const load = () => void api<Favorite[]>("/api/favorites").then((data) => setItems(assertArray<Favorite>(data, "favoris"))).catch((e) => setError((e as Error).message));
  useEffect(load, []);
  async function remove(id: string) { await api(`/api/favorites/${id}`, { method: "DELETE" }); setItems((current) => Array.isArray(current) ? current.filter((item) => item.id !== id) : []); }
  return <div className="min-h-screen bg-background"><Navbar /><main className="container mx-auto px-4 pt-32 pb-20"><BackButton fallbackTo="/compte" /><h1 className="font-display text-4xl font-bold mb-8">Mes <span className="text-gradient">favoris</span></h1>
    {error && <p role="alert" className="text-sm text-destructive mb-5">{error}</p>}
    {!items.length && !error ? <div className="glass rounded-2xl p-10 text-center"><Heart className="mx-auto mb-4 text-primary" /><p className="text-muted-foreground mb-4">Vous n'avez pas encore enregistré d'article.</p><Link to="/boutique"><Button className="rounded-full">Parcourir la boutique</Button></Link></div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{items.map((item) => <article key={item.id} className="glass rounded-2xl overflow-hidden"><Link to={`/article/${item.id}`}><img src={item.img} alt={item.name} className="aspect-square w-full object-cover bg-white/5" /></Link><div className="p-4"><Link to={`/article/${item.id}`} className="font-semibold hover:text-primary">{item.name}</Link><p className="text-xs text-muted-foreground mt-1">{item.brand || item.category} · {item.size || "Taille unique"}</p><p className="font-bold text-primary mt-2">{item.price.toLocaleString("fr-FR")} FCFA</p><p className="text-xs text-muted-foreground mt-1"><MapPin size={12} className="inline" /> {item.city}</p><Button onClick={() => void remove(item.id)} variant="ghost" size="sm" className="mt-2 text-muted-foreground">Retirer des favoris</Button></div></article>)}</div>}
  </main><Footer /></div>;
}
