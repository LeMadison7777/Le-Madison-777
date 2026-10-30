import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const pages: Record<string, { title: string; description: string }> = {
  "/": { title: "Mode d'occasion au Congo", description: "Achetez et vendez des vêtements et accessoires d'occasion au Congo avec Madclothes." },
  "/boutique": { title: "Boutique de vêtements d'occasion", description: "Parcourez les annonces de vêtements et accessoires d'occasion publiées par la communauté Madclothes." },
  "/categories": { title: "Catégories de mode", description: "Explorez les vêtements, chaussures, sacs, bijoux et accessoires proposés sur Madclothes." },
  "/selection": { title: "Sélection d'annonces", description: "Découvrez une sélection d'articles publiés par les vendeurs Madclothes." },
  "/fonctionnement": { title: "Comment fonctionne Madclothes ?", description: "Découvrez les étapes pour acheter ou vendre un article d'occasion sur Madclothes." },
  "/commissions": { title: "Frais et commissions", description: "Consultez les frais de service Madclothes et les modalités annoncées avant tout paiement." },
  "/avis": { title: "Avis de la communauté", description: "Lisez les retours d'expérience partagés par les membres de Madclothes." },
  "/nouveautes": { title: "Dernières annonces", description: "Parcourez les dernières annonces de mode d'occasion publiées sur Madclothes." },
  "/vendre-sur-madclothes": { title: "Vendre sur Madclothes", description: "Publiez vos vêtements et accessoires d'occasion et échangez avec des acheteurs au Congo." },
  "/contact": { title: "Contacter Madclothes", description: "Contactez l'équipe Madclothes par téléphone, email ou WhatsApp." },
  "/aide": { title: "Centre d'aide", description: "Trouvez des réponses aux questions courantes et contactez l'équipe Madclothes en cas de problème." },
  "/conditions": { title: "Conditions d'utilisation", description: "Consultez les conditions d'utilisation de la marketplace Madclothes." },
  "/confidentialite": { title: "Confidentialité et cookies", description: "Découvrez les données utilisées par Madclothes et gérez vos préférences de cookies." },
  "/mentions-legales": { title: "Mentions légales", description: "Informations légales et coordonnées de Madclothes." },
};

const privatePaths = new Set(["/compte", "/vendre", "/favoris", "/commandes", "/messages", "/admin"]);

export default function PageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = pages[pathname] ?? (pathname.startsWith("/article/")
      ? { title: "Annonce de mode d'occasion", description: "Consultez les détails de cette annonce sur Madclothes." }
      : { title: "Page introuvable", description: "Cette adresse ne correspond à aucune page Madclothes." });
    const title = `${page.title} | Madclothes`;
    document.title = title;

    const setMeta = (selector: string, attribute: "name" | "property", key: string, content: string) => {
      let meta = document.head.querySelector<HTMLMetaElement>(selector);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, key);
        document.head.append(meta);
      }
      meta.content = content;
    };
    setMeta('meta[name="description"]', "name", "description", page.description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", page.description);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", page.description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = new URL(pathname, window.location.origin).toString();

    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.append(robots);
    }
    robots.content = privatePaths.has(pathname) || pathname.startsWith("/messages/") ? "noindex, nofollow" : "index, follow";
  }, [pathname]);

  return null;
}
