import webpush from "web-push";
import { pool } from "./database.js";

type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type StoredPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PushError = Error & {
  status?: number;
  statusCode?: number;
};

const MAX_SUBSCRIPTIONS_PER_PROFILE = 10;
const MAX_ENDPOINT_LENGTH = 2048;

const ALLOWED_PUSH_HOSTS = new Set([
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
]);

function validationError(message: string): PushError {
  return Object.assign(new Error(message), { status: 400 });
}

function isAllowedPushHost(hostname: string): boolean {
  return ALLOWED_PUSH_HOSTS.has(hostname.toLowerCase());
}

function validateEndpoint(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_ENDPOINT_LENGTH
  ) {
    throw validationError("Endpoint Push invalide.");
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw validationError("Endpoint Push invalide.");
  }

  const hostname = url.hostname.toLowerCase();

  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== "" ||
    !hostname ||
    !isAllowedPushHost(hostname) ||
    url.hash !== ""
  ) {
    throw validationError("Fournisseur Push non autorisé.");
  }

  return url.toString();
}

function validateBase64Url(
  value: unknown,
  expectedLength: number,
  label: string,
): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 128 ||
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    throw validationError(`${label} invalide.`);
  }

  const decoded = Buffer.from(value, "base64url");

  if (
    decoded.length !== expectedLength ||
    decoded.toString("base64url") !== value
  ) {
    throw validationError(`${label} invalide.`);
  }

  return value;
}

export function validatePushSubscription(
  input: unknown,
): PushSubscriptionInput {
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input)
  ) {
    throw validationError("Abonnement Push invalide.");
  }

  const subscription = input as Record<string, unknown>;

  if (
    typeof subscription.keys !== "object" ||
    subscription.keys === null ||
    Array.isArray(subscription.keys)
  ) {
    throw validationError("Clés Push invalides.");
  }

  const keys = subscription.keys as Record<string, unknown>;

  return {
    endpoint: validateEndpoint(subscription.endpoint),
    keys: {
      p256dh: validateBase64Url(
        keys.p256dh,
        65,
        "Clé publique Push",
      ),
      auth: validateBase64Url(
        keys.auth,
        16,
        "Clé d'authentification Push",
      ),
    },
  };
}

export async function savePushSubscription(
  profileId: string,
  input: unknown,
): Promise<void> {
  // La validation intervient avant toute connexion à PostgreSQL.
  const subscription = validatePushSubscription(input);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verrou transactionnel : évite de dépasser la limite
    // en cas de plusieurs inscriptions simultanées.
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [profileId],
    );

    const existing = await client.query(
      `SELECT 1
       FROM push_subscriptions
       WHERE profile_id = $1
         AND endpoint = $2
       LIMIT 1`,
      [profileId, subscription.endpoint],
    );

    const countResult = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM push_subscriptions
       WHERE profile_id = $1`,
      [profileId],
    );

    const count = Number(countResult.rows[0]?.count ?? 0);

    if (
      count >= MAX_SUBSCRIPTIONS_PER_PROFILE &&
      existing.rows.length === 0
    ) {
      throw Object.assign(
        new Error("Vous avez atteint la limite de 10 appareils."),
        { status: 409 },
      );
    }

    await client.query(
      `INSERT INTO push_subscriptions
        (profile_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (profile_id, endpoint)
       DO UPDATE SET
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         updated_at = now()`,
      [
        profileId,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth,
      ],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function deletePushSubscription(
  profileId: string,
  endpointValue: unknown,
): Promise<void> {
  const endpoint = validateEndpoint(endpointValue);

  await pool.query(
    `DELETE FROM push_subscriptions
     WHERE profile_id = $1
       AND endpoint = $2`,
    [profileId, endpoint],
  );
}

export async function sendPushToProfile(
  profileId: string,
  payload: unknown,
): Promise<void> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  // Sans configuration VAPID, le Push reste désactivé.
  if (!publicKey || !privateKey || !subject) {
    return;
  }

  try {
    const serializedPayload = JSON.stringify(payload);

    if (!serializedPayload) {
      return;
    }

    webpush.setVapidDetails(
      subject,
      publicKey,
      privateKey,
    );

    const result = await pool.query<StoredPushSubscription>(
      `SELECT endpoint, p256dh, auth
       FROM push_subscriptions
       WHERE profile_id = $1`,
      [profileId],
    );

    await Promise.all(
      result.rows.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            serializedPayload,
          );
        } catch (error) {
          const statusCode = (
            error as PushError
          )?.statusCode;

          // 404 et 410 indiquent un abonnement qui n'est
          // plus utilisable. On le supprime.
          if (statusCode === 404 || statusCode === 410) {
            try {
              await pool.query(
                `DELETE FROM push_subscriptions
                 WHERE profile_id = $1
                   AND endpoint = $2`,
                [profileId, subscription.endpoint],
              );
            } catch {
              // Ne pas journaliser les endpoints ou les clés.
            }
          }

          // Les autres erreurs ne suppriment pas l'abonnement.
        }
      }),
    );
  } catch {
    // Une erreur Push ne doit jamais interrompre
    // le fonctionnement principal de Madclothes.
  }
}