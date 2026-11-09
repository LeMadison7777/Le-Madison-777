var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/database.ts
import { attachDatabasePool } from "file:///C:/Users/Le%20MADISON/OneDrive/Desktop/Le%20Madison%20777/node_modules/@vercel/functions/index.js";
import { Pool } from "file:///C:/Users/Le%20MADISON/OneDrive/Desktop/Le%20Madison%20777/node_modules/pg/esm/index.mjs";
var globalForPool, pool;
var init_database = __esm({
  "server/database.ts"() {
    globalForPool = globalThis;
    pool = globalForPool.madclothesPool ?? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 5e3,
      connectionTimeoutMillis: 1e4,
      ssl: { rejectUnauthorized: true }
    });
    if (!globalForPool.madclothesPool) {
      globalForPool.madclothesPool = pool;
      attachDatabasePool(pool);
    }
  }
});

// server/r2.ts
import { S3Client } from "file:///C:/Users/Le%20MADISON/OneDrive/Desktop/Le%20Madison%20777/node_modules/@aws-sdk/client-s3/dist-cjs/index.js";
function getR2Bucket() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new R2ConfigurationError();
  return bucket;
}
function getR2Client() {
  if (client) return client;
  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey || !process.env.R2_BUCKET_NAME) {
    throw new R2ConfigurationError();
  }
  client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_S3_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });
  return client;
}
var R2ConfigurationError, client;
var init_r2 = __esm({
  "server/r2.ts"() {
    R2ConfigurationError = class extends Error {
      status = 503;
      constructor() {
        super("Le stockage Cloudflare R2 n'est pas configur\xE9 c\xF4t\xE9 serveur.");
        this.name = "R2ConfigurationError";
      }
    };
  }
});

// server/push.ts
import webpush from "file:///C:/Users/Le%20MADISON/OneDrive/Desktop/Le%20Madison%20777/node_modules/web-push/src/index.js";
function validationError(message) {
  return Object.assign(new Error(message), { status: 400 });
}
function isAllowedPushHost(hostname) {
  return ALLOWED_PUSH_HOSTS.has(hostname.toLowerCase());
}
function validateEndpoint(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_ENDPOINT_LENGTH) {
    throw validationError("Endpoint Push invalide.");
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw validationError("Endpoint Push invalide.");
  }
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username !== "" || url.password !== "" || url.port !== "" || !hostname || !isAllowedPushHost(hostname) || url.hash !== "") {
    throw validationError("Fournisseur Push non autoris\xE9.");
  }
  return url.toString();
}
function validateBase64Url(value, expectedLength, label) {
  if (typeof value !== "string" || value.length < 1 || value.length > 128 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw validationError(`${label} invalide.`);
  }
  const decoded = Buffer.from(value, "base64url");
  if (decoded.length !== expectedLength || decoded.toString("base64url") !== value) {
    throw validationError(`${label} invalide.`);
  }
  return value;
}
function validatePushSubscription(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw validationError("Abonnement Push invalide.");
  }
  const subscription = input;
  if (typeof subscription.keys !== "object" || subscription.keys === null || Array.isArray(subscription.keys)) {
    throw validationError("Cl\xE9s Push invalides.");
  }
  const keys = subscription.keys;
  return {
    endpoint: validateEndpoint(subscription.endpoint),
    keys: {
      p256dh: validateBase64Url(
        keys.p256dh,
        65,
        "Cl\xE9 publique Push"
      ),
      auth: validateBase64Url(
        keys.auth,
        16,
        "Cl\xE9 d'authentification Push"
      )
    }
  };
}
async function savePushSubscription(profileId, input) {
  const subscription = validatePushSubscription(input);
  const client2 = await pool.connect();
  try {
    await client2.query("BEGIN");
    await client2.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [profileId]
    );
    const existing = await client2.query(
      `SELECT 1
       FROM push_subscriptions
       WHERE profile_id = $1
         AND endpoint = $2
       LIMIT 1`,
      [profileId, subscription.endpoint]
    );
    const countResult = await client2.query(
      `SELECT COUNT(*)::int AS count
       FROM push_subscriptions
       WHERE profile_id = $1`,
      [profileId]
    );
    const count = Number(countResult.rows[0]?.count ?? 0);
    if (count >= MAX_SUBSCRIPTIONS_PER_PROFILE && existing.rows.length === 0) {
      throw Object.assign(
        new Error("Vous avez atteint la limite de 10 appareils."),
        { status: 409 }
      );
    }
    await client2.query(
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
        subscription.keys.auth
      ]
    );
    await client2.query("COMMIT");
  } catch (error) {
    await client2.query("ROLLBACK").catch(() => void 0);
    throw error;
  } finally {
    client2.release();
  }
}
async function deletePushSubscription(profileId, endpointValue) {
  const endpoint = validateEndpoint(endpointValue);
  await pool.query(
    `DELETE FROM push_subscriptions
     WHERE profile_id = $1
       AND endpoint = $2`,
    [profileId, endpoint]
  );
}
async function sendPushToProfile(profileId, payload) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
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
      privateKey
    );
    const result = await pool.query(
      `SELECT endpoint, p256dh, auth
       FROM push_subscriptions
       WHERE profile_id = $1`,
      [profileId]
    );
    await Promise.all(
      result.rows.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
              }
            },
            serializedPayload
          );
        } catch (error) {
          const statusCode = error?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            try {
              await pool.query(
                `DELETE FROM push_subscriptions
                 WHERE profile_id = $1
                   AND endpoint = $2`,
                [profileId, subscription.endpoint]
              );
            } catch {
            }
          }
        }
      })
    );
  } catch {
  }
}
var MAX_SUBSCRIPTIONS_PER_PROFILE, MAX_ENDPOINT_LENGTH, ALLOWED_PUSH_HOSTS;
var init_push = __esm({
  "server/push.ts"() {
    init_database();
    MAX_SUBSCRIPTIONS_PER_PROFILE = 10;
    MAX_ENDPOINT_LENGTH = 2048;
    ALLOWED_PUSH_HOSTS = /* @__PURE__ */ new Set([
      "fcm.googleapis.com",
      "updates.push.services.mozilla.com",
      "web.push.apple.com"
    ]);
  }
});

// server/api.ts
var api_exports = {};
__export(api_exports, {
  handleApi: () => handleApi
});
import { randomUUID } from "node:crypto";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "file:///C:/Users/Le%20MADISON/OneDrive/Desktop/Le%20Madison%20777/node_modules/@aws-sdk/client-s3/dist-cjs/index.js";
import { getSignedUrl } from "file:///C:/Users/Le%20MADISON/OneDrive/Desktop/Le%20Madison%20777/node_modules/@aws-sdk/s3-request-presigner/dist-cjs/index.js";
import { createRemoteJWKSet, jwtVerify } from "file:///C:/Users/Le%20MADISON/OneDrive/Desktop/Le%20Madison%20777/node_modules/jose/dist/webapi/index.js";
function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'"
    }
  });
}
async function body(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_JSON_BYTES) fail(413, "La requ\xEAte est trop volumineuse.");
  try {
    return await request.json();
  } catch {
    fail(400, "Le corps JSON est invalide.");
  }
}
function text(value, label, min, max) {
  if (typeof value !== "string") fail(400, `${label} est requis.`);
  const clean = value.trim();
  if (clean.length < min || clean.length > max) fail(400, `${label} doit contenir de ${min} \xE0 ${max} caract\xE8res.`);
  return clean;
}
function integer(value, label, min, max) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) fail(400, `${label} est invalide.`);
  return parsed;
}
function authConfig() {
  const url = process.env.NEON_AUTH_JWKS_URL;
  if (!url) fail(503, "L'authentification Neon n'est pas configur\xE9e c\xF4t\xE9 serveur.");
  jwks ??= createRemoteJWKSet(new URL(url));
  return jwks;
}
async function authenticated(request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) fail(401, "Connectez-vous pour continuer.");
  let payload;
  try {
    ({ payload } = await jwtVerify(token, authConfig()));
  } catch {
    fail(401, "Votre session a expir\xE9. Reconnectez-vous.");
  }
  if (typeof payload.sub !== "string" || !payload.sub) fail(401, "La session ne contient pas d'identit\xE9 valide.");
  const result = await pool.query(
    "SELECT id, role, status FROM profiles WHERE auth_subject = $1",
    [payload.sub]
  );
  const profile2 = result.rows[0];
  if (!profile2) fail(409, "Compl\xE9tez votre profil pour continuer.");
  if (profile2.status !== "active") fail(403, "Ce compte n'est pas actif.");
  return { subject: payload.sub, email: typeof payload.email === "string" ? payload.email : void 0, profileId: profile2.id, role: profile2.role };
}
function storage() {
  return getR2Client();
}
async function imageUrl(key) {
  if (!key) return "/images/product-placeholder.svg";
  const base = (process.env.R2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_URL)?.replace(/\/$/, "");
  if (base) return `${base}/${key}`;
  try {
    return await getSignedUrl(storage(), new GetObjectCommand({ Bucket: getR2Bucket(), Key: key }), { expiresIn: 3600 });
  } catch {
    return "/images/product-placeholder.svg";
  }
}
async function profile(request, method) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) fail(401, "Connectez-vous pour continuer.");
  let payload;
  try {
    ({ payload } = await jwtVerify(token, authConfig()));
  } catch {
    fail(401, "Votre session a expir\xE9.");
  }
  if (!payload.sub) fail(401, "Identit\xE9 invalide.");
  if (method === "GET") {
    const result2 = await pool.query(
      'SELECT id, display_name AS "displayName", username, phone, city, biography, avatar_object_key AS "avatarKey", role FROM profiles WHERE auth_subject = $1',
      [payload.sub]
    );
    return result2.rows[0] ? json(result2.rows[0]) : json({ profile: null }, 200);
  }
  if (method !== "POST" && method !== "PATCH") fail(405, "M\xE9thode non autoris\xE9e.");
  const input = await body(request);
  const displayName = text(input.displayName, "Le nom", 2, 80);
  const emailName = (typeof payload.email === "string" ? payload.email.split("@")[0] : "membre").normalize("NFKD").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30) || "membre";
  const username = `${emailName}_${String(payload.sub).slice(-6)}`.slice(0, 40);
  const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  const role = typeof payload.email === "string" && allowlist.includes(payload.email.toLowerCase()) ? "admin" : "member";
  if (method === "POST") {
    const result2 = await pool.query(
      `INSERT INTO profiles (auth_subject, display_name, username, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (auth_subject) DO UPDATE SET display_name = EXCLUDED.display_name
       RETURNING id, display_name AS "displayName", username, phone, city, biography, role`,
      [payload.sub, displayName, username, role]
    );
    return json(result2.rows[0], 201);
  }
  const city = input.city == null ? null : text(input.city, "La ville", 2, 80);
  const phone = input.phone == null ? null : text(input.phone, "Le t\xE9l\xE9phone", 6, 30);
  const biography = input.biography == null ? null : text(input.biography, "La bio", 0, 500);
  const result = await pool.query(
    `UPDATE profiles SET display_name = $2, city = $3, phone = $4, biography = $5
     WHERE auth_subject = $1 RETURNING id, display_name AS "displayName", username, phone, city, biography, role`,
    [payload.sub, displayName, city, phone, biography]
  );
  if (!result.rowCount) fail(404, "Profil introuvable.");
  return json(result.rows[0]);
}
async function listings(request, method, path2) {
  if (method === "GET" && path2 === "/api/listings") {
    const query = new URL(request.url).searchParams;
    const search = (query.get("q") || "").trim().slice(0, 100) || null;
    const category = query.get("category")?.slice(0, 80) || null;
    const city = query.get("city")?.slice(0, 80) || null;
    const size = query.get("size")?.slice(0, 20) || null;
    const conditionValues = { "Neuf avec \xE9tiquette": "new_with_tags", "Neuf sans \xE9tiquette": "new_without_tags", "Tr\xE8s bon \xE9tat": "very_good", "Bon \xE9tat": "good", "\xC9tat correct": "fair" };
    const conditionLabel = query.get("condition");
    const condition = conditionLabel ? conditionValues[conditionLabel] : null;
    if (conditionLabel && !condition) fail(400, "L'\xE9tat demand\xE9 est invalide.");
    const min = query.has("min") ? integer(query.get("min"), "Le prix minimum", 0, 1e7) : 0;
    const max = query.has("max") ? integer(query.get("max"), "Le prix maximum", min, 1e7) : 1e7;
    const page = query.has("page") ? integer(query.get("page"), "La page", 1, 1e4) : 1;
    const limit = query.has("limit") ? integer(query.get("limit"), "La limite", 1, 48) : 24;
    const result = await pool.query(
      `SELECT l.id, l.title AS name, l.brand, l.size_label AS size, l.price_xaf AS price,
              l.city || ', Congo' AS location, l.city, c.name AS category,
              CASE l.condition WHEN 'new_with_tags' THEN 'Neuf avec \xE9tiquette' WHEN 'new_without_tags' THEN 'Neuf sans \xE9tiquette' WHEN 'very_good' THEN 'Tr\xE8s bon \xE9tat' WHEN 'good' THEN 'Bon \xE9tat' ELSE '\xC9tat correct' END AS condition,
              COALESCE(json_agg(json_build_object('id', i.id, 'key', i.object_key, 'alt', i.alt_text, 'type', i.content_type) ORDER BY i.position) FILTER (WHERE i.id IS NOT NULL), '[]'::json) AS images
       FROM listings l JOIN categories c ON c.id = l.category_id
       LEFT JOIN listing_images i ON i.listing_id = l.id
       WHERE l.status = 'published' AND c.is_active
         AND ($1::text IS NULL OR l.title ILIKE '%' || $1 || '%' OR COALESCE(l.brand, '') ILIKE '%' || $1 || '%')
         AND ($2::text IS NULL OR c.name = $2 OR c.slug = $2)
         AND ($3::text IS NULL OR l.city = $3)
         AND ($4::text IS NULL OR l.size_label = $4)
         AND ($5::listing_condition IS NULL OR l.condition=$5)
         AND l.price_xaf BETWEEN $6 AND $7
       GROUP BY l.id, c.name
       ORDER BY l.published_at DESC NULLS LAST, l.created_at DESC
       LIMIT $8 OFFSET $9`,
      [search, category, city, size, condition, min, max, limit, (page - 1) * limit]
    );
    const count = await pool.query(
      `SELECT count(*)::int AS count FROM listings l JOIN categories c ON c.id = l.category_id
       WHERE l.status = 'published' AND c.is_active
         AND ($1::text IS NULL OR l.title ILIKE '%' || $1 || '%' OR COALESCE(l.brand, '') ILIKE '%' || $1 || '%')
         AND ($2::text IS NULL OR c.name = $2 OR c.slug = $2)
         AND ($3::text IS NULL OR l.city = $3)
         AND ($4::text IS NULL OR l.size_label = $4)
         AND ($5::listing_condition IS NULL OR l.condition=$5)
         AND l.price_xaf BETWEEN $6 AND $7`,
      [search, category, city, size, condition, min, max]
    );
    const items = await Promise.all(result.rows.map(async (item) => ({
      ...item,
      price: Number(item.price),
      img: await imageUrl(item.images[0]?.key)
    })));
    return json({ items, total: count.rows[0].count, page, limit });
  }
  if (method === "GET" && path2 === "/api/categories") {
    const result = await pool.query("SELECT id, name, slug FROM categories WHERE is_active = true ORDER BY sort_order, name");
    return json(result.rows);
  }
  if (method === "GET" && /^\/api\/listings\/[\w-]+$/.test(path2)) {
    const id = path2.split("/").at(-1);
    const result = await pool.query(
      `SELECT l.id, l.seller_id AS "sellerId", l.title AS name, l.description, l.brand, l.size_label AS size,
       l.price_xaf AS price, l.city, l.city || ', Congo' AS location, l.country_code AS "countryCode", c.name AS category,
       CASE l.condition WHEN 'new_with_tags' THEN 'Neuf avec \xE9tiquette' WHEN 'new_without_tags' THEN 'Neuf sans \xE9tiquette' WHEN 'very_good' THEN 'Tr\xE8s bon \xE9tat' WHEN 'good' THEN 'Bon \xE9tat' ELSE '\xC9tat correct' END AS condition,
       p.display_name AS seller, COALESCE(json_agg(json_build_object('id', i.id, 'key', i.object_key, 'alt', i.alt_text) ORDER BY i.position) FILTER (WHERE i.id IS NOT NULL), '[]'::json) AS images
       FROM listings l JOIN categories c ON c.id=l.category_id JOIN profiles p ON p.id=l.seller_id LEFT JOIN listing_images i ON i.listing_id=l.id
       WHERE l.id=$1 AND l.status='published' GROUP BY l.id, c.name, p.display_name`,
      [id]
    );
    if (!result.rows[0]) fail(404, "Annonce introuvable.");
    const item = result.rows[0];
    const images = await Promise.all(item.images.map(async (image) => ({
      ...image,
      url: await imageUrl(image.key)
    })));
    return json({ ...item, price: Number(item.price), images });
  }
  const user = await authenticated(request);
  if (method === "POST" && path2 === "/api/listings") {
    const input = await body(request);
    const title = text(input.title, "Le titre", 3, 140);
    const description = text(input.description, "La description", 1, 5e3);
    const brand = input.brand == null ? null : text(input.brand, "La marque", 1, 80);
    const size = input.size == null ? null : text(input.size, "La taille", 1, 20);
    const city = text(input.city, "La ville", 2, 80);
    const price = integer(input.price, "Le prix", 1, 1e7);
    const conditionMap = { "Neuf avec \xE9tiquette": "new_with_tags", "Neuf sans \xE9tiquette": "new_without_tags", "Tr\xE8s bon \xE9tat": "very_good", "Bon \xE9tat": "good", "\xC9tat correct": "fair" };
    const condition = conditionMap[String(input.condition)] || String(input.condition);
    if (!Object.values(conditionMap).includes(condition)) fail(400, "L'\xE9tat de l'article est invalide.");
    const categoryId = text(input.categoryId, "La cat\xE9gorie", 1, 80);
    const result = await pool.query(
      `INSERT INTO listings (seller_id, category_id, title, description, brand, size_label, condition, price_xaf, city, status)
       SELECT $1, c.id, $3, $4, $5, $6, $7::listing_condition, $8, $9, 'draft'
       FROM categories c WHERE c.id::text=$2 AND c.is_active
       RETURNING id, status`,
      [user.profileId, categoryId, title, description, brand, size, condition, price, city]
    );
    if (!result.rowCount) fail(400, "Cat\xE9gorie inconnue ou inactive.");
    return json(result.rows[0], 201);
  }
  const match = path2.match(/^\/api\/listings\/([\w-]+)\/(publish|withdraw)$/);
  if (method === "POST" && match) {
    const [, listingId, action] = match;
    if (action === "publish") {
      const result2 = await pool.query(
        `UPDATE listings l SET status='published', published_at=now()
         WHERE l.id=$1 AND l.seller_id=$2 AND l.status='draft'
           AND EXISTS (SELECT 1 FROM listing_images i WHERE i.listing_id=l.id)
         RETURNING l.id, l.status`,
        [listingId, user.profileId]
      );
      if (!result2.rowCount) fail(409, "Ajoutez au moins une photo \xE0 votre brouillon avant de publier.");
      return json(result2.rows[0]);
    }
    const result = await pool.query("UPDATE listings SET status='withdrawn' WHERE id=$1 AND seller_id=$2 AND status IN ('draft','published') RETURNING id,status", [listingId, user.profileId]);
    if (!result.rowCount) fail(404, "Annonce introuvable.");
    return json(result.rows[0]);
  }
  if (method === "GET" && path2 === "/api/seller/listings") {
    const result = await pool.query(
      `SELECT l.id, l.title AS name, l.price_xaf AS price, l.status, l.city, l.created_at AS "createdAt",
       (SELECT i.object_key FROM listing_images i WHERE i.listing_id=l.id ORDER BY i.position LIMIT 1) AS "imageKey"
       FROM listings l WHERE l.seller_id=$1 ORDER BY l.created_at DESC`,
      [user.profileId]
    );
    return json(await Promise.all(result.rows.map(async (item) => ({
      ...item,
      price: Number(item.price),
      img: await imageUrl(item.imageKey)
    }))));
  }
  fail(404, "Route annonce introuvable.");
}
async function uploads(request, method, path2) {
  const user = await authenticated(request);
  if (method === "POST" && path2 === "/api/uploads/presign") {
    const input = await body(request);
    const listingId = text(input.listingId, "L'annonce", 1, 80);
    const contentType = text(input.contentType, "Le type de fichier", 1, 100);
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) fail(400, "Format d'image accept\xE9 : JPEG, PNG, WebP ou AVIF.");
    const size = integer(input.size, "La taille du fichier", 1, MAX_IMAGE_BYTES);
    const listing = await pool.query("SELECT id FROM listings WHERE id=$1 AND seller_id=$2 AND status='draft'", [listingId, user.profileId]);
    if (!listing.rowCount) fail(404, "Brouillon introuvable.");
    const current = await pool.query("SELECT count(*)::int AS count FROM listing_images WHERE listing_id=$1", [listingId]);
    if (current.rows[0].count >= 10) fail(400, "Une annonce peut contenir au maximum 10 photos.");
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[contentType];
    const key = `listings/${user.profileId}/${listingId}/${randomUUID()}.${ext}`;
    const command = new PutObjectCommand({ Bucket: getR2Bucket(), Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(storage(), command, { expiresIn: 300 });
    return json({ key, uploadUrl, expiresIn: 300 });
  }
  if (method === "POST" && path2 === "/api/uploads/confirm") {
    const input = await body(request);
    const key = text(input.key, "La cl\xE9", 1, 500);
    const listingId = text(input.listingId, "L'annonce", 1, 80);
    const alt = input.alt == null ? null : text(input.alt, "Le texte alternatif", 0, 180);
    if (!key.startsWith(`listings/${user.profileId}/${listingId}/`)) fail(403, "Cl\xE9 de fichier invalide.");
    const listing = await pool.query("SELECT id FROM listings WHERE id=$1 AND seller_id=$2 AND status='draft'", [listingId, user.profileId]);
    if (!listing.rowCount) fail(404, "Brouillon introuvable.");
    let head;
    try {
      head = await storage().send(new HeadObjectCommand({ Bucket: getR2Bucket(), Key: key }));
    } catch {
      fail(400, "Le fichier n'a pas \xE9t\xE9 re\xE7u par R2.");
    }
    const contentType = head.ContentType || "";
    const byteSize = head.ContentLength || 0;
    if (!ALLOWED_IMAGE_TYPES.has(contentType) || byteSize < 1 || byteSize > MAX_IMAGE_BYTES) fail(400, "Le fichier envoy\xE9 ne respecte pas les r\xE8gles d'image.");
    const position = await pool.query("SELECT COALESCE(max(position)+1,0)::int AS position FROM listing_images WHERE listing_id=$1", [listingId]);
    if (position.rows[0].position > 9) fail(400, "Une annonce peut contenir au maximum 10 photos.");
    const result = await pool.query(
      `INSERT INTO listing_images (listing_id, object_key, alt_text, content_type, byte_size, position)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (object_key) DO NOTHING RETURNING id`,
      [listingId, key, alt, contentType, byteSize, position.rows[0].position]
    );
    if (!result.rowCount) fail(409, "Cette photo a d\xE9j\xE0 \xE9t\xE9 enregistr\xE9e.");
    return json({ id: result.rows[0].id, key, alt }, 201);
  }
  fail(404, "Route de t\xE9l\xE9versement introuvable.");
}
async function favorites(request, method, path2) {
  const user = await authenticated(request);
  if (method === "GET" && path2 === "/api/favorites") {
    const result = await pool.query(
      `SELECT l.id, l.title AS name, l.brand, l.size_label AS size, l.price_xaf AS price, l.city,
       c.name AS category, (SELECT i.object_key FROM listing_images i WHERE i.listing_id=l.id ORDER BY position LIMIT 1) AS key
       FROM favorites f JOIN listings l ON l.id=f.listing_id JOIN categories c ON c.id=l.category_id WHERE f.profile_id=$1 AND l.status='published'`,
      [user.profileId]
    );
    return json(await Promise.all(result.rows.map(async (item) => ({
      ...item,
      price: Number(item.price),
      img: await imageUrl(item.key)
    }))));
  }
  const match = path2.match(/^\/api\/favorites\/([\w-]+)$/);
  if (match && method === "POST") {
    const result = await pool.query(
      `INSERT INTO favorites (profile_id, listing_id) SELECT $1,id FROM listings WHERE id=$2 AND status='published'
       ON CONFLICT DO NOTHING RETURNING listing_id`,
      [user.profileId, match[1]]
    );
    return json({ favorited: true, inserted: Boolean(result.rowCount) });
  }
  if (match && method === "DELETE") {
    await pool.query("DELETE FROM favorites WHERE profile_id=$1 AND listing_id=$2", [user.profileId, match[1]]);
    return json({ favorited: false });
  }
  fail(404, "Route favoris introuvable.");
}
async function orders(request, method, path2) {
  const user = await authenticated(request);
  if (method === "GET" && path2 === "/api/orders") {
    const result = await pool.query(
      `SELECT o.id, o.status, o.item_price_xaf AS "itemPrice", o.total_xaf AS total, o.created_at AS "createdAt",
       l.title AS "listingTitle", l.id AS "listingId",
       CASE WHEN o.seller_id=$1 THEN pb.display_name ELSE p.display_name END AS "otherPartyName",
       o.seller_id=$1 AS "isSeller",
       EXISTS (SELECT 1 FROM reviews r WHERE r.order_id=o.id AND r.reviewer_id=$1) AS "hasReviewed"
       FROM orders o JOIN listings l ON l.id=o.listing_id JOIN profiles p ON p.id=o.seller_id JOIN profiles pb ON pb.id=o.buyer_id
       WHERE o.buyer_id=$1 OR o.seller_id=$1 ORDER BY o.created_at DESC`,
      [user.profileId]
    );
    return json(result.rows.map((row) => ({ ...row, itemPrice: Number(row.itemPrice), total: Number(row.total) })));
  }
  if (method === "POST" && path2 === "/api/orders") {
    const input = await body(request);
    const listingId = text(input.listingId, "L'annonce", 1, 80);
    const method2 = input.deliveryMethod === "pickup" ? "pickup" : "delivery";
    const city = text(input.city, "La ville", 2, 80);
    const details = input.details == null ? null : text(input.details, "Les informations de remise", 0, 500);
    const client2 = await pool.connect();
    try {
      await client2.query("BEGIN");
      const listing = await client2.query("SELECT id,seller_id,price_xaf FROM listings WHERE id=$1 AND status='published' FOR UPDATE", [listingId]);
      if (!listing.rowCount) fail(409, "Cet article n'est plus disponible.");
      const row = listing.rows[0];
      if (row.seller_id === user.profileId) fail(400, "Vous ne pouvez pas acheter votre propre annonce.");
      const setting = await client2.query("SELECT value FROM platform_settings WHERE key='commission_rates'");
      const bps = Number(setting.rows[0]?.value?.seller_bps || 0);
      const commission = Math.floor(Number(row.price_xaf) * Math.min(Math.max(bps, 0), 1e4) / 1e4);
      const order = await client2.query(
        `INSERT INTO orders (listing_id,buyer_id,seller_id,item_price_xaf,commission_xaf)
         VALUES ($1,$2,$3,$4,$5) RETURNING id,status,total_xaf AS total`,
        [listingId, user.profileId, row.seller_id, row.price_xaf, commission]
      );
      await client2.query("UPDATE listings SET status='reserved' WHERE id=$1", [listingId]);
      await client2.query("INSERT INTO fulfillments (order_id,method,city,pickup_or_delivery_details) VALUES ($1,$2,$3,$4)", [order.rows[0].id, method2, city, details]);
      await client2.query(
        "INSERT INTO notifications (profile_id,kind,payload) VALUES ($1,'order_created',jsonb_build_object('orderId',$2::text))",
        [row.seller_id, order.rows[0].id]
      );
      await client2.query("COMMIT");
      await sendPushToProfile(row.seller_id, {
        title: "Nouvelle commande",
        body: "Une nouvelle demande concerne l'un de vos articles.",
        url: "/commandes"
      });
      return json({ ...order.rows[0], total: Number(order.rows[0].total), paymentEnabled: false, message: "Votre demande est enregistr\xE9e. Le paiement sera activ\xE9 lorsque les acc\xE8s au prestataire seront configur\xE9s; la commande reste en attente." }, 201);
    } catch (error) {
      try {
        await client2.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Madclothes transaction rollback failed", rollbackError);
      }
      throw error;
    } finally {
      client2.release();
    }
  }
  const reviewMatch = path2.match(/^\/api\/orders\/([\w-]+)\/review$/);
  if (method === "POST" && reviewMatch) {
    const input = await body(request);
    const rating = integer(input.rating, "La note", 1, 5);
    const comment = input.comment == null || input.comment === "" ? null : text(input.comment, "Le commentaire", 1, 1200);
    const order = await pool.query("SELECT id,buyer_id,seller_id FROM orders WHERE id=$1 AND status='completed' AND (buyer_id=$2 OR seller_id=$2)", [reviewMatch[1], user.profileId]);
    if (!order.rowCount) fail(409, "Seule une commande termin\xE9e peut recevoir une \xE9valuation.");
    const reviewee = order.rows[0].buyer_id === user.profileId ? order.rows[0].seller_id : order.rows[0].buyer_id;
    const result = await pool.query("INSERT INTO reviews (order_id,reviewer_id,reviewee_id,rating,comment) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (order_id,reviewer_id) DO NOTHING RETURNING id,rating,comment", [order.rows[0].id, user.profileId, reviewee, rating, comment]);
    if (!result.rowCount) fail(409, "Vous avez d\xE9j\xE0 \xE9valu\xE9 cette commande.");
    await pool.query("INSERT INTO notifications (profile_id,kind,payload) VALUES ($1,'new_review',jsonb_build_object('orderId',$2::text))", [reviewee, order.rows[0].id]);
    await pool.query("INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,metadata) VALUES ($1,'review_created','review',$2,$3::jsonb)", [user.profileId, result.rows[0].id, JSON.stringify({ rating })]);
    return json(result.rows[0], 201);
  }
  const match = path2.match(/^\/api\/orders\/([\w-]+)\/status$/);
  if (method === "PATCH" && match) {
    const input = await body(request);
    const next = String(input.status || "");
    const transitions = { pending_payment: ["cancelled"], paid: ["processing", "disputed"], processing: ["shipped", "completed", "disputed"], shipped: ["completed", "disputed"], disputed: ["refunded"] };
    const client2 = await pool.connect();
    try {
      await client2.query("BEGIN");
      const current = await client2.query("SELECT id,buyer_id,seller_id,status FROM orders WHERE id=$1 FOR UPDATE", [match[1]]);
      const order = current.rows[0];
      if (!order || ![order.buyer_id, order.seller_id].includes(user.profileId)) fail(404, "Commande introuvable.");
      if (!transitions[order.status]?.includes(next)) fail(409, "Cette transition de commande n'est pas autoris\xE9e.");
      if ((next === "processing" || next === "shipped") && order.seller_id !== user.profileId) fail(403, "Seul le vendeur peut mettre \xE0 jour cette \xE9tape.");
      if (next === "cancelled" && order.buyer_id !== user.profileId) fail(403, "Seul l'acheteur peut annuler cette demande.");
      if (next === "completed" && order.buyer_id !== user.profileId) fail(403, "Seul l'acheteur peut confirmer la r\xE9ception.");
      await client2.query("UPDATE orders SET status=$2 WHERE id=$1", [order.id, next]);
      if (next === "completed") await client2.query("UPDATE listings SET status='sold' WHERE id=(SELECT listing_id FROM orders WHERE id=$1)", [order.id]);
      if (next === "cancelled") await client2.query("UPDATE listings SET status='published' WHERE id=(SELECT listing_id FROM orders WHERE id=$1) AND status='reserved'", [order.id]);
      await client2.query("INSERT INTO notifications (profile_id,kind,payload) VALUES ($1,'order_status',jsonb_build_object('orderId',$2::text,'status',$3::text))", [order.buyer_id === user.profileId ? order.seller_id : order.buyer_id, order.id, next]);
      await client2.query("COMMIT");
      return json({ id: order.id, status: next });
    } catch (error) {
      try {
        await client2.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Madclothes transaction rollback failed", rollbackError);
      }
      throw error;
    } finally {
      client2.release();
    }
  }
  fail(404, "Route commande introuvable.");
}
async function messaging(request, method, path2) {
  const user = await authenticated(request);
  if (method === "GET" && path2 === "/api/conversations") {
    const result = await pool.query(
      `SELECT c.id, c.listing_id AS "listingId", l.title AS "listingTitle", c.last_message_at AS "lastMessageAt",
       CASE WHEN c.buyer_id=$1 THEN ps.display_name ELSE pb.display_name END AS "otherName",
       (SELECT body FROM messages m WHERE m.conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS "lastMessage"
       FROM conversations c JOIN listings l ON l.id=c.listing_id JOIN profiles pb ON pb.id=c.buyer_id JOIN profiles ps ON ps.id=c.seller_id
       WHERE c.buyer_id=$1 OR c.seller_id=$1 ORDER BY c.last_message_at DESC`,
      [user.profileId]
    );
    return json(result.rows);
  }
  if (method === "POST" && path2 === "/api/conversations") {
    const input = await body(request);
    const listingId = text(input.listingId, "L'annonce", 1, 80);
    const message = text(input.message, "Le message", 1, 5e3);
    const listing = await pool.query("SELECT id,seller_id FROM listings WHERE id=$1 AND status='published'", [listingId]);
    if (!listing.rowCount) fail(404, "Annonce introuvable.");
    if (listing.rows[0].seller_id === user.profileId) fail(400, "Vous \xEAtes le vendeur de cette annonce.");
    const client2 = await pool.connect();
    try {
      await client2.query("BEGIN");
      const conversation = await client2.query(
        `INSERT INTO conversations (listing_id,buyer_id,seller_id) VALUES ($1,$2,$3)
         ON CONFLICT (listing_id,buyer_id) DO UPDATE SET last_message_at=now() RETURNING id`,
        [listingId, user.profileId, listing.rows[0].seller_id]
      );
      const id = conversation.rows[0].id;
      await client2.query("INSERT INTO messages (conversation_id,sender_id,body) VALUES ($1,$2,$3)", [id, user.profileId, message]);
      await client2.query("UPDATE conversations SET last_message_at=now() WHERE id=$1", [id]);
      await client2.query("INSERT INTO notifications (profile_id,kind,payload) VALUES ($1,'new_message',jsonb_build_object('conversationId',$2::text))", [listing.rows[0].seller_id, id]);
      await client2.query("COMMIT");
      return json({ id }, 201);
    } catch (error) {
      try {
        await client2.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Madclothes transaction rollback failed", rollbackError);
      }
      throw error;
    } finally {
      client2.release();
    }
  }
  const match = path2.match(/^\/api\/conversations\/([\w-]+)$/);
  if (method === "GET" && match) {
    const allowed = await pool.query("SELECT id FROM conversations WHERE id=$1 AND (buyer_id=$2 OR seller_id=$2)", [match[1], user.profileId]);
    if (!allowed.rowCount) fail(404, "Conversation introuvable.");
    const result = await pool.query('SELECT m.id,m.body,m.created_at AS "createdAt",m.sender_id=$2 AS "own",p.display_name AS "senderName" FROM messages m JOIN profiles p ON p.id=m.sender_id WHERE m.conversation_id=$1 ORDER BY m.created_at', [match[1], user.profileId]);
    await pool.query("UPDATE messages SET read_at=now() WHERE conversation_id=$1 AND sender_id<>$2 AND read_at IS NULL", [match[1], user.profileId]);
    return json(result.rows);
  }
  if (method === "POST" && match) {
    const input = await body(request);
    const message = text(input.message, "Le message", 1, 5e3);
    const client2 = await pool.connect();
    try {
      await client2.query("BEGIN");
      const allowed = await client2.query("SELECT id,buyer_id,seller_id FROM conversations WHERE id=$1 AND (buyer_id=$2 OR seller_id=$2) FOR UPDATE", [match[1], user.profileId]);
      if (!allowed.rowCount) fail(404, "Conversation introuvable.");
      await client2.query("INSERT INTO messages (conversation_id,sender_id,body) VALUES ($1,$2,$3)", [match[1], user.profileId, message]);
      await client2.query("UPDATE conversations SET last_message_at=now() WHERE id=$1", [match[1]]);
      const target = allowed.rows[0].buyer_id === user.profileId ? allowed.rows[0].seller_id : allowed.rows[0].buyer_id;
      await client2.query("INSERT INTO notifications (profile_id,kind,payload) VALUES ($1,'new_message',jsonb_build_object('conversationId',$2::text))", [target, match[1]]);
      await client2.query("COMMIT");
      return json({ sent: true }, 201);
    } catch (error) {
      try {
        await client2.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Madclothes transaction rollback failed", rollbackError);
      }
      throw error;
    } finally {
      client2.release();
    }
  }
  fail(404, "Route messagerie introuvable.");
}
async function pushSubscriptions(request, method) {
  const user = await authenticated(request);
  if (method === "POST") {
    const input = await body(request);
    const subscription = input.subscription ?? input;
    await savePushSubscription(user.profileId, subscription);
    return json({ subscribed: true }, 201);
  }
  if (method === "DELETE") {
    const input = await body(request);
    await deletePushSubscription(user.profileId, input.endpoint);
    return json({ unsubscribed: true });
  }
  fail(405, "M\xE9thode non autoris\xE9e.");
}
async function notifications(request, method, path2) {
  const user = await authenticated(request);
  if (method === "GET" && path2 === "/api/notifications") {
    const result = await pool.query('SELECT id,kind,payload,read_at AS "readAt",created_at AS "createdAt" FROM notifications WHERE profile_id=$1 ORDER BY created_at DESC LIMIT 50', [user.profileId]);
    return json(result.rows);
  }
  if (method === "PATCH" && path2 === "/api/notifications/read-all") {
    await pool.query("UPDATE notifications SET read_at=now() WHERE profile_id=$1 AND read_at IS NULL", [user.profileId]);
    return json({ read: true });
  }
  const match = path2.match(/^\/api\/notifications\/([\w-]+)\/read$/);
  if (method === "PATCH" && match) {
    await pool.query("UPDATE notifications SET read_at=now() WHERE id=$1 AND profile_id=$2", [match[1], user.profileId]);
    return json({ read: true });
  }
  fail(404, "Route notification introuvable.");
}
async function admin(request, method, path2) {
  const user = await authenticated(request);
  if (method === "PATCH" && path2 === "/api/admin/commissions") {
    if (user.role !== "admin") fail(403, "Seuls les administrateurs peuvent modifier le bar\xE8me.");
    const input = await body(request);
    const sellerBps = integer(input.sellerBps, "La commission vendeur", 0, 2e3);
    const value = { seller_bps: sellerBps, configured: input.configured !== false };
    await pool.query(
      `INSERT INTO platform_settings (key,value) VALUES ('commission_rates',$1::jsonb)
       ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`,
      [JSON.stringify(value)]
    );
    await pool.query("INSERT INTO audit_logs (actor_id,action,entity_type,metadata) VALUES ($1,'commission_rates_updated','platform_setting',$2::jsonb)", [user.profileId, JSON.stringify({ seller_bps: sellerBps })]);
    return json({ configured: value.configured, sellerBps });
  }
  if (user.role !== "admin" && user.role !== "moderator") fail(403, "Acc\xE8s r\xE9serv\xE9 \xE0 l'\xE9quipe de mod\xE9ration.");
  if (method === "GET" && path2 === "/api/admin/reports") {
    const result = await pool.query(
      `SELECT r.id,r.target_type AS "targetType",r.target_id AS "targetId",r.reason,r.status,r.created_at AS "createdAt",p.display_name AS reporter
       FROM moderation_reports r JOIN profiles p ON p.id=r.reporter_id WHERE r.status IN ('open','reviewing') ORDER BY r.created_at`
    );
    return json(result.rows);
  }
  if (method === "PATCH" && /^\/api\/admin\/reports\/[\w-]+$/.test(path2)) {
    const id = path2.split("/").at(-1);
    const input = await body(request);
    const status = String(input.status || "");
    if (!["reviewing", "resolved", "dismissed"].includes(status)) fail(400, "Statut de mod\xE9ration invalide.");
    const note = input.note == null ? null : text(input.note, "La note", 0, 1e3);
    if (input.action === "suspend_target") {
      const target = await pool.query("SELECT target_type,target_id FROM moderation_reports WHERE id=$1", [id]);
      if (!target.rowCount) fail(404, "Signalement introuvable.");
      if (target.rows[0].target_type === "listing") {
        await pool.query("UPDATE listings SET status='suspended' WHERE id=$1 AND status IN ('published','reserved')", [target.rows[0].target_id]);
      } else if (target.rows[0].target_type === "profile") {
        if (user.role !== "admin") fail(403, "Seul un administrateur peut suspendre un compte.");
        if (target.rows[0].target_id === user.profileId) fail(400, "Vous ne pouvez pas suspendre votre propre compte.");
        await pool.query("UPDATE profiles SET status='suspended' WHERE id=$1", [target.rows[0].target_id]);
      } else {
        fail(400, "Cette cible ne peut pas \xEAtre suspendue depuis cette action.");
      }
    }
    const result = await pool.query(
      `UPDATE moderation_reports SET status=$2,reviewer_id=$3,resolution_note=$4,resolved_at=CASE WHEN $2 IN ('resolved','dismissed') THEN now() ELSE NULL END
       WHERE id=$1 RETURNING id,status`,
      [id, status, user.profileId, note]
    );
    if (!result.rowCount) fail(404, "Signalement introuvable.");
    await pool.query("INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,metadata) VALUES ($1,'moderation_report_updated','moderation_report',$2,$3::jsonb)", [user.profileId, id, JSON.stringify({ status })]);
    return json(result.rows[0]);
  }
  fail(404, "Route administration introuvable.");
}
async function sitemap(request) {
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.PUBLIC_SITE_URL || process.env.SITE_URL || requestOrigin;
  const origin = new URL(configuredOrigin).origin;
  const staticPaths = ["/", "/boutique", "/categories", "/selection", "/fonctionnement", "/commissions", "/avis", "/nouveautes", "/vendre-sur-madclothes", "/contact", "/aide", "/conditions", "/confidentialite", "/mentions-legales"];
  const entries = staticPaths.map((path2) => ({ path: path2, updatedAt: null }));
  try {
    const result = await pool.query(
      "SELECT id, updated_at FROM listings WHERE status = 'published' ORDER BY published_at DESC NULLS LAST LIMIT 5000"
    );
    for (const listing of result.rows) entries.push({ path: `/article/${listing.id}`, updatedAt: listing.updated_at });
  } catch (error) {
    console.warn("Sitemap listing URLs unavailable; serving public pages only.", error);
  }
  const xmlEscape = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  const urls = entries.map(({ path: path2, updatedAt }) => {
    const lastmod = updatedAt ? `<lastmod>${new Date(updatedAt).toISOString()}</lastmod>` : "";
    return `<url><loc>${xmlEscape(`${origin}${path2}`)}</loc>${lastmod}</url>`;
  }).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=3600" }
  });
}
function robots(request) {
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.PUBLIC_SITE_URL || process.env.SITE_URL || requestOrigin;
  const origin = new URL(configuredOrigin).origin;
  return new Response(`User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=3600" }
  });
}
function resolveRequestPath(request) {
  const url = new URL(request.url);
  let path2 = url.pathname.replace(/\/$/, "") || "/";
  const internalRoute = url.searchParams.get("__madclothes_route");
  if (internalRoute) {
    url.searchParams.delete("__madclothes_route");
    if (path2 === "/api" || path2 === "/api/index" || path2 === "/") {
      path2 = (internalRoute.startsWith("/") ? internalRoute : `/${internalRoute}`).replace(/\/$/, "") || "/";
    }
  }
  if (path2 === "/api" || path2 === "/api/index") {
    const matchedPath = request.headers.get("x-matched-path");
    if (matchedPath && matchedPath.startsWith("/api/")) {
      path2 = matchedPath.split("?")[0].replace(/\/$/, "") || "/";
    }
  }
  let requestForRouting = request;
  if (internalRoute) {
    try {
      requestForRouting = new Request(url.toString(), request);
    } catch {
      requestForRouting = request;
    }
  }
  return { path: path2, requestForRouting };
}
async function handleApi(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Methods": allowedMethods, "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "600" } });
  const { path: path2, requestForRouting: req } = resolveRequestPath(request);
  if (path2 === "/api/robots" && req.method === "GET") return robots(req);
  if (path2 === "/api/sitemap" && req.method === "GET") return await sitemap(req);
  if (!process.env.DATABASE_URL) return json({ error: "DATABASE_URL n'est pas configur\xE9e." }, 503);
  try {
    if (path2 === "/api/health" && req.method === "GET") {
      await pool.query("SELECT 1");
      return json({ status: "ok", database: "connected" });
    }
    if (path2 === "/api/commissions" && req.method === "GET") {
      const result = await pool.query("SELECT value FROM platform_settings WHERE key='commission_rates'");
      const value = result.rows[0]?.value || {};
      return json({ configured: Boolean(value.configured), sellerBps: Number(value.seller_bps || 0) });
    }
    if (path2 === "/api/reviews" && req.method === "GET") {
      const result = await pool.query(
        `SELECT r.rating,r.comment,p.display_name AS "displayName",p.city,r.created_at AS "createdAt"
         FROM reviews r JOIN profiles p ON p.id=r.reviewer_id
         WHERE r.comment IS NOT NULL AND length(trim(r.comment)) > 0
         ORDER BY r.created_at DESC LIMIT 12`
      );
      return json(result.rows);
    }
    if (path2 === "/api/profile") return await profile(req, req.method);
    if (path2 === "/api/listings" || path2.startsWith("/api/listings/") || path2 === "/api/categories" || path2 === "/api/seller/listings") return await listings(req, req.method, path2);
    if (path2 === "/api/uploads/presign" || path2 === "/api/uploads/confirm") return await uploads(req, req.method, path2);
    if (path2 === "/api/favorites" || path2.startsWith("/api/favorites/")) return await favorites(req, req.method, path2);
    if (path2 === "/api/orders" || path2.startsWith("/api/orders/")) return await orders(req, req.method, path2);
    if (path2 === "/api/conversations" || path2.startsWith("/api/conversations/")) return await messaging(req, req.method, path2);
    if (path2 === "/api/push-subscriptions") return await pushSubscriptions(req, req.method);
    if (path2 === "/api/notifications" || path2.startsWith("/api/notifications/")) return await notifications(req, req.method, path2);
    if (path2.startsWith("/api/admin/")) return await admin(req, req.method, path2);
    if (path2 === "/api/reports" && req.method === "POST") {
      const user = await authenticated(req);
      const input = await body(req);
      const type = String(input.targetType || "");
      if (!["listing", "message", "review", "profile"].includes(type)) fail(400, "Type de signalement invalide.");
      const targetId = text(input.targetId, "La cible", 1, 80);
      const reason = text(input.reason, "Le motif", 3, 1e3);
      await pool.query("INSERT INTO moderation_reports (reporter_id,target_type,target_id,reason) VALUES ($1,$2,$3,$4)", [user.profileId, type, targetId, reason]);
      return json({ reported: true }, 201);
    }
    return json({ error: "Route introuvable." }, 404);
  } catch (error) {
    const apiError = error;
    if (apiError.status) return json({ error: apiError.message }, apiError.status);
    if (error.code === "23505") return json({ error: "Cet \xE9l\xE9ment existe d\xE9j\xE0 ou n'est plus disponible." }, 409);
    if (error.code === "23503") return json({ error: "La r\xE9f\xE9rence demand\xE9e n'existe pas." }, 400);
    const reference = randomUUID();
    const code = typeof error?.code === "string" ? error.code : "INTERNAL";
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error("Madclothes API error", { reference, method: req.method, path: path2, code, errorName, error });
    return json({ error: `Le serveur n\u2019a pas pu terminer l\u2019op\xE9ration. R\xE9f\xE9rence de diagnostic : ${reference}`, reference }, 500);
  }
}
var MAX_JSON_BYTES, MAX_IMAGE_BYTES, ALLOWED_IMAGE_TYPES, allowedMethods, jwks;
var init_api = __esm({
  "server/api.ts"() {
    init_database();
    init_r2();
    init_push();
    MAX_JSON_BYTES = 64e3;
    MAX_IMAGE_BYTES = 15 * 1024 * 1024;
    ALLOWED_IMAGE_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
    allowedMethods = "GET, POST, PATCH, DELETE, OPTIONS";
  }
});

// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/Le%20MADISON/OneDrive/Desktop/Le%20Madison%20777/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Le%20MADISON/OneDrive/Desktop/Le%20Madison%20777/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/Le%20MADISON/OneDrive/Desktop/Le%20Madison%20777/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///C:/Users/Le%20MADISON/OneDrive/Desktop/Le%20Madison%20777/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Le MADISON\\OneDrive\\Desktop\\Le Madison 777";
function localApi(handler) {
  return {
    name: "madclothes-local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestPath = req.url?.split("?", 1)[0];
        if (!req.url?.startsWith("/api/") && requestPath !== "/sitemap.xml" && requestPath !== "/robots.txt") return next();
        try {
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (["host", "connection", "content-length", "transfer-encoding"].includes(key)) continue;
            if (Array.isArray(value)) headers.set(key, value.join(", "));
            else if (value) headers.set(key, value);
          }
          let rawBody;
          if (req.method !== "GET" && req.method !== "HEAD") {
            const chunks = [];
            for await (const chunk of req) chunks.push(Buffer.from(chunk));
            rawBody = Buffer.concat(chunks);
          }
          const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
          if (requestUrl.pathname === "/sitemap.xml") requestUrl.pathname = "/api/sitemap";
          if (requestUrl.pathname === "/robots.txt") requestUrl.pathname = "/api/robots";
          const request = new Request(requestUrl, {
            method: req.method,
            headers,
            body: rawBody
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          next(error);
        }
      });
    }
  };
}
var vite_config_default = defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const key of ["DATABASE_URL", "NEON_AUTH_JWKS_URL", "ADMIN_EMAIL_ALLOWLIST", "R2_ACCOUNT_ID", "CLOUDFLARE_ACCOUNT_ID", "R2_BUCKET_NAME", "R2_S3_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_PUBLIC_BASE_URL", "R2_PUBLIC_URL", "PUBLIC_SITE_URL", "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"]) {
    if (env[key] && !process.env[key]) process.env[key] = env[key];
  }
  const { handleApi: handleApi2 } = await Promise.resolve().then(() => (init_api(), api_exports));
  return {
    // Keep one known local origin so auth redirects, R2 CORS, and browser
    // caches all use the same address instead of Vite silently picking 8083+.
    server: { host: true, port: 8082, strictPort: true, hmr: { overlay: false } },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      localApi(handleApi2),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["brand/madclothes-logo.jpg", "icons/apple-touch-icon.png"],
        manifest: {
          name: "Madclothes \u2014 Mode d'occasion",
          short_name: "Madclothes",
          description: "Achetez et vendez des v\xEAtements d'occasion au Congo.",
          lang: "fr-CG",
          start_url: "/",
          scope: "/",
          display: "standalone",
          background_color: "#101b2b",
          theme_color: "#e60072",
          orientation: "portrait-primary",
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
          ]
        },
        workbox: {
          importScripts: ["/push-handler.js"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
              handler: "NetworkOnly"
            },
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\//,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "madclothes-category-art", expiration: { maxEntries: 30, maxAgeSeconds: 7 * 24 * 60 * 60 } }
            }
          ]
        },
        devOptions: { enabled: false }
      })
    ].filter(Boolean),
    resolve: { alias: { "@": path.resolve(__vite_injected_original_dirname, "./src") } }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2VydmVyL2RhdGFiYXNlLnRzIiwgInNlcnZlci9yMi50cyIsICJzZXJ2ZXIvcHVzaC50cyIsICJzZXJ2ZXIvYXBpLnRzIiwgInZpdGUuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTGUgTUFESVNPTlxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXExlIE1hZGlzb24gNzc3XFxcXHNlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTGUgTUFESVNPTlxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXExlIE1hZGlzb24gNzc3XFxcXHNlcnZlclxcXFxkYXRhYmFzZS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTGUlMjBNQURJU09OL09uZURyaXZlL0Rlc2t0b3AvTGUlMjBNYWRpc29uJTIwNzc3L3NlcnZlci9kYXRhYmFzZS50c1wiO2ltcG9ydCB7IGF0dGFjaERhdGFiYXNlUG9vbCB9IGZyb20gXCJAdmVyY2VsL2Z1bmN0aW9uc1wiO1xuaW1wb3J0IHsgUG9vbCB9IGZyb20gXCJwZ1wiO1xuXG5jb25zdCBnbG9iYWxGb3JQb29sID0gZ2xvYmFsVGhpcyBhcyB0eXBlb2YgZ2xvYmFsVGhpcyAmIHsgbWFkY2xvdGhlc1Bvb2w/OiBQb29sIH07XG5cbmV4cG9ydCBjb25zdCBwb29sID0gZ2xvYmFsRm9yUG9vbC5tYWRjbG90aGVzUG9vbCA/PyBuZXcgUG9vbCh7XG4gIGNvbm5lY3Rpb25TdHJpbmc6IHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTCxcbiAgbWF4OiA1LFxuICBpZGxlVGltZW91dE1pbGxpczogNV8wMDAsXG4gIGNvbm5lY3Rpb25UaW1lb3V0TWlsbGlzOiAxMF8wMDAsXG4gIHNzbDogeyByZWplY3RVbmF1dGhvcml6ZWQ6IHRydWUgfSxcbn0pO1xuXG5pZiAoIWdsb2JhbEZvclBvb2wubWFkY2xvdGhlc1Bvb2wpIHtcbiAgZ2xvYmFsRm9yUG9vbC5tYWRjbG90aGVzUG9vbCA9IHBvb2w7XG4gIGF0dGFjaERhdGFiYXNlUG9vbChwb29sKTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTGUgTUFESVNPTlxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXExlIE1hZGlzb24gNzc3XFxcXHNlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTGUgTUFESVNPTlxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXExlIE1hZGlzb24gNzc3XFxcXHNlcnZlclxcXFxyMi50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTGUlMjBNQURJU09OL09uZURyaXZlL0Rlc2t0b3AvTGUlMjBNYWRpc29uJTIwNzc3L3NlcnZlci9yMi50c1wiO2ltcG9ydCB7IFMzQ2xpZW50IH0gZnJvbSBcIkBhd3Mtc2RrL2NsaWVudC1zM1wiO1xuXG5jbGFzcyBSMkNvbmZpZ3VyYXRpb25FcnJvciBleHRlbmRzIEVycm9yIHtcbiAgc3RhdHVzID0gNTAzO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiTGUgc3RvY2thZ2UgQ2xvdWRmbGFyZSBSMiBuJ2VzdCBwYXMgY29uZmlndXJcdTAwRTkgY1x1MDBGNHRcdTAwRTkgc2VydmV1ci5cIik7XG4gICAgdGhpcy5uYW1lID0gXCJSMkNvbmZpZ3VyYXRpb25FcnJvclwiO1xuICB9XG59XG5cbmxldCBjbGllbnQ6IFMzQ2xpZW50IHwgdW5kZWZpbmVkO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UjJCdWNrZXQoKTogc3RyaW5nIHtcbiAgY29uc3QgYnVja2V0ID0gcHJvY2Vzcy5lbnYuUjJfQlVDS0VUX05BTUU7XG4gIGlmICghYnVja2V0KSB0aHJvdyBuZXcgUjJDb25maWd1cmF0aW9uRXJyb3IoKTtcbiAgcmV0dXJuIGJ1Y2tldDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFIyQ2xpZW50KCk6IFMzQ2xpZW50IHtcbiAgaWYgKGNsaWVudCkgcmV0dXJuIGNsaWVudDtcblxuICBjb25zdCBhY2NvdW50SWQgPSBwcm9jZXNzLmVudi5SMl9BQ0NPVU5UX0lEIHx8IHByb2Nlc3MuZW52LkNMT1VERkxBUkVfQUNDT1VOVF9JRDtcbiAgY29uc3QgYWNjZXNzS2V5SWQgPSBwcm9jZXNzLmVudi5SMl9BQ0NFU1NfS0VZX0lEO1xuICBjb25zdCBzZWNyZXRBY2Nlc3NLZXkgPSBwcm9jZXNzLmVudi5SMl9TRUNSRVRfQUNDRVNTX0tFWTtcbiAgaWYgKCFhY2NvdW50SWQgfHwgIWFjY2Vzc0tleUlkIHx8ICFzZWNyZXRBY2Nlc3NLZXkgfHwgIXByb2Nlc3MuZW52LlIyX0JVQ0tFVF9OQU1FKSB7XG4gICAgdGhyb3cgbmV3IFIyQ29uZmlndXJhdGlvbkVycm9yKCk7XG4gIH1cblxuICBjbGllbnQgPSBuZXcgUzNDbGllbnQoe1xuICAgIHJlZ2lvbjogXCJhdXRvXCIsXG4gICAgZW5kcG9pbnQ6IHByb2Nlc3MuZW52LlIyX1MzX0VORFBPSU5UIHx8IGBodHRwczovLyR7YWNjb3VudElkfS5yMi5jbG91ZGZsYXJlc3RvcmFnZS5jb21gLFxuICAgIGNyZWRlbnRpYWxzOiB7IGFjY2Vzc0tleUlkLCBzZWNyZXRBY2Nlc3NLZXkgfSxcbiAgfSk7XG4gIHJldHVybiBjbGllbnQ7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXExlIE1BRElTT05cXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxMZSBNYWRpc29uIDc3N1xcXFxzZXJ2ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXExlIE1BRElTT05cXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxMZSBNYWRpc29uIDc3N1xcXFxzZXJ2ZXJcXFxccHVzaC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTGUlMjBNQURJU09OL09uZURyaXZlL0Rlc2t0b3AvTGUlMjBNYWRpc29uJTIwNzc3L3NlcnZlci9wdXNoLnRzXCI7aW1wb3J0IHdlYnB1c2ggZnJvbSBcIndlYi1wdXNoXCI7XHJcbmltcG9ydCB7IHBvb2wgfSBmcm9tIFwiLi9kYXRhYmFzZS5qc1wiO1xyXG5cclxudHlwZSBQdXNoU3Vic2NyaXB0aW9uSW5wdXQgPSB7XHJcbiAgZW5kcG9pbnQ6IHN0cmluZztcclxuICBrZXlzOiB7XHJcbiAgICBwMjU2ZGg6IHN0cmluZztcclxuICAgIGF1dGg6IHN0cmluZztcclxuICB9O1xyXG59O1xyXG5cclxudHlwZSBTdG9yZWRQdXNoU3Vic2NyaXB0aW9uID0ge1xyXG4gIGVuZHBvaW50OiBzdHJpbmc7XHJcbiAgcDI1NmRoOiBzdHJpbmc7XHJcbiAgYXV0aDogc3RyaW5nO1xyXG59O1xyXG5cclxudHlwZSBQdXNoRXJyb3IgPSBFcnJvciAmIHtcclxuICBzdGF0dXM/OiBudW1iZXI7XHJcbiAgc3RhdHVzQ29kZT86IG51bWJlcjtcclxufTtcclxuXHJcbmNvbnN0IE1BWF9TVUJTQ1JJUFRJT05TX1BFUl9QUk9GSUxFID0gMTA7XHJcbmNvbnN0IE1BWF9FTkRQT0lOVF9MRU5HVEggPSAyMDQ4O1xyXG5cclxuY29uc3QgQUxMT1dFRF9QVVNIX0hPU1RTID0gbmV3IFNldChbXHJcbiAgXCJmY20uZ29vZ2xlYXBpcy5jb21cIixcclxuICBcInVwZGF0ZXMucHVzaC5zZXJ2aWNlcy5tb3ppbGxhLmNvbVwiLFxyXG4gIFwid2ViLnB1c2guYXBwbGUuY29tXCIsXHJcbl0pO1xyXG5cclxuZnVuY3Rpb24gdmFsaWRhdGlvbkVycm9yKG1lc3NhZ2U6IHN0cmluZyk6IFB1c2hFcnJvciB7XHJcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24obmV3IEVycm9yKG1lc3NhZ2UpLCB7IHN0YXR1czogNDAwIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0FsbG93ZWRQdXNoSG9zdChob3N0bmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIEFMTE9XRURfUFVTSF9IT1NUUy5oYXMoaG9zdG5hbWUudG9Mb3dlckNhc2UoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHZhbGlkYXRlRW5kcG9pbnQodmFsdWU6IHVua25vd24pOiBzdHJpbmcge1xyXG4gIGlmIChcclxuICAgIHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIiB8fFxyXG4gICAgdmFsdWUubGVuZ3RoID09PSAwIHx8XHJcbiAgICB2YWx1ZS5sZW5ndGggPiBNQVhfRU5EUE9JTlRfTEVOR1RIXHJcbiAgKSB7XHJcbiAgICB0aHJvdyB2YWxpZGF0aW9uRXJyb3IoXCJFbmRwb2ludCBQdXNoIGludmFsaWRlLlwiKTtcclxuICB9XHJcblxyXG4gIGxldCB1cmw6IFVSTDtcclxuXHJcbiAgdHJ5IHtcclxuICAgIHVybCA9IG5ldyBVUkwodmFsdWUpO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgdGhyb3cgdmFsaWRhdGlvbkVycm9yKFwiRW5kcG9pbnQgUHVzaCBpbnZhbGlkZS5cIik7XHJcbiAgfVxyXG5cclxuICBjb25zdCBob3N0bmFtZSA9IHVybC5ob3N0bmFtZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICBpZiAoXHJcbiAgICB1cmwucHJvdG9jb2wgIT09IFwiaHR0cHM6XCIgfHxcclxuICAgIHVybC51c2VybmFtZSAhPT0gXCJcIiB8fFxyXG4gICAgdXJsLnBhc3N3b3JkICE9PSBcIlwiIHx8XHJcbiAgICB1cmwucG9ydCAhPT0gXCJcIiB8fFxyXG4gICAgIWhvc3RuYW1lIHx8XHJcbiAgICAhaXNBbGxvd2VkUHVzaEhvc3QoaG9zdG5hbWUpIHx8XHJcbiAgICB1cmwuaGFzaCAhPT0gXCJcIlxyXG4gICkge1xyXG4gICAgdGhyb3cgdmFsaWRhdGlvbkVycm9yKFwiRm91cm5pc3NldXIgUHVzaCBub24gYXV0b3Jpc1x1MDBFOS5cIik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdXJsLnRvU3RyaW5nKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHZhbGlkYXRlQmFzZTY0VXJsKFxyXG4gIHZhbHVlOiB1bmtub3duLFxyXG4gIGV4cGVjdGVkTGVuZ3RoOiBudW1iZXIsXHJcbiAgbGFiZWw6IHN0cmluZyxcclxuKTogc3RyaW5nIHtcclxuICBpZiAoXHJcbiAgICB0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIgfHxcclxuICAgIHZhbHVlLmxlbmd0aCA8IDEgfHxcclxuICAgIHZhbHVlLmxlbmd0aCA+IDEyOCB8fFxyXG4gICAgIS9eW0EtWmEtejAtOV8tXSskLy50ZXN0KHZhbHVlKVxyXG4gICkge1xyXG4gICAgdGhyb3cgdmFsaWRhdGlvbkVycm9yKGAke2xhYmVsfSBpbnZhbGlkZS5gKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGRlY29kZWQgPSBCdWZmZXIuZnJvbSh2YWx1ZSwgXCJiYXNlNjR1cmxcIik7XHJcblxyXG4gIGlmIChcclxuICAgIGRlY29kZWQubGVuZ3RoICE9PSBleHBlY3RlZExlbmd0aCB8fFxyXG4gICAgZGVjb2RlZC50b1N0cmluZyhcImJhc2U2NHVybFwiKSAhPT0gdmFsdWVcclxuICApIHtcclxuICAgIHRocm93IHZhbGlkYXRpb25FcnJvcihgJHtsYWJlbH0gaW52YWxpZGUuYCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdmFsdWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVB1c2hTdWJzY3JpcHRpb24oXHJcbiAgaW5wdXQ6IHVua25vd24sXHJcbik6IFB1c2hTdWJzY3JpcHRpb25JbnB1dCB7XHJcbiAgaWYgKFxyXG4gICAgdHlwZW9mIGlucHV0ICE9PSBcIm9iamVjdFwiIHx8XHJcbiAgICBpbnB1dCA9PT0gbnVsbCB8fFxyXG4gICAgQXJyYXkuaXNBcnJheShpbnB1dClcclxuICApIHtcclxuICAgIHRocm93IHZhbGlkYXRpb25FcnJvcihcIkFib25uZW1lbnQgUHVzaCBpbnZhbGlkZS5cIik7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdWJzY3JpcHRpb24gPSBpbnB1dCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuXHJcbiAgaWYgKFxyXG4gICAgdHlwZW9mIHN1YnNjcmlwdGlvbi5rZXlzICE9PSBcIm9iamVjdFwiIHx8XHJcbiAgICBzdWJzY3JpcHRpb24ua2V5cyA9PT0gbnVsbCB8fFxyXG4gICAgQXJyYXkuaXNBcnJheShzdWJzY3JpcHRpb24ua2V5cylcclxuICApIHtcclxuICAgIHRocm93IHZhbGlkYXRpb25FcnJvcihcIkNsXHUwMEU5cyBQdXNoIGludmFsaWRlcy5cIik7XHJcbiAgfVxyXG5cclxuICBjb25zdCBrZXlzID0gc3Vic2NyaXB0aW9uLmtleXMgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBlbmRwb2ludDogdmFsaWRhdGVFbmRwb2ludChzdWJzY3JpcHRpb24uZW5kcG9pbnQpLFxyXG4gICAga2V5czoge1xyXG4gICAgICBwMjU2ZGg6IHZhbGlkYXRlQmFzZTY0VXJsKFxyXG4gICAgICAgIGtleXMucDI1NmRoLFxyXG4gICAgICAgIDY1LFxyXG4gICAgICAgIFwiQ2xcdTAwRTkgcHVibGlxdWUgUHVzaFwiLFxyXG4gICAgICApLFxyXG4gICAgICBhdXRoOiB2YWxpZGF0ZUJhc2U2NFVybChcclxuICAgICAgICBrZXlzLmF1dGgsXHJcbiAgICAgICAgMTYsXHJcbiAgICAgICAgXCJDbFx1MDBFOSBkJ2F1dGhlbnRpZmljYXRpb24gUHVzaFwiLFxyXG4gICAgICApLFxyXG4gICAgfSxcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZVB1c2hTdWJzY3JpcHRpb24oXHJcbiAgcHJvZmlsZUlkOiBzdHJpbmcsXHJcbiAgaW5wdXQ6IHVua25vd24sXHJcbik6IFByb21pc2U8dm9pZD4ge1xyXG4gIC8vIExhIHZhbGlkYXRpb24gaW50ZXJ2aWVudCBhdmFudCB0b3V0ZSBjb25uZXhpb24gXHUwMEUwIFBvc3RncmVTUUwuXHJcbiAgY29uc3Qgc3Vic2NyaXB0aW9uID0gdmFsaWRhdGVQdXNoU3Vic2NyaXB0aW9uKGlucHV0KTtcclxuXHJcbiAgY29uc3QgY2xpZW50ID0gYXdhaXQgcG9vbC5jb25uZWN0KCk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBjbGllbnQucXVlcnkoXCJCRUdJTlwiKTtcclxuXHJcbiAgICAvLyBWZXJyb3UgdHJhbnNhY3Rpb25uZWwgOiBcdTAwRTl2aXRlIGRlIGRcdTAwRTlwYXNzZXIgbGEgbGltaXRlXHJcbiAgICAvLyBlbiBjYXMgZGUgcGx1c2lldXJzIGluc2NyaXB0aW9ucyBzaW11bHRhblx1MDBFOWVzLlxyXG4gICAgYXdhaXQgY2xpZW50LnF1ZXJ5KFxyXG4gICAgICBcIlNFTEVDVCBwZ19hZHZpc29yeV94YWN0X2xvY2soaGFzaHRleHQoJDEpKVwiLFxyXG4gICAgICBbcHJvZmlsZUlkXSxcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCBjbGllbnQucXVlcnkoXHJcbiAgICAgIGBTRUxFQ1QgMVxyXG4gICAgICAgRlJPTSBwdXNoX3N1YnNjcmlwdGlvbnNcclxuICAgICAgIFdIRVJFIHByb2ZpbGVfaWQgPSAkMVxyXG4gICAgICAgICBBTkQgZW5kcG9pbnQgPSAkMlxyXG4gICAgICAgTElNSVQgMWAsXHJcbiAgICAgIFtwcm9maWxlSWQsIHN1YnNjcmlwdGlvbi5lbmRwb2ludF0sXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGNvdW50UmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5KFxyXG4gICAgICBgU0VMRUNUIENPVU5UKCopOjppbnQgQVMgY291bnRcclxuICAgICAgIEZST00gcHVzaF9zdWJzY3JpcHRpb25zXHJcbiAgICAgICBXSEVSRSBwcm9maWxlX2lkID0gJDFgLFxyXG4gICAgICBbcHJvZmlsZUlkXSxcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgY291bnQgPSBOdW1iZXIoY291bnRSZXN1bHQucm93c1swXT8uY291bnQgPz8gMCk7XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICBjb3VudCA+PSBNQVhfU1VCU0NSSVBUSU9OU19QRVJfUFJPRklMRSAmJlxyXG4gICAgICBleGlzdGluZy5yb3dzLmxlbmd0aCA9PT0gMFxyXG4gICAgKSB7XHJcbiAgICAgIHRocm93IE9iamVjdC5hc3NpZ24oXHJcbiAgICAgICAgbmV3IEVycm9yKFwiVm91cyBhdmV6IGF0dGVpbnQgbGEgbGltaXRlIGRlIDEwIGFwcGFyZWlscy5cIiksXHJcbiAgICAgICAgeyBzdGF0dXM6IDQwOSB9LFxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGF3YWl0IGNsaWVudC5xdWVyeShcclxuICAgICAgYElOU0VSVCBJTlRPIHB1c2hfc3Vic2NyaXB0aW9uc1xyXG4gICAgICAgIChwcm9maWxlX2lkLCBlbmRwb2ludCwgcDI1NmRoLCBhdXRoKVxyXG4gICAgICAgVkFMVUVTICgkMSwgJDIsICQzLCAkNClcclxuICAgICAgIE9OIENPTkZMSUNUIChwcm9maWxlX2lkLCBlbmRwb2ludClcclxuICAgICAgIERPIFVQREFURSBTRVRcclxuICAgICAgICAgcDI1NmRoID0gRVhDTFVERUQucDI1NmRoLFxyXG4gICAgICAgICBhdXRoID0gRVhDTFVERUQuYXV0aCxcclxuICAgICAgICAgdXBkYXRlZF9hdCA9IG5vdygpYCxcclxuICAgICAgW1xyXG4gICAgICAgIHByb2ZpbGVJZCxcclxuICAgICAgICBzdWJzY3JpcHRpb24uZW5kcG9pbnQsXHJcbiAgICAgICAgc3Vic2NyaXB0aW9uLmtleXMucDI1NmRoLFxyXG4gICAgICAgIHN1YnNjcmlwdGlvbi5rZXlzLmF1dGgsXHJcbiAgICAgIF0sXHJcbiAgICApO1xyXG5cclxuICAgIGF3YWl0IGNsaWVudC5xdWVyeShcIkNPTU1JVFwiKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgYXdhaXQgY2xpZW50LnF1ZXJ5KFwiUk9MTEJBQ0tcIikuY2F0Y2goKCkgPT4gdW5kZWZpbmVkKTtcclxuICAgIHRocm93IGVycm9yO1xyXG4gIH0gZmluYWxseSB7XHJcbiAgICBjbGllbnQucmVsZWFzZSgpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlbGV0ZVB1c2hTdWJzY3JpcHRpb24oXHJcbiAgcHJvZmlsZUlkOiBzdHJpbmcsXHJcbiAgZW5kcG9pbnRWYWx1ZTogdW5rbm93bixcclxuKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgZW5kcG9pbnQgPSB2YWxpZGF0ZUVuZHBvaW50KGVuZHBvaW50VmFsdWUpO1xyXG5cclxuICBhd2FpdCBwb29sLnF1ZXJ5KFxyXG4gICAgYERFTEVURSBGUk9NIHB1c2hfc3Vic2NyaXB0aW9uc1xyXG4gICAgIFdIRVJFIHByb2ZpbGVfaWQgPSAkMVxyXG4gICAgICAgQU5EIGVuZHBvaW50ID0gJDJgLFxyXG4gICAgW3Byb2ZpbGVJZCwgZW5kcG9pbnRdLFxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZW5kUHVzaFRvUHJvZmlsZShcclxuICBwcm9maWxlSWQ6IHN0cmluZyxcclxuICBwYXlsb2FkOiB1bmtub3duLFxyXG4pOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBwdWJsaWNLZXkgPSBwcm9jZXNzLmVudi5WQVBJRF9QVUJMSUNfS0VZO1xyXG4gIGNvbnN0IHByaXZhdGVLZXkgPSBwcm9jZXNzLmVudi5WQVBJRF9QUklWQVRFX0tFWTtcclxuICBjb25zdCBzdWJqZWN0ID0gcHJvY2Vzcy5lbnYuVkFQSURfU1VCSkVDVDtcclxuXHJcbiAgLy8gU2FucyBjb25maWd1cmF0aW9uIFZBUElELCBsZSBQdXNoIHJlc3RlIGRcdTAwRTlzYWN0aXZcdTAwRTkuXHJcbiAgaWYgKCFwdWJsaWNLZXkgfHwgIXByaXZhdGVLZXkgfHwgIXN1YmplY3QpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBzZXJpYWxpemVkUGF5bG9hZCA9IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpO1xyXG5cclxuICAgIGlmICghc2VyaWFsaXplZFBheWxvYWQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHdlYnB1c2guc2V0VmFwaWREZXRhaWxzKFxyXG4gICAgICBzdWJqZWN0LFxyXG4gICAgICBwdWJsaWNLZXksXHJcbiAgICAgIHByaXZhdGVLZXksXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBvb2wucXVlcnk8U3RvcmVkUHVzaFN1YnNjcmlwdGlvbj4oXHJcbiAgICAgIGBTRUxFQ1QgZW5kcG9pbnQsIHAyNTZkaCwgYXV0aFxyXG4gICAgICAgRlJPTSBwdXNoX3N1YnNjcmlwdGlvbnNcclxuICAgICAgIFdIRVJFIHByb2ZpbGVfaWQgPSAkMWAsXHJcbiAgICAgIFtwcm9maWxlSWRdLFxyXG4gICAgKTtcclxuXHJcbiAgICBhd2FpdCBQcm9taXNlLmFsbChcclxuICAgICAgcmVzdWx0LnJvd3MubWFwKGFzeW5jIChzdWJzY3JpcHRpb24pID0+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgYXdhaXQgd2VicHVzaC5zZW5kTm90aWZpY2F0aW9uKFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgZW5kcG9pbnQ6IHN1YnNjcmlwdGlvbi5lbmRwb2ludCxcclxuICAgICAgICAgICAgICBrZXlzOiB7XHJcbiAgICAgICAgICAgICAgICBwMjU2ZGg6IHN1YnNjcmlwdGlvbi5wMjU2ZGgsXHJcbiAgICAgICAgICAgICAgICBhdXRoOiBzdWJzY3JpcHRpb24uYXV0aCxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXJpYWxpemVkUGF5bG9hZCxcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgIGNvbnN0IHN0YXR1c0NvZGUgPSAoXHJcbiAgICAgICAgICAgIGVycm9yIGFzIFB1c2hFcnJvclxyXG4gICAgICAgICAgKT8uc3RhdHVzQ29kZTtcclxuXHJcbiAgICAgICAgICAvLyA0MDQgZXQgNDEwIGluZGlxdWVudCB1biBhYm9ubmVtZW50IHF1aSBuJ2VzdFxyXG4gICAgICAgICAgLy8gcGx1cyB1dGlsaXNhYmxlLiBPbiBsZSBzdXBwcmltZS5cclxuICAgICAgICAgIGlmIChzdGF0dXNDb2RlID09PSA0MDQgfHwgc3RhdHVzQ29kZSA9PT0gNDEwKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgYXdhaXQgcG9vbC5xdWVyeShcclxuICAgICAgICAgICAgICAgIGBERUxFVEUgRlJPTSBwdXNoX3N1YnNjcmlwdGlvbnNcclxuICAgICAgICAgICAgICAgICBXSEVSRSBwcm9maWxlX2lkID0gJDFcclxuICAgICAgICAgICAgICAgICAgIEFORCBlbmRwb2ludCA9ICQyYCxcclxuICAgICAgICAgICAgICAgIFtwcm9maWxlSWQsIHN1YnNjcmlwdGlvbi5lbmRwb2ludF0sXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgICAgLy8gTmUgcGFzIGpvdXJuYWxpc2VyIGxlcyBlbmRwb2ludHMgb3UgbGVzIGNsXHUwMEU5cy5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIExlcyBhdXRyZXMgZXJyZXVycyBuZSBzdXBwcmltZW50IHBhcyBsJ2Fib25uZW1lbnQuXHJcbiAgICAgICAgfVxyXG4gICAgICB9KSxcclxuICAgICk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICAvLyBVbmUgZXJyZXVyIFB1c2ggbmUgZG9pdCBqYW1haXMgaW50ZXJyb21wcmVcclxuICAgIC8vIGxlIGZvbmN0aW9ubmVtZW50IHByaW5jaXBhbCBkZSBNYWRjbG90aGVzLlxyXG4gIH1cclxufSIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTGUgTUFESVNPTlxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXExlIE1hZGlzb24gNzc3XFxcXHNlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTGUgTUFESVNPTlxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXExlIE1hZGlzb24gNzc3XFxcXHNlcnZlclxcXFxhcGkudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0xlJTIwTUFESVNPTi9PbmVEcml2ZS9EZXNrdG9wL0xlJTIwTWFkaXNvbiUyMDc3Ny9zZXJ2ZXIvYXBpLnRzXCI7aW1wb3J0IHsgcmFuZG9tVVVJRCB9IGZyb20gXCJub2RlOmNyeXB0b1wiO1xyXG5cclxuaW1wb3J0IHsgR2V0T2JqZWN0Q29tbWFuZCwgSGVhZE9iamVjdENvbW1hbmQsIFB1dE9iamVjdENvbW1hbmQgfSBmcm9tIFwiQGF3cy1zZGsvY2xpZW50LXMzXCI7XHJcbmltcG9ydCB7IGdldFNpZ25lZFVybCB9IGZyb20gXCJAYXdzLXNkay9zMy1yZXF1ZXN0LXByZXNpZ25lclwiO1xyXG5pbXBvcnQgeyBjcmVhdGVSZW1vdGVKV0tTZXQsIGp3dFZlcmlmeSwgdHlwZSBKV1RQYXlsb2FkIH0gZnJvbSBcImpvc2VcIjtcclxuaW1wb3J0IHsgcG9vbCB9IGZyb20gXCIuL2RhdGFiYXNlLmpzXCI7XHJcbmltcG9ydCB7IGdldFIyQnVja2V0LCBnZXRSMkNsaWVudCB9IGZyb20gXCIuL3IyLmpzXCI7XHJcbmltcG9ydCB7XHJcbiAgc2F2ZVB1c2hTdWJzY3JpcHRpb24sIGRlbGV0ZVB1c2hTdWJzY3JpcHRpb24sIHNlbmRQdXNoVG9Qcm9maWxlLCB9IGZyb20gXCIuL3B1c2guanNcIjtcclxuXHJcbmNvbnN0IE1BWF9KU09OX0JZVEVTID0gNjRfMDAwO1xyXG5jb25zdCBNQVhfSU1BR0VfQllURVMgPSAxNSAqIDEwMjQgKiAxMDI0O1xyXG5jb25zdCBBTExPV0VEX0lNQUdFX1RZUEVTID0gbmV3IFNldChbXCJpbWFnZS9qcGVnXCIsIFwiaW1hZ2UvcG5nXCIsIFwiaW1hZ2Uvd2VicFwiLCBcImltYWdlL2F2aWZcIl0pO1xyXG5jb25zdCBhbGxvd2VkTWV0aG9kcyA9IFwiR0VULCBQT1NULCBQQVRDSCwgREVMRVRFLCBPUFRJT05TXCI7XHJcbmxldCBqd2tzOiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVSZW1vdGVKV0tTZXQ+IHwgdW5kZWZpbmVkO1xyXG5cclxudHlwZSBBdXRoID0geyBzdWJqZWN0OiBzdHJpbmc7IGVtYWlsPzogc3RyaW5nOyBwcm9maWxlSWQ6IHN0cmluZzsgcm9sZTogc3RyaW5nIH07XHJcbnR5cGUgQXBpRXJyb3IgPSBFcnJvciAmIHsgc3RhdHVzPzogbnVtYmVyIH07XHJcblxyXG5mdW5jdGlvbiBmYWlsKHN0YXR1czogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcpOiBuZXZlciB7XHJcbiAgY29uc3QgZXJyb3I6IEFwaUVycm9yID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xyXG4gIGVycm9yLnN0YXR1cyA9IHN0YXR1cztcclxuICB0aHJvdyBlcnJvcjtcclxufVxyXG5cclxuZnVuY3Rpb24ganNvbihkYXRhOiB1bmtub3duLCBzdGF0dXMgPSAyMDApIHtcclxuICByZXR1cm4gUmVzcG9uc2UuanNvbihkYXRhLCB7XHJcbiAgICBzdGF0dXMsXHJcbiAgICBoZWFkZXJzOiB7XHJcbiAgICAgIFwiQ2FjaGUtQ29udHJvbFwiOiBcIm5vLXN0b3JlXCIsXHJcbiAgICAgIFwiWC1Db250ZW50LVR5cGUtT3B0aW9uc1wiOiBcIm5vc25pZmZcIixcclxuICAgICAgXCJSZWZlcnJlci1Qb2xpY3lcIjogXCJzdHJpY3Qtb3JpZ2luLXdoZW4tY3Jvc3Mtb3JpZ2luXCIsXHJcbiAgICAgIFwiQ29udGVudC1TZWN1cml0eS1Qb2xpY3lcIjogXCJkZWZhdWx0LXNyYyAnbm9uZSc7IGZyYW1lLWFuY2VzdG9ycyAnbm9uZSdcIixcclxuICAgIH0sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGJvZHk8VCBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+PihyZXF1ZXN0OiBSZXF1ZXN0KTogUHJvbWlzZTxUPiB7XHJcbiAgY29uc3QgbGVuZ3RoID0gTnVtYmVyKHJlcXVlc3QuaGVhZGVycy5nZXQoXCJjb250ZW50LWxlbmd0aFwiKSB8fCAwKTtcclxuICBpZiAobGVuZ3RoID4gTUFYX0pTT05fQllURVMpIGZhaWwoNDEzLCBcIkxhIHJlcXVcdTAwRUF0ZSBlc3QgdHJvcCB2b2x1bWluZXVzZS5cIik7XHJcbiAgdHJ5IHtcclxuICAgIHJldHVybiBhd2FpdCByZXF1ZXN0Lmpzb24oKSBhcyBUO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgZmFpbCg0MDAsIFwiTGUgY29ycHMgSlNPTiBlc3QgaW52YWxpZGUuXCIpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdGV4dCh2YWx1ZTogdW5rbm93biwgbGFiZWw6IHN0cmluZywgbWluOiBudW1iZXIsIG1heDogbnVtYmVyKTogc3RyaW5nIHtcclxuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSBmYWlsKDQwMCwgYCR7bGFiZWx9IGVzdCByZXF1aXMuYCk7XHJcbiAgY29uc3QgY2xlYW4gPSB2YWx1ZS50cmltKCk7XHJcbiAgaWYgKGNsZWFuLmxlbmd0aCA8IG1pbiB8fCBjbGVhbi5sZW5ndGggPiBtYXgpIGZhaWwoNDAwLCBgJHtsYWJlbH0gZG9pdCBjb250ZW5pciBkZSAke21pbn0gXHUwMEUwICR7bWF4fSBjYXJhY3RcdTAwRThyZXMuYCk7XHJcbiAgcmV0dXJuIGNsZWFuO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnRlZ2VyKHZhbHVlOiB1bmtub3duLCBsYWJlbDogc3RyaW5nLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpOiBudW1iZXIge1xyXG4gIGNvbnN0IHBhcnNlZCA9IHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiA/IHZhbHVlIDogTnVtYmVyKHZhbHVlKTtcclxuICBpZiAoIU51bWJlci5pc1NhZmVJbnRlZ2VyKHBhcnNlZCkgfHwgcGFyc2VkIDwgbWluIHx8IHBhcnNlZCA+IG1heCkgZmFpbCg0MDAsIGAke2xhYmVsfSBlc3QgaW52YWxpZGUuYCk7XHJcbiAgcmV0dXJuIHBhcnNlZDtcclxufVxyXG5cclxuZnVuY3Rpb24gYXV0aENvbmZpZygpIHtcclxuICBjb25zdCB1cmwgPSBwcm9jZXNzLmVudi5ORU9OX0FVVEhfSldLU19VUkw7XHJcbiAgaWYgKCF1cmwpIGZhaWwoNTAzLCBcIkwnYXV0aGVudGlmaWNhdGlvbiBOZW9uIG4nZXN0IHBhcyBjb25maWd1clx1MDBFOWUgY1x1MDBGNHRcdTAwRTkgc2VydmV1ci5cIik7XHJcbiAgandrcyA/Pz0gY3JlYXRlUmVtb3RlSldLU2V0KG5ldyBVUkwodXJsKSk7XHJcbiAgcmV0dXJuIGp3a3M7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGF1dGhlbnRpY2F0ZWQocmVxdWVzdDogUmVxdWVzdCk6IFByb21pc2U8QXV0aD4ge1xyXG4gIGNvbnN0IHRva2VuID0gcmVxdWVzdC5oZWFkZXJzLmdldChcImF1dGhvcml6YXRpb25cIik/Lm1hdGNoKC9eQmVhcmVyXFxzKyguKykkL2kpPy5bMV07XHJcbiAgaWYgKCF0b2tlbikgZmFpbCg0MDEsIFwiQ29ubmVjdGV6LXZvdXMgcG91ciBjb250aW51ZXIuXCIpO1xyXG4gIGxldCBwYXlsb2FkOiBKV1RQYXlsb2FkO1xyXG4gIHRyeSB7XHJcbiAgICAoeyBwYXlsb2FkIH0gPSBhd2FpdCBqd3RWZXJpZnkodG9rZW4sIGF1dGhDb25maWcoKSkpO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgZmFpbCg0MDEsIFwiVm90cmUgc2Vzc2lvbiBhIGV4cGlyXHUwMEU5LiBSZWNvbm5lY3Rlei12b3VzLlwiKTtcclxuICB9XHJcbiAgaWYgKHR5cGVvZiBwYXlsb2FkLnN1YiAhPT0gXCJzdHJpbmdcIiB8fCAhcGF5bG9hZC5zdWIpIGZhaWwoNDAxLCBcIkxhIHNlc3Npb24gbmUgY29udGllbnQgcGFzIGQnaWRlbnRpdFx1MDBFOSB2YWxpZGUuXCIpO1xyXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBvb2wucXVlcnkoXHJcbiAgICBcIlNFTEVDVCBpZCwgcm9sZSwgc3RhdHVzIEZST00gcHJvZmlsZXMgV0hFUkUgYXV0aF9zdWJqZWN0ID0gJDFcIixcclxuICAgIFtwYXlsb2FkLnN1Yl0sXHJcbiAgKTtcclxuICBjb25zdCBwcm9maWxlID0gcmVzdWx0LnJvd3NbMF07XHJcbiAgaWYgKCFwcm9maWxlKSBmYWlsKDQwOSwgXCJDb21wbFx1MDBFOXRleiB2b3RyZSBwcm9maWwgcG91ciBjb250aW51ZXIuXCIpO1xyXG4gIGlmIChwcm9maWxlLnN0YXR1cyAhPT0gXCJhY3RpdmVcIikgZmFpbCg0MDMsIFwiQ2UgY29tcHRlIG4nZXN0IHBhcyBhY3RpZi5cIik7XHJcbiAgcmV0dXJuIHsgc3ViamVjdDogcGF5bG9hZC5zdWIsIGVtYWlsOiB0eXBlb2YgcGF5bG9hZC5lbWFpbCA9PT0gXCJzdHJpbmdcIiA/IHBheWxvYWQuZW1haWwgOiB1bmRlZmluZWQsIHByb2ZpbGVJZDogcHJvZmlsZS5pZCwgcm9sZTogcHJvZmlsZS5yb2xlIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0b3JhZ2UoKSB7XHJcbiAgcmV0dXJuIGdldFIyQ2xpZW50KCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGltYWdlVXJsKGtleTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgaWYgKCFrZXkpIHJldHVybiBcIi9pbWFnZXMvcHJvZHVjdC1wbGFjZWhvbGRlci5zdmdcIjtcclxuICBjb25zdCBiYXNlID0gKHByb2Nlc3MuZW52LlIyX1BVQkxJQ19CQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5SMl9QVUJMSUNfVVJMKT8ucmVwbGFjZSgvXFwvJC8sIFwiXCIpO1xyXG4gIGlmIChiYXNlKSByZXR1cm4gYCR7YmFzZX0vJHtrZXl9YDtcclxuICB0cnkge1xyXG4gICAgcmV0dXJuIGF3YWl0IGdldFNpZ25lZFVybChzdG9yYWdlKCksIG5ldyBHZXRPYmplY3RDb21tYW5kKHsgQnVja2V0OiBnZXRSMkJ1Y2tldCgpLCBLZXk6IGtleSB9KSwgeyBleHBpcmVzSW46IDM2MDAgfSk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4gXCIvaW1hZ2VzL3Byb2R1Y3QtcGxhY2Vob2xkZXIuc3ZnXCI7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcm9maWxlKHJlcXVlc3Q6IFJlcXVlc3QsIG1ldGhvZDogc3RyaW5nKSB7XHJcbiAgY29uc3QgdG9rZW4gPSByZXF1ZXN0LmhlYWRlcnMuZ2V0KFwiYXV0aG9yaXphdGlvblwiKT8ubWF0Y2goL15CZWFyZXJcXHMrKC4rKSQvaSk/LlsxXTtcclxuICBpZiAoIXRva2VuKSBmYWlsKDQwMSwgXCJDb25uZWN0ZXotdm91cyBwb3VyIGNvbnRpbnVlci5cIik7XHJcbiAgbGV0IHBheWxvYWQ6IEpXVFBheWxvYWQ7XHJcbiAgdHJ5IHsgKHsgcGF5bG9hZCB9ID0gYXdhaXQgand0VmVyaWZ5KHRva2VuLCBhdXRoQ29uZmlnKCkpKTsgfSBjYXRjaCB7IGZhaWwoNDAxLCBcIlZvdHJlIHNlc3Npb24gYSBleHBpclx1MDBFOS5cIik7IH1cclxuICBpZiAoIXBheWxvYWQuc3ViKSBmYWlsKDQwMSwgXCJJZGVudGl0XHUwMEU5IGludmFsaWRlLlwiKTtcclxuICBpZiAobWV0aG9kID09PSBcIkdFVFwiKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb29sLnF1ZXJ5KFxyXG4gICAgICBcIlNFTEVDVCBpZCwgZGlzcGxheV9uYW1lIEFTIFxcXCJkaXNwbGF5TmFtZVxcXCIsIHVzZXJuYW1lLCBwaG9uZSwgY2l0eSwgYmlvZ3JhcGh5LCBhdmF0YXJfb2JqZWN0X2tleSBBUyBcXFwiYXZhdGFyS2V5XFxcIiwgcm9sZSBGUk9NIHByb2ZpbGVzIFdIRVJFIGF1dGhfc3ViamVjdCA9ICQxXCIsXHJcbiAgICAgIFtwYXlsb2FkLnN1Yl0sXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIHJlc3VsdC5yb3dzWzBdID8ganNvbihyZXN1bHQucm93c1swXSkgOiBqc29uKHsgcHJvZmlsZTogbnVsbCB9LCAyMDApO1xyXG4gIH1cclxuICBpZiAobWV0aG9kICE9PSBcIlBPU1RcIiAmJiBtZXRob2QgIT09IFwiUEFUQ0hcIikgZmFpbCg0MDUsIFwiTVx1MDBFOXRob2RlIG5vbiBhdXRvcmlzXHUwMEU5ZS5cIik7XHJcbiAgY29uc3QgaW5wdXQgPSBhd2FpdCBib2R5PFJlY29yZDxzdHJpbmcsIHVua25vd24+PihyZXF1ZXN0KTtcclxuICBjb25zdCBkaXNwbGF5TmFtZSA9IHRleHQoaW5wdXQuZGlzcGxheU5hbWUsIFwiTGUgbm9tXCIsIDIsIDgwKTtcclxuICBjb25zdCBlbWFpbE5hbWUgPSAodHlwZW9mIHBheWxvYWQuZW1haWwgPT09IFwic3RyaW5nXCIgPyBwYXlsb2FkLmVtYWlsLnNwbGl0KFwiQFwiKVswXSA6IFwibWVtYnJlXCIpLm5vcm1hbGl6ZShcIk5GS0RcIikucmVwbGFjZSgvW15hLXpBLVowLTlfXS9nLCBcIlwiKS5zbGljZSgwLCAzMCkgfHwgXCJtZW1icmVcIjtcclxuICBjb25zdCB1c2VybmFtZSA9IGAke2VtYWlsTmFtZX1fJHtTdHJpbmcocGF5bG9hZC5zdWIpLnNsaWNlKC02KX1gLnNsaWNlKDAsIDQwKTtcclxuICBjb25zdCBhbGxvd2xpc3QgPSAocHJvY2Vzcy5lbnYuQURNSU5fRU1BSUxfQUxMT1dMSVNUIHx8IFwiXCIpLnNwbGl0KFwiLFwiKS5tYXAoKGl0ZW0pID0+IGl0ZW0udHJpbSgpLnRvTG93ZXJDYXNlKCkpLmZpbHRlcihCb29sZWFuKTtcclxuICBjb25zdCByb2xlID0gdHlwZW9mIHBheWxvYWQuZW1haWwgPT09IFwic3RyaW5nXCIgJiYgYWxsb3dsaXN0LmluY2x1ZGVzKHBheWxvYWQuZW1haWwudG9Mb3dlckNhc2UoKSkgPyBcImFkbWluXCIgOiBcIm1lbWJlclwiO1xyXG4gIGlmIChtZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb29sLnF1ZXJ5KFxyXG4gICAgICBgSU5TRVJUIElOVE8gcHJvZmlsZXMgKGF1dGhfc3ViamVjdCwgZGlzcGxheV9uYW1lLCB1c2VybmFtZSwgcm9sZSlcclxuICAgICAgIFZBTFVFUyAoJDEsICQyLCAkMywgJDQpXHJcbiAgICAgICBPTiBDT05GTElDVCAoYXV0aF9zdWJqZWN0KSBETyBVUERBVEUgU0VUIGRpc3BsYXlfbmFtZSA9IEVYQ0xVREVELmRpc3BsYXlfbmFtZVxyXG4gICAgICAgUkVUVVJOSU5HIGlkLCBkaXNwbGF5X25hbWUgQVMgXCJkaXNwbGF5TmFtZVwiLCB1c2VybmFtZSwgcGhvbmUsIGNpdHksIGJpb2dyYXBoeSwgcm9sZWAsXHJcbiAgICAgIFtwYXlsb2FkLnN1YiwgZGlzcGxheU5hbWUsIHVzZXJuYW1lLCByb2xlXSxcclxuICAgICk7XHJcbiAgICByZXR1cm4ganNvbihyZXN1bHQucm93c1swXSwgMjAxKTtcclxuICB9XHJcbiAgY29uc3QgY2l0eSA9IGlucHV0LmNpdHkgPT0gbnVsbCA/IG51bGwgOiB0ZXh0KGlucHV0LmNpdHksIFwiTGEgdmlsbGVcIiwgMiwgODApO1xyXG4gIGNvbnN0IHBob25lID0gaW5wdXQucGhvbmUgPT0gbnVsbCA/IG51bGwgOiB0ZXh0KGlucHV0LnBob25lLCBcIkxlIHRcdTAwRTlsXHUwMEU5cGhvbmVcIiwgNiwgMzApO1xyXG4gIGNvbnN0IGJpb2dyYXBoeSA9IGlucHV0LmJpb2dyYXBoeSA9PSBudWxsID8gbnVsbCA6IHRleHQoaW5wdXQuYmlvZ3JhcGh5LCBcIkxhIGJpb1wiLCAwLCA1MDApO1xyXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBvb2wucXVlcnkoXHJcbiAgICBgVVBEQVRFIHByb2ZpbGVzIFNFVCBkaXNwbGF5X25hbWUgPSAkMiwgY2l0eSA9ICQzLCBwaG9uZSA9ICQ0LCBiaW9ncmFwaHkgPSAkNVxyXG4gICAgIFdIRVJFIGF1dGhfc3ViamVjdCA9ICQxIFJFVFVSTklORyBpZCwgZGlzcGxheV9uYW1lIEFTIFwiZGlzcGxheU5hbWVcIiwgdXNlcm5hbWUsIHBob25lLCBjaXR5LCBiaW9ncmFwaHksIHJvbGVgLFxyXG4gICAgW3BheWxvYWQuc3ViLCBkaXNwbGF5TmFtZSwgY2l0eSwgcGhvbmUsIGJpb2dyYXBoeV0sXHJcbiAgKTtcclxuICBpZiAoIXJlc3VsdC5yb3dDb3VudCkgZmFpbCg0MDQsIFwiUHJvZmlsIGludHJvdXZhYmxlLlwiKTtcclxuICByZXR1cm4ganNvbihyZXN1bHQucm93c1swXSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGxpc3RpbmdzKHJlcXVlc3Q6IFJlcXVlc3QsIG1ldGhvZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpIHtcclxuICBpZiAobWV0aG9kID09PSBcIkdFVFwiICYmIHBhdGggPT09IFwiL2FwaS9saXN0aW5nc1wiKSB7XHJcbiAgICBjb25zdCBxdWVyeSA9IG5ldyBVUkwocmVxdWVzdC51cmwpLnNlYXJjaFBhcmFtcztcclxuICAgIGNvbnN0IHNlYXJjaCA9IChxdWVyeS5nZXQoXCJxXCIpIHx8IFwiXCIpLnRyaW0oKS5zbGljZSgwLCAxMDApIHx8IG51bGw7XHJcbiAgICBjb25zdCBjYXRlZ29yeSA9IHF1ZXJ5LmdldChcImNhdGVnb3J5XCIpPy5zbGljZSgwLCA4MCkgfHwgbnVsbDtcclxuICAgIGNvbnN0IGNpdHkgPSBxdWVyeS5nZXQoXCJjaXR5XCIpPy5zbGljZSgwLCA4MCkgfHwgbnVsbDtcclxuICAgIGNvbnN0IHNpemUgPSBxdWVyeS5nZXQoXCJzaXplXCIpPy5zbGljZSgwLCAyMCkgfHwgbnVsbDtcclxuICAgIGNvbnN0IGNvbmRpdGlvblZhbHVlczogUmVjb3JkPHN0cmluZyxzdHJpbmc+ID0geyBcIk5ldWYgYXZlYyBcdTAwRTl0aXF1ZXR0ZVwiOiBcIm5ld193aXRoX3RhZ3NcIiwgXCJOZXVmIHNhbnMgXHUwMEU5dGlxdWV0dGVcIjogXCJuZXdfd2l0aG91dF90YWdzXCIsIFwiVHJcdTAwRThzIGJvbiBcdTAwRTl0YXRcIjogXCJ2ZXJ5X2dvb2RcIiwgXCJCb24gXHUwMEU5dGF0XCI6IFwiZ29vZFwiLCBcIlx1MDBDOXRhdCBjb3JyZWN0XCI6IFwiZmFpclwiIH07XHJcbiAgICBjb25zdCBjb25kaXRpb25MYWJlbCA9IHF1ZXJ5LmdldChcImNvbmRpdGlvblwiKTtcclxuICAgIGNvbnN0IGNvbmRpdGlvbiA9IGNvbmRpdGlvbkxhYmVsID8gY29uZGl0aW9uVmFsdWVzW2NvbmRpdGlvbkxhYmVsXSA6IG51bGw7XHJcbiAgICBpZiAoY29uZGl0aW9uTGFiZWwgJiYgIWNvbmRpdGlvbikgZmFpbCg0MDAsIFwiTCdcdTAwRTl0YXQgZGVtYW5kXHUwMEU5IGVzdCBpbnZhbGlkZS5cIik7XHJcbiAgICBjb25zdCBtaW4gPSBxdWVyeS5oYXMoXCJtaW5cIikgPyBpbnRlZ2VyKHF1ZXJ5LmdldChcIm1pblwiKSwgXCJMZSBwcml4IG1pbmltdW1cIiwgMCwgMTBfMDAwXzAwMCkgOiAwO1xyXG4gICAgY29uc3QgbWF4ID0gcXVlcnkuaGFzKFwibWF4XCIpID8gaW50ZWdlcihxdWVyeS5nZXQoXCJtYXhcIiksIFwiTGUgcHJpeCBtYXhpbXVtXCIsIG1pbiwgMTBfMDAwXzAwMCkgOiAxMF8wMDBfMDAwO1xyXG4gICAgY29uc3QgcGFnZSA9IHF1ZXJ5LmhhcyhcInBhZ2VcIikgPyBpbnRlZ2VyKHF1ZXJ5LmdldChcInBhZ2VcIiksIFwiTGEgcGFnZVwiLCAxLCAxMF8wMDApIDogMTtcclxuICAgIGNvbnN0IGxpbWl0ID0gcXVlcnkuaGFzKFwibGltaXRcIikgPyBpbnRlZ2VyKHF1ZXJ5LmdldChcImxpbWl0XCIpLCBcIkxhIGxpbWl0ZVwiLCAxLCA0OCkgOiAyNDtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBvb2wucXVlcnkoXHJcbiAgICAgIGBTRUxFQ1QgbC5pZCwgbC50aXRsZSBBUyBuYW1lLCBsLmJyYW5kLCBsLnNpemVfbGFiZWwgQVMgc2l6ZSwgbC5wcmljZV94YWYgQVMgcHJpY2UsXHJcbiAgICAgICAgICAgICAgbC5jaXR5IHx8ICcsIENvbmdvJyBBUyBsb2NhdGlvbiwgbC5jaXR5LCBjLm5hbWUgQVMgY2F0ZWdvcnksXHJcbiAgICAgICAgICAgICAgQ0FTRSBsLmNvbmRpdGlvbiBXSEVOICduZXdfd2l0aF90YWdzJyBUSEVOICdOZXVmIGF2ZWMgXHUwMEU5dGlxdWV0dGUnIFdIRU4gJ25ld193aXRob3V0X3RhZ3MnIFRIRU4gJ05ldWYgc2FucyBcdTAwRTl0aXF1ZXR0ZScgV0hFTiAndmVyeV9nb29kJyBUSEVOICdUclx1MDBFOHMgYm9uIFx1MDBFOXRhdCcgV0hFTiAnZ29vZCcgVEhFTiAnQm9uIFx1MDBFOXRhdCcgRUxTRSAnXHUwMEM5dGF0IGNvcnJlY3QnIEVORCBBUyBjb25kaXRpb24sXHJcbiAgICAgICAgICAgICAgQ09BTEVTQ0UoanNvbl9hZ2coanNvbl9idWlsZF9vYmplY3QoJ2lkJywgaS5pZCwgJ2tleScsIGkub2JqZWN0X2tleSwgJ2FsdCcsIGkuYWx0X3RleHQsICd0eXBlJywgaS5jb250ZW50X3R5cGUpIE9SREVSIEJZIGkucG9zaXRpb24pIEZJTFRFUiAoV0hFUkUgaS5pZCBJUyBOT1QgTlVMTCksICdbXSc6Ompzb24pIEFTIGltYWdlc1xyXG4gICAgICAgRlJPTSBsaXN0aW5ncyBsIEpPSU4gY2F0ZWdvcmllcyBjIE9OIGMuaWQgPSBsLmNhdGVnb3J5X2lkXHJcbiAgICAgICBMRUZUIEpPSU4gbGlzdGluZ19pbWFnZXMgaSBPTiBpLmxpc3RpbmdfaWQgPSBsLmlkXHJcbiAgICAgICBXSEVSRSBsLnN0YXR1cyA9ICdwdWJsaXNoZWQnIEFORCBjLmlzX2FjdGl2ZVxyXG4gICAgICAgICBBTkQgKCQxOjp0ZXh0IElTIE5VTEwgT1IgbC50aXRsZSBJTElLRSAnJScgfHwgJDEgfHwgJyUnIE9SIENPQUxFU0NFKGwuYnJhbmQsICcnKSBJTElLRSAnJScgfHwgJDEgfHwgJyUnKVxyXG4gICAgICAgICBBTkQgKCQyOjp0ZXh0IElTIE5VTEwgT1IgYy5uYW1lID0gJDIgT1IgYy5zbHVnID0gJDIpXHJcbiAgICAgICAgIEFORCAoJDM6OnRleHQgSVMgTlVMTCBPUiBsLmNpdHkgPSAkMylcclxuICAgICAgICAgQU5EICgkNDo6dGV4dCBJUyBOVUxMIE9SIGwuc2l6ZV9sYWJlbCA9ICQ0KVxyXG4gICAgICAgICBBTkQgKCQ1OjpsaXN0aW5nX2NvbmRpdGlvbiBJUyBOVUxMIE9SIGwuY29uZGl0aW9uPSQ1KVxyXG4gICAgICAgICBBTkQgbC5wcmljZV94YWYgQkVUV0VFTiAkNiBBTkQgJDdcclxuICAgICAgIEdST1VQIEJZIGwuaWQsIGMubmFtZVxyXG4gICAgICAgT1JERVIgQlkgbC5wdWJsaXNoZWRfYXQgREVTQyBOVUxMUyBMQVNULCBsLmNyZWF0ZWRfYXQgREVTQ1xyXG4gICAgICAgTElNSVQgJDggT0ZGU0VUICQ5YCxcclxuICAgICAgW3NlYXJjaCwgY2F0ZWdvcnksIGNpdHksIHNpemUsIGNvbmRpdGlvbiwgbWluLCBtYXgsIGxpbWl0LCAocGFnZSAtIDEpICogbGltaXRdLFxyXG4gICAgKTtcclxuICAgIGNvbnN0IGNvdW50ID0gYXdhaXQgcG9vbC5xdWVyeShcclxuICAgICAgYFNFTEVDVCBjb3VudCgqKTo6aW50IEFTIGNvdW50IEZST00gbGlzdGluZ3MgbCBKT0lOIGNhdGVnb3JpZXMgYyBPTiBjLmlkID0gbC5jYXRlZ29yeV9pZFxyXG4gICAgICAgV0hFUkUgbC5zdGF0dXMgPSAncHVibGlzaGVkJyBBTkQgYy5pc19hY3RpdmVcclxuICAgICAgICAgQU5EICgkMTo6dGV4dCBJUyBOVUxMIE9SIGwudGl0bGUgSUxJS0UgJyUnIHx8ICQxIHx8ICclJyBPUiBDT0FMRVNDRShsLmJyYW5kLCAnJykgSUxJS0UgJyUnIHx8ICQxIHx8ICclJylcclxuICAgICAgICAgQU5EICgkMjo6dGV4dCBJUyBOVUxMIE9SIGMubmFtZSA9ICQyIE9SIGMuc2x1ZyA9ICQyKVxyXG4gICAgICAgICBBTkQgKCQzOjp0ZXh0IElTIE5VTEwgT1IgbC5jaXR5ID0gJDMpXHJcbiAgICAgICAgIEFORCAoJDQ6OnRleHQgSVMgTlVMTCBPUiBsLnNpemVfbGFiZWwgPSAkNClcclxuICAgICAgICAgQU5EICgkNTo6bGlzdGluZ19jb25kaXRpb24gSVMgTlVMTCBPUiBsLmNvbmRpdGlvbj0kNSlcclxuICAgICAgICAgQU5EIGwucHJpY2VfeGFmIEJFVFdFRU4gJDYgQU5EICQ3YCwgW3NlYXJjaCwgY2F0ZWdvcnksIGNpdHksIHNpemUsIGNvbmRpdGlvbiwgbWluLCBtYXhdLFxyXG4gICAgKTtcclxuICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgUHJvbWlzZS5hbGwocmVzdWx0LnJvd3MubWFwKGFzeW5jIChpdGVtKSA9PiAoe1xyXG4gICAgICAuLi5pdGVtLFxyXG4gICAgICBwcmljZTogTnVtYmVyKGl0ZW0ucHJpY2UpLFxyXG4gICAgICBpbWc6IGF3YWl0IGltYWdlVXJsKGl0ZW0uaW1hZ2VzWzBdPy5rZXkpLFxyXG4gICAgfSkpKTtcclxuICAgIHJldHVybiBqc29uKHsgaXRlbXMsIHRvdGFsOiBjb3VudC5yb3dzWzBdLmNvdW50LCBwYWdlLCBsaW1pdCB9KTtcclxuICB9XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJHRVRcIiAmJiBwYXRoID09PSBcIi9hcGkvY2F0ZWdvcmllc1wiKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb29sLnF1ZXJ5KFwiU0VMRUNUIGlkLCBuYW1lLCBzbHVnIEZST00gY2F0ZWdvcmllcyBXSEVSRSBpc19hY3RpdmUgPSB0cnVlIE9SREVSIEJZIHNvcnRfb3JkZXIsIG5hbWVcIik7XHJcbiAgICByZXR1cm4ganNvbihyZXN1bHQucm93cyk7XHJcbiAgfVxyXG4gIGlmIChtZXRob2QgPT09IFwiR0VUXCIgJiYgL15cXC9hcGlcXC9saXN0aW5nc1xcL1tcXHctXSskLy50ZXN0KHBhdGgpKSB7XHJcbiAgICBjb25zdCBpZCA9IHBhdGguc3BsaXQoXCIvXCIpLmF0KC0xKSE7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb29sLnF1ZXJ5KFxyXG4gICAgICBgU0VMRUNUIGwuaWQsIGwuc2VsbGVyX2lkIEFTIFwic2VsbGVySWRcIiwgbC50aXRsZSBBUyBuYW1lLCBsLmRlc2NyaXB0aW9uLCBsLmJyYW5kLCBsLnNpemVfbGFiZWwgQVMgc2l6ZSxcclxuICAgICAgIGwucHJpY2VfeGFmIEFTIHByaWNlLCBsLmNpdHksIGwuY2l0eSB8fCAnLCBDb25nbycgQVMgbG9jYXRpb24sIGwuY291bnRyeV9jb2RlIEFTIFwiY291bnRyeUNvZGVcIiwgYy5uYW1lIEFTIGNhdGVnb3J5LFxyXG4gICAgICAgQ0FTRSBsLmNvbmRpdGlvbiBXSEVOICduZXdfd2l0aF90YWdzJyBUSEVOICdOZXVmIGF2ZWMgXHUwMEU5dGlxdWV0dGUnIFdIRU4gJ25ld193aXRob3V0X3RhZ3MnIFRIRU4gJ05ldWYgc2FucyBcdTAwRTl0aXF1ZXR0ZScgV0hFTiAndmVyeV9nb29kJyBUSEVOICdUclx1MDBFOHMgYm9uIFx1MDBFOXRhdCcgV0hFTiAnZ29vZCcgVEhFTiAnQm9uIFx1MDBFOXRhdCcgRUxTRSAnXHUwMEM5dGF0IGNvcnJlY3QnIEVORCBBUyBjb25kaXRpb24sXHJcbiAgICAgICBwLmRpc3BsYXlfbmFtZSBBUyBzZWxsZXIsIENPQUxFU0NFKGpzb25fYWdnKGpzb25fYnVpbGRfb2JqZWN0KCdpZCcsIGkuaWQsICdrZXknLCBpLm9iamVjdF9rZXksICdhbHQnLCBpLmFsdF90ZXh0KSBPUkRFUiBCWSBpLnBvc2l0aW9uKSBGSUxURVIgKFdIRVJFIGkuaWQgSVMgTk9UIE5VTEwpLCAnW10nOjpqc29uKSBBUyBpbWFnZXNcclxuICAgICAgIEZST00gbGlzdGluZ3MgbCBKT0lOIGNhdGVnb3JpZXMgYyBPTiBjLmlkPWwuY2F0ZWdvcnlfaWQgSk9JTiBwcm9maWxlcyBwIE9OIHAuaWQ9bC5zZWxsZXJfaWQgTEVGVCBKT0lOIGxpc3RpbmdfaW1hZ2VzIGkgT04gaS5saXN0aW5nX2lkPWwuaWRcclxuICAgICAgIFdIRVJFIGwuaWQ9JDEgQU5EIGwuc3RhdHVzPSdwdWJsaXNoZWQnIEdST1VQIEJZIGwuaWQsIGMubmFtZSwgcC5kaXNwbGF5X25hbWVgLCBbaWRdLFxyXG4gICAgKTtcclxuICAgIGlmICghcmVzdWx0LnJvd3NbMF0pIGZhaWwoNDA0LCBcIkFubm9uY2UgaW50cm91dmFibGUuXCIpO1xyXG4gICAgY29uc3QgaXRlbSA9IHJlc3VsdC5yb3dzWzBdO1xyXG4gICAgY29uc3QgaW1hZ2VzID0gYXdhaXQgUHJvbWlzZS5hbGwoaXRlbS5pbWFnZXMubWFwKGFzeW5jIChpbWFnZTogeyBrZXk6IHN0cmluZzsgYWx0OiBzdHJpbmcgfCBudWxsIH0pID0+ICh7XHJcbiAgICAgIC4uLmltYWdlLFxyXG4gICAgICB1cmw6IGF3YWl0IGltYWdlVXJsKGltYWdlLmtleSksXHJcbiAgICB9KSkpO1xyXG4gICAgcmV0dXJuIGpzb24oeyAuLi5pdGVtLCBwcmljZTogTnVtYmVyKGl0ZW0ucHJpY2UpLCBpbWFnZXMgfSk7XHJcbiAgfVxyXG4gIGNvbnN0IHVzZXIgPSBhd2FpdCBhdXRoZW50aWNhdGVkKHJlcXVlc3QpO1xyXG4gIGlmIChtZXRob2QgPT09IFwiUE9TVFwiICYmIHBhdGggPT09IFwiL2FwaS9saXN0aW5nc1wiKSB7XHJcbiAgICBjb25zdCBpbnB1dCA9IGF3YWl0IGJvZHk8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+KHJlcXVlc3QpO1xyXG4gICAgY29uc3QgdGl0bGUgPSB0ZXh0KGlucHV0LnRpdGxlLCBcIkxlIHRpdHJlXCIsIDMsIDE0MCk7XHJcbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHRleHQoaW5wdXQuZGVzY3JpcHRpb24sIFwiTGEgZGVzY3JpcHRpb25cIiwgMSwgNTAwMCk7XHJcbiAgICBjb25zdCBicmFuZCA9IGlucHV0LmJyYW5kID09IG51bGwgPyBudWxsIDogdGV4dChpbnB1dC5icmFuZCwgXCJMYSBtYXJxdWVcIiwgMSwgODApO1xyXG4gICAgY29uc3Qgc2l6ZSA9IGlucHV0LnNpemUgPT0gbnVsbCA/IG51bGwgOiB0ZXh0KGlucHV0LnNpemUsIFwiTGEgdGFpbGxlXCIsIDEsIDIwKTtcclxuICAgIGNvbnN0IGNpdHkgPSB0ZXh0KGlucHV0LmNpdHksIFwiTGEgdmlsbGVcIiwgMiwgODApO1xyXG4gICAgY29uc3QgcHJpY2UgPSBpbnRlZ2VyKGlucHV0LnByaWNlLCBcIkxlIHByaXhcIiwgMSwgMTBfMDAwXzAwMCk7XHJcbiAgICBjb25zdCBjb25kaXRpb25NYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7IFwiTmV1ZiBhdmVjIFx1MDBFOXRpcXVldHRlXCI6IFwibmV3X3dpdGhfdGFnc1wiLCBcIk5ldWYgc2FucyBcdTAwRTl0aXF1ZXR0ZVwiOiBcIm5ld193aXRob3V0X3RhZ3NcIiwgXCJUclx1MDBFOHMgYm9uIFx1MDBFOXRhdFwiOiBcInZlcnlfZ29vZFwiLCBcIkJvbiBcdTAwRTl0YXRcIjogXCJnb29kXCIsIFwiXHUwMEM5dGF0IGNvcnJlY3RcIjogXCJmYWlyXCIgfTtcclxuICAgIGNvbnN0IGNvbmRpdGlvbiA9IGNvbmRpdGlvbk1hcFtTdHJpbmcoaW5wdXQuY29uZGl0aW9uKV0gfHwgU3RyaW5nKGlucHV0LmNvbmRpdGlvbik7XHJcbiAgICBpZiAoIU9iamVjdC52YWx1ZXMoY29uZGl0aW9uTWFwKS5pbmNsdWRlcyhjb25kaXRpb24pKSBmYWlsKDQwMCwgXCJMJ1x1MDBFOXRhdCBkZSBsJ2FydGljbGUgZXN0IGludmFsaWRlLlwiKTtcclxuICAgIGNvbnN0IGNhdGVnb3J5SWQgPSB0ZXh0KGlucHV0LmNhdGVnb3J5SWQsIFwiTGEgY2F0XHUwMEU5Z29yaWVcIiwgMSwgODApO1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcG9vbC5xdWVyeShcclxuICAgICAgYElOU0VSVCBJTlRPIGxpc3RpbmdzIChzZWxsZXJfaWQsIGNhdGVnb3J5X2lkLCB0aXRsZSwgZGVzY3JpcHRpb24sIGJyYW5kLCBzaXplX2xhYmVsLCBjb25kaXRpb24sIHByaWNlX3hhZiwgY2l0eSwgc3RhdHVzKVxyXG4gICAgICAgU0VMRUNUICQxLCBjLmlkLCAkMywgJDQsICQ1LCAkNiwgJDc6Omxpc3RpbmdfY29uZGl0aW9uLCAkOCwgJDksICdkcmFmdCdcclxuICAgICAgIEZST00gY2F0ZWdvcmllcyBjIFdIRVJFIGMuaWQ6OnRleHQ9JDIgQU5EIGMuaXNfYWN0aXZlXHJcbiAgICAgICBSRVRVUk5JTkcgaWQsIHN0YXR1c2AsIFt1c2VyLnByb2ZpbGVJZCwgY2F0ZWdvcnlJZCwgdGl0bGUsIGRlc2NyaXB0aW9uLCBicmFuZCwgc2l6ZSwgY29uZGl0aW9uLCBwcmljZSwgY2l0eV0sXHJcbiAgICApO1xyXG4gICAgaWYgKCFyZXN1bHQucm93Q291bnQpIGZhaWwoNDAwLCBcIkNhdFx1MDBFOWdvcmllIGluY29ubnVlIG91IGluYWN0aXZlLlwiKTtcclxuICAgIHJldHVybiBqc29uKHJlc3VsdC5yb3dzWzBdLCAyMDEpO1xyXG4gIH1cclxuICBjb25zdCBtYXRjaCA9IHBhdGgubWF0Y2goL15cXC9hcGlcXC9saXN0aW5nc1xcLyhbXFx3LV0rKVxcLyhwdWJsaXNofHdpdGhkcmF3KSQvKTtcclxuICBpZiAobWV0aG9kID09PSBcIlBPU1RcIiAmJiBtYXRjaCkge1xyXG4gICAgY29uc3QgWywgbGlzdGluZ0lkLCBhY3Rpb25dID0gbWF0Y2g7XHJcbiAgICBpZiAoYWN0aW9uID09PSBcInB1Ymxpc2hcIikge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb29sLnF1ZXJ5KFxyXG4gICAgICAgIGBVUERBVEUgbGlzdGluZ3MgbCBTRVQgc3RhdHVzPSdwdWJsaXNoZWQnLCBwdWJsaXNoZWRfYXQ9bm93KClcclxuICAgICAgICAgV0hFUkUgbC5pZD0kMSBBTkQgbC5zZWxsZXJfaWQ9JDIgQU5EIGwuc3RhdHVzPSdkcmFmdCdcclxuICAgICAgICAgICBBTkQgRVhJU1RTIChTRUxFQ1QgMSBGUk9NIGxpc3RpbmdfaW1hZ2VzIGkgV0hFUkUgaS5saXN0aW5nX2lkPWwuaWQpXHJcbiAgICAgICAgIFJFVFVSTklORyBsLmlkLCBsLnN0YXR1c2AsIFtsaXN0aW5nSWQsIHVzZXIucHJvZmlsZUlkXSxcclxuICAgICAgKTtcclxuICAgICAgaWYgKCFyZXN1bHQucm93Q291bnQpIGZhaWwoNDA5LCBcIkFqb3V0ZXogYXUgbW9pbnMgdW5lIHBob3RvIFx1MDBFMCB2b3RyZSBicm91aWxsb24gYXZhbnQgZGUgcHVibGllci5cIik7XHJcbiAgICAgIHJldHVybiBqc29uKHJlc3VsdC5yb3dzWzBdKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBvb2wucXVlcnkoXCJVUERBVEUgbGlzdGluZ3MgU0VUIHN0YXR1cz0nd2l0aGRyYXduJyBXSEVSRSBpZD0kMSBBTkQgc2VsbGVyX2lkPSQyIEFORCBzdGF0dXMgSU4gKCdkcmFmdCcsJ3B1Ymxpc2hlZCcpIFJFVFVSTklORyBpZCxzdGF0dXNcIiwgW2xpc3RpbmdJZCwgdXNlci5wcm9maWxlSWRdKTtcclxuICAgIGlmICghcmVzdWx0LnJvd0NvdW50KSBmYWlsKDQwNCwgXCJBbm5vbmNlIGludHJvdXZhYmxlLlwiKTtcclxuICAgIHJldHVybiBqc29uKHJlc3VsdC5yb3dzWzBdKTtcclxuICB9XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJHRVRcIiAmJiBwYXRoID09PSBcIi9hcGkvc2VsbGVyL2xpc3RpbmdzXCIpIHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBvb2wucXVlcnkoXHJcbiAgICAgIGBTRUxFQ1QgbC5pZCwgbC50aXRsZSBBUyBuYW1lLCBsLnByaWNlX3hhZiBBUyBwcmljZSwgbC5zdGF0dXMsIGwuY2l0eSwgbC5jcmVhdGVkX2F0IEFTIFwiY3JlYXRlZEF0XCIsXHJcbiAgICAgICAoU0VMRUNUIGkub2JqZWN0X2tleSBGUk9NIGxpc3RpbmdfaW1hZ2VzIGkgV0hFUkUgaS5saXN0aW5nX2lkPWwuaWQgT1JERVIgQlkgaS5wb3NpdGlvbiBMSU1JVCAxKSBBUyBcImltYWdlS2V5XCJcclxuICAgICAgIEZST00gbGlzdGluZ3MgbCBXSEVSRSBsLnNlbGxlcl9pZD0kMSBPUkRFUiBCWSBsLmNyZWF0ZWRfYXQgREVTQ2AsIFt1c2VyLnByb2ZpbGVJZF0sXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIGpzb24oYXdhaXQgUHJvbWlzZS5hbGwocmVzdWx0LnJvd3MubWFwKGFzeW5jIChpdGVtKSA9PiAoe1xyXG4gICAgICAuLi5pdGVtLFxyXG4gICAgICBwcmljZTogTnVtYmVyKGl0ZW0ucHJpY2UpLFxyXG4gICAgICBpbWc6IGF3YWl0IGltYWdlVXJsKGl0ZW0uaW1hZ2VLZXkpLFxyXG4gICAgfSkpKSk7XHJcbiAgfVxyXG4gIGZhaWwoNDA0LCBcIlJvdXRlIGFubm9uY2UgaW50cm91dmFibGUuXCIpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiB1cGxvYWRzKHJlcXVlc3Q6IFJlcXVlc3QsIG1ldGhvZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpIHtcclxuICBjb25zdCB1c2VyID0gYXdhaXQgYXV0aGVudGljYXRlZChyZXF1ZXN0KTtcclxuICBpZiAobWV0aG9kID09PSBcIlBPU1RcIiAmJiBwYXRoID09PSBcIi9hcGkvdXBsb2Fkcy9wcmVzaWduXCIpIHtcclxuICAgIGNvbnN0IGlucHV0ID0gYXdhaXQgYm9keTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ocmVxdWVzdCk7XHJcbiAgICBjb25zdCBsaXN0aW5nSWQgPSB0ZXh0KGlucHV0Lmxpc3RpbmdJZCwgXCJMJ2Fubm9uY2VcIiwgMSwgODApO1xyXG4gICAgY29uc3QgY29udGVudFR5cGUgPSB0ZXh0KGlucHV0LmNvbnRlbnRUeXBlLCBcIkxlIHR5cGUgZGUgZmljaGllclwiLCAxLCAxMDApO1xyXG4gICAgaWYgKCFBTExPV0VEX0lNQUdFX1RZUEVTLmhhcyhjb250ZW50VHlwZSkpIGZhaWwoNDAwLCBcIkZvcm1hdCBkJ2ltYWdlIGFjY2VwdFx1MDBFOSA6IEpQRUcsIFBORywgV2ViUCBvdSBBVklGLlwiKTtcclxuICAgIGNvbnN0IHNpemUgPSBpbnRlZ2VyKGlucHV0LnNpemUsIFwiTGEgdGFpbGxlIGR1IGZpY2hpZXJcIiwgMSwgTUFYX0lNQUdFX0JZVEVTKTtcclxuICAgIGNvbnN0IGxpc3RpbmcgPSBhd2FpdCBwb29sLnF1ZXJ5KFwiU0VMRUNUIGlkIEZST00gbGlzdGluZ3MgV0hFUkUgaWQ9JDEgQU5EIHNlbGxlcl9pZD0kMiBBTkQgc3RhdHVzPSdkcmFmdCdcIiwgW2xpc3RpbmdJZCwgdXNlci5wcm9maWxlSWRdKTtcclxuICAgIGlmICghbGlzdGluZy5yb3dDb3VudCkgZmFpbCg0MDQsIFwiQnJvdWlsbG9uIGludHJvdXZhYmxlLlwiKTtcclxuICAgIGNvbnN0IGN1cnJlbnQgPSBhd2FpdCBwb29sLnF1ZXJ5KFwiU0VMRUNUIGNvdW50KCopOjppbnQgQVMgY291bnQgRlJPTSBsaXN0aW5nX2ltYWdlcyBXSEVSRSBsaXN0aW5nX2lkPSQxXCIsIFtsaXN0aW5nSWRdKTtcclxuICAgIGlmIChjdXJyZW50LnJvd3NbMF0uY291bnQgPj0gMTApIGZhaWwoNDAwLCBcIlVuZSBhbm5vbmNlIHBldXQgY29udGVuaXIgYXUgbWF4aW11bSAxMCBwaG90b3MuXCIpO1xyXG4gICAgY29uc3QgZXh0ID0gKHsgXCJpbWFnZS9qcGVnXCI6IFwianBnXCIsIFwiaW1hZ2UvcG5nXCI6IFwicG5nXCIsIFwiaW1hZ2Uvd2VicFwiOiBcIndlYnBcIiwgXCJpbWFnZS9hdmlmXCI6IFwiYXZpZlwiIH0gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilbY29udGVudFR5cGVdO1xyXG4gICAgY29uc3Qga2V5ID0gYGxpc3RpbmdzLyR7dXNlci5wcm9maWxlSWR9LyR7bGlzdGluZ0lkfS8ke3JhbmRvbVVVSUQoKX0uJHtleHR9YDtcclxuICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgUHV0T2JqZWN0Q29tbWFuZCh7IEJ1Y2tldDogZ2V0UjJCdWNrZXQoKSwgS2V5OiBrZXksIENvbnRlbnRUeXBlOiBjb250ZW50VHlwZSB9KTtcclxuICAgIGNvbnN0IHVwbG9hZFVybCA9IGF3YWl0IGdldFNpZ25lZFVybChzdG9yYWdlKCksIGNvbW1hbmQsIHsgZXhwaXJlc0luOiAzMDAgfSk7XHJcbiAgICByZXR1cm4ganNvbih7IGtleSwgdXBsb2FkVXJsLCBleHBpcmVzSW46IDMwMCB9KTtcclxuICB9XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJQT1NUXCIgJiYgcGF0aCA9PT0gXCIvYXBpL3VwbG9hZHMvY29uZmlybVwiKSB7XHJcbiAgICBjb25zdCBpbnB1dCA9IGF3YWl0IGJvZHk8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+KHJlcXVlc3QpO1xyXG4gICAgY29uc3Qga2V5ID0gdGV4dChpbnB1dC5rZXksIFwiTGEgY2xcdTAwRTlcIiwgMSwgNTAwKTtcclxuICAgIGNvbnN0IGxpc3RpbmdJZCA9IHRleHQoaW5wdXQubGlzdGluZ0lkLCBcIkwnYW5ub25jZVwiLCAxLCA4MCk7XHJcbiAgICBjb25zdCBhbHQgPSBpbnB1dC5hbHQgPT0gbnVsbCA/IG51bGwgOiB0ZXh0KGlucHV0LmFsdCwgXCJMZSB0ZXh0ZSBhbHRlcm5hdGlmXCIsIDAsIDE4MCk7XHJcbiAgICBpZiAoIWtleS5zdGFydHNXaXRoKGBsaXN0aW5ncy8ke3VzZXIucHJvZmlsZUlkfS8ke2xpc3RpbmdJZH0vYCkpIGZhaWwoNDAzLCBcIkNsXHUwMEU5IGRlIGZpY2hpZXIgaW52YWxpZGUuXCIpO1xyXG4gICAgY29uc3QgbGlzdGluZyA9IGF3YWl0IHBvb2wucXVlcnkoXCJTRUxFQ1QgaWQgRlJPTSBsaXN0aW5ncyBXSEVSRSBpZD0kMSBBTkQgc2VsbGVyX2lkPSQyIEFORCBzdGF0dXM9J2RyYWZ0J1wiLCBbbGlzdGluZ0lkLCB1c2VyLnByb2ZpbGVJZF0pO1xyXG4gICAgaWYgKCFsaXN0aW5nLnJvd0NvdW50KSBmYWlsKDQwNCwgXCJCcm91aWxsb24gaW50cm91dmFibGUuXCIpO1xyXG4gICAgbGV0IGhlYWQ7XHJcbiAgICB0cnkgeyBoZWFkID0gYXdhaXQgc3RvcmFnZSgpLnNlbmQobmV3IEhlYWRPYmplY3RDb21tYW5kKHsgQnVja2V0OiBnZXRSMkJ1Y2tldCgpLCBLZXk6IGtleSB9KSk7IH1cclxuICAgIGNhdGNoIHsgZmFpbCg0MDAsIFwiTGUgZmljaGllciBuJ2EgcGFzIFx1MDBFOXRcdTAwRTkgcmVcdTAwRTd1IHBhciBSMi5cIik7IH1cclxuICAgIGNvbnN0IGNvbnRlbnRUeXBlID0gaGVhZC5Db250ZW50VHlwZSB8fCBcIlwiO1xyXG4gICAgY29uc3QgYnl0ZVNpemUgPSBoZWFkLkNvbnRlbnRMZW5ndGggfHwgMDtcclxuICAgIGlmICghQUxMT1dFRF9JTUFHRV9UWVBFUy5oYXMoY29udGVudFR5cGUpIHx8IGJ5dGVTaXplIDwgMSB8fCBieXRlU2l6ZSA+IE1BWF9JTUFHRV9CWVRFUykgZmFpbCg0MDAsIFwiTGUgZmljaGllciBlbnZveVx1MDBFOSBuZSByZXNwZWN0ZSBwYXMgbGVzIHJcdTAwRThnbGVzIGQnaW1hZ2UuXCIpO1xyXG4gICAgY29uc3QgcG9zaXRpb24gPSBhd2FpdCBwb29sLnF1ZXJ5KFwiU0VMRUNUIENPQUxFU0NFKG1heChwb3NpdGlvbikrMSwwKTo6aW50IEFTIHBvc2l0aW9uIEZST00gbGlzdGluZ19pbWFnZXMgV0hFUkUgbGlzdGluZ19pZD0kMVwiLCBbbGlzdGluZ0lkXSk7XHJcbiAgICBpZiAocG9zaXRpb24ucm93c1swXS5wb3NpdGlvbiA+IDkpIGZhaWwoNDAwLCBcIlVuZSBhbm5vbmNlIHBldXQgY29udGVuaXIgYXUgbWF4aW11bSAxMCBwaG90b3MuXCIpO1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcG9vbC5xdWVyeShcclxuICAgICAgYElOU0VSVCBJTlRPIGxpc3RpbmdfaW1hZ2VzIChsaXN0aW5nX2lkLCBvYmplY3Rfa2V5LCBhbHRfdGV4dCwgY29udGVudF90eXBlLCBieXRlX3NpemUsIHBvc2l0aW9uKVxyXG4gICAgICAgVkFMVUVTICgkMSwkMiwkMywkNCwkNSwkNikgT04gQ09ORkxJQ1QgKG9iamVjdF9rZXkpIERPIE5PVEhJTkcgUkVUVVJOSU5HIGlkYCxcclxuICAgICAgW2xpc3RpbmdJZCwga2V5LCBhbHQsIGNvbnRlbnRUeXBlLCBieXRlU2l6ZSwgcG9zaXRpb24ucm93c1swXS5wb3NpdGlvbl0sXHJcbiAgICApO1xyXG4gICAgaWYgKCFyZXN1bHQucm93Q291bnQpIGZhaWwoNDA5LCBcIkNldHRlIHBob3RvIGEgZFx1MDBFOWpcdTAwRTAgXHUwMEU5dFx1MDBFOSBlbnJlZ2lzdHJcdTAwRTllLlwiKTtcclxuICAgIHJldHVybiBqc29uKHsgaWQ6IHJlc3VsdC5yb3dzWzBdLmlkLCBrZXksIGFsdCB9LCAyMDEpO1xyXG4gIH1cclxuICBmYWlsKDQwNCwgXCJSb3V0ZSBkZSB0XHUwMEU5bFx1MDBFOXZlcnNlbWVudCBpbnRyb3V2YWJsZS5cIik7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGZhdm9yaXRlcyhyZXF1ZXN0OiBSZXF1ZXN0LCBtZXRob2Q6IHN0cmluZywgcGF0aDogc3RyaW5nKSB7XHJcbiAgY29uc3QgdXNlciA9IGF3YWl0IGF1dGhlbnRpY2F0ZWQocmVxdWVzdCk7XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJHRVRcIiAmJiBwYXRoID09PSBcIi9hcGkvZmF2b3JpdGVzXCIpIHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBvb2wucXVlcnkoXHJcbiAgICAgIGBTRUxFQ1QgbC5pZCwgbC50aXRsZSBBUyBuYW1lLCBsLmJyYW5kLCBsLnNpemVfbGFiZWwgQVMgc2l6ZSwgbC5wcmljZV94YWYgQVMgcHJpY2UsIGwuY2l0eSxcclxuICAgICAgIGMubmFtZSBBUyBjYXRlZ29yeSwgKFNFTEVDVCBpLm9iamVjdF9rZXkgRlJPTSBsaXN0aW5nX2ltYWdlcyBpIFdIRVJFIGkubGlzdGluZ19pZD1sLmlkIE9SREVSIEJZIHBvc2l0aW9uIExJTUlUIDEpIEFTIGtleVxyXG4gICAgICAgRlJPTSBmYXZvcml0ZXMgZiBKT0lOIGxpc3RpbmdzIGwgT04gbC5pZD1mLmxpc3RpbmdfaWQgSk9JTiBjYXRlZ29yaWVzIGMgT04gYy5pZD1sLmNhdGVnb3J5X2lkIFdIRVJFIGYucHJvZmlsZV9pZD0kMSBBTkQgbC5zdGF0dXM9J3B1Ymxpc2hlZCdgLCBbdXNlci5wcm9maWxlSWRdLFxyXG4gICAgKTtcclxuICAgIHJldHVybiBqc29uKGF3YWl0IFByb21pc2UuYWxsKHJlc3VsdC5yb3dzLm1hcChhc3luYyAoaXRlbSkgPT4gKHtcclxuICAgICAgLi4uaXRlbSxcclxuICAgICAgcHJpY2U6IE51bWJlcihpdGVtLnByaWNlKSxcclxuICAgICAgaW1nOiBhd2FpdCBpbWFnZVVybChpdGVtLmtleSksXHJcbiAgICB9KSkpKTtcclxuICB9XHJcbiAgY29uc3QgbWF0Y2ggPSBwYXRoLm1hdGNoKC9eXFwvYXBpXFwvZmF2b3JpdGVzXFwvKFtcXHctXSspJC8pO1xyXG4gIGlmIChtYXRjaCAmJiBtZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb29sLnF1ZXJ5KFxyXG4gICAgICBgSU5TRVJUIElOVE8gZmF2b3JpdGVzIChwcm9maWxlX2lkLCBsaXN0aW5nX2lkKSBTRUxFQ1QgJDEsaWQgRlJPTSBsaXN0aW5ncyBXSEVSRSBpZD0kMiBBTkQgc3RhdHVzPSdwdWJsaXNoZWQnXHJcbiAgICAgICBPTiBDT05GTElDVCBETyBOT1RISU5HIFJFVFVSTklORyBsaXN0aW5nX2lkYCwgW3VzZXIucHJvZmlsZUlkLCBtYXRjaFsxXV0sXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIGpzb24oeyBmYXZvcml0ZWQ6IHRydWUsIGluc2VydGVkOiBCb29sZWFuKHJlc3VsdC5yb3dDb3VudCkgfSk7XHJcbiAgfVxyXG4gIGlmIChtYXRjaCAmJiBtZXRob2QgPT09IFwiREVMRVRFXCIpIHtcclxuICAgIGF3YWl0IHBvb2wucXVlcnkoXCJERUxFVEUgRlJPTSBmYXZvcml0ZXMgV0hFUkUgcHJvZmlsZV9pZD0kMSBBTkQgbGlzdGluZ19pZD0kMlwiLCBbdXNlci5wcm9maWxlSWQsIG1hdGNoWzFdXSk7XHJcbiAgICByZXR1cm4ganNvbih7IGZhdm9yaXRlZDogZmFsc2UgfSk7XHJcbiAgfVxyXG4gIGZhaWwoNDA0LCBcIlJvdXRlIGZhdm9yaXMgaW50cm91dmFibGUuXCIpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBvcmRlcnMocmVxdWVzdDogUmVxdWVzdCwgbWV0aG9kOiBzdHJpbmcsIHBhdGg6IHN0cmluZykge1xyXG4gIGNvbnN0IHVzZXIgPSBhd2FpdCBhdXRoZW50aWNhdGVkKHJlcXVlc3QpO1xyXG4gIGlmIChtZXRob2QgPT09IFwiR0VUXCIgJiYgcGF0aCA9PT0gXCIvYXBpL29yZGVyc1wiKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb29sLnF1ZXJ5KFxyXG4gICAgICBgU0VMRUNUIG8uaWQsIG8uc3RhdHVzLCBvLml0ZW1fcHJpY2VfeGFmIEFTIFwiaXRlbVByaWNlXCIsIG8udG90YWxfeGFmIEFTIHRvdGFsLCBvLmNyZWF0ZWRfYXQgQVMgXCJjcmVhdGVkQXRcIixcclxuICAgICAgIGwudGl0bGUgQVMgXCJsaXN0aW5nVGl0bGVcIiwgbC5pZCBBUyBcImxpc3RpbmdJZFwiLFxyXG4gICAgICAgQ0FTRSBXSEVOIG8uc2VsbGVyX2lkPSQxIFRIRU4gcGIuZGlzcGxheV9uYW1lIEVMU0UgcC5kaXNwbGF5X25hbWUgRU5EIEFTIFwib3RoZXJQYXJ0eU5hbWVcIixcclxuICAgICAgIG8uc2VsbGVyX2lkPSQxIEFTIFwiaXNTZWxsZXJcIixcclxuICAgICAgIEVYSVNUUyAoU0VMRUNUIDEgRlJPTSByZXZpZXdzIHIgV0hFUkUgci5vcmRlcl9pZD1vLmlkIEFORCByLnJldmlld2VyX2lkPSQxKSBBUyBcImhhc1Jldmlld2VkXCJcclxuICAgICAgIEZST00gb3JkZXJzIG8gSk9JTiBsaXN0aW5ncyBsIE9OIGwuaWQ9by5saXN0aW5nX2lkIEpPSU4gcHJvZmlsZXMgcCBPTiBwLmlkPW8uc2VsbGVyX2lkIEpPSU4gcHJvZmlsZXMgcGIgT04gcGIuaWQ9by5idXllcl9pZFxyXG4gICAgICAgV0hFUkUgby5idXllcl9pZD0kMSBPUiBvLnNlbGxlcl9pZD0kMSBPUkRFUiBCWSBvLmNyZWF0ZWRfYXQgREVTQ2AsIFt1c2VyLnByb2ZpbGVJZF0sXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIGpzb24ocmVzdWx0LnJvd3MubWFwKChyb3cpID0+ICh7IC4uLnJvdywgaXRlbVByaWNlOiBOdW1iZXIocm93Lml0ZW1QcmljZSksIHRvdGFsOiBOdW1iZXIocm93LnRvdGFsKSB9KSkpO1xyXG4gIH1cclxuICBpZiAobWV0aG9kID09PSBcIlBPU1RcIiAmJiBwYXRoID09PSBcIi9hcGkvb3JkZXJzXCIpIHtcclxuICAgIGNvbnN0IGlucHV0ID0gYXdhaXQgYm9keTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ocmVxdWVzdCk7XHJcbiAgICBjb25zdCBsaXN0aW5nSWQgPSB0ZXh0KGlucHV0Lmxpc3RpbmdJZCwgXCJMJ2Fubm9uY2VcIiwgMSwgODApO1xyXG4gICAgY29uc3QgbWV0aG9kID0gaW5wdXQuZGVsaXZlcnlNZXRob2QgPT09IFwicGlja3VwXCIgPyBcInBpY2t1cFwiIDogXCJkZWxpdmVyeVwiO1xyXG4gICAgY29uc3QgY2l0eSA9IHRleHQoaW5wdXQuY2l0eSwgXCJMYSB2aWxsZVwiLCAyLCA4MCk7XHJcbiAgICBjb25zdCBkZXRhaWxzID0gaW5wdXQuZGV0YWlscyA9PSBudWxsID8gbnVsbCA6IHRleHQoaW5wdXQuZGV0YWlscywgXCJMZXMgaW5mb3JtYXRpb25zIGRlIHJlbWlzZVwiLCAwLCA1MDApO1xyXG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgcG9vbC5jb25uZWN0KCk7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBjbGllbnQucXVlcnkoXCJCRUdJTlwiKTtcclxuICAgICAgY29uc3QgbGlzdGluZyA9IGF3YWl0IGNsaWVudC5xdWVyeShcIlNFTEVDVCBpZCxzZWxsZXJfaWQscHJpY2VfeGFmIEZST00gbGlzdGluZ3MgV0hFUkUgaWQ9JDEgQU5EIHN0YXR1cz0ncHVibGlzaGVkJyBGT1IgVVBEQVRFXCIsIFtsaXN0aW5nSWRdKTtcclxuICAgICAgaWYgKCFsaXN0aW5nLnJvd0NvdW50KSBmYWlsKDQwOSwgXCJDZXQgYXJ0aWNsZSBuJ2VzdCBwbHVzIGRpc3BvbmlibGUuXCIpO1xyXG4gICAgICBjb25zdCByb3cgPSBsaXN0aW5nLnJvd3NbMF07XHJcbiAgICAgIGlmIChyb3cuc2VsbGVyX2lkID09PSB1c2VyLnByb2ZpbGVJZCkgZmFpbCg0MDAsIFwiVm91cyBuZSBwb3V2ZXogcGFzIGFjaGV0ZXIgdm90cmUgcHJvcHJlIGFubm9uY2UuXCIpO1xyXG4gICAgICBjb25zdCBzZXR0aW5nID0gYXdhaXQgY2xpZW50LnF1ZXJ5KFwiU0VMRUNUIHZhbHVlIEZST00gcGxhdGZvcm1fc2V0dGluZ3MgV0hFUkUga2V5PSdjb21taXNzaW9uX3JhdGVzJ1wiKTtcclxuICAgICAgY29uc3QgYnBzID0gTnVtYmVyKHNldHRpbmcucm93c1swXT8udmFsdWU/LnNlbGxlcl9icHMgfHwgMCk7XHJcbiAgICAgIGNvbnN0IGNvbW1pc3Npb24gPSBNYXRoLmZsb29yKE51bWJlcihyb3cucHJpY2VfeGFmKSAqIE1hdGgubWluKE1hdGgubWF4KGJwcywgMCksIDEwXzAwMCkgLyAxMF8wMDApO1xyXG4gICAgICBjb25zdCBvcmRlciA9IGF3YWl0IGNsaWVudC5xdWVyeShcclxuICAgICAgICBgSU5TRVJUIElOVE8gb3JkZXJzIChsaXN0aW5nX2lkLGJ1eWVyX2lkLHNlbGxlcl9pZCxpdGVtX3ByaWNlX3hhZixjb21taXNzaW9uX3hhZilcclxuICAgICAgICAgVkFMVUVTICgkMSwkMiwkMywkNCwkNSkgUkVUVVJOSU5HIGlkLHN0YXR1cyx0b3RhbF94YWYgQVMgdG90YWxgLFxyXG4gICAgICAgIFtsaXN0aW5nSWQsdXNlci5wcm9maWxlSWQscm93LnNlbGxlcl9pZCxyb3cucHJpY2VfeGFmLGNvbW1pc3Npb25dLFxyXG4gICAgICApO1xyXG4gICAgICBhd2FpdCBjbGllbnQucXVlcnkoXCJVUERBVEUgbGlzdGluZ3MgU0VUIHN0YXR1cz0ncmVzZXJ2ZWQnIFdIRVJFIGlkPSQxXCIsIFtsaXN0aW5nSWRdKTtcclxuICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5KFwiSU5TRVJUIElOVE8gZnVsZmlsbG1lbnRzIChvcmRlcl9pZCxtZXRob2QsY2l0eSxwaWNrdXBfb3JfZGVsaXZlcnlfZGV0YWlscykgVkFMVUVTICgkMSwkMiwkMywkNClcIiwgW29yZGVyLnJvd3NbMF0uaWQsbWV0aG9kLGNpdHksZGV0YWlsc10pO1xyXG4gICAgICBhd2FpdCBjbGllbnQucXVlcnkoXCJJTlNFUlQgSU5UTyBub3RpZmljYXRpb25zIChwcm9maWxlX2lkLGtpbmQscGF5bG9hZCkgVkFMVUVTICgkMSwnb3JkZXJfY3JlYXRlZCcsanNvbmJfYnVpbGRfb2JqZWN0KCdvcmRlcklkJywkMjo6dGV4dCkpXCIsXHJcbiAgICAgIFtyb3cuc2VsbGVyX2lkLCBvcmRlci5yb3dzWzBdLmlkXSwpO1xyXG5cclxuICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5KFwiQ09NTUlUXCIpO1xyXG5cclxuLy8gTm90aWZpY2F0aW9uIFB1c2ggZW52b3lcdTAwRTllIHVuaXF1ZW1lbnQgYXByXHUwMEU4cyB2YWxpZGF0aW9uIGRlIGxhIHRyYW5zYWN0aW9uLlxyXG4gICAgICBhd2FpdCBzZW5kUHVzaFRvUHJvZmlsZShyb3cuc2VsbGVyX2lkLCB7XHJcbiAgdGl0bGU6IFwiTm91dmVsbGUgY29tbWFuZGVcIixcclxuICBib2R5OiBcIlVuZSBub3V2ZWxsZSBkZW1hbmRlIGNvbmNlcm5lIGwndW4gZGUgdm9zIGFydGljbGVzLlwiLFxyXG4gIHVybDogXCIvY29tbWFuZGVzXCIsXHJcbn0pO1xyXG5cclxuICAgICAgcmV0dXJuIGpzb24oey4uLm9yZGVyLnJvd3NbMF0sdG90YWw6IE51bWJlcihvcmRlci5yb3dzWzBdLnRvdGFsKSwgcGF5bWVudEVuYWJsZWQ6IGZhbHNlLCBtZXNzYWdlOiBcIlZvdHJlIGRlbWFuZGUgZXN0IGVucmVnaXN0clx1MDBFOWUuIExlIHBhaWVtZW50IHNlcmEgYWN0aXZcdTAwRTkgbG9yc3F1ZSBsZXMgYWNjXHUwMEU4cyBhdSBwcmVzdGF0YWlyZSBzZXJvbnQgY29uZmlndXJcdTAwRTlzOyBsYSBjb21tYW5kZSByZXN0ZSBlbiBhdHRlbnRlLlwiLH0sIDIwMSk7fSBcclxuICAgICAgXHJcbiAgICAgIGNhdGNoIChlcnJvcikge1xyXG4gICAgICB0cnkgeyBhd2FpdCBjbGllbnQucXVlcnkoXCJST0xMQkFDS1wiKTsgfVxyXG4gICAgICBjYXRjaCAocm9sbGJhY2tFcnJvcikgeyBjb25zb2xlLmVycm9yKFwiTWFkY2xvdGhlcyB0cmFuc2FjdGlvbiByb2xsYmFjayBmYWlsZWRcIiwgcm9sbGJhY2tFcnJvcik7IH1cclxuICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICB9XHJcbiAgICBmaW5hbGx5IHsgY2xpZW50LnJlbGVhc2UoKTsgfVxyXG4gIH1cclxuICBjb25zdCByZXZpZXdNYXRjaCA9IHBhdGgubWF0Y2goL15cXC9hcGlcXC9vcmRlcnNcXC8oW1xcdy1dKylcXC9yZXZpZXckLyk7XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJQT1NUXCIgJiYgcmV2aWV3TWF0Y2gpIHtcclxuICAgIGNvbnN0IGlucHV0ID0gYXdhaXQgYm9keTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ocmVxdWVzdCk7XHJcbiAgICBjb25zdCByYXRpbmcgPSBpbnRlZ2VyKGlucHV0LnJhdGluZywgXCJMYSBub3RlXCIsIDEsIDUpO1xyXG4gICAgY29uc3QgY29tbWVudCA9IGlucHV0LmNvbW1lbnQgPT0gbnVsbCB8fCBpbnB1dC5jb21tZW50ID09PSBcIlwiID8gbnVsbCA6IHRleHQoaW5wdXQuY29tbWVudCwgXCJMZSBjb21tZW50YWlyZVwiLCAxLCAxMjAwKTtcclxuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgcG9vbC5xdWVyeShcIlNFTEVDVCBpZCxidXllcl9pZCxzZWxsZXJfaWQgRlJPTSBvcmRlcnMgV0hFUkUgaWQ9JDEgQU5EIHN0YXR1cz0nY29tcGxldGVkJyBBTkQgKGJ1eWVyX2lkPSQyIE9SIHNlbGxlcl9pZD0kMilcIiwgW3Jldmlld01hdGNoWzFdLHVzZXIucHJvZmlsZUlkXSk7XHJcbiAgICBpZiAoIW9yZGVyLnJvd0NvdW50KSBmYWlsKDQwOSwgXCJTZXVsZSB1bmUgY29tbWFuZGUgdGVybWluXHUwMEU5ZSBwZXV0IHJlY2V2b2lyIHVuZSBcdTAwRTl2YWx1YXRpb24uXCIpO1xyXG4gICAgY29uc3QgcmV2aWV3ZWUgPSBvcmRlci5yb3dzWzBdLmJ1eWVyX2lkID09PSB1c2VyLnByb2ZpbGVJZCA/IG9yZGVyLnJvd3NbMF0uc2VsbGVyX2lkIDogb3JkZXIucm93c1swXS5idXllcl9pZDtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBvb2wucXVlcnkoXCJJTlNFUlQgSU5UTyByZXZpZXdzIChvcmRlcl9pZCxyZXZpZXdlcl9pZCxyZXZpZXdlZV9pZCxyYXRpbmcsY29tbWVudCkgVkFMVUVTICgkMSwkMiwkMywkNCwkNSkgT04gQ09ORkxJQ1QgKG9yZGVyX2lkLHJldmlld2VyX2lkKSBETyBOT1RISU5HIFJFVFVSTklORyBpZCxyYXRpbmcsY29tbWVudFwiLCBbb3JkZXIucm93c1swXS5pZCx1c2VyLnByb2ZpbGVJZCxyZXZpZXdlZSxyYXRpbmcsY29tbWVudF0pO1xyXG4gICAgaWYgKCFyZXN1bHQucm93Q291bnQpIGZhaWwoNDA5LCBcIlZvdXMgYXZleiBkXHUwMEU5alx1MDBFMCBcdTAwRTl2YWx1XHUwMEU5IGNldHRlIGNvbW1hbmRlLlwiKTtcclxuICAgIGF3YWl0IHBvb2wucXVlcnkoXCJJTlNFUlQgSU5UTyBub3RpZmljYXRpb25zIChwcm9maWxlX2lkLGtpbmQscGF5bG9hZCkgVkFMVUVTICgkMSwnbmV3X3JldmlldycsanNvbmJfYnVpbGRfb2JqZWN0KCdvcmRlcklkJywkMjo6dGV4dCkpXCIsIFtyZXZpZXdlZSxvcmRlci5yb3dzWzBdLmlkXSk7XHJcbiAgICBhd2FpdCBwb29sLnF1ZXJ5KFwiSU5TRVJUIElOVE8gYXVkaXRfbG9ncyAoYWN0b3JfaWQsYWN0aW9uLGVudGl0eV90eXBlLGVudGl0eV9pZCxtZXRhZGF0YSkgVkFMVUVTICgkMSwncmV2aWV3X2NyZWF0ZWQnLCdyZXZpZXcnLCQyLCQzOjpqc29uYilcIiwgW3VzZXIucHJvZmlsZUlkLHJlc3VsdC5yb3dzWzBdLmlkLEpTT04uc3RyaW5naWZ5KHsgcmF0aW5nIH0pXSk7XHJcbiAgICByZXR1cm4ganNvbihyZXN1bHQucm93c1swXSwgMjAxKTtcclxuICB9XHJcbiAgY29uc3QgbWF0Y2ggPSBwYXRoLm1hdGNoKC9eXFwvYXBpXFwvb3JkZXJzXFwvKFtcXHctXSspXFwvc3RhdHVzJC8pO1xyXG4gIGlmIChtZXRob2QgPT09IFwiUEFUQ0hcIiAmJiBtYXRjaCkge1xyXG4gICAgY29uc3QgaW5wdXQgPSBhd2FpdCBib2R5PFJlY29yZDxzdHJpbmcsIHVua25vd24+PihyZXF1ZXN0KTtcclxuICAgIGNvbnN0IG5leHQgPSBTdHJpbmcoaW5wdXQuc3RhdHVzIHx8IFwiXCIpO1xyXG4gICAgY29uc3QgdHJhbnNpdGlvbnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHsgcGVuZGluZ19wYXltZW50OiBbXCJjYW5jZWxsZWRcIl0sIHBhaWQ6IFtcInByb2Nlc3NpbmdcIiwgXCJkaXNwdXRlZFwiXSwgcHJvY2Vzc2luZzogW1wic2hpcHBlZFwiLCBcImNvbXBsZXRlZFwiLCBcImRpc3B1dGVkXCJdLCBzaGlwcGVkOiBbXCJjb21wbGV0ZWRcIiwgXCJkaXNwdXRlZFwiXSwgZGlzcHV0ZWQ6IFtcInJlZnVuZGVkXCJdIH07XHJcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCBwb29sLmNvbm5lY3QoKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGNsaWVudC5xdWVyeShcIkJFR0lOXCIpO1xyXG4gICAgICBjb25zdCBjdXJyZW50ID0gYXdhaXQgY2xpZW50LnF1ZXJ5KFwiU0VMRUNUIGlkLGJ1eWVyX2lkLHNlbGxlcl9pZCxzdGF0dXMgRlJPTSBvcmRlcnMgV0hFUkUgaWQ9JDEgRk9SIFVQREFURVwiLCBbbWF0Y2hbMV1dKTtcclxuICAgICAgY29uc3Qgb3JkZXIgPSBjdXJyZW50LnJvd3NbMF07XHJcbiAgICAgIGlmICghb3JkZXIgfHwgIVtvcmRlci5idXllcl9pZCxvcmRlci5zZWxsZXJfaWRdLmluY2x1ZGVzKHVzZXIucHJvZmlsZUlkKSkgZmFpbCg0MDQsIFwiQ29tbWFuZGUgaW50cm91dmFibGUuXCIpO1xyXG4gICAgICBpZiAoIXRyYW5zaXRpb25zW29yZGVyLnN0YXR1c10/LmluY2x1ZGVzKG5leHQpKSBmYWlsKDQwOSwgXCJDZXR0ZSB0cmFuc2l0aW9uIGRlIGNvbW1hbmRlIG4nZXN0IHBhcyBhdXRvcmlzXHUwMEU5ZS5cIik7XHJcbiAgICAgIGlmICgobmV4dCA9PT0gXCJwcm9jZXNzaW5nXCIgfHwgbmV4dCA9PT0gXCJzaGlwcGVkXCIpICYmIG9yZGVyLnNlbGxlcl9pZCAhPT0gdXNlci5wcm9maWxlSWQpIGZhaWwoNDAzLCBcIlNldWwgbGUgdmVuZGV1ciBwZXV0IG1ldHRyZSBcdTAwRTAgam91ciBjZXR0ZSBcdTAwRTl0YXBlLlwiKTtcclxuICAgICAgaWYgKG5leHQgPT09IFwiY2FuY2VsbGVkXCIgJiYgb3JkZXIuYnV5ZXJfaWQgIT09IHVzZXIucHJvZmlsZUlkKSBmYWlsKDQwMywgXCJTZXVsIGwnYWNoZXRldXIgcGV1dCBhbm51bGVyIGNldHRlIGRlbWFuZGUuXCIpO1xyXG4gICAgICBpZiAobmV4dCA9PT0gXCJjb21wbGV0ZWRcIiAmJiBvcmRlci5idXllcl9pZCAhPT0gdXNlci5wcm9maWxlSWQpIGZhaWwoNDAzLCBcIlNldWwgbCdhY2hldGV1ciBwZXV0IGNvbmZpcm1lciBsYSByXHUwMEU5Y2VwdGlvbi5cIik7XHJcbiAgICAgIGF3YWl0IGNsaWVudC5xdWVyeShcIlVQREFURSBvcmRlcnMgU0VUIHN0YXR1cz0kMiBXSEVSRSBpZD0kMVwiLCBbb3JkZXIuaWQsbmV4dF0pO1xyXG4gICAgICBpZiAobmV4dCA9PT0gXCJjb21wbGV0ZWRcIikgYXdhaXQgY2xpZW50LnF1ZXJ5KFwiVVBEQVRFIGxpc3RpbmdzIFNFVCBzdGF0dXM9J3NvbGQnIFdIRVJFIGlkPShTRUxFQ1QgbGlzdGluZ19pZCBGUk9NIG9yZGVycyBXSEVSRSBpZD0kMSlcIiwgW29yZGVyLmlkXSk7XHJcbiAgICAgIGlmIChuZXh0ID09PSBcImNhbmNlbGxlZFwiKSBhd2FpdCBjbGllbnQucXVlcnkoXCJVUERBVEUgbGlzdGluZ3MgU0VUIHN0YXR1cz0ncHVibGlzaGVkJyBXSEVSRSBpZD0oU0VMRUNUIGxpc3RpbmdfaWQgRlJPTSBvcmRlcnMgV0hFUkUgaWQ9JDEpIEFORCBzdGF0dXM9J3Jlc2VydmVkJ1wiLCBbb3JkZXIuaWRdKTtcclxuICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5KFwiSU5TRVJUIElOVE8gbm90aWZpY2F0aW9ucyAocHJvZmlsZV9pZCxraW5kLHBheWxvYWQpIFZBTFVFUyAoJDEsJ29yZGVyX3N0YXR1cycsanNvbmJfYnVpbGRfb2JqZWN0KCdvcmRlcklkJywkMjo6dGV4dCwnc3RhdHVzJywkMzo6dGV4dCkpXCIsIFtvcmRlci5idXllcl9pZCA9PT0gdXNlci5wcm9maWxlSWQgPyBvcmRlci5zZWxsZXJfaWQgOiBvcmRlci5idXllcl9pZCxvcmRlci5pZCxuZXh0XSk7XHJcbiAgICAgIGF3YWl0IGNsaWVudC5xdWVyeShcIkNPTU1JVFwiKTtcclxuICAgICAgcmV0dXJuIGpzb24oeyBpZDogb3JkZXIuaWQsIHN0YXR1czogbmV4dCB9KTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0cnkgeyBhd2FpdCBjbGllbnQucXVlcnkoXCJST0xMQkFDS1wiKTsgfVxuICAgICAgY2F0Y2ggKHJvbGxiYWNrRXJyb3IpIHsgY29uc29sZS5lcnJvcihcIk1hZGNsb3RoZXMgdHJhbnNhY3Rpb24gcm9sbGJhY2sgZmFpbGVkXCIsIHJvbGxiYWNrRXJyb3IpOyB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XHJcbiAgICBmaW5hbGx5IHsgY2xpZW50LnJlbGVhc2UoKTsgfVxyXG4gIH1cclxuICBmYWlsKDQwNCwgXCJSb3V0ZSBjb21tYW5kZSBpbnRyb3V2YWJsZS5cIik7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG1lc3NhZ2luZyhyZXF1ZXN0OiBSZXF1ZXN0LCBtZXRob2Q6IHN0cmluZywgcGF0aDogc3RyaW5nKSB7XHJcbiAgY29uc3QgdXNlciA9IGF3YWl0IGF1dGhlbnRpY2F0ZWQocmVxdWVzdCk7XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJHRVRcIiAmJiBwYXRoID09PSBcIi9hcGkvY29udmVyc2F0aW9uc1wiKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb29sLnF1ZXJ5KFxyXG4gICAgICBgU0VMRUNUIGMuaWQsIGMubGlzdGluZ19pZCBBUyBcImxpc3RpbmdJZFwiLCBsLnRpdGxlIEFTIFwibGlzdGluZ1RpdGxlXCIsIGMubGFzdF9tZXNzYWdlX2F0IEFTIFwibGFzdE1lc3NhZ2VBdFwiLFxyXG4gICAgICAgQ0FTRSBXSEVOIGMuYnV5ZXJfaWQ9JDEgVEhFTiBwcy5kaXNwbGF5X25hbWUgRUxTRSBwYi5kaXNwbGF5X25hbWUgRU5EIEFTIFwib3RoZXJOYW1lXCIsXHJcbiAgICAgICAoU0VMRUNUIGJvZHkgRlJPTSBtZXNzYWdlcyBtIFdIRVJFIG0uY29udmVyc2F0aW9uX2lkPWMuaWQgT1JERVIgQlkgY3JlYXRlZF9hdCBERVNDIExJTUlUIDEpIEFTIFwibGFzdE1lc3NhZ2VcIlxyXG4gICAgICAgRlJPTSBjb252ZXJzYXRpb25zIGMgSk9JTiBsaXN0aW5ncyBsIE9OIGwuaWQ9Yy5saXN0aW5nX2lkIEpPSU4gcHJvZmlsZXMgcGIgT04gcGIuaWQ9Yy5idXllcl9pZCBKT0lOIHByb2ZpbGVzIHBzIE9OIHBzLmlkPWMuc2VsbGVyX2lkXHJcbiAgICAgICBXSEVSRSBjLmJ1eWVyX2lkPSQxIE9SIGMuc2VsbGVyX2lkPSQxIE9SREVSIEJZIGMubGFzdF9tZXNzYWdlX2F0IERFU0NgLCBbdXNlci5wcm9maWxlSWRdLFxyXG4gICAgKTtcclxuICAgIHJldHVybiBqc29uKHJlc3VsdC5yb3dzKTtcclxuICB9XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJQT1NUXCIgJiYgcGF0aCA9PT0gXCIvYXBpL2NvbnZlcnNhdGlvbnNcIikge1xyXG4gICAgY29uc3QgaW5wdXQgPSBhd2FpdCBib2R5PFJlY29yZDxzdHJpbmcsIHVua25vd24+PihyZXF1ZXN0KTtcclxuICAgIGNvbnN0IGxpc3RpbmdJZCA9IHRleHQoaW5wdXQubGlzdGluZ0lkLCBcIkwnYW5ub25jZVwiLCAxLCA4MCk7XHJcbiAgICBjb25zdCBtZXNzYWdlID0gdGV4dChpbnB1dC5tZXNzYWdlLCBcIkxlIG1lc3NhZ2VcIiwgMSwgNTAwMCk7XHJcbiAgICBjb25zdCBsaXN0aW5nID0gYXdhaXQgcG9vbC5xdWVyeShcIlNFTEVDVCBpZCxzZWxsZXJfaWQgRlJPTSBsaXN0aW5ncyBXSEVSRSBpZD0kMSBBTkQgc3RhdHVzPSdwdWJsaXNoZWQnXCIsIFtsaXN0aW5nSWRdKTtcclxuICAgIGlmICghbGlzdGluZy5yb3dDb3VudCkgZmFpbCg0MDQsIFwiQW5ub25jZSBpbnRyb3V2YWJsZS5cIik7XHJcbiAgICBpZiAobGlzdGluZy5yb3dzWzBdLnNlbGxlcl9pZCA9PT0gdXNlci5wcm9maWxlSWQpIGZhaWwoNDAwLCBcIlZvdXMgXHUwMEVBdGVzIGxlIHZlbmRldXIgZGUgY2V0dGUgYW5ub25jZS5cIik7XHJcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCBwb29sLmNvbm5lY3QoKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGNsaWVudC5xdWVyeShcIkJFR0lOXCIpO1xyXG4gICAgICBjb25zdCBjb252ZXJzYXRpb24gPSBhd2FpdCBjbGllbnQucXVlcnkoXHJcbiAgICAgICAgYElOU0VSVCBJTlRPIGNvbnZlcnNhdGlvbnMgKGxpc3RpbmdfaWQsYnV5ZXJfaWQsc2VsbGVyX2lkKSBWQUxVRVMgKCQxLCQyLCQzKVxyXG4gICAgICAgICBPTiBDT05GTElDVCAobGlzdGluZ19pZCxidXllcl9pZCkgRE8gVVBEQVRFIFNFVCBsYXN0X21lc3NhZ2VfYXQ9bm93KCkgUkVUVVJOSU5HIGlkYCxcclxuICAgICAgICBbbGlzdGluZ0lkLHVzZXIucHJvZmlsZUlkLGxpc3Rpbmcucm93c1swXS5zZWxsZXJfaWRdLFxyXG4gICAgICApO1xyXG4gICAgICBjb25zdCBpZCA9IGNvbnZlcnNhdGlvbi5yb3dzWzBdLmlkO1xyXG4gICAgICBhd2FpdCBjbGllbnQucXVlcnkoXCJJTlNFUlQgSU5UTyBtZXNzYWdlcyAoY29udmVyc2F0aW9uX2lkLHNlbmRlcl9pZCxib2R5KSBWQUxVRVMgKCQxLCQyLCQzKVwiLCBbaWQsdXNlci5wcm9maWxlSWQsbWVzc2FnZV0pO1xyXG4gICAgICBhd2FpdCBjbGllbnQucXVlcnkoXCJVUERBVEUgY29udmVyc2F0aW9ucyBTRVQgbGFzdF9tZXNzYWdlX2F0PW5vdygpIFdIRVJFIGlkPSQxXCIsIFtpZF0pO1xyXG4gICAgICBhd2FpdCBjbGllbnQucXVlcnkoXCJJTlNFUlQgSU5UTyBub3RpZmljYXRpb25zIChwcm9maWxlX2lkLGtpbmQscGF5bG9hZCkgVkFMVUVTICgkMSwnbmV3X21lc3NhZ2UnLGpzb25iX2J1aWxkX29iamVjdCgnY29udmVyc2F0aW9uSWQnLCQyOjp0ZXh0KSlcIiwgW2xpc3Rpbmcucm93c1swXS5zZWxsZXJfaWQsaWRdKTtcclxuICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5KFwiQ09NTUlUXCIpO1xyXG4gICAgICByZXR1cm4ganNvbih7IGlkIH0sIDIwMSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdHJ5IHsgYXdhaXQgY2xpZW50LnF1ZXJ5KFwiUk9MTEJBQ0tcIik7IH1cbiAgICAgIGNhdGNoIChyb2xsYmFja0Vycm9yKSB7IGNvbnNvbGUuZXJyb3IoXCJNYWRjbG90aGVzIHRyYW5zYWN0aW9uIHJvbGxiYWNrIGZhaWxlZFwiLCByb2xsYmFja0Vycm9yKTsgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxyXG4gICAgZmluYWxseSB7IGNsaWVudC5yZWxlYXNlKCk7IH1cclxuICB9XHJcbiAgY29uc3QgbWF0Y2ggPSBwYXRoLm1hdGNoKC9eXFwvYXBpXFwvY29udmVyc2F0aW9uc1xcLyhbXFx3LV0rKSQvKTtcclxuICBpZiAobWV0aG9kID09PSBcIkdFVFwiICYmIG1hdGNoKSB7XHJcbiAgICBjb25zdCBhbGxvd2VkID0gYXdhaXQgcG9vbC5xdWVyeShcIlNFTEVDVCBpZCBGUk9NIGNvbnZlcnNhdGlvbnMgV0hFUkUgaWQ9JDEgQU5EIChidXllcl9pZD0kMiBPUiBzZWxsZXJfaWQ9JDIpXCIsIFttYXRjaFsxXSx1c2VyLnByb2ZpbGVJZF0pO1xyXG4gICAgaWYgKCFhbGxvd2VkLnJvd0NvdW50KSBmYWlsKDQwNCwgXCJDb252ZXJzYXRpb24gaW50cm91dmFibGUuXCIpO1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcG9vbC5xdWVyeShcIlNFTEVDVCBtLmlkLG0uYm9keSxtLmNyZWF0ZWRfYXQgQVMgXFxcImNyZWF0ZWRBdFxcXCIsbS5zZW5kZXJfaWQ9JDIgQVMgXFxcIm93blxcXCIscC5kaXNwbGF5X25hbWUgQVMgXFxcInNlbmRlck5hbWVcXFwiIEZST00gbWVzc2FnZXMgbSBKT0lOIHByb2ZpbGVzIHAgT04gcC5pZD1tLnNlbmRlcl9pZCBXSEVSRSBtLmNvbnZlcnNhdGlvbl9pZD0kMSBPUkRFUiBCWSBtLmNyZWF0ZWRfYXRcIiwgW21hdGNoWzFdLHVzZXIucHJvZmlsZUlkXSk7XHJcbiAgICBhd2FpdCBwb29sLnF1ZXJ5KFwiVVBEQVRFIG1lc3NhZ2VzIFNFVCByZWFkX2F0PW5vdygpIFdIRVJFIGNvbnZlcnNhdGlvbl9pZD0kMSBBTkQgc2VuZGVyX2lkPD4kMiBBTkQgcmVhZF9hdCBJUyBOVUxMXCIsIFttYXRjaFsxXSx1c2VyLnByb2ZpbGVJZF0pO1xyXG4gICAgcmV0dXJuIGpzb24ocmVzdWx0LnJvd3MpO1xyXG4gIH1cclxuICBpZiAobWV0aG9kID09PSBcIlBPU1RcIiAmJiBtYXRjaCkge1xyXG4gICAgY29uc3QgaW5wdXQgPSBhd2FpdCBib2R5PFJlY29yZDxzdHJpbmcsIHVua25vd24+PihyZXF1ZXN0KTtcclxuICAgIGNvbnN0IG1lc3NhZ2UgPSB0ZXh0KGlucHV0Lm1lc3NhZ2UsIFwiTGUgbWVzc2FnZVwiLCAxLCA1MDAwKTtcclxuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHBvb2wuY29ubmVjdCgpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5KFwiQkVHSU5cIik7XHJcbiAgICAgIGNvbnN0IGFsbG93ZWQgPSBhd2FpdCBjbGllbnQucXVlcnkoXCJTRUxFQ1QgaWQsYnV5ZXJfaWQsc2VsbGVyX2lkIEZST00gY29udmVyc2F0aW9ucyBXSEVSRSBpZD0kMSBBTkQgKGJ1eWVyX2lkPSQyIE9SIHNlbGxlcl9pZD0kMikgRk9SIFVQREFURVwiLCBbbWF0Y2hbMV0sdXNlci5wcm9maWxlSWRdKTtcclxuICAgICAgaWYgKCFhbGxvd2VkLnJvd0NvdW50KSBmYWlsKDQwNCwgXCJDb252ZXJzYXRpb24gaW50cm91dmFibGUuXCIpO1xyXG4gICAgICBhd2FpdCBjbGllbnQucXVlcnkoXCJJTlNFUlQgSU5UTyBtZXNzYWdlcyAoY29udmVyc2F0aW9uX2lkLHNlbmRlcl9pZCxib2R5KSBWQUxVRVMgKCQxLCQyLCQzKVwiLCBbbWF0Y2hbMV0sdXNlci5wcm9maWxlSWQsbWVzc2FnZV0pO1xyXG4gICAgICBhd2FpdCBjbGllbnQucXVlcnkoXCJVUERBVEUgY29udmVyc2F0aW9ucyBTRVQgbGFzdF9tZXNzYWdlX2F0PW5vdygpIFdIRVJFIGlkPSQxXCIsIFttYXRjaFsxXV0pO1xyXG4gICAgICBjb25zdCB0YXJnZXQgPSBhbGxvd2VkLnJvd3NbMF0uYnV5ZXJfaWQgPT09IHVzZXIucHJvZmlsZUlkID8gYWxsb3dlZC5yb3dzWzBdLnNlbGxlcl9pZCA6IGFsbG93ZWQucm93c1swXS5idXllcl9pZDtcclxuICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5KFwiSU5TRVJUIElOVE8gbm90aWZpY2F0aW9ucyAocHJvZmlsZV9pZCxraW5kLHBheWxvYWQpIFZBTFVFUyAoJDEsJ25ld19tZXNzYWdlJyxqc29uYl9idWlsZF9vYmplY3QoJ2NvbnZlcnNhdGlvbklkJywkMjo6dGV4dCkpXCIsIFt0YXJnZXQsbWF0Y2hbMV1dKTtcclxuICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5KFwiQ09NTUlUXCIpO1xyXG4gICAgICByZXR1cm4ganNvbih7IHNlbnQ6IHRydWUgfSwgMjAxKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIHRyeSB7IGF3YWl0IGNsaWVudC5xdWVyeShcIlJPTExCQUNLXCIpOyB9XHJcbiAgICAgIGNhdGNoIChyb2xsYmFja0Vycm9yKSB7IGNvbnNvbGUuZXJyb3IoXCJNYWRjbG90aGVzIHRyYW5zYWN0aW9uIHJvbGxiYWNrIGZhaWxlZFwiLCByb2xsYmFja0Vycm9yKTsgfVxyXG4gICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH0gZmluYWxseSB7IGNsaWVudC5yZWxlYXNlKCk7IH1cclxuICB9XHJcbiAgZmFpbCg0MDQsIFwiUm91dGUgbWVzc2FnZXJpZSBpbnRyb3V2YWJsZS5cIik7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHB1c2hTdWJzY3JpcHRpb25zKHJlcXVlc3Q6IFJlcXVlc3QsIG1ldGhvZDogc3RyaW5nKSB7XHJcbiAgY29uc3QgdXNlciA9IGF3YWl0IGF1dGhlbnRpY2F0ZWQocmVxdWVzdCk7XHJcblxyXG4gIGlmIChtZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICBjb25zdCBpbnB1dCA9IGF3YWl0IGJvZHk8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+KHJlcXVlc3QpO1xyXG4gICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gaW5wdXQuc3Vic2NyaXB0aW9uID8/IGlucHV0O1xyXG5cclxuICAgIGF3YWl0IHNhdmVQdXNoU3Vic2NyaXB0aW9uKHVzZXIucHJvZmlsZUlkLCBzdWJzY3JpcHRpb24pO1xyXG5cclxuICAgIHJldHVybiBqc29uKHsgc3Vic2NyaWJlZDogdHJ1ZSB9LCAyMDEpO1xyXG4gIH1cclxuXHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJERUxFVEVcIikge1xyXG4gICAgY29uc3QgaW5wdXQgPSBhd2FpdCBib2R5PFJlY29yZDxzdHJpbmcsIHVua25vd24+PihyZXF1ZXN0KTtcclxuXHJcbiAgICBhd2FpdCBkZWxldGVQdXNoU3Vic2NyaXB0aW9uKHVzZXIucHJvZmlsZUlkLCBpbnB1dC5lbmRwb2ludCk7XHJcblxyXG4gICAgcmV0dXJuIGpzb24oeyB1bnN1YnNjcmliZWQ6IHRydWUgfSk7XHJcbiAgfVxyXG5cclxuICBmYWlsKDQwNSwgXCJNXHUwMEU5dGhvZGUgbm9uIGF1dG9yaXNcdTAwRTllLlwiKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gbm90aWZpY2F0aW9ucyhyZXF1ZXN0OiBSZXF1ZXN0LCBtZXRob2Q6IHN0cmluZywgcGF0aDogc3RyaW5nKSB7XHJcbiAgY29uc3QgdXNlciA9IGF3YWl0IGF1dGhlbnRpY2F0ZWQocmVxdWVzdCk7XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJHRVRcIiAmJiBwYXRoID09PSBcIi9hcGkvbm90aWZpY2F0aW9uc1wiKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb29sLnF1ZXJ5KFwiU0VMRUNUIGlkLGtpbmQscGF5bG9hZCxyZWFkX2F0IEFTIFxcXCJyZWFkQXRcXFwiLGNyZWF0ZWRfYXQgQVMgXFxcImNyZWF0ZWRBdFxcXCIgRlJPTSBub3RpZmljYXRpb25zIFdIRVJFIHByb2ZpbGVfaWQ9JDEgT1JERVIgQlkgY3JlYXRlZF9hdCBERVNDIExJTUlUIDUwXCIsIFt1c2VyLnByb2ZpbGVJZF0pO1xyXG4gICAgcmV0dXJuIGpzb24ocmVzdWx0LnJvd3MpO1xyXG4gIH1cclxuICBpZiAobWV0aG9kID09PSBcIlBBVENIXCIgJiYgcGF0aCA9PT0gXCIvYXBpL25vdGlmaWNhdGlvbnMvcmVhZC1hbGxcIikge1xyXG4gICAgYXdhaXQgcG9vbC5xdWVyeShcIlVQREFURSBub3RpZmljYXRpb25zIFNFVCByZWFkX2F0PW5vdygpIFdIRVJFIHByb2ZpbGVfaWQ9JDEgQU5EIHJlYWRfYXQgSVMgTlVMTFwiLCBbdXNlci5wcm9maWxlSWRdKTtcclxuICAgIHJldHVybiBqc29uKHsgcmVhZDogdHJ1ZSB9KTtcclxuICB9XHJcbiAgY29uc3QgbWF0Y2ggPSBwYXRoLm1hdGNoKC9eXFwvYXBpXFwvbm90aWZpY2F0aW9uc1xcLyhbXFx3LV0rKVxcL3JlYWQkLyk7XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJQQVRDSFwiICYmIG1hdGNoKSB7XHJcbiAgICBhd2FpdCBwb29sLnF1ZXJ5KFwiVVBEQVRFIG5vdGlmaWNhdGlvbnMgU0VUIHJlYWRfYXQ9bm93KCkgV0hFUkUgaWQ9JDEgQU5EIHByb2ZpbGVfaWQ9JDJcIiwgW21hdGNoWzFdLHVzZXIucHJvZmlsZUlkXSk7XHJcbiAgICByZXR1cm4ganNvbih7IHJlYWQ6IHRydWUgfSk7XHJcbiAgfVxyXG4gIGZhaWwoNDA0LCBcIlJvdXRlIG5vdGlmaWNhdGlvbiBpbnRyb3V2YWJsZS5cIik7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGFkbWluKHJlcXVlc3Q6IFJlcXVlc3QsIG1ldGhvZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpIHtcclxuICBjb25zdCB1c2VyID0gYXdhaXQgYXV0aGVudGljYXRlZChyZXF1ZXN0KTtcclxuICBpZiAobWV0aG9kID09PSBcIlBBVENIXCIgJiYgcGF0aCA9PT0gXCIvYXBpL2FkbWluL2NvbW1pc3Npb25zXCIpIHtcclxuICAgIGlmICh1c2VyLnJvbGUgIT09IFwiYWRtaW5cIikgZmFpbCg0MDMsIFwiU2V1bHMgbGVzIGFkbWluaXN0cmF0ZXVycyBwZXV2ZW50IG1vZGlmaWVyIGxlIGJhclx1MDBFOG1lLlwiKTtcclxuICAgIGNvbnN0IGlucHV0ID0gYXdhaXQgYm9keTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ocmVxdWVzdCk7XHJcbiAgICBjb25zdCBzZWxsZXJCcHMgPSBpbnRlZ2VyKGlucHV0LnNlbGxlckJwcywgXCJMYSBjb21taXNzaW9uIHZlbmRldXJcIiwgMCwgMl8wMDApO1xyXG4gICAgY29uc3QgdmFsdWUgPSB7IHNlbGxlcl9icHM6IHNlbGxlckJwcywgY29uZmlndXJlZDogaW5wdXQuY29uZmlndXJlZCAhPT0gZmFsc2UgfTtcclxuICAgIGF3YWl0IHBvb2wucXVlcnkoXHJcbiAgICAgIGBJTlNFUlQgSU5UTyBwbGF0Zm9ybV9zZXR0aW5ncyAoa2V5LHZhbHVlKSBWQUxVRVMgKCdjb21taXNzaW9uX3JhdGVzJywkMTo6anNvbmIpXHJcbiAgICAgICBPTiBDT05GTElDVCAoa2V5KSBETyBVUERBVEUgU0VUIHZhbHVlPUVYQ0xVREVELnZhbHVlLCB1cGRhdGVkX2F0PW5vdygpYCwgW0pTT04uc3RyaW5naWZ5KHZhbHVlKV0sXHJcbiAgICApO1xyXG4gICAgYXdhaXQgcG9vbC5xdWVyeShcIklOU0VSVCBJTlRPIGF1ZGl0X2xvZ3MgKGFjdG9yX2lkLGFjdGlvbixlbnRpdHlfdHlwZSxtZXRhZGF0YSkgVkFMVUVTICgkMSwnY29tbWlzc2lvbl9yYXRlc191cGRhdGVkJywncGxhdGZvcm1fc2V0dGluZycsJDI6Ompzb25iKVwiLCBbdXNlci5wcm9maWxlSWQsSlNPTi5zdHJpbmdpZnkoeyBzZWxsZXJfYnBzOiBzZWxsZXJCcHMgfSldKTtcclxuICAgIHJldHVybiBqc29uKHsgY29uZmlndXJlZDogdmFsdWUuY29uZmlndXJlZCwgc2VsbGVyQnBzIH0pO1xyXG4gIH1cclxuICBpZiAodXNlci5yb2xlICE9PSBcImFkbWluXCIgJiYgdXNlci5yb2xlICE9PSBcIm1vZGVyYXRvclwiKSBmYWlsKDQwMywgXCJBY2NcdTAwRThzIHJcdTAwRTlzZXJ2XHUwMEU5IFx1MDBFMCBsJ1x1MDBFOXF1aXBlIGRlIG1vZFx1MDBFOXJhdGlvbi5cIik7XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJHRVRcIiAmJiBwYXRoID09PSBcIi9hcGkvYWRtaW4vcmVwb3J0c1wiKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb29sLnF1ZXJ5KFxyXG4gICAgICBgU0VMRUNUIHIuaWQsci50YXJnZXRfdHlwZSBBUyBcInRhcmdldFR5cGVcIixyLnRhcmdldF9pZCBBUyBcInRhcmdldElkXCIsci5yZWFzb24sci5zdGF0dXMsci5jcmVhdGVkX2F0IEFTIFwiY3JlYXRlZEF0XCIscC5kaXNwbGF5X25hbWUgQVMgcmVwb3J0ZXJcclxuICAgICAgIEZST00gbW9kZXJhdGlvbl9yZXBvcnRzIHIgSk9JTiBwcm9maWxlcyBwIE9OIHAuaWQ9ci5yZXBvcnRlcl9pZCBXSEVSRSByLnN0YXR1cyBJTiAoJ29wZW4nLCdyZXZpZXdpbmcnKSBPUkRFUiBCWSByLmNyZWF0ZWRfYXRgLFxyXG4gICAgKTtcclxuICAgIHJldHVybiBqc29uKHJlc3VsdC5yb3dzKTtcclxuICB9XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJQQVRDSFwiICYmIC9eXFwvYXBpXFwvYWRtaW5cXC9yZXBvcnRzXFwvW1xcdy1dKyQvLnRlc3QocGF0aCkpIHtcclxuICAgIGNvbnN0IGlkID0gcGF0aC5zcGxpdChcIi9cIikuYXQoLTEpITtcclxuICAgIGNvbnN0IGlucHV0ID0gYXdhaXQgYm9keTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ocmVxdWVzdCk7XHJcbiAgICBjb25zdCBzdGF0dXMgPSBTdHJpbmcoaW5wdXQuc3RhdHVzIHx8IFwiXCIpO1xyXG4gICAgaWYgKCEoW1wicmV2aWV3aW5nXCIsXCJyZXNvbHZlZFwiLFwiZGlzbWlzc2VkXCJdIGFzIHN0cmluZ1tdKS5pbmNsdWRlcyhzdGF0dXMpKSBmYWlsKDQwMCwgXCJTdGF0dXQgZGUgbW9kXHUwMEU5cmF0aW9uIGludmFsaWRlLlwiKTtcclxuICAgIGNvbnN0IG5vdGUgPSBpbnB1dC5ub3RlID09IG51bGwgPyBudWxsIDogdGV4dChpbnB1dC5ub3RlLCBcIkxhIG5vdGVcIiwgMCwgMTAwMCk7XHJcbiAgICBpZiAoaW5wdXQuYWN0aW9uID09PSBcInN1c3BlbmRfdGFyZ2V0XCIpIHtcclxuICAgICAgY29uc3QgdGFyZ2V0ID0gYXdhaXQgcG9vbC5xdWVyeShcIlNFTEVDVCB0YXJnZXRfdHlwZSx0YXJnZXRfaWQgRlJPTSBtb2RlcmF0aW9uX3JlcG9ydHMgV0hFUkUgaWQ9JDFcIiwgW2lkXSk7XHJcbiAgICAgIGlmICghdGFyZ2V0LnJvd0NvdW50KSBmYWlsKDQwNCwgXCJTaWduYWxlbWVudCBpbnRyb3V2YWJsZS5cIik7XHJcbiAgICAgIGlmICh0YXJnZXQucm93c1swXS50YXJnZXRfdHlwZSA9PT0gXCJsaXN0aW5nXCIpIHtcclxuICAgICAgICBhd2FpdCBwb29sLnF1ZXJ5KFwiVVBEQVRFIGxpc3RpbmdzIFNFVCBzdGF0dXM9J3N1c3BlbmRlZCcgV0hFUkUgaWQ9JDEgQU5EIHN0YXR1cyBJTiAoJ3B1Ymxpc2hlZCcsJ3Jlc2VydmVkJylcIiwgW3RhcmdldC5yb3dzWzBdLnRhcmdldF9pZF0pO1xyXG4gICAgICB9IGVsc2UgaWYgKHRhcmdldC5yb3dzWzBdLnRhcmdldF90eXBlID09PSBcInByb2ZpbGVcIikge1xyXG4gICAgICAgIGlmICh1c2VyLnJvbGUgIT09IFwiYWRtaW5cIikgZmFpbCg0MDMsIFwiU2V1bCB1biBhZG1pbmlzdHJhdGV1ciBwZXV0IHN1c3BlbmRyZSB1biBjb21wdGUuXCIpO1xyXG4gICAgICAgIGlmICh0YXJnZXQucm93c1swXS50YXJnZXRfaWQgPT09IHVzZXIucHJvZmlsZUlkKSBmYWlsKDQwMCwgXCJWb3VzIG5lIHBvdXZleiBwYXMgc3VzcGVuZHJlIHZvdHJlIHByb3ByZSBjb21wdGUuXCIpO1xyXG4gICAgICAgIGF3YWl0IHBvb2wucXVlcnkoXCJVUERBVEUgcHJvZmlsZXMgU0VUIHN0YXR1cz0nc3VzcGVuZGVkJyBXSEVSRSBpZD0kMVwiLCBbdGFyZ2V0LnJvd3NbMF0udGFyZ2V0X2lkXSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZmFpbCg0MDAsIFwiQ2V0dGUgY2libGUgbmUgcGV1dCBwYXMgXHUwMEVBdHJlIHN1c3BlbmR1ZSBkZXB1aXMgY2V0dGUgYWN0aW9uLlwiKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcG9vbC5xdWVyeShcclxuICAgICAgYFVQREFURSBtb2RlcmF0aW9uX3JlcG9ydHMgU0VUIHN0YXR1cz0kMixyZXZpZXdlcl9pZD0kMyxyZXNvbHV0aW9uX25vdGU9JDQscmVzb2x2ZWRfYXQ9Q0FTRSBXSEVOICQyIElOICgncmVzb2x2ZWQnLCdkaXNtaXNzZWQnKSBUSEVOIG5vdygpIEVMU0UgTlVMTCBFTkRcclxuICAgICAgIFdIRVJFIGlkPSQxIFJFVFVSTklORyBpZCxzdGF0dXNgLCBbaWQsc3RhdHVzLHVzZXIucHJvZmlsZUlkLG5vdGVdLFxyXG4gICAgKTtcclxuICAgIGlmICghcmVzdWx0LnJvd0NvdW50KSBmYWlsKDQwNCwgXCJTaWduYWxlbWVudCBpbnRyb3V2YWJsZS5cIik7XHJcbiAgICBhd2FpdCBwb29sLnF1ZXJ5KFwiSU5TRVJUIElOVE8gYXVkaXRfbG9ncyAoYWN0b3JfaWQsYWN0aW9uLGVudGl0eV90eXBlLGVudGl0eV9pZCxtZXRhZGF0YSkgVkFMVUVTICgkMSwnbW9kZXJhdGlvbl9yZXBvcnRfdXBkYXRlZCcsJ21vZGVyYXRpb25fcmVwb3J0JywkMiwkMzo6anNvbmIpXCIsIFt1c2VyLnByb2ZpbGVJZCxpZCxKU09OLnN0cmluZ2lmeSh7IHN0YXR1cyB9KV0pO1xyXG4gICAgcmV0dXJuIGpzb24ocmVzdWx0LnJvd3NbMF0pO1xyXG4gIH1cclxuICBmYWlsKDQwNCwgXCJSb3V0ZSBhZG1pbmlzdHJhdGlvbiBpbnRyb3V2YWJsZS5cIik7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHNpdGVtYXAocmVxdWVzdDogUmVxdWVzdCkge1xyXG4gIGNvbnN0IHJlcXVlc3RPcmlnaW4gPSBuZXcgVVJMKHJlcXVlc3QudXJsKS5vcmlnaW47XHJcbiAgY29uc3QgY29uZmlndXJlZE9yaWdpbiA9IHByb2Nlc3MuZW52LlBVQkxJQ19TSVRFX1VSTCB8fCBwcm9jZXNzLmVudi5TSVRFX1VSTCB8fCByZXF1ZXN0T3JpZ2luO1xyXG4gIGNvbnN0IG9yaWdpbiA9IG5ldyBVUkwoY29uZmlndXJlZE9yaWdpbikub3JpZ2luO1xyXG4gIGNvbnN0IHN0YXRpY1BhdGhzID0gW1wiL1wiLCBcIi9ib3V0aXF1ZVwiLCBcIi9jYXRlZ29yaWVzXCIsIFwiL3NlbGVjdGlvblwiLCBcIi9mb25jdGlvbm5lbWVudFwiLCBcIi9jb21taXNzaW9uc1wiLCBcIi9hdmlzXCIsIFwiL25vdXZlYXV0ZXNcIiwgXCIvdmVuZHJlLXN1ci1tYWRjbG90aGVzXCIsIFwiL2NvbnRhY3RcIiwgXCIvYWlkZVwiLCBcIi9jb25kaXRpb25zXCIsIFwiL2NvbmZpZGVudGlhbGl0ZVwiLCBcIi9tZW50aW9ucy1sZWdhbGVzXCJdO1xyXG4gIGNvbnN0IGVudHJpZXM6IEFycmF5PHsgcGF0aDogc3RyaW5nOyB1cGRhdGVkQXQ6IERhdGUgfCBzdHJpbmcgfCBudWxsIH0+ID0gc3RhdGljUGF0aHMubWFwKChwYXRoKSA9PiAoeyBwYXRoLCB1cGRhdGVkQXQ6IG51bGwgfSkpO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb29sLnF1ZXJ5PHsgaWQ6IHN0cmluZzsgdXBkYXRlZF9hdDogRGF0ZSB8IHN0cmluZyB9PihcclxuICAgICAgXCJTRUxFQ1QgaWQsIHVwZGF0ZWRfYXQgRlJPTSBsaXN0aW5ncyBXSEVSRSBzdGF0dXMgPSAncHVibGlzaGVkJyBPUkRFUiBCWSBwdWJsaXNoZWRfYXQgREVTQyBOVUxMUyBMQVNUIExJTUlUIDUwMDBcIixcclxuICAgICk7XHJcbiAgICBmb3IgKGNvbnN0IGxpc3Rpbmcgb2YgcmVzdWx0LnJvd3MpIGVudHJpZXMucHVzaCh7IHBhdGg6IGAvYXJ0aWNsZS8ke2xpc3RpbmcuaWR9YCwgdXBkYXRlZEF0OiBsaXN0aW5nLnVwZGF0ZWRfYXQgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUud2FybihcIlNpdGVtYXAgbGlzdGluZyBVUkxzIHVuYXZhaWxhYmxlOyBzZXJ2aW5nIHB1YmxpYyBwYWdlcyBvbmx5LlwiLCBlcnJvcik7XHJcbiAgfVxyXG4gIGNvbnN0IHhtbEVzY2FwZSA9ICh2YWx1ZTogc3RyaW5nKSA9PiB2YWx1ZS5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIikucmVwbGFjZSgvPC9nLCBcIiZsdDtcIikucmVwbGFjZSgvPi9nLCBcIiZndDtcIikucmVwbGFjZSgvXCIvZywgXCImcXVvdDtcIikucmVwbGFjZSgvJy9nLCBcIiZhcG9zO1wiKTtcclxuICBjb25zdCB1cmxzID0gZW50cmllcy5tYXAoKHsgcGF0aCwgdXBkYXRlZEF0IH0pID0+IHtcclxuICAgIGNvbnN0IGxhc3Rtb2QgPSB1cGRhdGVkQXQgPyBgPGxhc3Rtb2Q+JHtuZXcgRGF0ZSh1cGRhdGVkQXQpLnRvSVNPU3RyaW5nKCl9PC9sYXN0bW9kPmAgOiBcIlwiO1xyXG4gICAgcmV0dXJuIGA8dXJsPjxsb2M+JHt4bWxFc2NhcGUoYCR7b3JpZ2lufSR7cGF0aH1gKX08L2xvYz4ke2xhc3Rtb2R9PC91cmw+YDtcclxuICB9KS5qb2luKFwiXCIpO1xyXG4gIHJldHVybiBuZXcgUmVzcG9uc2UoYDw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCI/Pjx1cmxzZXQgeG1sbnM9XCJodHRwOi8vd3d3LnNpdGVtYXBzLm9yZy9zY2hlbWFzL3NpdGVtYXAvMC45XCI+JHt1cmxzfTwvdXJsc2V0PmAsIHtcclxuICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi94bWw7IGNoYXJzZXQ9dXRmLThcIiwgXCJDYWNoZS1Db250cm9sXCI6IFwicHVibGljLCBtYXgtYWdlPTMwMCwgcy1tYXhhZ2U9MzYwMFwiIH0sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJvYm90cyhyZXF1ZXN0OiBSZXF1ZXN0KSB7XHJcbiAgY29uc3QgcmVxdWVzdE9yaWdpbiA9IG5ldyBVUkwocmVxdWVzdC51cmwpLm9yaWdpbjtcclxuICBjb25zdCBjb25maWd1cmVkT3JpZ2luID0gcHJvY2Vzcy5lbnYuUFVCTElDX1NJVEVfVVJMIHx8IHByb2Nlc3MuZW52LlNJVEVfVVJMIHx8IHJlcXVlc3RPcmlnaW47XHJcbiAgY29uc3Qgb3JpZ2luID0gbmV3IFVSTChjb25maWd1cmVkT3JpZ2luKS5vcmlnaW47XHJcbiAgcmV0dXJuIG5ldyBSZXNwb25zZShgVXNlci1hZ2VudDogKlxcbkFsbG93OiAvXFxuXFxuU2l0ZW1hcDogJHtvcmlnaW59L3NpdGVtYXAueG1sXFxuYCwge1xyXG4gICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW47IGNoYXJzZXQ9dXRmLThcIiwgXCJDYWNoZS1Db250cm9sXCI6IFwicHVibGljLCBtYXgtYWdlPTMwMCwgcy1tYXhhZ2U9MzYwMFwiIH0sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlc29sdmVSZXF1ZXN0UGF0aChyZXF1ZXN0OiBSZXF1ZXN0KTogeyBwYXRoOiBzdHJpbmc7IHJlcXVlc3RGb3JSb3V0aW5nOiBSZXF1ZXN0IH0ge1xyXG4gIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxdWVzdC51cmwpO1xyXG4gIGxldCBwYXRoID0gdXJsLnBhdGhuYW1lLnJlcGxhY2UoL1xcLyQvLCBcIlwiKSB8fCBcIi9cIjtcclxuXHJcbiAgY29uc3QgaW50ZXJuYWxSb3V0ZSA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwiX19tYWRjbG90aGVzX3JvdXRlXCIpO1xyXG4gIGlmIChpbnRlcm5hbFJvdXRlKSB7XHJcbiAgICB1cmwuc2VhcmNoUGFyYW1zLmRlbGV0ZShcIl9fbWFkY2xvdGhlc19yb3V0ZVwiKTtcclxuICAgIGlmIChwYXRoID09PSBcIi9hcGlcIiB8fCBwYXRoID09PSBcIi9hcGkvaW5kZXhcIiB8fCBwYXRoID09PSBcIi9cIikge1xyXG4gICAgICBwYXRoID0gKGludGVybmFsUm91dGUuc3RhcnRzV2l0aChcIi9cIikgPyBpbnRlcm5hbFJvdXRlIDogYC8ke2ludGVybmFsUm91dGV9YCkucmVwbGFjZSgvXFwvJC8sIFwiXCIpIHx8IFwiL1wiO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKHBhdGggPT09IFwiL2FwaVwiIHx8IHBhdGggPT09IFwiL2FwaS9pbmRleFwiKSB7XHJcbiAgICBjb25zdCBtYXRjaGVkUGF0aCA9IHJlcXVlc3QuaGVhZGVycy5nZXQoXCJ4LW1hdGNoZWQtcGF0aFwiKTtcclxuICAgIGlmIChtYXRjaGVkUGF0aCAmJiBtYXRjaGVkUGF0aC5zdGFydHNXaXRoKFwiL2FwaS9cIikpIHtcclxuICAgICAgcGF0aCA9IG1hdGNoZWRQYXRoLnNwbGl0KFwiP1wiKVswXS5yZXBsYWNlKC9cXC8kLywgXCJcIikgfHwgXCIvXCI7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBsZXQgcmVxdWVzdEZvclJvdXRpbmcgPSByZXF1ZXN0O1xyXG4gIGlmIChpbnRlcm5hbFJvdXRlKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICByZXF1ZXN0Rm9yUm91dGluZyA9IG5ldyBSZXF1ZXN0KHVybC50b1N0cmluZygpLCByZXF1ZXN0KTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICByZXF1ZXN0Rm9yUm91dGluZyA9IHJlcXVlc3Q7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBwYXRoLCByZXF1ZXN0Rm9yUm91dGluZyB9O1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlQXBpKHJlcXVlc3Q6IFJlcXVlc3QpOiBQcm9taXNlPFJlc3BvbnNlPiB7XHJcbiAgaWYgKHJlcXVlc3QubWV0aG9kID09PSBcIk9QVElPTlNcIikgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7IHN0YXR1czogMjA0LCBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kc1wiOiBhbGxvd2VkTWV0aG9kcywgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCI6IFwiQXV0aG9yaXphdGlvbiwgQ29udGVudC1UeXBlXCIsIFwiQWNjZXNzLUNvbnRyb2wtTWF4LUFnZVwiOiBcIjYwMFwiIH0gfSk7XHJcbiAgY29uc3QgeyBwYXRoLCByZXF1ZXN0Rm9yUm91dGluZzogcmVxIH0gPSByZXNvbHZlUmVxdWVzdFBhdGgocmVxdWVzdCk7XHJcbiAgaWYgKHBhdGggPT09IFwiL2FwaS9yb2JvdHNcIiAmJiByZXEubWV0aG9kID09PSBcIkdFVFwiKSByZXR1cm4gcm9ib3RzKHJlcSk7XHJcbiAgaWYgKHBhdGggPT09IFwiL2FwaS9zaXRlbWFwXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJHRVRcIikgcmV0dXJuIGF3YWl0IHNpdGVtYXAocmVxKTtcclxuICBpZiAoIXByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTCkgcmV0dXJuIGpzb24oeyBlcnJvcjogXCJEQVRBQkFTRV9VUkwgbidlc3QgcGFzIGNvbmZpZ3VyXHUwMEU5ZS5cIiB9LCA1MDMpO1xyXG4gIHRyeSB7XHJcbiAgICBpZiAocGF0aCA9PT0gXCIvYXBpL2hlYWx0aFwiICYmIHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcclxuICAgICAgYXdhaXQgcG9vbC5xdWVyeShcIlNFTEVDVCAxXCIpO1xyXG4gICAgICByZXR1cm4ganNvbih7IHN0YXR1czogXCJva1wiLCBkYXRhYmFzZTogXCJjb25uZWN0ZWRcIiB9KTtcclxuICAgIH1cclxuICAgIGlmIChwYXRoID09PSBcIi9hcGkvY29tbWlzc2lvbnNcIiAmJiByZXEubWV0aG9kID09PSBcIkdFVFwiKSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBvb2wucXVlcnkoXCJTRUxFQ1QgdmFsdWUgRlJPTSBwbGF0Zm9ybV9zZXR0aW5ncyBXSEVSRSBrZXk9J2NvbW1pc3Npb25fcmF0ZXMnXCIpO1xyXG4gICAgICBjb25zdCB2YWx1ZSA9IHJlc3VsdC5yb3dzWzBdPy52YWx1ZSB8fCB7fTtcclxuICAgICAgcmV0dXJuIGpzb24oeyBjb25maWd1cmVkOiBCb29sZWFuKHZhbHVlLmNvbmZpZ3VyZWQpLCBzZWxsZXJCcHM6IE51bWJlcih2YWx1ZS5zZWxsZXJfYnBzIHx8IDApIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKHBhdGggPT09IFwiL2FwaS9yZXZpZXdzXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb29sLnF1ZXJ5KFxyXG4gICAgICAgIGBTRUxFQ1Qgci5yYXRpbmcsci5jb21tZW50LHAuZGlzcGxheV9uYW1lIEFTIFwiZGlzcGxheU5hbWVcIixwLmNpdHksci5jcmVhdGVkX2F0IEFTIFwiY3JlYXRlZEF0XCJcclxuICAgICAgICAgRlJPTSByZXZpZXdzIHIgSk9JTiBwcm9maWxlcyBwIE9OIHAuaWQ9ci5yZXZpZXdlcl9pZFxyXG4gICAgICAgICBXSEVSRSByLmNvbW1lbnQgSVMgTk9UIE5VTEwgQU5EIGxlbmd0aCh0cmltKHIuY29tbWVudCkpID4gMFxyXG4gICAgICAgICBPUkRFUiBCWSByLmNyZWF0ZWRfYXQgREVTQyBMSU1JVCAxMmAsXHJcbiAgICAgICk7XHJcbiAgICAgIHJldHVybiBqc29uKHJlc3VsdC5yb3dzKTtcclxuICAgIH1cclxuICAgIGlmIChwYXRoID09PSBcIi9hcGkvcHJvZmlsZVwiKSByZXR1cm4gYXdhaXQgcHJvZmlsZShyZXEsIHJlcS5tZXRob2QpO1xyXG4gICAgaWYgKHBhdGggPT09IFwiL2FwaS9saXN0aW5nc1wiIHx8IHBhdGguc3RhcnRzV2l0aChcIi9hcGkvbGlzdGluZ3MvXCIpIHx8IHBhdGggPT09IFwiL2FwaS9jYXRlZ29yaWVzXCIgfHwgcGF0aCA9PT0gXCIvYXBpL3NlbGxlci9saXN0aW5nc1wiKSByZXR1cm4gYXdhaXQgbGlzdGluZ3MocmVxLCByZXEubWV0aG9kLCBwYXRoKTtcclxuICAgIGlmIChwYXRoID09PSBcIi9hcGkvdXBsb2Fkcy9wcmVzaWduXCIgfHwgcGF0aCA9PT0gXCIvYXBpL3VwbG9hZHMvY29uZmlybVwiKSByZXR1cm4gYXdhaXQgdXBsb2FkcyhyZXEsIHJlcS5tZXRob2QsIHBhdGgpO1xyXG4gICAgaWYgKHBhdGggPT09IFwiL2FwaS9mYXZvcml0ZXNcIiB8fCBwYXRoLnN0YXJ0c1dpdGgoXCIvYXBpL2Zhdm9yaXRlcy9cIikpIHJldHVybiBhd2FpdCBmYXZvcml0ZXMocmVxLCByZXEubWV0aG9kLCBwYXRoKTtcclxuICAgIGlmIChwYXRoID09PSBcIi9hcGkvb3JkZXJzXCIgfHwgcGF0aC5zdGFydHNXaXRoKFwiL2FwaS9vcmRlcnMvXCIpKSByZXR1cm4gYXdhaXQgb3JkZXJzKHJlcSwgcmVxLm1ldGhvZCwgcGF0aCk7XHJcbiAgICBpZiAocGF0aCA9PT0gXCIvYXBpL2NvbnZlcnNhdGlvbnNcIiB8fCBwYXRoLnN0YXJ0c1dpdGgoXCIvYXBpL2NvbnZlcnNhdGlvbnMvXCIpKSByZXR1cm4gYXdhaXQgbWVzc2FnaW5nKHJlcSwgcmVxLm1ldGhvZCwgcGF0aCk7XHJcbiAgICBpZiAocGF0aCA9PT0gXCIvYXBpL3B1c2gtc3Vic2NyaXB0aW9uc1wiKSByZXR1cm4gYXdhaXQgcHVzaFN1YnNjcmlwdGlvbnMocmVxLCByZXEubWV0aG9kKTtcclxuICAgIGlmIChwYXRoID09PSBcIi9hcGkvbm90aWZpY2F0aW9uc1wiIHx8IHBhdGguc3RhcnRzV2l0aChcIi9hcGkvbm90aWZpY2F0aW9ucy9cIikpIHJldHVybiBhd2FpdCBub3RpZmljYXRpb25zKHJlcSwgcmVxLm1ldGhvZCwgcGF0aCk7XHJcbiAgICBpZiAocGF0aC5zdGFydHNXaXRoKFwiL2FwaS9hZG1pbi9cIikpIHJldHVybiBhd2FpdCBhZG1pbihyZXEsIHJlcS5tZXRob2QsIHBhdGgpO1xyXG4gICAgaWYgKHBhdGggPT09IFwiL2FwaS9yZXBvcnRzXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgY29uc3QgdXNlciA9IGF3YWl0IGF1dGhlbnRpY2F0ZWQocmVxKTtcclxuICAgICAgY29uc3QgaW5wdXQgPSBhd2FpdCBib2R5PFJlY29yZDxzdHJpbmcsIHVua25vd24+PihyZXEpO1xyXG4gICAgICBjb25zdCB0eXBlID0gU3RyaW5nKGlucHV0LnRhcmdldFR5cGUgfHwgXCJcIik7XHJcbiAgICAgIGlmICghKFtcImxpc3RpbmdcIixcIm1lc3NhZ2VcIixcInJldmlld1wiLFwicHJvZmlsZVwiXSBhcyBzdHJpbmdbXSkuaW5jbHVkZXModHlwZSkpIGZhaWwoNDAwLCBcIlR5cGUgZGUgc2lnbmFsZW1lbnQgaW52YWxpZGUuXCIpO1xyXG4gICAgICBjb25zdCB0YXJnZXRJZCA9IHRleHQoaW5wdXQudGFyZ2V0SWQsIFwiTGEgY2libGVcIiwgMSwgODApO1xyXG4gICAgICBjb25zdCByZWFzb24gPSB0ZXh0KGlucHV0LnJlYXNvbiwgXCJMZSBtb3RpZlwiLCAzLCAxMDAwKTtcclxuICAgICAgYXdhaXQgcG9vbC5xdWVyeShcIklOU0VSVCBJTlRPIG1vZGVyYXRpb25fcmVwb3J0cyAocmVwb3J0ZXJfaWQsdGFyZ2V0X3R5cGUsdGFyZ2V0X2lkLHJlYXNvbikgVkFMVUVTICgkMSwkMiwkMywkNClcIiwgW3VzZXIucHJvZmlsZUlkLHR5cGUsdGFyZ2V0SWQscmVhc29uXSk7XHJcbiAgICAgIHJldHVybiBqc29uKHsgcmVwb3J0ZWQ6IHRydWUgfSwgMjAxKTtcclxuICAgIH1cclxuICAgIHJldHVybiBqc29uKHsgZXJyb3I6IFwiUm91dGUgaW50cm91dmFibGUuXCIgfSwgNDA0KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc3QgYXBpRXJyb3IgPSBlcnJvciBhcyBBcGlFcnJvcjtcclxuICAgIGlmIChhcGlFcnJvci5zdGF0dXMpIHJldHVybiBqc29uKHsgZXJyb3I6IGFwaUVycm9yLm1lc3NhZ2UgfSwgYXBpRXJyb3Iuc3RhdHVzKTtcclxuICAgIGlmICgoZXJyb3IgYXMgeyBjb2RlPzogc3RyaW5nIH0pLmNvZGUgPT09IFwiMjM1MDVcIikgcmV0dXJuIGpzb24oeyBlcnJvcjogXCJDZXQgXHUwMEU5bFx1MDBFOW1lbnQgZXhpc3RlIGRcdTAwRTlqXHUwMEUwIG91IG4nZXN0IHBsdXMgZGlzcG9uaWJsZS5cIiB9LCA0MDkpO1xyXG4gICAgaWYgKChlcnJvciBhcyB7IGNvZGU/OiBzdHJpbmcgfSkuY29kZSA9PT0gXCIyMzUwM1wiKSByZXR1cm4ganNvbih7IGVycm9yOiBcIkxhIHJcdTAwRTlmXHUwMEU5cmVuY2UgZGVtYW5kXHUwMEU5ZSBuJ2V4aXN0ZSBwYXMuXCIgfSwgNDAwKTtcclxuICAgIGNvbnN0IHJlZmVyZW5jZSA9IHJhbmRvbVVVSUQoKTtcclxuICAgIGNvbnN0IGNvZGUgPSB0eXBlb2YgKGVycm9yIGFzIHsgY29kZT86IHVua25vd24gfSk/LmNvZGUgPT09IFwic3RyaW5nXCIgPyAoZXJyb3IgYXMgeyBjb2RlOiBzdHJpbmcgfSkuY29kZSA6IFwiSU5URVJOQUxcIjtcclxuICAgIGNvbnN0IGVycm9yTmFtZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5uYW1lIDogXCJVbmtub3duRXJyb3JcIjtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJNYWRjbG90aGVzIEFQSSBlcnJvclwiLCB7IHJlZmVyZW5jZSwgbWV0aG9kOiByZXEubWV0aG9kLCBwYXRoLCBjb2RlLCBlcnJvck5hbWUsIGVycm9yIH0pO1xyXG4gICAgcmV0dXJuIGpzb24oeyBlcnJvcjogYExlIHNlcnZldXIgblx1MjAxOWEgcGFzIHB1IHRlcm1pbmVyIGxcdTIwMTlvcFx1MDBFOXJhdGlvbi4gUlx1MDBFOWZcdTAwRTlyZW5jZSBkZSBkaWFnbm9zdGljIDogJHtyZWZlcmVuY2V9YCwgcmVmZXJlbmNlIH0sIDUwMCk7XHJcbiAgfVxyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTGUgTUFESVNPTlxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXExlIE1hZGlzb24gNzc3XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxMZSBNQURJU09OXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcTGUgTWFkaXNvbiA3NzdcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0xlJTIwTUFESVNPTi9PbmVEcml2ZS9EZXNrdG9wL0xlJTIwTWFkaXNvbiUyMDc3Ny92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiwgdHlwZSBQbHVnaW4gfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XG5pbXBvcnQgdHlwZSB7IEluY29taW5nTWVzc2FnZSwgU2VydmVyUmVzcG9uc2UgfSBmcm9tIFwibm9kZTpodHRwXCI7XG5pbXBvcnQgdHlwZSB7IGhhbmRsZUFwaSBhcyBIYW5kbGVBcGkgfSBmcm9tIFwiLi9zZXJ2ZXIvYXBpLmpzXCI7XG5cbnR5cGUgQXBpSGFuZGxlciA9IHR5cGVvZiBIYW5kbGVBcGk7XG5cbmZ1bmN0aW9uIGxvY2FsQXBpKGhhbmRsZXI6IEFwaUhhbmRsZXIpOiBQbHVnaW4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6IFwibWFkY2xvdGhlcy1sb2NhbC1hcGlcIixcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXE6IEluY29taW5nTWVzc2FnZSwgcmVzOiBTZXJ2ZXJSZXNwb25zZSwgbmV4dCkgPT4ge1xuICAgICAgICBjb25zdCByZXF1ZXN0UGF0aCA9IHJlcS51cmw/LnNwbGl0KFwiP1wiLCAxKVswXTtcbiAgICAgICAgaWYgKCFyZXEudXJsPy5zdGFydHNXaXRoKFwiL2FwaS9cIikgJiYgcmVxdWVzdFBhdGggIT09IFwiL3NpdGVtYXAueG1sXCIgJiYgcmVxdWVzdFBhdGggIT09IFwiL3JvYm90cy50eHRcIikgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhyZXEuaGVhZGVycykpIHtcbiAgICAgICAgICAgIGlmIChbXCJob3N0XCIsIFwiY29ubmVjdGlvblwiLCBcImNvbnRlbnQtbGVuZ3RoXCIsIFwidHJhbnNmZXItZW5jb2RpbmdcIl0uaW5jbHVkZXMoa2V5KSkgY29udGludWU7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIGhlYWRlcnMuc2V0KGtleSwgdmFsdWUuam9pbihcIiwgXCIpKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlKSBoZWFkZXJzLnNldChrZXksIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IHJhd0JvZHk6IEJ1ZmZlciB8IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gXCJHRVRcIiAmJiByZXEubWV0aG9kICE9PSBcIkhFQURcIikge1xuICAgICAgICAgICAgY29uc3QgY2h1bmtzOiBCdWZmZXJbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXEpIGNodW5rcy5wdXNoKEJ1ZmZlci5mcm9tKGNodW5rKSk7XG4gICAgICAgICAgICByYXdCb2R5ID0gQnVmZmVyLmNvbmNhdChjaHVua3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCByZXF1ZXN0VXJsID0gbmV3IFVSTChyZXEudXJsIHx8IFwiL1wiLCBgaHR0cDovLyR7cmVxLmhlYWRlcnMuaG9zdCB8fCBcImxvY2FsaG9zdFwifWApO1xuICAgICAgICAgIGlmIChyZXF1ZXN0VXJsLnBhdGhuYW1lID09PSBcIi9zaXRlbWFwLnhtbFwiKSByZXF1ZXN0VXJsLnBhdGhuYW1lID0gXCIvYXBpL3NpdGVtYXBcIjtcbiAgICAgICAgICBpZiAocmVxdWVzdFVybC5wYXRobmFtZSA9PT0gXCIvcm9ib3RzLnR4dFwiKSByZXF1ZXN0VXJsLnBhdGhuYW1lID0gXCIvYXBpL3JvYm90c1wiO1xuICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBuZXcgUmVxdWVzdChyZXF1ZXN0VXJsLCB7XG4gICAgICAgICAgICBtZXRob2Q6IHJlcS5tZXRob2QsXG4gICAgICAgICAgICBoZWFkZXJzLFxuICAgICAgICAgICAgYm9keTogcmF3Qm9keSBhcyB1bmtub3duIGFzIEJvZHlJbml0LFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgaGFuZGxlcihyZXF1ZXN0KTtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IHJlc3BvbnNlLnN0YXR1cztcbiAgICAgICAgICByZXNwb25zZS5oZWFkZXJzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHJlcy5zZXRIZWFkZXIoa2V5LCB2YWx1ZSkpO1xuICAgICAgICAgIHJlcy5lbmQoQnVmZmVyLmZyb20oYXdhaXQgcmVzcG9uc2UuYXJyYXlCdWZmZXIoKSkpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIG5leHQoZXJyb3IgYXMgRXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoYXN5bmMgKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgXCJcIik7XG4gIGZvciAoY29uc3Qga2V5IG9mIFtcIkRBVEFCQVNFX1VSTFwiLCBcIk5FT05fQVVUSF9KV0tTX1VSTFwiLCBcIkFETUlOX0VNQUlMX0FMTE9XTElTVFwiLCBcIlIyX0FDQ09VTlRfSURcIiwgXCJDTE9VREZMQVJFX0FDQ09VTlRfSURcIiwgXCJSMl9CVUNLRVRfTkFNRVwiLCBcIlIyX1MzX0VORFBPSU5UXCIsIFwiUjJfQUNDRVNTX0tFWV9JRFwiLCBcIlIyX1NFQ1JFVF9BQ0NFU1NfS0VZXCIsIFwiUjJfUFVCTElDX0JBU0VfVVJMXCIsIFwiUjJfUFVCTElDX1VSTFwiLCBcIlBVQkxJQ19TSVRFX1VSTFwiLCBcIlZBUElEX1BVQkxJQ19LRVlcIiwgXCJWQVBJRF9QUklWQVRFX0tFWVwiLCBcIlZBUElEX1NVQkpFQ1RcIl0pIHtcbiAgICBpZiAoZW52W2tleV0gJiYgIXByb2Nlc3MuZW52W2tleV0pIHByb2Nlc3MuZW52W2tleV0gPSBlbnZba2V5XTtcbiAgfVxuICBjb25zdCB7IGhhbmRsZUFwaSB9ID0gYXdhaXQgaW1wb3J0KFwiLi9zZXJ2ZXIvYXBpLmpzXCIpO1xuICByZXR1cm4ge1xuICAgIC8vIEtlZXAgb25lIGtub3duIGxvY2FsIG9yaWdpbiBzbyBhdXRoIHJlZGlyZWN0cywgUjIgQ09SUywgYW5kIGJyb3dzZXJcbiAgICAvLyBjYWNoZXMgYWxsIHVzZSB0aGUgc2FtZSBhZGRyZXNzIGluc3RlYWQgb2YgVml0ZSBzaWxlbnRseSBwaWNraW5nIDgwODMrLlxuICAgIHNlcnZlcjogeyBob3N0OiB0cnVlLCBwb3J0OiA4MDgyLCBzdHJpY3RQb3J0OiB0cnVlLCBobXI6IHsgb3ZlcmxheTogZmFsc2UgfSB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgIHJlYWN0KCksXG4gICAgICBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCksXG4gICAgICBsb2NhbEFwaShoYW5kbGVBcGkpLFxuICAgICAgVml0ZVBXQSh7XG4gICAgICAgIHJlZ2lzdGVyVHlwZTogXCJhdXRvVXBkYXRlXCIsXG4gICAgICAgIGluY2x1ZGVBc3NldHM6IFtcImJyYW5kL21hZGNsb3RoZXMtbG9nby5qcGdcIiwgXCJpY29ucy9hcHBsZS10b3VjaC1pY29uLnBuZ1wiXSxcbiAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICBuYW1lOiBcIk1hZGNsb3RoZXMgXHUyMDE0IE1vZGUgZCdvY2Nhc2lvblwiLFxuICAgICAgICAgIHNob3J0X25hbWU6IFwiTWFkY2xvdGhlc1wiLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkFjaGV0ZXogZXQgdmVuZGV6IGRlcyB2XHUwMEVBdGVtZW50cyBkJ29jY2FzaW9uIGF1IENvbmdvLlwiLFxuICAgICAgICAgIGxhbmc6IFwiZnItQ0dcIixcbiAgICAgICAgICBzdGFydF91cmw6IFwiL1wiLFxuICAgICAgICAgIHNjb3BlOiBcIi9cIixcbiAgICAgICAgICBkaXNwbGF5OiBcInN0YW5kYWxvbmVcIixcbiAgICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiMxMDFiMmJcIixcbiAgICAgICAgICB0aGVtZV9jb2xvcjogXCIjZTYwMDcyXCIsXG4gICAgICAgICAgb3JpZW50YXRpb246IFwicG9ydHJhaXQtcHJpbWFyeVwiLFxuICAgICAgICAgIGljb25zOiBbXG4gICAgICAgICAgICB7IHNyYzogXCIvaWNvbnMvaWNvbi0xOTIucG5nXCIsIHNpemVzOiBcIjE5MngxOTJcIiwgdHlwZTogXCJpbWFnZS9wbmdcIiB9LFxuICAgICAgICAgICAgeyBzcmM6IFwiL2ljb25zL2ljb24tNTEyLnBuZ1wiLCBzaXplczogXCI1MTJ4NTEyXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIgfSxcbiAgICAgICAgICAgIHsgc3JjOiBcIi9pY29ucy9pY29uLW1hc2thYmxlLTUxMi5wbmdcIiwgc2l6ZXM6IFwiNTEyeDUxMlwiLCB0eXBlOiBcImltYWdlL3BuZ1wiLCBwdXJwb3NlOiBcIm1hc2thYmxlXCIgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB3b3JrYm94OiB7XG4gICAgICAgICAgaW1wb3J0U2NyaXB0czogW1wiL3B1c2gtaGFuZGxlci5qc1wiXSxcbiAgICAgICAgICBuYXZpZ2F0ZUZhbGxiYWNrOiBcIi9pbmRleC5odG1sXCIsXG4gICAgICAgICAgbmF2aWdhdGVGYWxsYmFja0RlbnlsaXN0OiBbL15cXC9hcGlcXC8vXSxcbiAgICAgICAgICBjbGVhbnVwT3V0ZGF0ZWRDYWNoZXM6IHRydWUsXG4gICAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdXJsUGF0dGVybjogKHsgdXJsIH0pID0+IHVybC5wYXRobmFtZS5zdGFydHNXaXRoKFwiL2FwaS9cIiksXG4gICAgICAgICAgICAgIGhhbmRsZXI6IFwiTmV0d29ya09ubHlcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvaW1hZ2VzXFwudW5zcGxhc2hcXC5jb21cXC8vLFxuICAgICAgICAgICAgICBoYW5kbGVyOiBcIlN0YWxlV2hpbGVSZXZhbGlkYXRlXCIsXG4gICAgICAgICAgICAgIG9wdGlvbnM6IHsgY2FjaGVOYW1lOiBcIm1hZGNsb3RoZXMtY2F0ZWdvcnktYXJ0XCIsIGV4cGlyYXRpb246IHsgbWF4RW50cmllczogMzAsIG1heEFnZVNlY29uZHM6IDcgKiAyNCAqIDYwICogNjAgfSB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBkZXZPcHRpb25zOiB7IGVuYWJsZWQ6IGZhbHNlIH0sXG4gICAgICB9KSxcbiAgICBdLmZpbHRlcihCb29sZWFuKSxcbiAgICByZXNvbHZlOiB7IGFsaWFzOiB7IFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpIH0gfSxcbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7QUFBOFcsU0FBUywwQkFBMEI7QUFDalosU0FBUyxZQUFZO0FBRHJCLElBR00sZUFFTztBQUxiO0FBQUE7QUFHQSxJQUFNLGdCQUFnQjtBQUVmLElB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
