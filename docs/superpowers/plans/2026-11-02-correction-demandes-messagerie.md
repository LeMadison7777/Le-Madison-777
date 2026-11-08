# Correction des demandes d’article et de la messagerie — Plan d’implémentation

> **Pour les agents d’exécution :** exécuter les étapes une par une ; les tests doivent couvrir les contrats backend et frontend. Aucune opération Git n’est autorisée dans le cadre de ce travail.

**Objectif :** rendre la soumission d’une demande d’article diagnostiquable et fiable, et garantir que les messages sont persistés et adressés au bon participant, sans écriture réelle en base pendant les tests.

**Architecture :** conserver les endpoints et le schéma métier existants. Ajouter des tests de régression avec base et authentification simulées, rendre atomiques les messages et notifications, puis clarifier l’interface de destinataire/envoi et la validation des formulaires. Les erreurs serveur resteront opaques côté client mais seront traçables côté serveur sans journaliser les contenus ou secrets.

**Stack technique :** React, TypeScript, Vite, Vitest, API Node/Vercel, Neon PostgreSQL.

**Spécification :** demande utilisateur du 2 novembre 2026 dans la conversation ; pas de document de spécification séparé.

## Contraintes globales

- Modifications uniquement dans la copie locale du projet.
- Aucun `git add`, commit, push, déploiement ou changement de configuration de compte.
- Ne jamais soumettre de vraie demande ni de vrai message et ne jamais contacter un utilisateur pendant les tests.
- Ne pas lire ni afficher les valeurs de `.env.local` ou d’autres secrets.
- Ne pas rejouer de migration et ne modifier le schéma qu’en cas de défaut démontré par le code et un test.
- Préserver l’authentification, les contrôles d’appartenance et la détermination serveur du destinataire.

## Points de vigilance

1. Une ville vide ou composée d’espaces doit être refusée par une erreur de validation claire, pas par une exception serveur.
2. Une annonce non publiée, vendue ou appartenant à l’acheteur ne doit pas générer de commande ni de message.
3. Une erreur après insertion d’un message ne doit pas laisser une réponse d’échec ambiguë avec une notification incohérente.
4. Un membre ne doit ni lire ni envoyer de message dans une conversation dont il n’est pas participant.
5. Les doubles clics et les requêtes de rafraîchissement ne doivent ni dupliquer des messages ni les afficher au mauvais destinataire.

---

### Tâche 1 : Tests de non-régression API pour demandes et messages

**Fichiers :**
- Créer : `src/test/order-messaging-flow.test.ts`
- Lire/réutiliser : `server/api.ts`, `server/database.ts`, `vitest.config.ts`

**Interfaces :**
- Consomme : `handleApi(Request): Promise<Response>`.
- Simule : le pool PostgreSQL et la vérification JWT ; aucun accès à une vraie base.

- [ ] **Étape 1 : écrire les tests rouges** pour la création de demande, le rejet d’une annonce indisponible, l’ouverture d’une conversation adressée au vendeur, l’envoi dans une conversation adressé à l’autre participant et le refus d’un non-participant.
- [ ] **Étape 2 : exécuter uniquement le nouveau fichier** et conserver la preuve de l’échec attendu avant correction.
- [ ] **Étape 3 : compléter les comportements serveur et les assertions minimales** sans changer les contrats publics des endpoints.
- [ ] **Étape 4 : relancer le fichier ciblé** et confirmer que chaque cas passe.

### Tâche 2 : Fiabiliser et sécuriser les opérations serveur

**Fichiers :**
- Modifier : `server/api.ts` — handlers `orders()` et `messaging()`.
- Tester : `src/test/order-messaging-flow.test.ts`.

**Interfaces :**
- La demande conserve `POST /api/orders` et les validations existantes.
- L’ouverture de conversation conserve `POST /api/conversations` ; l’envoi conserve `POST /api/conversations/:id`.

- [ ] **Étape 1 : préserver et vérifier** la transaction complète de demande (commande, réservation, remise et notification), en gardant les réponses 4xx/409 pour les cas métier connus.
- [ ] **Étape 2 : rendre atomiques** insertion du message, mise à jour de `last_message_at` et création de notification pour une conversation existante ; déterminer le destinataire uniquement depuis les participants stockés côté serveur.
- [ ] **Étape 3 : améliorer la traçabilité des erreurs 500** avec le chemin/méthode et le code d’erreur technique côté serveur, sans renvoyer SQL, détails internes, PII ou corps du message au navigateur.
- [ ] **Étape 4 : prouver par les tests** qu’un échec de notification annule l’envoi existant au lieu de laisser un message partiellement traité, et que les contrôles d’accès restent effectifs.

### Tâche 3 : Clarifier et fiabiliser les formulaires frontend

**Fichiers :**
- Modifier : `src/pages/ProductDetail.tsx`.
- Modifier : `src/pages/Messages.tsx`.
- Tester : `src/test/order-messaging-flow.test.ts` ou un fichier composant ciblé si le montage React est nécessaire.

**Interfaces :**
- Le formulaire de demande continue d’appeler `/api/orders`.
- Le formulaire de conversation continue d’appeler `/api/conversations` puis navigue vers `/messages/:id`.
- L’envoi dans la conversation continue d’appeler `/api/conversations/:id`.

- [ ] **Étape 1 : valider les entrées côté client** (trim, longueur minimale de la ville et du message), conserver la validation serveur comme autorité, vider les notices anciennes et empêcher les doubles soumissions.
- [ ] **Étape 2 : identifier visiblement le destinataire** dans l’en-tête de conversation, en utilisant `otherName` déjà fourni par l’API.
- [ ] **Étape 3 : rendre l’action d’envoi évidente et sûre** avec libellé visible, état occupé, bouton désactivé durant l’envoi et conservation du brouillon si le POST échoue.
- [ ] **Étape 4 : tester** succès, rejet de validation, réponse serveur en erreur et affichage du destinataire sans produire de requête réelle.

### Tâche 4 : Audit ciblé et vérification locale

**Fichiers :** aucun changement supplémentaire prévu.

- [ ] **Étape 1 : relire les routes modifiées** pour vérifier les paramètres SQL, l’authentification, l’appartenance à la conversation, les transactions et l’absence de fuite d’information.
- [ ] **Étape 2 : exécuter** `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint` et `npm.cmd run build`.
- [ ] **Étape 3 : vérifier** le diff local et confirmer qu’aucun fichier de secret, artefact non souhaité ou changement de configuration n’a été ajouté.
- [ ] **Étape 4 : rapporter** les tests, les causes prouvées, les limites liées à la base de production et les fichiers modifiés ; laisser l’utilisateur tester avant tout déploiement.

## Revue rapide du plan

- Le plan couvre la demande d’article, l’ouverture de conversation, l’envoi et la visibilité du destinataire.
- Les tests proposés ne contactent pas de vrais utilisateurs et n’écrivent pas dans la base réelle.
- Aucun accès à une valeur secrète, migration, opération Git ou déploiement n’est nécessaire.
- Une erreur PostgreSQL de production ne peut être attribuée à une cause précise qu’avec un log serveur ; le plan ajoute une traçabilité sûre sans prétendre deviner la cause.


## État d’exécution — 2 novembre 2026

Les modifications prévues aux tâches 1 à 3 sont réalisées localement : tests API et UI ajoutés, validation frontend renforcée, envoi d’un message et notification atomiques, destinataire visible, envoi protégé contre les doubles clics, et référence non sensible pour les erreurs serveur inconnues.

Les contrôles `npm.cmd run typecheck:app`, `npm.cmd run typecheck:server` et `npm.cmd run lint` ont terminé avec succès. ESLint rapporte 10 avertissements dans des fichiers existants non modifiés et 0 erreur.

Les tests Vitest et le build n’ont pas pu être exécutés : esbuild échoue pendant le chargement de la configuration en tentant de lire `../../..`, accès refusé, avant le chargement des tests ou la compilation. Ce blocage a persisté avec une configuration de test isolée et une résolution limitée à `node_modules`; aucun résultat de test fonctionnel n’est donc revendiqué.

Aucune requête d’écriture vers une vraie base n’a été envoyée, aucun secret n’a été lu, et aucune opération Git, migration ou publication n’a été effectuée. Le code source confirme que la demande est traitée dans une transaction et que le destinataire du message est choisi côté serveur. La cause exacte du HTTP 500 observé sur le site ne peut pas être affirmée sans le journal de la fonction Vercel correspondante ; le changement ajoute une référence de diagnostic pour rendre une nouvelle erreur interne traçable côté serveur tout en gardant ses détails hors du navigateur.
