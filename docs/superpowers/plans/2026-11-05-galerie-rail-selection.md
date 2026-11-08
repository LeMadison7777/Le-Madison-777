# Animation de vêtements en fond de « Sélection » — plan révisé

**Direction confirmée par l’utilisateur :** animation originale en fond décoratif de la seule section « Sélection », pas dans le hero; garder les cartes et leurs images visuellement inchangées; aucune vraie photo n’est nécessaire. L’animation originale reste visuellement intacte; son enveloppe arrière-plan est `aria-hidden`, `inert` et `pointer-events-none` pour ne voler ni clics ni focus.

**Mode :** extension locale ciblée.

## Audit préalable

- Accueil : `Index` rend `HeroSection`, puis catégories et `FeaturedProducts`. Le hero possède l’asset local `@/assets/hero-fashion.webp`.
- La source de l’utilisateur `pasted_content.txt` contient `ClothingRailHero`, autoportant, sans dépendance tierce (React et createPortal seulement); en l’absence de `image`, `backImage` et `sideImage`, elle dessine les vêtements par illustrations SVG intégrées.
- La source originale prend en charge `autoplay`, s’arrête avec `prefers-reduced-motion`, et comprend des boutons/modale interactifs; le fond devra être inert et masqué à l’arbre d’accessibilité. L’autoplay est requis ici pour que le fond vive sans interaction.
- Typecheck réussi après la première proposition. ESLint : 0 erreur, 10 avertissements préexistants. Le build exécuté par l’utilisateur a fini avec `✓ built in 28.81s`; avertissement existant de chunk >500 kB et notes d’annotations zod. Les tests utilisateur : 40 réussis, 1 échec dans le test temporaire de galerie sur une espace fine insécable dans le prix; ce test doit être remplacé, car l’interface a changé de galerie au premier plan vers un fond animé.

## Portée

- Copier le composant `ClothingRailHero` depuis le fichier fourni, sans changement de son code source.
- Créer une configuration locale de quelques illustrations intégrées (aucune image, donnée commerciale ou URL distante).
- Placer la couche du rail en position absolue derrière tout le contenu de `FeaturedProducts`, avec l’intégration décorative rendue inert et pointer-events none. Autoplay soumis au respect natif de la préférence de mouvement réduit.
- Supprimer l’ancien rail simplifié de premier plan; conserver la section titre, les états de chargement/erreur/vide, la grille de cartes, leurs images et routes.
- Ne modifier ni le hero, ni l’asset local, ni backend, dépendances, configuration ou Git.

## Vérifications TDD

1. Remplacer le test de galerie précédente par un test du fond : l’animation est rendue en arrière-plan inert/aria-hidden/pointer-events-none; les images fournies aux cartes restent inchangées; les cartes persistent.
2. Exécuter le test en PowerShell utilisateur; confirmer un échec fonctionnel lié à l’absence du fond. Ne pas modifier le composant avant le rouge.
3. Extraire fidèlement le composant original fourni vers `src/components/ui/product-rail-gallery.tsx` et intégrer le wrapper d’arrière-plan minimal dans « Sélection ».
4. Exécuter le test ciblé puis la suite complète, `typecheck:app`, ESLint et build en `.work/build-gallery`. Relever séparément les avertissements déjà présents.
5. Revoir le code source et le plan final; vérifier que `HeroSection.tsx`, son asset, `ProductCard.tsx` et les URLs d’images des cartes n’ont pas été modifiés.

## Hors périmètre

Ne pas réécrire l’animation d’origine, ne pas ajouter d’images tierces, ne pas toucher au hero, aux données des annonces, à la base, au backend, aux Push, aux dépendances, aux secrets, au staging Git, aux commits ou aux déploiements.


## Résultat final — 2026-11-05

- Le corps de `ClothingRailHero` est conservé tel que fourni jusqu’à `export default ClothingRailHero;`. Seule l’annexe textuelle `demo.tsx` qui suivait l’export a été retirée du fichier source; ses exemples contenaient des URL d’images distantes et n’étaient pas une partie du composant.
- Le wrapper de fond ne passe aucun `image`, `backImage` ou `sideImage`; les vêtements sont dessinés par les SVG intégrés. La couche est `aria-hidden`, marquée `inert` au montage et `pointer-events-none`, sous le contenu `z-10`. Le hero, `ProductCard` et ses URLs d’images ne sont pas modifiés.
- TDD observé : test ciblé rouge avant intégration (2 échecs, fond absent), puis vert après intégration (2/2 tests réussis).
- Vitest complet exécuté par l’utilisateur : 8 fichiers, 41 tests réussis, 0 échec. Typecheck applicatif : réussi. ESLint : 0 erreur et 11 avertissements (10 avertissements antérieurs, 1 avertissement de nettoyage de ref dans le composant fourni à `product-rail-gallery.tsx:1132`; non modifié pour préserver la source de l’animation).
- Build de production exécuté par l’utilisateur : terminé avec succès; le service worker PWA a généré 37 entrées de précache (915,41 KiB). Avertissements rapportés par Vite/Rollup : annotations de commentaires dans Zod et un chunk `Footer` de 532,45 kB au-dessus du seuil de 500 kB.
- Aucun accès distant aux données, aucune dépendance ajoutée, aucune opération Git (add/commit/push) et aucun déploiement. L’aperçu visuel interactif dans un navigateur n’a pas été exécuté dans cette session; le contrôle d’apparence finale reste à faire localement par l’utilisateur.
