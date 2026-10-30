# Madclothes

Madclothes est une marketplace de vêtements d’occasion destinée au Congo. L’application utilise React, TypeScript et Vite pour le client, Neon PostgreSQL pour les données, Neon Auth pour les sessions, Cloudflare R2 pour les photos et les fonctions Node.js de Vercel pour l’API.

## Démarrage local

Prérequis : Node.js 20 ou supérieur et npm.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Complétez les variables dans `.env.local` avant d’utiliser l’API. Le middleware Vite expose les routes de `server/api.ts` à `http://localhost:8080/api`. Le navigateur ne reçoit jamais les identifiants Neon ni les clés Cloudflare.

## Services et configuration

- **Neon** : `DATABASE_URL` doit viser la base métier `madclothes` avec la connexion pooled. Neon Auth peut utiliser sa base d’authentification dédiée `neondb`; ses URL publiques et JWKS sont configurées séparément.
- **Cloudflare R2** : configurez le bucket, l’endpoint S3, les clés d’accès et le domaine public dans les variables `R2_*`. Autorisez l’origine de l’application dans la règle CORS R2 pour les méthodes `PUT` et l’en-tête `Content-Type`.
- **Vercel** : les routes `api/[...route].ts` appellent le même gestionnaire que le serveur local. Ajoutez les variables d’environnement dans les environnements Vercel utilisés et déclarez le domaine de production comme domaine de confiance dans Neon Auth.
- **Paiements** : Mobile Money et RTL Money ne sont pas activés sans accès et identifiants fournisseur. Une demande de commande reste en attente et ne représente pas un paiement confirmé.

Ne préfixez jamais `DATABASE_URL`, `NEON_AUTH_JWKS_URL` ou les clés R2 par `VITE_`. Les valeurs d’exemple sont dans [`.env.example`](.env.example); les valeurs réelles restent dans `.env.local` ou dans les variables de l’hébergeur.

## Base de données

La base Neon `Madclothes` est connectée. Dans sa branche, la base métier est `madclothes` et les migrations `0001_initial.sql` et `0002_seed_reference_data.sql` ont été appliquées. La deuxième migration ajoute les catégories de référence et laisse le taux de commission désactivé tant qu’un administrateur ne l’a pas configuré.

Pour une nouvelle base, exécutez les fichiers de `db/migrations` dans l’ordre avec l’outil SQL de Neon. Ces migrations créent le schéma métier et les catégories; elles ne créent aucun compte utilisateur de démonstration.

Le schéma et les flux sont décrits dans [`docs/data-backend.md`](docs/data-backend.md). Il reste à renseigner les identifiants Cloudflare R2 et les accès de paiement avant d’activer ces services. La configuration de production Vercel est détaillée dans [`docs/deployment.md`](docs/deployment.md).

## Commandes de développement

```powershell
npm run lint
npm test
npm run build
```

Le catalogue est vide tant que des vendeurs n’ont pas publié de vraies annonces. Les évaluations affichées proviennent des commandes terminées et des avis réellement enregistrés.

## Pages publiques et sitemap

Les rubriques ont chacune leur adresse : `/boutique`, `/categories`, `/selection`, `/fonctionnement`, `/commissions`, `/avis`, `/nouveautes`, `/vendre-sur-madclothes`, `/contact` et `/aide`. Les routes du compte restent privées et sont exclues du sitemap.

`/sitemap.xml` et `/robots.txt` sont servis par l’API. Le sitemap référence les pages publiques et les annonces publiées dans Neon; le routage Vercel autorise aussi l’ouverture directe des pages internes.
