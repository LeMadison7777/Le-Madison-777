import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import { InstallPrompt } from "@/components/InstallPrompt";
import CookieConsent from "@/components/CookieConsent";
import PageMetadata from "@/components/PageMetadata";

const Boutique = lazy(() => import("./pages/Boutique"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Account = lazy(() => import("./pages/Account"));
const Sell = lazy(() => import("./pages/Sell"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Orders = lazy(() => import("./pages/Orders"));
const Messages = lazy(() => import("./pages/Messages"));
const Admin = lazy(() => import("./pages/Admin"));
const Legal = lazy(() => import("./pages/Legal"));
const SectionPage = lazy(() => import("./pages/SectionPage"));
const Help = lazy(() => import("./pages/Help"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function OfflineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online ? null : <div role="status" className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-lg rounded-xl border border-primary/30 bg-background/95 px-4 py-3 text-center text-sm shadow-lg">Vous êtes hors ligne. Les annonces et actions demandant le serveur seront disponibles au retour de la connexion.</div>;
}

const App = () => <QueryClientProvider client={queryClient}><TooltipProvider><Toaster /><Sonner /><BrowserRouter><AuthProvider><PageMetadata /><Suspense fallback={null}><Routes>
  <Route path="/" element={<Index />} />
  <Route path="/boutique" element={<Boutique />} />
  <Route path="/categories" element={<SectionPage />} />
  <Route path="/selection" element={<SectionPage />} />
  <Route path="/fonctionnement" element={<SectionPage />} />
  <Route path="/commissions" element={<SectionPage />} />
  <Route path="/avis" element={<SectionPage />} />
  <Route path="/nouveautes" element={<SectionPage />} />
  <Route path="/vendre-sur-madclothes" element={<SectionPage />} />
  <Route path="/contact" element={<SectionPage />} />
  <Route path="/aide" element={<Help />} />
  <Route path="/article/:id" element={<ProductDetail />} />
  <Route path="/compte" element={<RequireAuth><Account /></RequireAuth>} />
  <Route path="/vendre" element={<RequireAuth><Sell /></RequireAuth>} />
  <Route path="/favoris" element={<RequireAuth><Favorites /></RequireAuth>} />
  <Route path="/commandes" element={<RequireAuth><Orders /></RequireAuth>} />
  <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
  <Route path="/messages/:id" element={<RequireAuth><Messages /></RequireAuth>} />
  <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
  <Route path="/conditions" element={<Legal />} />
  <Route path="/confidentialite" element={<Legal />} />
  <Route path="/mentions-legales" element={<Legal />} />
  <Route path="*" element={<NotFound />} />
</Routes></Suspense><InstallPrompt /><OfflineStatus /><CookieConsent /></AuthProvider></BrowserRouter></TooltipProvider></QueryClientProvider>;

export default App;
