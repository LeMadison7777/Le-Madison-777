import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

type Order = {
  id: string;
  status: string;
  itemPrice: number;
  total: number;
  createdAt: string;
  listingTitle: string;
  listingId: string;
  otherPartyName: string;
  isSeller: boolean;
  hasReviewed: boolean;
};

const labels: Record<string, string> = {
  pending_payment: "Demande en attente",
  paid: "Payée",
  processing: "En préparation",
  shipped: "Expédiée",
  completed: "Terminée",
  cancelled: "Annulée",
  disputed: "En litige",
  refunded: "Remboursée",
};

export default function Orders() {
  const [items, setItems] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setError("");
    void api<Order[]>("/api/orders").then(setItems).catch((e) => setError((e as Error).message));
  }, []);

  useEffect(() => load(), [load]);

  async function cancel(id: string) {
    try {
      await api(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: "cancelled" }) });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await api(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function submitReview(id: string) {
    setSubmittingId(id);
    setError("");
    try {
      await api(`/api/orders/${id}/review`, { method: "POST", body: JSON.stringify({ rating, comment }) });
      setItems((current) => current.map((order) => order.id === id ? { ...order, hasReviewed: true } : order));
      setComment("");
      setRating(5);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 pt-32 pb-20">
        <BackButton fallbackTo="/compte" />
        <h1 className="mb-8 font-display text-4xl font-bold">Mes <span className="text-gradient">commandes</span></h1>
        {error && <p role="alert" className="mb-5 text-sm text-destructive">{error}</p>}
        {items.length === 0 && !error && <p className="glass rounded-2xl p-8 text-muted-foreground">Aucune commande pour le moment.</p>}
        <div className="space-y-4">
          {items.map((order) => (
            <article key={order.id} className="glass rounded-2xl p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="font-semibold">{order.listingTitle}</p>
                  <p className="text-sm text-muted-foreground">Commande du {new Date(order.createdAt).toLocaleDateString("fr-FR")} · {order.isSeller ? "Acheteur" : "Vendeur"} : {order.otherPartyName}</p>
                  <p className="mt-2 font-bold text-primary">{order.total.toLocaleString("fr-FR")} FCFA</p>
                  <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{labels[order.status] || order.status}</span>
                </div>
                <div className="flex gap-3">
                  <a className="self-center text-sm text-primary" href={`/article/${order.listingId}`}>Voir l’article</a>
                  {!order.isSeller && order.status === "pending_payment" && <Button onClick={() => void cancel(order.id)} variant="outline" className="rounded-full">Annuler</Button>}
                  {order.isSeller && order.status === "paid" && <Button onClick={() => void updateStatus(order.id, "processing")} variant="outline" className="rounded-full">Préparer la commande</Button>}
                  {order.isSeller && order.status === "processing" && <Button onClick={() => void updateStatus(order.id, "shipped")} variant="outline" className="rounded-full">Marquer comme expédiée</Button>}
                  {!order.isSeller && order.status === "shipped" && <Button onClick={() => void updateStatus(order.id, "completed")} className="rounded-full">Confirmer la réception</Button>}
                </div>
              </div>
              {order.status === "completed" && (
                <div className="mt-5 border-t border-border/60 pt-4">
                  {order.hasReviewed ? (
                    <p className="text-sm text-muted-foreground">Votre évaluation a été enregistrée.</p>
                  ) : (
                    <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void submitReview(order.id); }}>
                      <h2 className="font-semibold">Évaluer cette transaction</h2>
                      <label className="flex items-center gap-3 text-sm">
                        Votre note
                        <select aria-label="Votre note" value={rating} onChange={(event) => setRating(Number(event.target.value))} className="rounded-lg border border-input bg-background px-3 py-2">
                          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}
                        </select>
                      </label>
                      <Textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1200} placeholder="Un commentaire (facultatif)" />
                      <Button type="submit" disabled={submittingId === order.id} className="rounded-full">
                        {submittingId === order.id ? "Envoi…" : "Publier mon évaluation"}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
        {items.some((item) => item.status === "pending_payment") && <p className="mt-6 text-sm text-muted-foreground">Le paiement n’est pas encore activé : les demandes restent en attente et ne confirment pas une vente.</p>}
      </main>
      <Footer />
    </div>
  );
}
