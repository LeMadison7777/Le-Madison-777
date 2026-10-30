import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Category = { id: string; name: string; slug: string };
const conditions = ["Neuf avec étiquette", "Neuf sans étiquette", "Très bon état", "Bon état", "État correct"];

export default function Sell() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", categoryId: "", brand: "", size: "", condition: conditions[2], price: "", city: "" });
  useEffect(() => {
    let active = true;
    void fetch("/api/categories", { headers: { Accept: "application/json" } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Impossible de charger les catégories.");
        return data as Category[];
      })
      .then((data) => {
        if (!active) return;
        setCategories(data);
        if (data[0]) setForm((current) => ({ ...current, categoryId: current.categoryId || data[0].id }));
      })
      .catch((cause) => { if (active) setCategoryError((cause as Error).message); })
      .finally(() => { if (active) setCategoriesLoading(false); });
    return () => { active = false; };
  }, []);
  async function publish(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (!files.length) { setError("Ajoutez au moins une photo pour publier l'annonce."); return; }
    if (files.length > 10) { setError("Vous pouvez sélectionner jusqu'à 10 photos."); return; }
    setBusy(true);
    let stage = "la création du brouillon";
    try {
      const draft = await api<{ id: string }>("/api/listings", { method: "POST", body: JSON.stringify({ ...form, price: Number(form.price) }) });
      for (const [position, file] of files.entries()) {
        stage = "la préparation du téléversement";
        const signed = await api<{ uploadUrl: string; key: string }>("/api/uploads/presign", { method: "POST", body: JSON.stringify({ listingId: draft.id, contentType: file.type, size: file.size }) });
        stage = "l’envoi de la photo vers Cloudflare R2";
        const uploaded = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        if (!uploaded.ok) throw new Error("Le téléversement d'une photo a échoué. Vérifiez la configuration CORS de votre bucket Cloudflare R2.");
        stage = "l’enregistrement de la photo";
        await api("/api/uploads/confirm", { method: "POST", body: JSON.stringify({ listingId: draft.id, key: signed.key, alt: `${form.title} — photo ${position + 1}` }) });
      }
      stage = "la publication de l’annonce";
      await api(`/api/listings/${draft.id}/publish`, { method: "POST" });
      navigate(`/article/${draft.id}`);
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "Une erreur inconnue est survenue.";
      setError(`Échec pendant ${stage} : ${detail}`);
    }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen bg-background"><Navbar /><main className="container mx-auto max-w-3xl px-4 pt-32 pb-20"><BackButton fallbackTo="/compte" />
    <p className="text-mono text-xs text-primary mb-3">Vendre sur Madclothes</p><h1 className="font-display text-4xl md:text-5xl font-bold mb-3">Publier un <span className="text-gradient">article</span></h1><p className="text-muted-foreground mb-8">Présentez clairement l'article et choisissez des photos nettes.</p>
    <form onSubmit={publish} className="glass rounded-2xl p-6 md:p-8 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="listing-title">Titre</Label><Input id="listing-title" required minLength={3} maxLength={140} placeholder="Ex. Robe fleurie taille M" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="listing-category">Catégorie</Label>
          <Select value={form.categoryId} onValueChange={(categoryId) => setForm((current) => ({ ...current, categoryId }))} required disabled={categoriesLoading || categories.length === 0}>
            <SelectTrigger id="listing-category" aria-label="Choisir une catégorie"><SelectValue placeholder={categoriesLoading ? "Chargement des catégories…" : "Choisir une catégorie"} /></SelectTrigger>
            <SelectContent>{categories.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
          </Select>
          {categoryError && <p role="alert" className="text-xs text-destructive">{categoryError}</p>}
        </div></div>
      <div className="space-y-2"><Label htmlFor="listing-description">Description</Label><Textarea id="listing-description" required maxLength={5000} rows={5} placeholder="Décrivez la coupe, la matière et l'état de l'article…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid sm:grid-cols-3 gap-4"><div className="space-y-2"><Label htmlFor="listing-brand">Marque (facultatif)</Label><Input id="listing-brand" maxLength={80} placeholder="Ex. H&amp;M" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="listing-size">Taille</Label><Input id="listing-size" required maxLength={20} placeholder="M, 38, unique…" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="listing-condition">État</Label><select id="listing-condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{conditions.map((item) => <option key={item}>{item}</option>)}</select></div></div>
      <div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="listing-price">Prix (FCFA)</Label><Input id="listing-price" type="number" min={1} max={10000000} step={1} required placeholder="Ex. 5000" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="listing-city">Ville</Label><Input id="listing-city" required maxLength={80} placeholder="Pointe-Noire" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div></div>
      <div className="space-y-2"><Label htmlFor="listing-images">Photos (10 maximum, 15 Mo chacune)</Label><Input id="listing-images" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />{files.length > 0 && <p className="text-xs text-muted-foreground">{files.length} photo{files.length > 1 ? "s" : ""} sélectionnée{files.length > 1 ? "s" : ""}</p>}</div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button disabled={busy || !categories.length} className="rounded-full">{busy ? "Publication en cours…" : "Publier l'annonce"}</Button>
      <p className="text-xs text-muted-foreground">Les paiements restent en attente des accès et de la configuration des prestataires.</p>
    </form>
  </main><Footer /></div>;
}
