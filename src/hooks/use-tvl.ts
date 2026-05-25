"use client";

import { useEffect, useState } from "react";

export interface TvlPoint {
  date: number;
  tvl: number;
}
export interface TvlData {
  chain: string;
  latestTvlUsd: number | null;
  changePct30d: number | null;
  history: TvlPoint[];
}

// Caller is expected to gate on truthy chain — keep the hook unconditional so
// the React Compiler lint can verify pure effects.
export function useTvl(chain: string) {
  const [data, setData] = useState<TvlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tvl/${encodeURIComponent(chain)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as TvlData;
        if (cancelled) return;
        setData(json);
        setError(null);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chain]);

  return { data, loading, error };
}
