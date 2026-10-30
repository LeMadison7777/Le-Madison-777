import { randomUUID } from "node:crypto";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { pool } from "./database";
import { getR2Bucket, getR2Client } from "./r2";

const MAX_JSON_BYTES = 64_000;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const allowedMethods = "GET, POST, PATCH, DELETE, OPTIONS";
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

type Auth = { subject: string; email?: string; profileId: string; role: string };
type ApiError = Error & { status?: number };

function fail(status: number, message: string): never {
  const error: ApiError = new Error(message);
  error.status = status;
  throw error;
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    },
  });
}

async function body<T extends Record<string, unknown>>(request: Request): Promise<T> {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_JSON_BYTES) fail(413, "La requête est trop volumineuse.");
  try {
    return await request.json() as T;
  } catch {
    fail(400, "Le corps JSON est invalide.");
  }
}

function text(value: unknown, label: string, min: number, max: number): string {
  if (typeof value !== "string") fail(400, `${label} est requis.`);
  const clean = value.trim();
  if (clean.length < min || clean.length > max) fail(400, `${label} doit contenir de ${min} à ${max} caractères.`);
  return clean;
}

function integer(value: unknown, label: string, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) fail(400, `${label} est invalide.`);
  return parsed;
}

function authConfig() {
  const url = process.env.NEON_AUTH_JWKS_URL;
  if (!url) fail(503, "L'authentification Neon n'est pas configurée côté serveur.");
  jwks ??= createRemoteJWKSet(new URL(url));
  return jwks;
}

async function authenticated(request: Request): Promise<Auth> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) fail(401, "Connectez-vous pour continuer.");
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, authConfig()));
  } catch {
    fail(401, "Votre session a expiré. Reconnectez-vous.");
  }
  if (typeof payload.sub !== "string" || !payload.sub) fail(401, "La session ne contient pas d'identité valide.");
  const result = await pool.query(
    "SELECT id, role, status FROM profiles WHERE auth_subject = $1",
    [payload.sub],
  );
  const profile = result.rows[0];
  if (!profile) fail(409, "Complétez votre profil pour continuer.");
  if (profile.status !== "active") fail(403, "Ce compte n'est pas actif.");
  return { subject: payload.sub, email: typeof payload.email === "string" ? payload.email : undefined, profileId: profile.id, role: profile.role };
}

function storage() {
  return getR2Client();
}

async function imageUrl(key: string | null | undefined): Promise<string> {
  if (!key) return "/images/product-placeholder.svg";
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (base) return `${base}/${key}`;
  try {
    return await getSignedUrl(storage(), new GetObjectCommand({ Bucket: getR2Bucket(), Key: key }), { expiresIn: 3600 });
  } catch {
    return "/images/product-placeholder.svg";
  }
}

async function profile(request: Request, method: string) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) fail(401, "Connectez-vous pour continuer.");
  let payload: JWTPayload;
  try { ({ payload } = await jwtVerify(token, authConfig())); } catch { fail(401, "Votre session a expiré."); }
  if (!payload.sub) fail(401, "Identité invalide.");
  if (method === "GET") {
    const result = await pool.query(
      "SELECT id, display_name AS \"displayName\", username, phone, city, biography, avatar_object_key AS \"avatarKey\", role FROM profiles WHERE auth_subject = $1",
      [payload.sub],
    );
    return result.rows[0] ? json(result.rows[0]) : json({ profile: null }, 200);
  }
  if (method !== "POST" && method !== "PATCH") fail(405, "Méthode non autorisée.");
  const input = await body<Record<string, unknown>>(request);
  const displayName = text(input.displayName, "Le nom", 2, 80);
  const emailName = (typeof payload.email === "string" ? payload.email.split("@")[0] : "membre").normalize("NFKD").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30) || "membre";
  const username = `${emailName}_${String(payload.sub).slice(-6)}`.slice(0, 40);
  const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  const role = typeof payload.email === "string" && allowlist.includes(payload.email.toLowerCase()) ? "admin" : "member";
  if (method === "POST") {
    const result = await pool.query(
      `INSERT INTO profiles (auth_subject, display_name, username, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (auth_subject) DO UPDATE SET display_name = EXCLUDED.display_name
       RETURNING id, display_name AS "displayName", username, phone, city, biography, role`,
      [payload.sub, displayName, username, role],
    );
    return json(result.rows[0], 201);
  }
  const city = input.city == null ? null : text(input.city, "La ville", 2, 80);
  const phone = input.phone == null ? null : text(input.phone, "Le téléphone", 6, 30);
  const biography = input.biography == null ? null : text(input.biography, "La bio", 0, 500);
  const result = await pool.query(
    `UPDATE profiles SET display_name = $2, city = $3, phone = $4, biography = $5
     WHERE auth_subject = $1 RETURNING id, display_name AS "displayName", username, phone, city, biography, role`,
    [payload.sub, displayName, city, phone, biography],
  );
  if (!result.rowCount) fail(404, "Profil introuvable.");
  return json(result.rows[0]);
}

async function listings(request: Request, method: string, path: string) {
  if (method === "GET" && path === "/api/listings") {
    const query = new URL(request.url).searchParams;
    const search = (query.get("q") || "").trim().slice(0, 100) || null;
    const category = query.get("category")?.slice(0, 80) || null;
    const city = query.get("city")?.slice(0, 80) || null;
    const size = query.get("size")?.slice(0, 20) || null;
    const conditionValues: Record<string,string> = { "Neuf avec étiquette": "new_with_tags", "Neuf sans étiquette": "new_without_tags", "Très bon état": "very_good", "Bon état": "good", "État correct": "fair" };
    const conditionLabel = query.get("condition");
    const condition = conditionLabel ? conditionValues[conditionLabel] : null;
    if (conditionLabel && !condition) fail(400, "L'état demandé est invalide.");
    const min = query.has("min") ? integer(query.get("min"), "Le prix minimum", 0, 10_000_000) : 0;
    const max = query.has("max") ? integer(query.get("max"), "Le prix maximum", min, 10_000_000) : 10_000_000;
    const page = query.has("page") ? integer(query.get("page"), "La page", 1, 10_000) : 1;
    const limit = query.has("limit") ? integer(query.get("limit"), "La limite", 1, 48) : 24;
    const result = await pool.query(
      `SELECT l.id, l.title AS name, l.brand, l.size_label AS size, l.price_xaf AS price,
              l.city || ', Congo' AS location, l.city, c.name AS category,
              CASE l.condition WHEN 'new_with_tags' THEN 'Neuf avec étiquette' WHEN 'new_without_tags' THEN 'Neuf sans étiquette' WHEN 'very_good' THEN 'Très bon état' WHEN 'good' THEN 'Bon état' ELSE 'État correct' END AS condition,
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
      [search, category, city, size, condition, min, max, limit, (page - 1) * limit],
    );
    const count = await pool.query(
      `SELECT count(*)::int AS count FROM listings l JOIN categories c ON c.id = l.category_id
       WHERE l.status = 'published' AND c.is_active
         AND ($1::text IS NULL OR l.title ILIKE '%' || $1 || '%' OR COALESCE(l.brand, '') ILIKE '%' || $1 || '%')
         AND ($2::text IS NULL OR c.name = $2 OR c.slug = $2)
         AND ($3::text IS NULL OR l.city = $3)
         AND ($4::text IS NULL OR l.size_label = $4)
         AND ($5::listing_condition IS NULL OR l.condition=$5)
         AND l.price_xaf BETWEEN $6 AND $7`, [search, category, city, size, condition, min, max],
    );
    const items = await Promise.all(result.rows.map(async (item) => ({
      ...item,
      price: Number(item.price),
      img: await imageUrl(item.images[0]?.key),
    })));
    return json({ items, total: count.rows[0].count, page, limit });
  }
  if (method === "GET" && path === "/api/categories") {
    const result = await pool.query("SELECT id, name, slug FROM categories WHERE is_active = true ORDER BY sort_order, name");
    return json(result.rows);
  }
  if (method === "GET" && /^\/api\/listings\/[\w-]+$/.test(path)) {
    const id = path.split("/").at(-1)!;
    const result = await pool.query(
      `SELECT l.id, l.seller_id AS "sellerId", l.title AS name, l.description, l.brand, l.size_label AS size,
       l.price_xaf AS price, l.city, l.city || ', Congo' AS location, l.country_code AS "countryCode", c.name AS category,
       CASE l.condition WHEN 'new_with_tags' THEN 'Neuf avec étiquette' WHEN 'new_without_tags' THEN 'Neuf sans étiquette' WHEN 'very_good' THEN 'Très bon état' WHEN 'good' THEN 'Bon état' ELSE 'État correct' END AS condition,
       p.display_name AS seller, COALESCE(json_agg(json_build_object('id', i.id, 'key', i.object_key, 'alt', i.alt_text) ORDER BY i.position) FILTER (WHERE i.id IS NOT NULL), '[]'::json) AS images
       FROM listings l JOIN categories c ON c.id=l.category_id JOIN profiles p ON p.id=l.seller_id LEFT JOIN listing_images i ON i.listing_id=l.id
       WHERE l.id=$1 AND l.status='published' GROUP BY l.id, c.name, p.display_name`, [id],
    );
    if (!result.rows[0]) fail(404, "Annonce introuvable.");
    const item = result.rows[0];
    const images = await Promise.all(item.images.map(async (image: { key: string; alt: string | null }) => ({
      ...image,
      url: await imageUrl(image.key),
    })));
    return json({ ...item, price: Number(item.price), images });
  }
  const user = await authenticated(request);
  if (method === "POST" && path === "/api/listings") {
    const input = await body<Record<string, unknown>>(request);
    const title = text(input.title, "Le titre", 3, 140);
    const description = text(input.description, "La description", 1, 5000);
    const brand = input.brand == null ? null : text(input.brand, "La marque", 1, 80);
    const size = input.size == null ? null : text(input.size, "La taille", 1, 20);
    const city = text(input.city, "La ville", 2, 80);
    const price = integer(input.price, "Le prix", 1, 10_000_000);
    const conditionMap: Record<string, string> = { "Neuf avec étiquette": "new_with_tags", "Neuf sans étiquette": "new_without_tags", "Très bon état": "very_good", "Bon état": "good", "État correct": "fair" };
    const condition = conditionMap[String(input.condition)] || String(input.condition);
    if (!Object.values(conditionMap).includes(condition)) fail(400, "L'état de l'article est invalide.");
    const categoryId = text(input.categoryId, "La catégorie", 1, 80);
    const result = await pool.query(
      `INSERT INTO listings (seller_id, category_id, title, description, brand, size_label, condition, price_xaf, city, status)
       SELECT $1, c.id, $3, $4, $5, $6, $7::listing_condition, $8, $9, 'draft'
       FROM categories c WHERE c.id::text=$2 AND c.is_active
       RETURNING id, status`, [user.profileId, categoryId, title, description, brand, size, condition, price, city],
    );
    if (!result.rowCount) fail(400, "Catégorie inconnue ou inactive.");
    return json(result.rows[0], 201);
  }
  const match = path.match(/^\/api\/listings\/([\w-]+)\/(publish|withdraw)$/);
  if (method === "POST" && match) {
    const [, listingId, action] = match;
    if (action === "publish") {
      const result = await pool.query(
        `UPDATE listings l SET status='published', published_at=now()
         WHERE l.id=$1 AND l.seller_id=$2 AND l.status='draft'
           AND EXISTS (SELECT 1 FROM listing_images i WHERE i.listing_id=l.id)
         RETURNING l.id, l.status`, [listingId, user.profileId],
      );
      if (!result.rowCount) fail(409, "Ajoutez au moins une photo à votre brouillon avant de publier.");
      return json(result.rows[0]);
    }
    const result = await pool.query("UPDATE listings SET status='withdrawn' WHERE id=$1 AND seller_id=$2 AND status IN ('draft','published') RETURNING id,status", [listingId, user.profileId]);
    if (!result.rowCount) fail(404, "Annonce introuvable.");
    return json(result.rows[0]);
  }
  if (method === "GET" && path === "/api/seller/listings") {
    const result = await pool.query(
      `SELECT l.id, l.title AS name, l.price_xaf AS price, l.status, l.city, l.created_at AS "createdAt",
       (SELECT i.object_key FROM listing_images i WHERE i.listing_id=l.id ORDER BY i.position LIMIT 1) AS "imageKey"
       FROM listings l WHERE l.seller_id=$1 ORDER BY l.created_at DESC`, [user.profileId],
    );
    return json(await Promise.all(result.rows.map(async (item) => ({
      ...item,
      price: Number(item.price),
      img: await imageUrl(item.imageKey),
    }))));
  }
  fail(404, "Route annonce introuvable.");
}

async function uploads(request: Request, method: string, path: string) {
  const user = await authenticated(request);
  if (method === "POST" && path === "/api/uploads/presign") {
    const input = await body<Record<string, unknown>>(request);
    const listingId = text(input.listingId, "L'annonce", 1, 80);
    const contentType = text(input.contentType, "Le type de fichier", 1, 100);
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) fail(400, "Format d'image accepté : JPEG, PNG, WebP ou AVIF.");
    const size = integer(input.size, "La taille du fichier", 1, MAX_IMAGE_BYTES);
    const listing = await pool.query("SELECT id FROM listings WHERE id=$1 AND seller_id=$2 AND status='draft'", [listingId, user.profileId]);
    if (!listing.rowCount) fail(404, "Brouillon introuvable.");
    const current = await pool.query("SELECT count(*)::int AS count FROM listing_images WHERE listing_id=$1", [listingId]);
    if (current.rows[0].count >= 10) fail(400, "Une annonce peut contenir au maximum 10 photos.");
    const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" } as Record<string, string>)[contentType];
    const key = `listings/${user.profileId}/${listingId}/${randomUUID()}.${ext}`;
    const command = new PutObjectCommand({ Bucket: getR2Bucket(), Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(storage(), command, { expiresIn: 300 });
    return json({ key, uploadUrl, expiresIn: 300 });
  }
  if (method === "POST" && path === "/api/uploads/confirm") {
    const input = await body<Record<string, unknown>>(request);
    const key = text(input.key, "La clé", 1, 500);
    const listingId = text(input.listingId, "L'annonce", 1, 80);
    const alt = input.alt == null ? null : text(input.alt, "Le texte alternatif", 0, 180);
    if (!key.startsWith(`listings/${user.profileId}/${listingId}/`)) fail(403, "Clé de fichier invalide.");
    const listing = await pool.query("SELECT id FROM listings WHERE id=$1 AND seller_id=$2 AND status='draft'", [listingId, user.profileId]);
    if (!listing.rowCount) fail(404, "Brouillon introuvable.");
    let head;
    try { head = await storage().send(new HeadObjectCommand({ Bucket: getR2Bucket(), Key: key })); }
    catch { fail(400, "Le fichier n'a pas été reçu par R2."); }
    const contentType = head.ContentType || "";
    const byteSize = head.ContentLength || 0;
    if (!ALLOWED_IMAGE_TYPES.has(contentType) || byteSize < 1 || byteSize > MAX_IMAGE_BYTES) fail(400, "Le fichier envoyé ne respecte pas les règles d'image.");
    const position = await pool.query("SELECT COALESCE(max(position)+1,0)::int AS position FROM listing_images WHERE listing_id=$1", [listingId]);
    if (position.rows[0].position > 9) fail(400, "Une annonce peut contenir au maximum 10 photos.");
    const result = await pool.query(
      `INSERT INTO listing_images (listing_id, object_key, alt_text, content_type, byte_size, position)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (object_key) DO NOTHING RETURNING id`,
      [listingId, key, alt, contentType, byteSize, position.rows[0].position],
    );
    if (!result.rowCount) fail(409, "Cette photo a déjà été enregistrée.");
    return json({ id: result.rows[0].id, key, alt }, 201);
  }
  fail(404, "Route de téléversement introuvable.");
}

async function favorites(request: Request, method: string, path: string) {
  const user = await authenticated(request);
  if (method === "GET" && path === "/api/favorites") {
    const result = await pool.query(
      `SELECT l.id, l.title AS name, l.brand, l.size_label AS size, l.price_xaf AS price, l.city,
       c.name AS category, (SELECT i.object_key FROM listing_images i WHERE i.listing_id=l.id ORDER BY position LIMIT 1) AS key
       FROM favorites f JOIN listings l ON l.id=f.listing_id JOIN categories c ON c.id=l.category_id WHERE f.profile_id=$1 AND l.status='published'`, [user.profileId],
    );
    return json(await Promise.all(result.rows.map(async (item) => ({
      ...item,
      price: Number(item.price),
      img: await imageUrl(item.key),
    }))));
  }
  const match = path.match(/^\/api\/favorites\/([\w-]+)$/);
  if (match && method === "POST") {
    const result = await pool.query(
      `INSERT INTO favorites (profile_id, listing_id) SELECT $1,id FROM listings WHERE id=$2 AND status='published'
       ON CONFLICT DO NOTHING RETURNING listing_id`, [user.profileId, match[1]],
    );
    return json({ favorited: true, inserted: Boolean(result.rowCount) });
  }
  if (match && method === "DELETE") {
    await pool.query("DELETE FROM favorites WHERE profile_id=$1 AND listing_id=$2", [user.profileId, match[1]]);
    return json({ favorited: false });
  }
  fail(404, "Route favoris introuvable.");
}

async function orders(request: Request, method: string, path: string) {
  const user = await authenticated(request);
  if (method === "GET" && path === "/api/orders") {
    const result = await pool.query(
      `SELECT o.id, o.status, o.item_price_xaf AS "itemPrice", o.total_xaf AS total, o.created_at AS "createdAt",
       l.title AS "listingTitle", l.id AS "listingId",
       CASE WHEN o.seller_id=$1 THEN pb.display_name ELSE p.display_name END AS "otherPartyName",
       o.seller_id=$1 AS "isSeller",
       EXISTS (SELECT 1 FROM reviews r WHERE r.order_id=o.id AND r.reviewer_id=$1) AS "hasReviewed"
       FROM orders o JOIN listings l ON l.id=o.listing_id JOIN profiles p ON p.id=o.seller_id JOIN profiles pb ON pb.id=o.buyer_id
       WHERE o.buyer_id=$1 OR o.seller_id=$1 ORDER BY o.created_at DESC`, [user.profileId],
    );
    return json(result.rows.map((row) => ({ ...row, itemPrice: Number(row.itemPrice), total: Number(row.total) })));
  }
  if (method === "POST" && path === "/api/orders") {
    const input = await body<Record<string, unknown>>(request);
    const listingId = text(input.listingId, "L'annonce", 1, 80);
    const method = input.deliveryMethod === "pickup" ? "pickup" : "delivery";
    const city = text(input.city, "La ville", 2, 80);
    const details = input.details == null ? null : text(input.details, "Les informations de remise", 0, 500);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const listing = await client.query("SELECT id,seller_id,price_xaf FROM listings WHERE id=$1 AND status='published' FOR UPDATE", [listingId]);
      if (!listing.rowCount) fail(409, "Cet article n'est plus disponible.");
      const row = listing.rows[0];
      if (row.seller_id === user.profileId) fail(400, "Vous ne pouvez pas acheter votre propre annonce.");
      const setting = await client.query("SELECT value FROM platform_settings WHERE key='commission_rates'");
      const bps = Number(setting.rows[0]?.value?.seller_bps || 0);
      const commission = Math.floor(Number(row.price_xaf) * Math.min(Math.max(bps, 0), 10_000) / 10_000);
      const order = await client.query(
        `INSERT INTO orders (listing_id,buyer_id,seller_id,item_price_xaf,commission_xaf)
         VALUES ($1,$2,$3,$4,$5) RETURNING id,status,total_xaf AS total`,
        [listingId,user.profileId,row.seller_id,row.price_xaf,commission],
      );
      await client.query("UPDATE listings SET status='reserved' WHERE id=$1", [listingId]);
      await client.query("INSERT INTO fulfillments (order_id,method,city,pickup_or_delivery_details) VALUES ($1,$2,$3,$4)", [order.rows[0].id,method,city,details]);
      await client.query("INSERT INTO notifications (profile_id,kind,payload) VALUES ($1,'order_created',jsonb_build_object('orderId',$2))", [row.seller_id,order.rows[0].id]);
      await client.query("COMMIT");
      return json({ ...order.rows[0], total: Number(order.rows[0].total), paymentEnabled: false, message: "Votre demande est enregistrée. Le paiement sera activé lorsque les accès au prestataire seront configurés; la commande reste en attente." }, 201);
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
  const reviewMatch = path.match(/^\/api\/orders\/([\w-]+)\/review$/);
  if (method === "POST" && reviewMatch) {
    const input = await body<Record<string, unknown>>(request);
    const rating = integer(input.rating, "La note", 1, 5);
    const comment = input.comment == null || input.comment === "" ? null : text(input.comment, "Le commentaire", 1, 1200);
    const order = await pool.query("SELECT id,buyer_id,seller_id FROM orders WHERE id=$1 AND status='completed' AND (buyer_id=$2 OR seller_id=$2)", [reviewMatch[1],user.profileId]);
    if (!order.rowCount) fail(409, "Seule une commande terminée peut recevoir une évaluation.");
    const reviewee = order.rows[0].buyer_id === user.profileId ? order.rows[0].seller_id : order.rows[0].buyer_id;
    const result = await pool.query("INSERT INTO reviews (order_id,reviewer_id,reviewee_id,rating,comment) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (order_id,reviewer_id) DO NOTHING RETURNING id,rating,comment", [order.rows[0].id,user.profileId,reviewee,rating,comment]);
    if (!result.rowCount) fail(409, "Vous avez déjà évalué cette commande.");
    await pool.query("INSERT INTO notifications (profile_id,kind,payload) VALUES ($1,'new_review',jsonb_build_object('orderId',$2))", [reviewee,order.rows[0].id]);
    await pool.query("INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,metadata) VALUES ($1,'review_created','review',$2,$3::jsonb)", [user.profileId,result.rows[0].id,JSON.stringify({ rating })]);
    return json(result.rows[0], 201);
  }
  const match = path.match(/^\/api\/orders\/([\w-]+)\/status$/);
  if (method === "PATCH" && match) {
    const input = await body<Record<string, unknown>>(request);
    const next = String(input.status || "");
    const transitions: Record<string, string[]> = { pending_payment: ["cancelled"], paid: ["processing", "disputed"], processing: ["shipped", "completed", "disputed"], shipped: ["completed", "disputed"], disputed: ["refunded"] };
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const current = await client.query("SELECT id,buyer_id,seller_id,status FROM orders WHERE id=$1 FOR UPDATE", [match[1]]);
      const order = current.rows[0];
      if (!order || ![order.buyer_id,order.seller_id].includes(user.profileId)) fail(404, "Commande introuvable.");
      if (!transitions[order.status]?.includes(next)) fail(409, "Cette transition de commande n'est pas autorisée.");
      if ((next === "processing" || next === "shipped") && order.seller_id !== user.profileId) fail(403, "Seul le vendeur peut mettre à jour cette étape.");
      if (next === "cancelled" && order.buyer_id !== user.profileId) fail(403, "Seul l'acheteur peut annuler cette demande.");
      if (next === "completed" && order.buyer_id !== user.profileId) fail(403, "Seul l'acheteur peut confirmer la réception.");
      await client.query("UPDATE orders SET status=$2 WHERE id=$1", [order.id,next]);
      if (next === "completed") await client.query("UPDATE listings SET status='sold' WHERE id=(SELECT listing_id FROM orders WHERE id=$1)", [order.id]);
      if (next === "cancelled") await client.query("UPDATE listings SET status='published' WHERE id=(SELECT listing_id FROM orders WHERE id=$1) AND status='reserved'", [order.id]);
      await client.query("INSERT INTO notifications (profile_id,kind,payload) VALUES ($1,'order_status',jsonb_build_object('orderId',$2,'status',$3))", [order.buyer_id === user.profileId ? order.seller_id : order.buyer_id,order.id,next]);
      await client.query("COMMIT");
      return json({ id: order.id, status: next });
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
  fail(404, "Route commande introuvable.");
}

async function messaging(request: Request, method: string, path: string) {
  const user = await authenticated(request);
  if (method === "GET" && path === "/api/conversations") {
    const result = await pool.query(
      `SELECT c.id, c.listing_id AS "listingId", l.title AS "listingTitle", c.last_message_at AS "lastMessageAt",
       CASE WHEN c.buyer_id=$1 THEN ps.display_name ELSE pb.display_name END AS "otherName",
       (SELECT body FROM messages m WHERE m.conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS "lastMessage"
       FROM conversations c JOIN listings l ON l.id=c.listing_id JOIN profiles pb ON pb.id=c.buyer_id JOIN profiles ps ON ps.id=c.seller_id
       WHERE c.buyer_id=$1 OR c.seller_id=$1 ORDER BY c.last_message_at DESC`, [user.profileId],
    );
    return json(result.rows);
  }
  if (method === "POST" && path === "/api/conversations") {
    const input = await body<Record<string, unknown>>(request);
    const listingId = text(input.listingId, "L'annonce", 1, 80);
    const message = text(input.message, "Le message", 1, 5000);
    const listing = await pool.query("SELECT id,seller_id FROM listings WHERE id=$1 AND status='published'", [listingId]);
    if (!listing.rowCount) fail(404, "Annonce introuvable.");
    if (listing.rows[0].seller_id === user.profileId) fail(400, "Vous êtes le vendeur de cette annonce.");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const conversation = await client.query(
        `INSERT INTO conversations (listing_id,buyer_id,seller_id) VALUES ($1,$2,$3)
         ON CONFLICT (listing_id,buyer_id) DO UPDATE SET last_message_at=now() RETURNING id`,
        [listingId,user.profileId,listing.rows[0].seller_id],
      );
      const id = conversation.rows[0].id;
      await client.query("INSERT INTO messages (conversation_id,sender_id,body) VALUES ($1,$2,$3)", [id,user.profileId,message]);
      await client.query("UPDATE conversations SET last_message_at=now() WHERE id=$1", [id]);
      await client.query("INSERT INTO notifications (profile_id,kind,payload) VALUES ($1,'new_message',jsonb_build_object('conversationId',$2))", [listing.rows[0].seller_id,id]);
      await client.query("COMMIT");
      return json({ id }, 201);
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
  const match = path.match(/^\/api\/conversations\/([\w-]+)$/);
  if (method === "GET" && match) {
    const allowed = await pool.query("SELECT id FROM conversations WHERE id=$1 AND (buyer_id=$2 OR seller_id=$2)", [match[1],user.profileId]);
    if (!allowed.rowCount) fail(404, "Conversation introuvable.");
    const result = await pool.query("SELECT m.id,m.body,m.created_at AS \"createdAt\",m.sender_id=$2 AS \"own\",p.display_name AS \"senderName\" FROM messages m JOIN profiles p ON p.id=m.sender_id WHERE m.conversation_id=$1 ORDER BY m.created_at", [match[1],user.profileId]);
    await pool.query("UPDATE messages SET read_at=now() WHERE conversation_id=$1 AND sender_id<>$2 AND read_at IS NULL", [match[1],user.profileId]);
    return json(result.rows);
  }
  if (method === "POST" && match) {
    const input = await body<Record<string, unknown>>(request);
    const message = text(input.message, "Le message", 1, 5000);
    const allowed = await pool.query("SELECT id,buyer_id,seller_id FROM conversations WHERE id=$1 AND (buyer_id=$2 OR seller_id=$2)", [match[1],user.profileId]);
    if (!allowed.rowCount) fail(404, "Conversation introuvable.");
    await pool.query("INSERT INTO messages (conversation_id,sender_id,body) VALUES ($1,$2,$3)", [match[1],user.profileId,message]);
    await pool.query("UPDATE conversations SET last_message_at=now() WHERE id=$1", [match[1]]);
    const target = allowed.rows[0].buyer_id === user.profileId ? allowed.rows[0].seller_id : allowed.rows[0].buyer_id;
    await pool.query("INSERT INTO notifications (profile_id,kind,payload) VALUES ($1,'new_message',jsonb_build_object('conversationId',$2))", [target,match[1]]);
    return json({ sent: true }, 201);
  }
  fail(404, "Route messagerie introuvable.");
}

async function notifications(request: Request, method: string, path: string) {
  const user = await authenticated(request);
  if (method === "GET" && path === "/api/notifications") {
    const result = await pool.query("SELECT id,kind,payload,read_at AS \"readAt\",created_at AS \"createdAt\" FROM notifications WHERE profile_id=$1 ORDER BY created_at DESC LIMIT 50", [user.profileId]);
    return json(result.rows);
  }
  if (method === "PATCH" && path === "/api/notifications/read-all") {
    await pool.query("UPDATE notifications SET read_at=now() WHERE profile_id=$1 AND read_at IS NULL", [user.profileId]);
    return json({ read: true });
  }
  const match = path.match(/^\/api\/notifications\/([\w-]+)\/read$/);
  if (method === "PATCH" && match) {
    await pool.query("UPDATE notifications SET read_at=now() WHERE id=$1 AND profile_id=$2", [match[1],user.profileId]);
    return json({ read: true });
  }
  fail(404, "Route notification introuvable.");
}

async function admin(request: Request, method: string, path: string) {
  const user = await authenticated(request);
  if (method === "PATCH" && path === "/api/admin/commissions") {
    if (user.role !== "admin") fail(403, "Seuls les administrateurs peuvent modifier le barème.");
    const input = await body<Record<string, unknown>>(request);
    const sellerBps = integer(input.sellerBps, "La commission vendeur", 0, 2_000);
    const value = { seller_bps: sellerBps, configured: input.configured !== false };
    await pool.query(
      `INSERT INTO platform_settings (key,value) VALUES ('commission_rates',$1::jsonb)
       ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`, [JSON.stringify(value)],
    );
    await pool.query("INSERT INTO audit_logs (actor_id,action,entity_type,metadata) VALUES ($1,'commission_rates_updated','platform_setting',$2::jsonb)", [user.profileId,JSON.stringify({ seller_bps: sellerBps })]);
    return json({ configured: value.configured, sellerBps });
  }
  if (user.role !== "admin" && user.role !== "moderator") fail(403, "Accès réservé à l'équipe de modération.");
  if (method === "GET" && path === "/api/admin/reports") {
    const result = await pool.query(
      `SELECT r.id,r.target_type AS "targetType",r.target_id AS "targetId",r.reason,r.status,r.created_at AS "createdAt",p.display_name AS reporter
       FROM moderation_reports r JOIN profiles p ON p.id=r.reporter_id WHERE r.status IN ('open','reviewing') ORDER BY r.created_at`,
    );
    return json(result.rows);
  }
  if (method === "PATCH" && /^\/api\/admin\/reports\/[\w-]+$/.test(path)) {
    const id = path.split("/").at(-1)!;
    const input = await body<Record<string, unknown>>(request);
    const status = String(input.status || "");
    if (!(["reviewing","resolved","dismissed"] as string[]).includes(status)) fail(400, "Statut de modération invalide.");
    const note = input.note == null ? null : text(input.note, "La note", 0, 1000);
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
        fail(400, "Cette cible ne peut pas être suspendue depuis cette action.");
      }
    }
    const result = await pool.query(
      `UPDATE moderation_reports SET status=$2,reviewer_id=$3,resolution_note=$4,resolved_at=CASE WHEN $2 IN ('resolved','dismissed') THEN now() ELSE NULL END
       WHERE id=$1 RETURNING id,status`, [id,status,user.profileId,note],
    );
    if (!result.rowCount) fail(404, "Signalement introuvable.");
    await pool.query("INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,metadata) VALUES ($1,'moderation_report_updated','moderation_report',$2,$3::jsonb)", [user.profileId,id,JSON.stringify({ status })]);
    return json(result.rows[0]);
  }
  fail(404, "Route administration introuvable.");
}

async function sitemap(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.PUBLIC_SITE_URL || process.env.SITE_URL || requestOrigin;
  const origin = new URL(configuredOrigin).origin;
  const staticPaths = ["/", "/boutique", "/categories", "/selection", "/fonctionnement", "/commissions", "/avis", "/nouveautes", "/vendre-sur-madclothes", "/contact", "/aide", "/conditions", "/confidentialite", "/mentions-legales"];
  const entries: Array<{ path: string; updatedAt: Date | string | null }> = staticPaths.map((path) => ({ path, updatedAt: null }));
  try {
    const result = await pool.query<{ id: string; updated_at: Date | string }>(
      "SELECT id, updated_at FROM listings WHERE status = 'published' ORDER BY published_at DESC NULLS LAST LIMIT 5000",
    );
    for (const listing of result.rows) entries.push({ path: `/article/${listing.id}`, updatedAt: listing.updated_at });
  } catch (error) {
    console.warn("Sitemap listing URLs unavailable; serving public pages only.", error);
  }
  const xmlEscape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
  const urls = entries.map(({ path, updatedAt }) => {
    const lastmod = updatedAt ? `<lastmod>${new Date(updatedAt).toISOString()}</lastmod>` : "";
    return `<url><loc>${xmlEscape(`${origin}${path}`)}</loc>${lastmod}</url>`;
  }).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=3600" },
  });
}

function robots(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.PUBLIC_SITE_URL || process.env.SITE_URL || requestOrigin;
  const origin = new URL(configuredOrigin).origin;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=3600" },
  });
}

export async function handleApi(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Methods": allowedMethods, "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "600" } });
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  if (path === "/api/robots" && request.method === "GET") return robots(request);
  if (path === "/api/sitemap" && request.method === "GET") return await sitemap(request);
  if (!process.env.DATABASE_URL) return json({ error: "DATABASE_URL n'est pas configurée." }, 503);
  try {
    if (path === "/api/health" && request.method === "GET") {
      await pool.query("SELECT 1");
      return json({ status: "ok", database: "connected" });
    }
    if (path === "/api/commissions" && request.method === "GET") {
      const result = await pool.query("SELECT value FROM platform_settings WHERE key='commission_rates'");
      const value = result.rows[0]?.value || {};
      return json({ configured: Boolean(value.configured), sellerBps: Number(value.seller_bps || 0) });
    }
    if (path === "/api/reviews" && request.method === "GET") {
      const result = await pool.query(
        `SELECT r.rating,r.comment,p.display_name AS "displayName",p.city,r.created_at AS "createdAt"
         FROM reviews r JOIN profiles p ON p.id=r.reviewer_id
         WHERE r.comment IS NOT NULL AND length(trim(r.comment)) > 0
         ORDER BY r.created_at DESC LIMIT 12`,
      );
      return json(result.rows);
    }
    if (path === "/api/profile") return await profile(request, request.method);
    if (path === "/api/listings" || path.startsWith("/api/listings/") || path === "/api/categories" || path === "/api/seller/listings") return await listings(request, request.method, path);
    if (path === "/api/uploads/presign" || path === "/api/uploads/confirm") return await uploads(request, request.method, path);
    if (path === "/api/favorites" || path.startsWith("/api/favorites/")) return await favorites(request, request.method, path);
    if (path === "/api/orders" || path.startsWith("/api/orders/")) return await orders(request, request.method, path);
    if (path === "/api/conversations" || path.startsWith("/api/conversations/")) return await messaging(request, request.method, path);
    if (path === "/api/notifications" || path.startsWith("/api/notifications/")) return await notifications(request, request.method, path);
    if (path.startsWith("/api/admin/")) return await admin(request, request.method, path);
    if (path === "/api/reports" && request.method === "POST") {
      const user = await authenticated(request);
      const input = await body<Record<string, unknown>>(request);
      const type = String(input.targetType || "");
      if (!(["listing","message","review","profile"] as string[]).includes(type)) fail(400, "Type de signalement invalide.");
      const targetId = text(input.targetId, "La cible", 1, 80);
      const reason = text(input.reason, "Le motif", 3, 1000);
      await pool.query("INSERT INTO moderation_reports (reporter_id,target_type,target_id,reason) VALUES ($1,$2,$3,$4)", [user.profileId,type,targetId,reason]);
      return json({ reported: true }, 201);
    }
    return json({ error: "Route introuvable." }, 404);
  } catch (error) {
    const apiError = error as ApiError;
    if (apiError.status) return json({ error: apiError.message }, apiError.status);
    if ((error as { code?: string }).code === "23505") return json({ error: "Cet élément existe déjà ou n'est plus disponible." }, 409);
    if ((error as { code?: string }).code === "23503") return json({ error: "La référence demandée n'existe pas." }, 400);
    console.error("Madclothes API error", error);
    return json({ error: "Une erreur inattendue est survenue." }, 500);
  }
}
