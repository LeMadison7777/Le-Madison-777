import { useEffect, useState } from "react";
import type { Product } from "@/data/products";

export function useListings(params = "", limit = 8) {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams(params);
    query.set("limit", String(limit));
    setLoading(true);
    fetch(`/api/listings?${query.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Le catalogue est indisponible.");
        return result as { items: Product[]; total: number };
      })
      .then((result) => { setItems(result.items); setTotal(result.total); setError(""); })
      .catch((cause) => { if (!controller.signal.aborted) { setItems([]); setError((cause as Error).message); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [params, limit]);
  return { items, total, loading, error };
}
