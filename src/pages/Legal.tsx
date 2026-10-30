import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function openCookieSettings() {
  window.dispatchEvent(new Event("madclothes:cookie-settings"));
}

const pages: Record<string, { title: string; paragraphs: string[] }> = {
  "/conditions": { title: "Conditions d'utilisation", paragraphs: ["Madclothes met en relation des acheteurs et des vendeurs d'articles de mode d'occasion.", "Les membres doivent publier des informations exactes, disposer des droits sur leurs annonces et respecter les autres membres.", "Les modalités de paiement, de livraison, de frais et de remboursement seront affichées avant activation des transactions. Aucun paiement n'est confirmé sur cette version tant que les prestataires ne sont pas configurés.", "Pour toute question concernant ces conditions, contactez l'équipe à ngoyiexauceroro@gmail.com."] },
  "/confidentialite": { title: "Politique de confidentialité", paragraphs: ["Madclothes traite les informations de compte, de profil, d'annonces et de transactions nécessaires au fonctionnement de la marketplace.", "Les comptes sont gérés par Neon Auth. Les données métier sont stockées dans PostgreSQL sur Neon. Les photos d'annonces sont conservées sur Cloudflare R2.", "Les clés d'accès aux services restent côté serveur. Elles ne sont pas intégrées au navigateur.", "Les cookies indispensables contribuent à la connexion et à la sécurité. Les préférences de cookies sont enregistrées dans le navigateur. Aucun outil de mesure d'audience ou de publicité n'est actuellement activé.", "Pour demander l'accès, la correction ou la suppression de vos données, écrivez à ngoyiexauceroro@gmail.com. Cette page doit être complétée avec l'identité juridique et les durées de conservation avant ouverture commerciale."] },
  "/mentions-legales": { title: "Mentions légales", paragraphs: ["Madclothes est une marketplace en cours de préparation pour les utilisateurs du Congo et d'Afrique centrale.", "Éditeur : Madclothes. Adresse de contact : ngoyiexauceroro@gmail.com. Téléphone : +242 06 609 94 27.", "L'identité juridique de l'éditeur, l'adresse de publication et les informations d'hébergement devront être ajoutées avant mise en production commerciale."] },
};

export default function Legal() {
  const location = useLocation();
  const page = pages[location.pathname] || pages["/conditions"];
  return <div className="min-h-screen bg-background"><Navbar /><main className="container mx-auto max-w-3xl px-4 pt-32 pb-24"><p className="text-mono text-xs text-primary mb-3">Madclothes</p><h1 className="font-display text-4xl md:text-5xl font-bold mb-8">{page.title}</h1><div className="space-y-5 text-muted-foreground leading-relaxed">{page.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>{location.pathname === "/confidentialite" && <section id="cookies" className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6"><h2 className="font-display text-2xl font-bold">Cookies et préférences</h2><p className="mt-3 leading-relaxed text-muted-foreground">Les cookies de connexion sont nécessaires à la session. Le choix de cookies facultatifs est conservé sur cet appareil. Aucun service de mesure d'audience ou de publicité n'est actif pour le moment.</p><button type="button" onClick={openCookieSettings} className="mt-4 text-primary underline underline-offset-4">Modifier mes préférences</button></section>}<Link to="/" className="inline-block mt-10 text-primary hover:underline">Retour à l'accueil</Link></main><Footer /></div>;
}
