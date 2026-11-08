# Décor animé de vêtements dans le hero — plan

> Plan d’implémentation local. Aucun commit, staging Git, push ou déploiement.

**Objectif :** ajouter une animation décorative de vêtements dessinés localement au hero, en conservant son texte, ses CTA, son image locale et ses parcours.

**Architecture :** réutiliser le composant ClothingRailHero déjà présent, avec des garments vectoriels intégrés sans URL d’image; l’envelopper dans une couche décorative inert, masquée aux technologies d’assistance et sans événements pointeur. Le contenu actuel du hero reste au premier plan. Le composant source gère déjà `prefers-reduced-motion`.

**Stack :** React, TypeScript, Tailwind, Vitest et Testing Library; aucune nouvelle dépendance ni ressource externe.

## Contraintes et points de revue

- Ne pas importer le texte, les prix ou les actifs boisson de la référence.
- Ne pas changer le texte, les routes des CTA, l’alt ou la source de l’image existante.
- La couche décorative n’ajoute aucun focus ni interaction et n’intercepte pas les clics.
- Aucun `src`, `backImage` ou `sideImage` distant; pas de CDN, script ou modèle externe.
- L’animation n’est pas obligatoire à l’utilisateur et le mouvement réduit doit rester respecté.

## Fichiers

- Modifier `src/components/HeroSection.tsx` pour ajouter la couche décorative sous le contenu existant.
- Créer `src/components/HeroGarmentDecoration.tsx` pour les silhouettes locales et le wrapper `aria-hidden`/`inert`/`pointer-events-none`.
- Créer `src/test/hero-garment-decoration.test.tsx` pour les garanties de rendu, d’inertie, d’absence d’images distantes et de non-régression du hero.

## Vérification

1. Écrire le test et vérifier l’échec rouge avant le code de production.
2. Implémenter le décor minimal puis relancer le test ciblé.
3. Exécuter tous les tests, `typecheck:app`, `typecheck:server`, `lint` et un build dans `.work/build-hero`.
4. Relire le diff et confirmer que seules les surfaces prévues ont changé; ne réaliser aucune opération Git.


## Bilan final — 2026-11-06

- Le test ciblé, exécuté dans le PowerShell de l’utilisateur : **1 fichier, 1 test réussi**.
- Suite complète, exécutée dans le PowerShell de l’utilisateur : **9 fichiers, 42 tests réussis**.
- Build `.work/build-hero` : l’utilisateur confirme qu’il a réussi sans erreur. La sortie détaillée n’a pas pu être lue dans cette session; statut consigné d’après sa confirmation explicite.
- TypeScript `typecheck:app` et `typecheck:server` : exécutés localement avec code 0.
- ESLint : 0 erreur, 11 avertissements préexistants (dont celui du ref dans le composant rail fourni).
- Les journaux de test mentionnent les avertissements informatifs React Router Future Flags; ils n’ont pas empêché les tests de réussir.
- Aucun média distant, nouvelle dépendance, staging Git, commit, push ou déploiement.
