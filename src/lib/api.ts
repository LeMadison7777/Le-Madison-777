import { getAccessToken } from "./auth";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  // Resolve a deferred method before passing RequestInit to fetch, which only
  // accepts a plain HTTP method string.
  const method = await Promise.resolve(options.method ?? "GET");
  if (typeof method !== "string") throw new TypeError("La méthode HTTP doit être une chaîne de caractères.");
  const response = await fetch(path, {
    ...options,
    method,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || "La requête n'a pas abouti.", response.status);
  return data as T;
}
