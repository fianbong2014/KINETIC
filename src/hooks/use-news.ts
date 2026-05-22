"use client";

import { useEffect, useState } from "react";

export interface NewsItem {
  source: string;
  title: string;
  link: string;
  publishedAt: string;
}

export function useNews(keyword: string | undefined) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const qs = keyword
      ? `?keyword=${encodeURIComponent(keyword)}`
      : "";
    (async () => {
      try {
        const res = await fetch(`/api/news${qs}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { items: NewsItem[] };
        if (cancelled) return;
        setItems(json.items ?? []);
        setError(null);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [keyword]);

  return { items, loading, error };
}
