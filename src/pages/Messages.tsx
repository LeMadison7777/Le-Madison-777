import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, assertArray } from "@/lib/api";

type Conversation = { id: string; listingId: string; listingTitle: string; otherName: string; lastMessage: string | null; lastMessageAt: string };
type Message = { id: string; body: string; createdAt: string; own: boolean; senderName: string };
export default function Messages() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const loadConversations = useCallback(() => void api<Conversation[]>("/api/conversations").then((data) => setConversations(assertArray<Conversation>(data, "conversations"))).catch((e) => setError((e as Error).message)), []);
  const loadMessages = useCallback(() => { if (id) void api<Message[]>(`/api/conversations/${id}`).then((data) => setMessages(assertArray<Message>(data, "messages"))).catch((e) => setError((e as Error).message)); }, [id]);
  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => {
    loadMessages();
    const timer = window.setInterval(() => { loadConversations(); loadMessages(); }, 10_000);
    return () => window.clearInterval(timer);
  }, [loadConversations, loadMessages]);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    const cleanDraft = draft.trim();
    if (!id || !cleanDraft || sending) return;
    setError(""); setSending(true);
    try { await api(`/api/conversations/${id}`, { method: "POST", body: JSON.stringify({ message: cleanDraft }) }); setDraft(""); loadMessages(); loadConversations(); }
    catch (e) { setError((e as Error).message); }
    finally { setSending(false); }
  }
  const activeConversation = conversations.find((item) => item.id === id);
  return <div className="min-h-screen bg-background"><Navbar /><main className="container mx-auto max-w-6xl px-4 pt-32 pb-20"><BackButton fallbackTo="/compte" /><h1 className="font-display text-4xl font-bold mb-8">Ma <span className="text-gradient">messagerie</span></h1>
    {error && <p role="alert" className="text-sm text-destructive mb-4">{error}</p>}
    <div className="grid md:grid-cols-[300px_1fr] min-h-[520px] glass rounded-2xl overflow-hidden">
      <aside className="border-r border-white/10 p-4"><h2 className="font-semibold mb-3">Conversations</h2>{!conversations.length && <p className="text-sm text-muted-foreground">Aucune conversation.</p>}<ul className="space-y-2">{conversations.map((item) => <li key={item.id}><Link to={`/messages/${item.id}`} className={`block rounded-xl p-3 hover:bg-white/5 ${id === item.id ? "bg-primary/10" : ""}`}><p className="font-medium text-sm">{item.otherName}</p><p className="text-xs text-primary truncate">{item.listingTitle}</p><p className="text-xs text-muted-foreground truncate mt-1">{item.lastMessage || "Conversation ouverte"}</p></Link></li>)}</ul></aside>
      <section className="flex flex-col min-h-[520px]">{id ? <>
        <div className="border-b border-white/10 p-4"><p className="font-semibold">Conversation avec {activeConversation?.otherName || "le vendeur"}</p><Link to={activeConversation ? `/article/${activeConversation.listingId}` : "/messages"} className="text-sm text-muted-foreground hover:text-primary">{activeConversation?.listingTitle || "Conversation"}</Link></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">{messages.map((item) => <div key={item.id} className={`max-w-[80%] rounded-2xl px-4 py-3 ${item.own ? "ml-auto bg-primary text-primary-foreground" : "bg-white/5"}`}><p className="text-xs opacity-70 mb-1">{item.own ? "Vous" : item.senderName}</p><p className="whitespace-pre-wrap text-sm">{item.body}</p><p className="mt-1 text-[10px] opacity-60">{new Date(item.createdAt).toLocaleString("fr-FR")}</p></div>)}</div>
        <form onSubmit={send} className="border-t border-white/10 p-4 flex items-end gap-3"><Textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={5000} rows={2} placeholder="Écrire un message…" /><Button aria-label="Envoyer le message" disabled={sending || !draft.trim()} type="submit" className="shrink-0 rounded-full">{sending ? "Envoi…" : <><Send size={16} aria-hidden="true" />Envoyer</>}</Button></form>
      </> : <div className="grid flex-1 place-items-center p-8 text-center text-muted-foreground">Choisissez une conversation ou contactez un vendeur depuis une annonce.</div>}</section>
    </div>
  </main><Footer /></div>;
}
