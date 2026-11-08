# Recherche externe — bibliothèque Web Push

## Sources consultées

1. README du dépôt officiel `web-push-libs/web-push` : https://github.com/web-push-libs/web-push
   - Bibliothèque Node.js destinée au protocole Web Push.
   - `setVapidDetails(subject, publicKey, privateKey)` configure VAPID et `sendNotification(subscription, payload)` traite le chiffrement des payloads.
   - Les clés VAPID doivent être générées une fois, conservées et réutilisées; la clé privée doit rester côté serveur.
   - Le README recommande un `subject` externe valide (`mailto:` ou HTTPS), pas un placeholder localhost.
   - Le dépôt présente 1 069 commits sur la page consultée.

2. Page npm `web-push` : https://www.npmjs.com/package/web-push
   - Version affichée : 3.6.7; publication affichée il y a trois ans au moment de la consultation.
   - Déclarations TypeScript fournies par `@types/web-push`.
   - Signal de maintenance à mettre en balance avec la forte adoption, et à vérifier avant ajout de dépendance.

## Décision provisoire

Ne pas réimplémenter l’encryption Web Push. Avant d’ajouter `web-push`, vérifier l’activité GitHub récente et comparer brièvement les alternatives maintenues. Ne jamais transmettre ou exposer de clé VAPID privée.


3. Historique GitHub officiel de `web-push` : https://api.github.com/repos/web-push-libs/web-push/commits?per_page=1
   - Le commit le plus récent retourné lors de la consultation date du 11 septembre 2026 et met à jour une dépendance de développement via Dependabot; le dépôt conserve une activité récente même si la publication npm est ancienne.
   - Le manifeste officiel indique Node >=16 et cinq dépendances runtime (asn1.js, http_ece, https-proxy-agent, jws, minimist).

4. Dépôt de l’alternative `@mmmike/web-push` : https://github.com/MMMikeM/web-push
5. Page npm de `@mmmike/web-push` : https://www.npmjs.com/package/@mmmike/web-push
   - La page consultée affiche la version 1.5.0 publiée quatre jours auparavant, zéro dépendance runtime, 9 393 téléchargements hebdomadaires et des déclarations TypeScript intégrées.
   - Le dépôt a été créé en décembre 2025 et affiche 146 commits; sa documentation affirme la conformité RFC 8291/8292 et cite un test vecteur RFC 8291.
   - Le manifeste exige Node >=22.12; la forte nouveauté et adoption plus limitée constituent un risque de maturité pour cette application.

6. Page web.dev trouvée : https://web.dev/articles/sending-messages-with-web-push
   - L’extraction automatique n’a retourné aucun contenu exploitable; aucune conclusion ne lui est attribuée.

## Décision d’implémentation

Pour ce backend Vercel/Node, privilégier la bibliothèque Node historique `web-push`, dont le dépôt a eu un commit récent et dont le moteur requis (Node >=16) est compatible plus largement. Garder la version exacte résolue dans `package-lock.json`, lancer l’audit npm et signaler l’ancienneté de la dernière publication npm comme réserve plutôt que d’adopter sans vérification une alternative très récente.


## Avis de sécurité BetterAuth à qualifier dans ce dépôt

7. Avis officiel GHSA-r4xp-prcw-77qf : https://github.com/advisories/GHSA-r4xp-prcw-77qf
   - Les versions Better Auth >=1.5.0-beta.12 et <1.7.7 sont concernées par un chemin OAuth Proxy sous certaines conditions (secret proxy identique au secret global, état cookie et liaison implicite activée). La version corrective annoncée est 1.7.7.
8. Avis officiel GHSA-965c-763c-88jm : https://github.com/advisories/GHSA-965c-763c-88jm
   - Les versions Better Auth >=1.4.0-beta.18 et <1.7.7 sont concernées par une collision OAuth-state/Magic-Link seulement si Magic Link et OAuth social/générique sont activés et que l’état OAuth utilise le stockage DB. L’avis décrit un possible accès à un compte sans validation de boîte mail; version corrective annoncée : 1.7.7.
9. Avis officiel GHSA-44jh-23m7-hpcf : https://github.com/advisories/GHSA-44jh-23m7-hpcf
   - Le dépassement de rate-limit nécessite l’adaptateur Drizzle BetterAuth concerné, des limites stockées en DB et PostgreSQL; l’impact est distinct des deux prises de compte OAuth.

État : le npm audit local a trouvé BetterAuth 1.7.6 sous @neondatabase/auth, mais l’application doit être inspectée pour confirmer l’activation des plugins/parcours concernés avant d’affirmer qu’elle est exploitable. Aucun workaround ou correctif issu d’un résultat Web ne sera appliqué automatiquement. Toute mise à niveau d’authentification nécessite une tâche/plan distinct et des tests du parcours de connexion.
