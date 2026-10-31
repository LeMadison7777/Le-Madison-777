import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/data/products";
import { api, assertArray } from "@/lib/api";

type ListingsResponse = {
  items: Product[];
  total: number;
  page?: number;
  limit?: number;
};

export function useListings(params = "", limit = 8) {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadIndex, setReloadIndex] = useState(0);

  const retry = useCallback(() => {
    setReloadIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams(params);
    query.set("limit", String(limit));
    setLoading(true);
    setError("");

    api<ListingsResponse>(`/api/listings?${query.toString()}`, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        if (!result || typeof result !== "object") {
          throw new Error("Structure de réponse d'annonces invalide.");
        }
        const validatedItems = assertArray<Product>(result.items, "annonces");
        const validatedTotal = typeof result.total === "number" ? result.total : validatedItems.length;
        setItems(validatedItems);
        setTotal(validatedTotal);
        setError("");
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setItems([]);
          setTotal(0);
          const message = cause instanceof Error ? cause.message : "Le catalogue est indisponible.";
          setError(message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [params, limit, reloadIndex]);

  return { items, total, loading, error, retry };
}
