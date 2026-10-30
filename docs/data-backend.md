# Données et stockage de Madclothes

## Architecture configurée

- **Neon PostgreSQL** héberge les données métier dans la base `madclothes`.
- **Neon Auth** fournit les sessions. Dans le projet connecté, sa base d’authentification est `neondb`; elle est distincte de la base métier.
- **Cloudflare R2** stocke les images. La base enregistre les clés d’objet et les métadonnées, jamais le contenu des fichiers ni une URL de téléversement durable.
- **Vercel Node.js Functions** héberge l’API en production. En développement, le middleware Vite transmet `/api` au même gestionnaire.

Le projet Neon `Madclothes` est connecté et les migrations `0001_initial.sql` et `0002_seed_reference_data.sql` ont été appliquées à `madclothes`. La base contient les tables métier; les catégories de départ sont chargées. Aucun utilisateur, produit ou avis fictif n’a été ajouté.

## Schéma et règles

La migration initiale couvre les profils et rôles, les catégories, les annonces, les références d’images, les favoris, les conversations et messages, les commandes, les paiements, les remises, les évaluations, les notifications, les signalements, les paramètres de plateforme et les journaux d’audit. Les prix sont en francs CFA (XAF). La commission est administrable et reste non configurée au départ.

Les opérations d’écriture passent par `server/api.ts`. Le serveur vérifie le JWT Neon Auth, détermine le profil et son rôle côté serveur, valide les entrées, puis utilise des requêtes SQL paramétrées. Les transitions de commande et les changements d’état d’annonce sont effectués dans des transactions.

## Variables serveur

Copiez `.env.example` vers `.env.local` pour le développement. `DATABASE_URL` doit être l’URL pooled Neon de la base métier. Les URL Neon Auth et l’URL JWKS sont fournies séparément. Les variables réelles ne doivent pas être commitées; `DATABASE_URL`, `NEON_AUTH_JWKS_URL` et toutes les clés R2 ne doivent jamais porter le préfixe `VITE_`.

`ADMIN_EMAIL_ALLOWLIST` contient les adresses auxquelles le serveur attribue le rôle administrateur lors de l’initialisation du profil. Les rôles ne sont pas définis par le navigateur.

Pour le développement local, Neon Auth accepte `http://localhost:8080`, `http://localhost:8081` et l'origine LAN `http://192.168.43.241:8080`.

## Images avec Cloudflare R2

Le client S3 et les routes de transfert avec URL temporaire sont implémentés dans `server/r2.ts` et `server/api.ts`. `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID` et `R2_SECRET_ACCESS_KEY` sont configurés dans `.env.local`; une requête `HeadBucket` a confirmé l’accès au bucket. Les clés restent côté serveur.

1. Le serveur authentifie le vendeur et vérifie qu’il possède le brouillon d’annonce.
2. Il limite le nombre de photos et signe une URL temporaire `PUT` pour un type d’image autorisé.
3. Le navigateur envoie directement le fichier au bucket R2 avec son type de contenu.
4. Le serveur vérifie l’objet reçu (type et taille maximale de 15 Mo), puis enregistre sa clé et ses métadonnées dans `listing_images`.
5. Si `R2_PUBLIC_BASE_URL` est défini, les images utilisent ce domaine; sinon, l’API remet des URL de lecture présignées valables une heure.

Dans les paramètres CORS du bucket, autorisez les origines locales et de production réellement utilisées, la méthode `PUT` et l’en-tête `Content-Type`. Les origines `http://localhost:8082` et `http://192.168.43.241:8082` ont aussi été ajoutées pour le téléversement depuis ce poste. Limitez `AllowedOrigins` aux domaines de l’application. Les clés d’accès restent côté serveur. Pour les photos, le service choisi est R2; Cloudflare Stream concerne les vidéos.

## Commandes et paiements

La création d’une commande réserve l’annonce et l’inscrit en état `pending_payment`. L’interface indique que le paiement n’est pas activé. Aucun écran ni endpoint ne doit présenter cet état comme un paiement reçu. Les variables MTN MoMo et RTL Money de `.env.example` sont des emplacements de configuration, pas des intégrations opérationnelles.

## État à compléter

- Un domaine public personnalisé est facultatif grâce aux URL de lecture présignées. Pour la mise en production, vérifier la politique CORS R2 et valider un vrai téléversement depuis le navigateur.
- Ajouter le domaine Vercel de production aux domaines de confiance Neon Auth.
- Obtenir les accès de production et la documentation API des fournisseurs de paiement avant d’implémenter leurs confirmations et remboursements.
- Ajouter des annonces et des commandes réelles via l’application pour alimenter le catalogue et les évaluations.
