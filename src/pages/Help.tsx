import { Link } from "react-router-dom";
import { Mail, MessageCircle, CircleHelp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";

const questions = [
  { question: "Je n'arrive pas à créer mon compte. Que faire ?", answer: "Vérifiez que votre adresse email est correcte, que votre mot de passe contient au moins 8 caractères et que votre connexion internet fonctionne. Après l'inscription, consultez votre boîte de réception et saisissez le code de vérification reçu. Si le message persiste, indiquez à l'équipe l'adresse utilisée, l'heure de l'essai et le message affiché, sans jamais envoyer votre mot de passe." },
  { question: "Comment acheter un article ?", answer: "Parcourez la boutique, ouvrez une annonce puis contactez son vendeur pour confirmer la disponibilité et convenir de la remise. Le paiement en ligne n'est pas encore activé." },
  { question: "Comment publier une annonce ?", answer: "Créez un compte, ouvrez la rubrique Vendre, ajoutez des photos et décrivez l'article, son état, son prix et sa ville." },
  { question: "Comment modifier mon profil ou mes annonces ?", answer: "Connectez-vous puis ouvrez votre espace personnel. Vous pourrez y gérer vos informations et retrouver vos annonces." },
  { question: "Comment signaler une annonce ou un problème ?", answer: "Utilisez le bouton de signalement sur l'annonce ou contactez l'équipe avec le lien de la page et une description du problème." },
  { question: "Le paiement ou la livraison sont-ils disponibles ?", answer: "Les partenaires de paiement et de livraison ne sont pas encore activés. Acheteur et vendeur doivent convenir directement de ces modalités avant toute transaction." },
];

export default function Help() {
  return <div className="min-h-screen bg-background"><Navbar /><main className="container mx-auto max-w-4xl px-4 pb-24 pt-32"><BackButton fallbackTo="/" />
    <div className="mb-12 text-center"><CircleHelp className="mx-auto mb-4 text-primary" size={34} /><p className="text-mono mb-3 text-xs text-primary">Assistance Madclothes</p><h1 className="font-display text-4xl font-bold md:text-5xl">Centre d'aide</h1><p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Des réponses aux questions courantes et un contact direct si tu rencontres un problème.</p></div>
    <section aria-labelledby="help-faq" className="space-y-3"><h2 id="help-faq" className="mb-5 font-display text-2xl font-bold">Questions fréquentes</h2>{questions.map(({ question, answer }) => <details key={question} className="glass rounded-2xl p-5 open:border-primary/30"><summary className="cursor-pointer list-none font-semibold marker:hidden">{question}</summary><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p></details>)}</section>
    <section className="mt-12 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8"><h2 className="font-display text-2xl font-bold">Besoin d'une aide personnelle ?</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Décris ce que tu faisais, la page concernée et le message affiché. N'envoie jamais ton mot de passe ni un code de connexion.</p><div className="mt-6 flex flex-wrap gap-3"><a href="mailto:ngoyiexauceroro@gmail.com?subject=Aide%20Madclothes" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"><Mail size={16} />Écrire à l'équipe</a><a href="https://wa.me/242066099427?text=Bonjour%2C%20j'ai%20besoin%20d'aide%20sur%20Madclothes." target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold hover:border-primary/50"><MessageCircle size={16} />Contacter sur WhatsApp</a></div></section>
    <p className="mt-8 text-center text-sm text-muted-foreground">Tu peux aussi consulter les <Link to="/conditions" className="text-primary underline">conditions d'utilisation</Link> et la <Link to="/confidentialite" className="text-primary underline">politique de confidentialité</Link>.</p>
  </main><Footer /></div>;
}
