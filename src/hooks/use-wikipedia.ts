"use client";

import { useEffect, useState } from "react";

export interface WikiSummary {
  title: string;
  extract: string;
  thumbnail: string | null;
  url: string;
}

// Caller is expected to gate on truthy title so this hook can stay pure.
export function useWikipedia(title: string) {
  const [data, setData] = useState<WikiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/wiki/${encodeURIComponent(title)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as WikiSummary;
        if (cancelled) return;
        setData(json);
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
  }, [title]);

  return { data, loading, error };
}
