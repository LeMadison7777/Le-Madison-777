# Suivi — accès caméra et notifications push PWA

## Accès caméra pour les photos d’annonce

- [ ] Le vendeur peut lancer la caméra depuis « Publier un article » par une action explicite; aucune demande de permission n’est déclenchée au chargement.
- [ ] Une photo capturée est ajoutée à la sélection existante comme JPEG et suit le flux de téléversement R2 déjà utilisé.
- [ ] Le plafond cumulé de 10 photos et la limite serveur de 15 Mo par image restent appliqués.
- [ ] Si la caméra est indisponible, l’origine non sécurisée, la permission refusée ou la capture impossible, l’interface explique le problème et le choix de fichiers reste utilisable.
- [ ] Les pistes caméra sont arrêtées à la capture, à la fermeture et au démontage du composant.

## Notifications Web Push

- [ ] L’utilisateur connecté peut activer puis désactiver les notifications depuis la section Notifications de son compte; la permission système est demandée uniquement après son clic.
- [ ] Les abonnés reçoivent des notifications push génériques pour les nouveaux messages, nouvelles demandes, changements de statut de commande et nouveaux avis; aucun contenu de message privé n’est exposé dans le push.
- [ ] Les routes d’abonnement exigent une session active, valident les données et l’endpoint, préviennent le SSRF et n’autorisent l’utilisateur à gérer que ses propres abonnements.
- [ ] La clé VAPID privée reste côté serveur; les liens des notifications ouvrent exclusivement des routes internes sûres.
- [ ] Les erreurs de fournisseur Push n’annulent pas une opération métier déjà validée; les abonnements expirés 404/410 sont retirés.
- [ ] Le code, la migration SQL et les instructions de configuration sont préparés localement; la migration n’est pas exécutée sur la base Neon partagée et `.env.local` n’est ni lu ni modifié.

## Limites d’exécution

- [ ] Aucun `git add`, commit, push, déploiement ou envoi réel de notification n’est effectué.
- [ ] Vérifications locales : tests ciblés, vérifications TypeScript, lint et build; tout blocage d’environnement est documenté sans le confondre avec un échec applicatif.
