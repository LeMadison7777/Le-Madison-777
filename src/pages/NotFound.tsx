import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () => <div className="min-h-screen bg-background flex flex-col"><Navbar /><main className="flex flex-1 items-center justify-center px-4 pt-20 text-center"><div><p className="text-mono text-primary mb-3">Erreur 404</p><h1 className="font-display text-4xl font-bold mb-3">Page introuvable</h1><p className="text-muted-foreground mb-6">Cette adresse ne correspond à aucune page Madclothes.</p><Link to="/" className="text-primary underline underline-offset-4">Retour à l'accueil</Link></div></main><Footer /></div>;

export default NotFound;
