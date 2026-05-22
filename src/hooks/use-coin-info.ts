"use client";

import { useEffect, useState } from "react";

export interface CoinInfo {
  id: string;
  symbol: string;
  name: string;
  image: string;
  marketCapRank: number | null;
  categories: string[];
  descriptionEn: string;
  hashingAlgorithm: string | null;
  genesisDate: string | null;
  market: {
    priceUsd: number | null;
    marketCapUsd: number | null;
    fdvUsd: number | null;
    volume24hUsd: number | null;
    athUsd: number | null;
    athChangePct: number | null;
    athDate: string | null;
    atlUsd: number | null;
    atlChangePct: number | null;
    atlDate: string | null;
    circulatingSupply: number | null;
    totalSupply: number | null;
    maxSupply: number | null;
    priceChangePct: {
      h1: number | null;
      h24: number | null;
      d7: number | null;
      d14: number | null;
      d30: number | null;
      d60: number | null;
      d200: number | null;
      y1: number | null;
    };
    sparkline7d: number[];
  };
  sentiment: { upPct: number | null; downPct: number | null };
  community: {
    twitterFollowers: number | null;
    redditSubscribers: number | null;
    redditAvgPosts48h: number | null;
    redditAvgComments48h: number | null;
    redditActiveUsers48h: number | null;
    telegramUserCount: number | null;
  };
  developer: {
    forks: number | null;
    stars: number | null;
    subscribers: number | null;
    totalIssues: number | null;
    closedIssues: number | null;
    prsMerged: number | null;
    prContributors: number | null;
    commits4w: number | null;
  };
  links: {
    homepage: string[];
    blockchainSites: string[];
    forum: string[];
    chat: string[];
    announcement: string[];
    twitter: string;
    facebook: string;
    telegram: string;
    subreddit: string;
    github: string[];
  };
}

/**
 * Fetches the slim CoinGecko payload from our cached /api/coin/[id] proxy.
 * The server route already throttles upstream via the Next data cache, so
 * this hook can refetch when the symbol changes without rate-limit risk.
 *
 * coingeckoId is required and assumed non-empty (callers come from PAIRS).
 */
export function useCoinInfo(coingeckoId: string) {
  const [data, setData] = useState<CoinInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // setState only inside the async resolution — the React Compiler lint
    // rule forbids synchronous setState in an effect body.
    (async () => {
      try {
        const res = await fetch(`/api/coin/${coingeckoId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as CoinInfo;
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
  }, [coingeckoId]);

  return { data, loading, error };
}
