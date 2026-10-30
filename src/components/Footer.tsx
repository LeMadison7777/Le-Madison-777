import { Link } from "react-router-dom";

function openCookieSettings() {
  window.dispatchEvent(new Event("madclothes:cookie-settings"));
}

const Footer = () => <footer className="border-t border-border py-10"><div className="container mx-auto px-4 flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
  <Link to="/" className="flex items-center gap-3"><img src="/brand/madclothes-logo.jpg" alt="" className="h-10 w-10 rounded-full object-cover bg-white" /><span className="font-display text-lg font-bold">Mad<span className="text-gradient">clothes</span></span></Link>
  <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Madclothes · Mode d'occasion au Congo</p>
  <nav aria-label="Rubriques, informations et aide" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><Link to="/boutique" className="hover:text-foreground">Boutique</Link><Link to="/categories" className="hover:text-foreground">Catégories</Link><Link to="/selection" className="hover:text-foreground">Sélection</Link><Link to="/nouveautes" className="hover:text-foreground">Nouveautés</Link><Link to="/fonctionnement" className="hover:text-foreground">Comment ça marche</Link><Link to="/vendre-sur-madclothes" className="hover:text-foreground">Vendre</Link><Link to="/commissions" className="hover:text-foreground">Frais</Link><Link to="/avis" className="hover:text-foreground">Avis</Link><Link to="/aide" className="hover:text-foreground">Centre d'aide</Link><Link to="/contact" className="hover:text-foreground">Contact</Link><Link to="/conditions" className="hover:text-foreground">Conditions</Link><Link to="/confidentialite" className="hover:text-foreground">Confidentialité</Link><Link to="/mentions-legales" className="hover:text-foreground">Mentions légales</Link><button type="button" onClick={openCookieSettings} className="text-left hover:text-foreground">Paramètres des cookies</button></nav>
</div></footer>;

export default Footer;
