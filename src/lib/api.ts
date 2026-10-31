import { getAccessToken } from "./auth";

export class ApiError extends Error {
  status: number;
  path?: string;

  constructor(message: string, status: number, path?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
  }
}

/**
 * Asserts that the provided data is an Array.
 * Throws an ApiError (HTTP 502) if data is not an Array, without silently replacing it.
 */
export function assertArray<T>(data: unknown, context = "données"): T[] {
  if (!Array.isArray(data)) {
    throw new ApiError(
      `Structure invalide reçue de l'API (${context} attendu sous forme de tableau).`,
      502,
    );
  }
  return data as T[];
}

function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const lower = contentType.toLowerCase();
  return lower.includes("application/json") || lower.includes("+json");
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const method = await Promise.resolve(options.method ?? "GET");
  if (typeof method !== "string") {
    throw new TypeError("La méthode HTTP doit être une chaîne de caractères.");
  }

  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers,
  });

  // Handle 204 No Content or empty 205 response
  if (response.status === 204 || response.status === 205) {
    if (!response.ok) {
      throw new ApiError(`Erreur HTTP ${response.status} sur ${path}.`, response.status, path);
    }
    return undefined as unknown as T;
  }

  const contentType = response.headers.get("content-type") || "";
  const isHtml = contentType.toLowerCase().includes("text/html");

  if (isHtml) {
    throw new ApiError(
      `L'API a renvoyé du HTML au lieu du JSON attendu. Route : ${path} — Statut : ${response.status}.`,
      response.status,
      path,
    );
  }

  if (!isJsonContentType(contentType)) {
    const text = await response.text().catch(() => "");
    if (!response.ok) {
      const errorDetail = text.trim() ? `: ${text.slice(0, 100)}` : "";
      throw new ApiError(
        `L'API a répondu avec le statut ${response.status} (non-JSON) sur ${path}${errorDetail}`,
        response.status,
        path,
      );
    }
    if (!text.trim()) {
      return undefined as unknown as T;
    }
    throw new ApiError(
      `Format de réponse inattendu (${contentType || "inconnu"}) sur ${path}. Attendu : application/json.`,
      response.status,
      path,
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      `Réponse JSON corrompue reçue de l'API. Route : ${path} — Statut : ${response.status}.`,
      response.status,
      path,
    );
  }

  if (!response.ok) {
    const errorRecord = (data && typeof data === "object" && "error" in data) ? (data as { error: unknown }) : null;
    const errorMessage = typeof errorRecord?.error === "string" ? errorRecord.error : "La requête n'a pas abouti.";
    throw new ApiError(errorMessage, response.status, path);
  }

  return data as T;
}
