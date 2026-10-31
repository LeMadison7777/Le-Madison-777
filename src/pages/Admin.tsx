import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, assertArray } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Report = { id: string; targetType: string; targetId: string; reason: string; status: string; createdAt: string; reporter: string };
export default function Admin() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [sellerRate, setSellerRate] = useState("0");
  useEffect(() => { void api<{ sellerBps: number }>("/api/commissions").then((value) => setSellerRate(String(value.sellerBps / 100))).catch(() => {}); }, []);
  const load = () => void api<Report[]>("/api/admin/reports").then((data) => setReports(assertArray<Report>(data, "signalements"))).catch((e) => setError((e as Error).message));
  useEffect(load, []);
  async function saveCommission(event: React.FormEvent) {
    event.preventDefault();
    try { await api("/api/admin/commissions", { method: "PATCH", body: JSON.stringify({ sellerBps: Math.round(Number(sellerRate) * 100), configured: true }) }); setError(""); }
    catch (e) { setError((e as Error).message); }
  }
  async function update(id: string, status: string, action?: string) {
    try { await api(`/api/admin/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status, note: notes[id] || "", action }) }); load(); }
    catch (e) { setError((e as Error).message); }
  }
  return <div className="min-h-screen bg-background"><Navbar /><main className="container mx-auto max-w-5xl px-4 pt-32 pb-20"><h1 className="font-display text-4xl font-bold mb-2">Modération</h1><p className="text-muted-foreground mb-8">Espace réservé aux comptes autorisés côté serveur.</p>
    {!profile || !["admin","moderator"].includes(profile.role) ? <p className="glass rounded-2xl p-6">Accès réservé à l'équipe de modération.</p> : <>
      {error && <p role="alert" className="text-sm text-destructive mb-5">{error}</p>}
      {profile.role === "admin" && <form onSubmit={saveCommission} className="glass rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-end gap-4"><div className="space-y-2"><Label htmlFor="seller-rate">Commission vendeur (%)</Label><Input id="seller-rate" type="number" min="0" max="20" step="0.01" placeholder="Ex. 5" value={sellerRate} onChange={(e) => setSellerRate(e.target.value)} /></div><Button type="submit" className="rounded-full">Enregistrer le barème</Button><p className="text-xs text-muted-foreground flex-1">Le barème est affiché publiquement. Le paiement reste désactivé jusqu'à configuration du prestataire.</p></form>}
      {!reports.length && <p className="glass rounded-2xl p-6 text-muted-foreground">Aucun signalement en attente.</p>}
      <div className="space-y-4">{reports.map((report) => <article key={report.id} className="glass rounded-2xl p-5"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">{report.targetType} · {report.targetId}</p><span className="text-xs text-muted-foreground">par {report.reporter} · {new Date(report.createdAt).toLocaleDateString("fr-FR")}</span></div><p className="my-3 text-sm">{report.reason}</p><Textarea value={notes[report.id] || ""} onChange={(e) => setNotes({ ...notes, [report.id]: e.target.value })} placeholder="Note de résolution (facultatif)" maxLength={1000} /><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => void update(report.id,"reviewing")} variant="outline">Prendre en charge</Button>{report.targetType === "listing" && <Button onClick={() => void update(report.id,"resolved","suspend_target")} variant="destructive">Suspendre l'annonce</Button>}{report.targetType === "profile" && profile.role === "admin" && <Button onClick={() => void update(report.id,"resolved","suspend_target")} variant="destructive">Suspendre le compte</Button>}<Button onClick={() => void update(report.id,"resolved")}>Résoudre</Button><Button onClick={() => void update(report.id,"dismissed")} variant="ghost">Écarter</Button></div></article>)}</div>
    </>}
  </main><Footer /></div>;
}
