# Déploiement

## Vercel

1. Importez le dépôt dans Vercel et gardez le framework Vite détecté automatiquement.
2. Ajoutez les variables serveur de `.env.example` dans les environnements Vercel concernés. `DATABASE_URL` doit être l’URL pooled Neon de `madclothes`.
3. Ajoutez le domaine de production de l’application aux domaines de confiance de Neon Auth.
4. Configurez R2 (bucket et clés; domaine public facultatif, car l’API peut signer les URL de lecture), puis ajoutez le domaine du site à la règle CORS du bucket.
5. Déployez depuis Vercel et vérifiez `/api/health`.

Le fichier `api/[...route].ts` envoie les routes `/api/*` au gestionnaire partagé. `vercel.json` configure les pages React accessibles par lien direct, ainsi que `/sitemap.xml` et `/robots.txt`. Le sitemap utilise l'origine de la requête ou `PUBLIC_SITE_URL` si cette variable est définie, et ajoute les annonces publiées.

Le projet n’a pas encore été déployé; le domaine Vercel de production reste à renseigner dans Neon Auth et dans CORS R2.

## Variables requises

| Variable | Où elle est utilisée |
| --- | --- |
| `DATABASE_URL` | Serveur Node.js uniquement, connexion pooled Neon métier |
| `VITE_NEON_AUTH_URL` | Client Neon Auth; URL publique du service |
| `NEON_AUTH_JWKS_URL` | Serveur Node.js, vérification des JWT |
| `PUBLIC_SITE_URL` | Optionnel, origine canonique de `/robots.txt` et `/sitemap.xml` |
| `ADMIN_EMAIL_ALLOWLIST` | Serveur Node.js, attribution contrôlée du rôle administrateur |
| `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_S3_ENDPOINT` | Configuration du bucket et de l’API S3 |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Signature serveur des accès temporaires |
| `R2_PUBLIC_BASE_URL` | Domaine public facultatif; sinon, URL de lecture présignées |

N’ajoutez jamais de secret avec le préfixe `VITE_`. Les variables MTN MoMo et RTL Money restent inutilisées tant que les accès fournisseur et la logique de confirmation serveur ne sont pas fournis.

## CORS Cloudflare R2

Adaptez les domaines avant d’enregistrer la règle dans les paramètres du bucket :

```json
[
  {
    "AllowedOrigins": ["http://localhost:8080", "http://localhost:8081", "http://localhost:8082", "http://192.168.43.241:8082", "https://votre-domaine.example"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Les migrations SQL se trouvent dans `db/migrations`. Pour le projet Neon Madclothes actuel, elles sont déjà appliquées; ne les rejouez pas en production sans vérifier l’historique de migration.
