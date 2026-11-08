import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Package, ShoppingBag, UserRound, CircleDollarSign, Bell, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api, assertArray } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import PushNotificationSettings from "@/components/PushNotificationSettings";

type Listing = { id: string; name: string; price: number; status: string; city: string; img: string };
type Notification = { id: string; kind: string; payload: Record<string, string>; readAt: string | null; createdAt: string };

const links = [
  { to: "/vendre", label: "Publier une annonce", Icon: ShoppingBag },
  { to: "/favoris", label: "Mes favoris", Icon: Heart },
  { to: "/commandes", label: "Mes commandes", Icon: Package },
  { to: "/messages", label: "Messagerie", Icon: MessageCircle },
];

export default function Account() {
  const { profile, refreshProfile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState("");

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");

  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ displayName: "", city: "", phone: "", biography: "" });

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName || "",
        city: profile.city || "",
        phone: profile.phone || "",
        biography: profile.biography || "",
      });
    }
  }, [profile]);

  const loadListings = useCallback(async () => {
    setListingsLoading(true);
    setListingsError("");
    try {
      const data = await api<Listing[]>("/api/seller/listings");
      const validated = assertArray<Listing>(data, "mes annonces");
      setListings(validated);
    } catch (cause) {
      setListings([]);
      setListingsError(cause instanceof Error ? cause.message : "Impossible de charger vos annonces.");
    } finally {
      setListingsLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const data = await api<Notification[]>("/api/notifications");
      const validated = assertArray<Notification>(data, "notifications");
      setNotifications(validated);
    } catch (cause) {
      setNotifications([]);
      setNotificationsError(cause instanceof Error ? cause.message : "Impossible de charger les notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile) {
      void loadListings();
      void loadNotifications();
    }
  }, [profile, loadListings, loadNotifications]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/profile", { method: "PATCH", body: JSON.stringify(form) });
      await refreshProfile();
      toast({ title: "Profil mis à jour" });
    } catch (error) {
      toast({ title: "Enregistrement impossible", description: (error as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function readNotification(id?: string) {
    try {
      await api(id ? `/api/notifications/${id}/read` : "/api/notifications/read-all", { method: "PATCH" });
      setNotifications((items) =>
        Array.isArray(items)
          ? items.map((item) => (id && item.id !== id ? item : { ...item, readAt: new Date().toISOString() }))
          : []
      );
    } catch {
      toast({ title: "Mise à jour impossible", variant: "destructive" });
    }
  }

  const hasUnreadNotifications = Array.isArray(notifications) && notifications.some((item) => item && !item.readAt);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 pt-32 pb-20">
        <BackButton />
        <p className="text-mono text-xs text-primary mb-3">Espace personnel</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-8">
          Bonjour, <span className="text-gradient">{profile?.displayName || "Membre"}</span>
        </h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {links.map(({ to, label, Icon }) => (
            <Link key={to} to={to} className="glass rounded-xl p-4 flex items-center gap-3 hover:border-primary/50">
              <Icon className="text-primary" size={20} />
              <span className="font-medium text-sm">{label}</span>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-8">
          {/* Profile Section */}
          <form onSubmit={save} className="glass rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <UserRound className="text-primary" />
              <h2 className="font-display text-xl font-bold">Mon profil</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nom affiché</Label>
              <Input
                id="profile-name"
                required
                minLength={2}
                maxLength={80}
                placeholder="Ex. Marie N'Goma"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-city">Ville</Label>
                <Input
                  id="profile-city"
                  maxLength={80}
                  placeholder="Pointe-Noire"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Téléphone</Label>
                <Input
                  id="profile-phone"
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="+242 06 000 00 00"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-bio">Présentation</Label>
              <Textarea
                id="profile-bio"
                maxLength={500}
                rows={4}
                placeholder="Présentez-vous en quelques mots…"
                value={form.biography}
                onChange={(e) => setForm({ ...form, biography: e.target.value })}
              />
            </div>
            <Button disabled={busy} className="rounded-full">
              {busy ? "Enregistrement…" : "Enregistrer le profil"}
            </Button>
          </form>

          {/* Seller Listings Section */}
          <section className="glass rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="text-primary" />
                <h2 className="font-display text-xl font-bold">Mes annonces</h2>
              </div>
              {listingsError && (
                <Button variant="ghost" size="sm" onClick={() => void loadListings()} className="gap-1 text-xs">
                  <RefreshCw size={12} /> Réessayer
                </Button>
              )}
            </div>

            {listingsLoading ? (
              <p className="text-sm text-muted-foreground animate-pulse">Chargement de vos annonces…</p>
            ) : listingsError ? (
              <div role="alert" className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive">
                <p>{listingsError}</p>
                <Button variant="outline" size="sm" onClick={() => void loadListings()} className="mt-2 text-xs">
                  Réessayer
                </Button>
              </div>
            ) : !Array.isArray(listings) || listings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune annonce pour le moment.</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {listings.map((item) => (
                  <li key={item.id} className="py-3 flex items-center gap-3">
                    <img src={item.img} alt="" className="h-14 w-14 rounded-lg object-cover bg-white/5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.price.toLocaleString("fr-FR")} FCFA · {item.status}
                      </p>
                    </div>
                    <Link to={`/article/${item.id}`} className="text-sm text-primary">
                      Ouvrir
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/vendre">
              <Button variant="outline" className="mt-5 rounded-full border-white/15">
                Publier un article
              </Button>
            </Link>
          </section>
        </div>

        {/* Notifications Section */}
        <section className="glass rounded-2xl p-6 md:p-8 mt-8">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Bell className="text-primary" size={20} />
              <h2 className="font-display text-xl font-bold">Notifications</h2>
            </div>
            <div className="flex items-center gap-2">
              {notificationsError && (
                <Button variant="ghost" size="sm" onClick={() => void loadNotifications()} className="gap-1 text-xs">
                  <RefreshCw size={12} /> Réessayer
                </Button>
              )}
              {hasUnreadNotifications && (
                <Button onClick={() => void readNotification()} variant="outline" size="sm" className="rounded-full">
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          </div>

          {notificationsLoading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Chargement de vos notifications…</p>
          ) : notificationsError ? (
            <div role="alert" className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive">
              <p>{notificationsError}</p>
              <Button variant="outline" size="sm" onClick={() => void loadNotifications()} className="mt-2 text-xs">
                Réessayer
              </Button>
            </div>
          ) : !Array.isArray(notifications) || notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Vos notifications apparaîtront ici.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {notifications.map((item) => (
                <li key={item.id} className={`py-3 flex items-center gap-3 ${item.readAt ? "opacity-60" : ""}`}>
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <p className="flex-1 text-sm">
                    {item.kind === "new_message"
                      ? "Vous avez reçu un message."
                      : item.kind === "order_created"
                      ? "Vous avez reçu une demande de commande."
                      : item.kind === "order_status"
                      ? "Le statut d'une commande a changé."
                      : item.kind === "new_review"
                      ? "Vous avez reçu une évaluation."
                      : "Nouvelle notification Madclothes."}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                  {!item.readAt && (
                    <Button onClick={() => void readNotification(item.id)} variant="ghost" size="sm">
                      Lu
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <PushNotificationSettings />
        </section>
      </main>
      <Footer />
    </div>
  );
}
