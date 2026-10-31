import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, assertArray, ApiError } from "@/lib/api";

describe("api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully returns parsed JSON when Content-Type is application/json", async () => {
    const payload = { items: [{ id: "1", name: "Assembleur" }], total: 1 };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await api<{ items: Array<{ id: string; name: string }>; total: number }>("/api/listings");
    expect(result).toEqual(payload);
  });

  it("explicitly rejects HTML responses instead of returning an empty object", async () => {
    const htmlResponse = "<!doctype html><html><body><h1>404 Not Found</h1></body></html>";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(htmlResponse, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    );

    await expect(api("/api/listings")).rejects.toThrowError(ApiError);
    await expect(api("/api/listings")).rejects.toThrow(
      "L'API a renvoyé du HTML au lieu du JSON attendu. Route : /api/listings — Statut : 200."
    );
  });

  it("handles 204 No Content cleanly without parsing error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 })
    );

    const result = await api<void>("/api/favorites/123", { method: "DELETE" });
    expect(result).toBeUndefined();
  });

  it("throws ApiError with error field from backend on HTTP error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Connectez-vous pour continuer." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(api("/api/profile")).rejects.toThrow("Connectez-vous pour continuer.");
  });

  it("assertArray returns the array when valid", () => {
    const sample = [{ id: "1" }, { id: "2" }];
    expect(assertArray(sample, "test")).toBe(sample);
    expect(assertArray([], "vide")).toEqual([]);
  });

  it("assertArray throws ApiError without masking when value is not an array", () => {
    expect(() => assertArray({}, "catégories")).toThrowError(ApiError);
    expect(() => assertArray(null, "catégories")).toThrow(
      "Structure invalide reçue de l'API (catégories attendu sous forme de tableau)."
    );
    expect(() => assertArray("string", "catégories")).toThrow(ApiError);
  });
});
