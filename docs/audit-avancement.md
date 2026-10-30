# Avancement du prompt maître Madclothes

État vérifié le 30 octobre 2026. « Présent dans le code » ne signifie pas que le service externe est configuré ni qu'un parcours de bout en bout a été validé.

## En place

- React, TypeScript et Vite sont conservés; l'application est découpée en routes publiques et privées.
- Neon PostgreSQL héberge le schéma métier de `madclothes`. Les migrations initiales et les catégories de référence ont été appliquées.
- Neon Auth gère l'inscription, la connexion, la vérification d'adresse e-mail par OTP et les sessions. L'API valide les JWT côté serveur et les rôles ne viennent pas du navigateur.
- L'origine locale `http://localhost:8081` est maintenant autorisée dans Neon Auth, en plus de `localhost:8080` et de l'origine LAN déjà configurée. Le client utilise aussi le helper JWT de Neon pour les requêtes privées.
- Le code comprend le catalogue dynamique, les filtres/recherche, les profils, les favoris, les annonces, les conversations, les notifications, les commandes en attente, les avis et les signalements. Leur présence dans le code ne remplace pas les tests de parcours réels.
- Le manifeste PWA, le service worker Workbox, les icônes dérivées du logo officiel, la proposition d'installation et l'indicateur hors ligne sont configurés. Le cache applicatif n'ajoute pas les réponses `/api` au cache hors ligne.
- Les pages indépendantes, le sitemap, `robots.txt`, le centre d'aide, le consentement cookies, les métadonnées et des boutons de retour sont présents.
- La police du début du projet est restaurée : Playfair Display pour les titres et DM Sans pour le texte.

## Partiel ou à configurer

- **Images R2 :** `HeadBucket` et la génération d’URL de dépôt signée réussissent. La règle CORS conserve les origines existantes et autorise maintenant `localhost:8080` et `localhost:8081`; le pré-vol du navigateur répond 204. L’API signe aussi les URL de lecture si aucun domaine public n’est configuré. Aucun vrai fichier n’a été envoyé pendant la vérification.
- **Paiements :** la commande peut rester en attente de paiement, mais MTN Mobile Money et RTL Money ne sont pas intégrés. Il manque les accès marchands, les callbacks fiables, la confirmation, les remboursements et les tests fournisseur. Aucun paiement n'est annoncé comme réussi.
- **Livraison :** le choix livraison/remise en main propre et les données de suivi de commande existent au niveau applicatif; aucun transporteur congolais ni suivi externe n'est connecté.
- **Catalogue réel :** aucune annonce ou évaluation fictive n'a été ajoutée. Il faut publier de vraies annonces pour alimenter la boutique.
- **Tests :** la suite actuelle ne contient qu'un test d'exemple. Les tests d'intégration, les parcours navigateur complets et les scénarios commande/paiement du prompt restent à écrire et exécuter.
- **Production :** aucun déploiement Vercel n'a été réalisé. Le domaine de production doit encore être ajouté à Neon Auth et à la politique CORS R2, puis les secrets de production doivent être configurés.
- **SEO :** les métadonnées et le sitemap sont disponibles, mais Vite reste une SPA sans rendu serveur ni prérendu des pages produit.

## Vérifications de cette intervention

- `npm.cmd run lint` : 0 erreur, 9 avertissements Fast Refresh dans des fichiers existants.
- `npm.cmd run test` : 1 fichier et 1 test passent. Le premier lancement dans le sandbox a échoué à charger la configuration; la relance autorisée a réussi.
- `npm.cmd run build` : réussi; le build génère `manifest.webmanifest`, `sw.js` et `workbox`. Avertissements de commentaires `@__PURE__` dans Zod et de bundle principal supérieur à 500 kB.
- Neon Auth : la liste des domaines de confiance confirme `http://localhost:8081`.
