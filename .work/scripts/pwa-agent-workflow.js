
async function main() {
  const root = 'C:\\Users\\Le MADISON\\OneDrive\\Desktop\\Le Madison 777';
  const full = (relative) => root + '\\' + relative;
  const files = (items) => items.map((relative) => ({ path: full(relative), name: relative }));

  const schema = JSON.stringify({
    type: 'object',
    properties: {
      role: { type: 'string' },
      task: { type: 'string' },
      verdict: { type: 'string', enum: ['completed', 'approved', 'changes_requested', 'blocked'] },
      summary: { type: 'string' },
      files_changed: { type: 'array', items: { type: 'string' } },
      tests_run: { type: 'array', items: { type: 'string' } },
      findings: { type: 'array', items: { type: 'string' } },
      blockers: { type: 'array', items: { type: 'string' } }
    },
    required: [
      'role',
      'task',
      'verdict',
      'summary',
      'files_changed',
      'tests_run',
      'findings',
      'blockers'
    ]
  });

  const constraints = `Contexte du dépôt : application React/Vite/Tailwind Madclothes sur le poste local Windows. L’utilisateur a approuvé l’implémentation des plans caméra et Push en local, avec agents. Respect strict : ne faire aucun git add, commit, push, déploiement ni migration de base réelle; ne pas lire, modifier ou inclure .env.local; ne pas envoyer de notification réelle; ne pas mettre à niveau d’autres dépendances et ne pas lancer npm audit fix. web-push@3.6.7 et @types/web-push@3.6.4 sont déjà ajoutés au projet. L’installation npm a signalé des vulnérabilités existantes de l’arbre, notamment BetterAuth et les outils de développement; ne les élargis pas ici, signale tout impact à l’agent parent. Quatre scripts d’installation existants (SWC, core-js, esbuild) sont bloqués par la politique npm locale : ne les approuve pas et ne change pas la politique. Les tests Vitest ont déjà rencontré un blocage d’environnement dans ce dépôt; essaie les commandes prévues, distingue une erreur du code d’un refus du lanceur et rapporte fidèlement la sortie.`;

  const tasks = [
    {
      id: 'camera',
      brief: 'Ajouter la capture caméra aux annonces',
      spec: `TÂCHE 1 — CAPTURE CAMÉRA (spécification complète)
Objectif : dans src/pages/Sell.tsx, permettre au vendeur d’ouvrir volontairement la caméra, de prendre une photo et de l’ajouter au flux de fichiers déjà envoyé vers R2.
Créer src/components/CameraCapture.tsx; modifier src/pages/Sell.tsx; tester dans src/test/camera-capture.test.tsx.
Contrat : CameraCapture reçoit onCapture(file: File) et onClose(). Produire image/jpeg avec nom stable de type madclothes-camera-<timestamp>.jpg. Le composant n’altère pas les fichiers existants; Sell concatène sans dépasser 10.
Contraintes : ne demander getUserMedia qu’après clic explicite; vidéo arrière idéale, audio désactivé; pas de capture ni upload avant clic « Prendre la photo »; Canvas JPEG; stopper toutes les pistes après capture, fermeture ou démontage; ne pas dépasser 10 photos ni 15 Mo par image; gérer origine non sécurisée, API/caméra absente, refus, caméra occupée, canvas/toBlob vide par message accessible; le sélecteur de fichiers reste disponible; garder le style existant, aucune dépendance nouvelle.
TDD obligatoire : écrire d’abord les tests de permission différée, capture JPEG, flux, arrêt des pistes, refus et démontage; exécuter npm.cmd test -- src/test/camera-capture.test.tsx et vérifier l’échec attendu avant le code; implémenter ensuite, relancer le test, typecheck:app, lint et build.
Fichiers autorisés : src/components/CameraCapture.tsx, src/pages/Sell.tsx, src/test/camera-capture.test.tsx. Les logs/candidats peuvent rester dans .work seulement.`,
      implFiles: [
        'TODO.md',
        'docs/superpowers/plans/2026-11-02-camera-pwa.md',
        'src/pages/Sell.tsx',
        'src/components/ui/button.tsx',
        'src/test/setup.ts',
        'vitest.config.ts'
      ],
      reviewFiles: [
        'TODO.md',
        'docs/superpowers/plans/2026-11-02-camera-pwa.md',
        'src/components/CameraCapture.tsx',
        'src/pages/Sell.tsx',
        'src/test/camera-capture.test.tsx',
        'src/test/setup.ts'
      ]
    },
    {
      id: 'push-api',
      brief: 'Créer l’API et le stockage sécurisé des abonnements Push',
      spec: `TÂCHE 2 — API ET STOCKAGE WEB PUSH (spécification complète)
Créer db/migrations/0003_push_subscriptions.sql et server/push.ts; modifier server/api.ts; ajouter src/test/push-subscriptions.test.ts.
POST /api/push-subscriptions reçoit une PushSubscription {endpoint, keys:{p256dh,auth}} et l’associe au profil authentifié. DELETE reçoit {endpoint} et ne supprime que l’abonnement appartenant au profil courant. Fournir sendPushToProfile(profileId,payload), qui échoue de façon isolée si la configuration fournisseur manque ou si l’envoi échoue.
Sécurité : valider JWT et profil actif; vérifier le propriétaire pour chaque suppression; vérifier type, longueur (endpoint <=2048), HTTPS et allowlist exacte des domaines push connus (FCM, Apple, Mozilla, Windows) pour prévenir SSRF; rejeter IP/loopback, credentials, ports atypiques, URL invalide et hôte similaire; borner clés, payload et souscriptions actives à 10 par profil; pas de fuite ni de journalisation endpoint, clés, payload privé ou secrets. Ne jamais exposer VAPID_PRIVATE_KEY. Supprimer un abonnement uniquement sur réponses définitives 404/410.
Migration SQL : profile_id en cascade, endpoint unique, clés nécessaires au Web Push, horodatages/index; ne pas exécuter la migration sur Neon. Tests DB/JWT simulés : succès authentifié, non authentifié, endpoint hostile, clés invalides, limite, propriété à la suppression, erreurs sans fuite. Les tests ne contactent jamais un push service réel.
Dépendance déjà installée : web-push@3.6.7 et @types/web-push@3.6.4; ne pas modifier package.json/lock ni ajouter d’autre dépendance. Utiliser VAPID côté serveur seulement, configuration absente = no-op. Test d’abord et observer l’échec attendu, puis code et npm.cmd run typecheck:server. Fichiers autorisés : server/push.ts, server/api.ts, db/migrations/0003_push_subscriptions.sql, src/test/push-subscriptions.test.ts.`,
      implFiles: [
        'TODO.md',
        'docs/superpowers/plans/2026-11-02-push-pwa.md',
        '.work/web-push-sources.md',
        'server/api.ts',
        'server/database.ts',
        'db/migrations/0001_initial.sql',
        'src/lib/auth.ts',
        'src/lib/api.ts',
        'src/test/order-messaging-flow.test.ts',
        'docs/data-backend.md',
        'docs/deployment.md',
        'package.json'
      ],
      reviewFiles: [
        'TODO.md',
        'docs/superpowers/plans/2026-11-02-push-pwa.md',
        'server/push.ts',
        'server/api.ts',
        'db/migrations/0003_push_subscriptions.sql',
        'src/test/push-subscriptions.test.ts'
      ]
    },
    {
      id: 'push-delivery',
      brief: 'Relier les événements métier au service worker Push',
      spec: `TÂCHE 3 — SERVICE WORKER ET LIVRAISON DES ÉVÉNEMENTS (spécification complète)
Créer public/push-handler.js; modifier vite.config.ts et server/api.ts; ajouter src/test/push-delivery.test.ts.
Workbox doit importer le gestionnaire sans remplacer le service worker généré ni ses règles de cache existantes. Le gestionnaire écoute push et notificationclick, affiche un titre/texte générique, icônes existantes et n’ouvre que des chemins Madclothes internes autorisés; toute URL externe ou invalide tombe sur /compte.
Relier après commit réussi les nouveaux messages, demandes/commandes, changements de statut et nouveaux avis au bon profil destinataire. Aucun corps de message, détail privé ou donnée sensible dans la notification. L’échec fournisseur ne fait pas échouer une opération métier déjà enregistrée; 404/410 ne retire que l’abonnement expiré. Conserver /api/* en NetworkOnly et les stratégies cache préexistantes.
TDD : écrire tests de destination correcte par type d’événement, exécution après succès transactionnel, échec push isolé et refus de chemin externe; exécuter npm.cmd test -- src/test/push-delivery.test.ts avec résultat rouge attendu avant implémentation; après code, relancer les tests et vérifier que le service worker se construit.
Fichiers autorisés : public/push-handler.js, vite.config.ts, server/api.ts, src/test/push-delivery.test.ts. Ne pas toucher aux migrations, clés d’environnement locales ou configuration distante.`,
      implFiles: [
        'TODO.md',
        'docs/superpowers/plans/2026-11-02-push-pwa.md',
        'server/api.ts',
        'server/push.ts',
        'src/test/order-messaging-flow.test.ts',
        'src/pages/ProductDetail.tsx',
        'src/pages/Messages.tsx',
        'vite.config.ts',
        'public/manifest.webmanifest'
      ],
      reviewFiles: [
        'TODO.md',
        'docs/superpowers/plans/2026-11-02-push-pwa.md',
        'public/push-handler.js',
        'vite.config.ts',
        'server/api.ts',
        'server/push.ts',
        'src/test/push-delivery.test.ts'
      ]
    },
    {
      id: 'push-ui',
      brief: 'Ajouter le réglage utilisateur et la configuration Push',
      spec: `TÂCHE 4 — ACTIVATION/DÉSACTIVATION ET CONFIGURATION (spécification complète)
Créer src/lib/push-notifications.ts; modifier src/pages/Account.tsx, vite.config.ts, .env.example et docs/deployment.md; ajouter src/test/push-notifications.test.tsx.
Dans la section Notifications du compte, offrir une commande accessible pour activer/désactiver volontairement. Demander Notification.permission seulement après clic. Vérifier navigateur, service worker, secure context et VITE_VAPID_PUBLIC_KEY avant demande; attendre serviceWorker.ready; convertir correctement la clé base64url; enregistrer la souscription via POST /api/push-subscriptions; à désactivation, supprimer l’abonnement correspondant côté serveur puis unsubscribe local avec état cohérent. Afficher chargement/succès/erreurs accessibles et expliquer l’indisponibilité ou le refus sans prétendre que le push est actif.
Configurer uniquement les variables VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY côté serveur et VITE_VAPID_PUBLIC_KEY côté frontend; ne jamais inclure de secret dans le bundle, les réponses ou logs. Pour le mode Vite local, n’exposer les clés privées qu’au middleware API de développement si l’architecture l’exige; ne pas modifier ni lire .env.local. Documenter génération VAPID et migration manuelle par le propriétaire après vérification de la cible. Ne pas configurer Vercel.
TDD : tests permission au clic, activation enregistrée, désactivation serveur+locale, refus/absence de support et erreur API; lancer d’abord le test ciblé et vérifier son échec attendu; ensuite code, test, typecheck:app, typecheck:server, lint, build. Faire le contrôle visuel seulement si le preview local peut être lancé sans modifier de configuration gérée.
Fichiers autorisés : src/lib/push-notifications.ts, src/pages/Account.tsx, vite.config.ts, .env.example, docs/deployment.md, src/test/push-notifications.test.tsx.`,
      implFiles: [
        'TODO.md',
        'docs/superpowers/plans/2026-11-02-push-pwa.md',
        'src/pages/Account.tsx',
        'src/main.tsx',
        'src/components/InstallPrompt.tsx',
        'vite.config.ts',
        'index.html',
        '.env.example',
        'docs/deployment.md',
        'src/test/setup.ts'
      ],
      reviewFiles: [
        'TODO.md',
        'docs/superpowers/plans/2026-11-02-push-pwa.md',
        'src/lib/push-notifications.ts',
        'src/pages/Account.tsx',
        'vite.config.ts',
        '.env.example',
        'docs/deployment.md',
        'src/test/push-notifications.test.tsx'
      ]
    }
  ];

  async function call(role, task, prompt, inputFiles) {
    return await agent(prompt, {
      brief: role + ' — ' + task.brief,
      input_files: files(inputFiles),
      sandbox: 'shared',
      effort_level: 'standard',
      schema
    });
  }

  async function executeTask(task) {
    log('Début du lot séquentiel : ' + task.brief);

    const implementationPrompt = `Rôle : agent d’implémentation.
${constraints}

${task.spec}

${task.id === 'camera'
      ? 'Le flux R2 et le champ de fichiers existants doivent rester intacts.'
      : 'Respecte les contrôles d’authentification, de confidentialité et de migration du plan.'}

Méthode : TDD strict, tests d’abord, exécuter le test rouge attendu, implémentation minimale, test vert, autocontrôle. Si l’échec est clairement une interdiction/outillage, rapporte-le sans contourner la politique. Consulte les fichiers d’entrée déclarés, limite tes modifications aux fichiers autorisés, ne demande pas à l’utilisateur de clarifier : rapporte un blocage à l’agent parent. N’effectue aucune opération Git. Retourne uniquement un objet JSON conforme au schéma avec role, task, verdict, summary, files_changed, tests_run, findings, blockers.`;

    const impl = await call('Implémenter', task, implementationPrompt, task.implFiles);

    if (!impl.ok || impl.value.verdict !== 'completed') {
      return {
        task: task.id,
        status: 'blocked',
        implementer: impl.ok ? impl.value : impl.error
      };
    }

    const specPrompt = `Rôle : reviewer indépendant de conformité.
${constraints}

SPÉCIFICATION À CONTRÔLER :
${task.spec}

Ne fais pas confiance au compte rendu de l’implémenteur. Lis réellement les fichiers d’implémentation et les tests déclarés en entrée. Vérifie chaque exigence, repère les omissions, les ajouts non demandés et les références de fichier/ligne. Aucun changement de fichier. verdict=approved seulement si aucune omission importante ni défaut sécurité. Retourne uniquement le JSON conforme au schéma.`;

    let spec = await call('Revue conformité', task, specPrompt, task.reviewFiles);

    if (!spec.ok) {
      return {
        task: task.id,
        status: 'blocked',
        implementer: impl.value,
        spec_review: spec.error
      };
    }

    if (spec.value.verdict !== 'approved') {
      const fixPrompt = `Rôle : agent de correction ciblée après revue conformité.
${constraints}

SPÉCIFICATION :
${task.spec}

L’implémenteur avait produit : ${JSON.stringify(impl.value)}
Reviewer conformité : ${JSON.stringify(spec.value)}

Corrige uniquement les omissions ou écarts précis signalés, conserve le périmètre autorisé, ajoute/ajuste d’abord un test rouge si un comportement manque, vérifie le test vert. Aucun Git, aucune autre dépendance ou migration réelle. Retourne le JSON conforme au schéma.`;

      const fix = await call('Corriger conformité', task, fixPrompt, task.reviewFiles);

      if (!fix.ok || fix.value.verdict !== 'completed') {
        return {
          task: task.id,
          status: 'blocked',
          implementer: impl.value,
          spec_review: spec.value,
          fix: fix.ok ? fix.value : fix.error
        };
      }

      spec = await call(
        'Revue conformité',
        task,
        `Réévalue les changements après correction. ${specPrompt}

Correction rapportée : ${JSON.stringify(fix.value)}`,
        task.reviewFiles
      );

      if (!spec.ok || spec.value.verdict !== 'approved') {
        return {
          task: task.id,
          status: 'blocked',
          implementer: impl.value,
          fix: fix.value,
          spec_review: spec.ok ? spec.value : spec.error
        };
      }
    }

    const qualityPrompt = `Rôle : reviewer indépendant qualité et sécurité.
${constraints}

EXIGENCES :
${task.spec}

La revue conformité vient d’être approuvée : ${JSON.stringify(spec.value)}.

Inspecte le vrai code et les tests. Cherche défauts de sécurité, bugs, gestion du cycle de vie/erreurs, accessibilité et fragilité des tests. Ignore les problèmes préexistants hors périmètre sauf s’ils rendent cette tâche dangereuse. Aucun changement de fichier. verdict=approved seulement si aucun problème important/critique; note les problèmes mineurs sans bloquer. Cite les fichiers/lignes. Retourne uniquement le JSON conforme au schéma.`;

    let quality = await call('Revue qualité', task, qualityPrompt, task.reviewFiles);

    if (!quality.ok) {
      return {
        task: task.id,
        status: 'blocked',
        implementer: impl.value,
        spec_review: spec.value,
        quality_review: quality.error
      };
    }

    if (quality.value.verdict !== 'approved') {
      const fixPrompt = `Rôle : agent de correction ciblée après revue qualité/sécurité.
${constraints}

SPÉCIFICATION :
${task.spec}

Implémentation initiale : ${JSON.stringify(impl.value)}
Revue de conformité approuvée : ${JSON.stringify(spec.value)}
Revue qualité : ${JSON.stringify(quality.value)}

Corrige uniquement les problèmes importants/critique signalés; garde le périmètre autorisé. Ajoute un test de régression d’abord si un comportement est en cause, puis vérifie. N’effectue aucune opération Git. Retourne le JSON conforme au schéma.`;

      const fix = await call('Corriger qualité', task, fixPrompt, task.reviewFiles);

      if (!fix.ok || fix.value.verdict !== 'completed') {
        return {
          task: task.id,
          status: 'blocked',
          implementer: impl.value,
          spec_review: spec.value,
          quality_review: quality.value,
          fix: fix.ok ? fix.value : fix.error
        };
      }

      quality = await call(
        'Revue qualité',
        task,
        `Réévalue la correction, inspecte le code réel et confirme les constats précédents. ${qualityPrompt}

Correction rapportée : ${JSON.stringify(fix.value)}`,
        task.reviewFiles
      );

      if (!quality.ok || quality.value.verdict !== 'approved') {
        return {
          task: task.id,
          status: 'blocked',
          implementer: impl.value,
          spec_review: spec.value,
          fix: fix.value,
          quality_review: quality.ok ? quality.value : quality.error
        };
      }
    }

    log('Lot terminé avec deux revues approuvées : ' + task.brief);

    return {
      task: task.id,
      status: 'completed',
      implementer: impl.value,
      spec_review: spec.value,
      quality_review: quality.value
    };
  }

  const results = [];

  for (const task of tasks) {
    const result = await executeTask(task);
    results.push(result);

    if (result.status !== 'completed') {
      log('Arrêt conservateur : le lot ' + task.id + ' nécessite une résolution avant le lot suivant.');

      return {
        status: 'blocked',
        results
      };
    }
  }

  log('Tous les lots sont terminés; démarrage de la revue globale indépendante.');

  const finalFiles = [
    'TODO.md',
    'docs/superpowers/plans/2026-11-02-camera-pwa.md',
    'docs/superpowers/plans/2026-11-02-push-pwa.md',
    'src/components/CameraCapture.tsx',
    'src/pages/Sell.tsx',
    'src/test/camera-capture.test.tsx',
    'server/push.ts',
    'server/api.ts',
    'db/migrations/0003_push_subscriptions.sql',
    'src/test/push-subscriptions.test.ts',
    'public/push-handler.js',
    'vite.config.ts',
    'src/test/push-delivery.test.ts',
    'src/lib/push-notifications.ts',
    'src/pages/Account.tsx',
    '.env.example',
    'docs/deployment.md',
    'src/test/push-notifications.test.tsx'
  ];

  const finalPrompt = `Rôle : reviewer final indépendant de toute l’implémentation caméra + Push.
${constraints}

Plans à respecter : la capture caméra doit être explicite, arrêt des pistes garanti et intégrée au flux R2 avec limites existantes; Web Push doit utiliser authentification/propriété stricte, allowlist anti-SSRF, clés privées uniquement serveur, payload générique et routes de clic internes sûres; désactivation retire l’abonnement local et serveur; erreurs Push ne font pas échouer l’opération métier; migration écrite mais non appliquée; configuration documentée; aucun secret local ni action Git/déploiement.

Résultats des revues par tâche : ${JSON.stringify(results)}

Inspecte les fichiers réels déclarés, vérifie l’intégration entre les lots, les contradictions de configuration, les tests et les limites utilisateur. Aucun changement de fichier. Signale tout défaut bloquant avec fichier/ligne et verdict=changes_requested; sinon verdict=approved. Retourne uniquement le JSON conforme au schéma.`;

  const finalReview = await agent(finalPrompt, {
    brief: 'Revue finale sécurité et intégration caméra + Push',
    input_files: files(finalFiles),
    sandbox: 'shared',
    effort_level: 'standard',
    schema
  });

  return {
    status: finalReview.ok && finalReview.value.verdict === 'approved'
      ? 'reviewed'
      : 'final_review_needed',
    results,
    final_review: finalReview.ok ? finalReview.value : finalReview.error
  };
}

main()
  .then((result) => {
    log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    log('Erreur dans le workflow PWA : ' + (error?.stack || error));
    throw error;
  });

