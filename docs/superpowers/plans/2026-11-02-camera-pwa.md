# Capture caméra dans la PWA — Plan d’implémentation

> **Pour les agents d’exécution :** appliquer ce plan étape par étape avec des tâches cochables et des vérifications indépendantes.

**Objectif :** permettre au vendeur d’ouvrir volontairement la caméra depuis « Publier un article », de prendre une photo et de l’ajouter aux fichiers envoyés avec l’annonce.

**Architecture :** ajouter un composant React isolé qui ne demande `getUserMedia` qu’après le clic de l’utilisateur, affiche l’aperçu, capture une image JPEG et arrête les pistes caméra après capture, fermeture ou démontage. Le flux d’envoi existant vers R2 reste la seule voie de téléversement; le sélecteur de fichiers reste disponible comme solution de repli.

**Technologies :** React 18, TypeScript, MediaDevices/getUserMedia, Canvas, Vitest, jsdom et React Testing Library.

**Spécification :** demande de l’utilisateur dans la conversation du 2 novembre 2026 : « Bien je veux que ma pwa puisse avoir l'autorisations d'activer la caméra ».

## Contraintes globales

- N’appeler la caméra qu’à la suite d’une action explicite de l’utilisateur; ne pas afficher de demande de permission au chargement.
- Ne pas enregistrer ni téléverser une image avant que l’utilisateur ait appuyé sur le bouton de capture.
- Conserver l’upload R2 existant, les types autorisés, la limite de 10 photos et la limite serveur de 15 Mo par image.
- Gérer caméra indisponible, origine non sécurisée, refus de permission et erreur de capture par un message accessible; ne pas masquer le sélecteur de fichiers.
- Réutiliser le style existant de Madclothes; aucune dépendance supplémentaire nécessaire.
- Travail local seulement : aucun `git add`, commit, push, déploiement ou changement de base.

## Points de revue et tests associés

- Navigateur sans `mediaDevices.getUserMedia` ou origine non sécurisée : afficher une explication et laisser le choix de fichiers utilisable.
- Permission refusée ou caméra occupée : afficher une erreur compréhensible, ne créer aucun fichier et permettre une nouvelle tentative.
- Capture après sélection de plusieurs photos : respecter le maximum total de 10 et ne pas écraser les photos existantes.
- Capture produisant un canvas vide : afficher une erreur, ne pas ajouter de fichier et arrêter les pistes.
- Fermeture, capture et démontage du composant : appeler `stop()` sur chaque piste caméra.

---

### Tâche 1 — Capture caméra isolée et intégrée au formulaire de vente

**Fichiers :**
- Créer : `src/components/CameraCapture.tsx`
- Modifier : `src/pages/Sell.tsx`
- Tester : `src/test/camera-capture.test.tsx`

**Interfaces :**
- Produit : `CameraCapture` reçoit `onCapture(file: File): void` et `onClose(): void`.
- Le fichier produit est `image/jpeg`, avec un nom de fichier stable de type `madclothes-camera-<timestamp>.jpg`.
- Le composant n’altère pas la liste de fichiers existants; `Sell` ajoute la photo capturée en respectant le plafond de 10.

- [ ] **Étape 1 : écrire les tests en échec** — vérifier qu’aucune permission n’est demandée au rendu, qu’un clic sur « Activer la caméra » appelle `getUserMedia` avec vidéo arrière idéale et sans audio, qu’une capture ajoute un JPEG et arrête toutes les pistes, qu’un refus affiche une erreur, et qu’un démontage arrête le flux.
- [ ] **Étape 2 : exécuter le test ciblé** — `npm.cmd test -- src/test/camera-capture.test.tsx`; résultat attendu avant implémentation : échec car le composant n’existe pas.
- [ ] **Étape 3 : implémenter le composant** — demander la permission uniquement depuis le bouton, lier le flux à `<video>`, capturer au format JPEG par Canvas, traiter l’échec de `toBlob`, puis arrêter et détacher le flux sur toutes les sorties.
- [ ] **Étape 4 : intégrer à `Sell.tsx`** — conserver le champ de fichiers actuel, ajouter un bouton explicite d’ouverture caméra, concaténer les captures à la sélection existante sans dépasser 10 et afficher les états/erreurs avec une région `role="status"` ou `role="alert"`.
- [ ] **Étape 5 : vérifier** — relancer le test ciblé, `npm.cmd run typecheck:app`, `npm.cmd run lint` et `npm.cmd run build`; noter séparément tout blocage d’outil préexistant.

## Non-objectifs

Cette capture ne sert pas à prendre des photos en arrière-plan, à scanner l’identité, ni à lancer automatiquement la caméra. Aucun changement de politique de navigateur ou de permission système ne peut être imposé par le site : le navigateur demandera l’autorisation au clic du vendeur.
