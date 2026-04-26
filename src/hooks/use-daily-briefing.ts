"use client";

import { useCallback, useEffect, useState } from "react";
import { PAIRS, type TradingPair } from "@/lib/symbols";
import type { PriceAlert } from "@/hooks/use-alerts";
import type { Position } from "@/hooks/use-positions";

// ─── Types ───────────────────────────────────────────────────────────

export interface MoverEntry {
  pair: TradingPair;
  price: number;
  changePct: number;
  volume24h: number;
}

export interface BriefingData {
  generatedAt: number;
  // 24h movers across all configured pairs, sorted by absolute change
  topGainers: MoverEntry[];
  topLosers: MoverEntry[];
  // Alerts that fired since the last briefing (or 24h ago if first time)
  triggeredAlerts: PriceAlert[];
  // Positions auto-closed (SL/TP) since last briefing
  closedPositions: Position[];
}

// ─── Storage ─────────────────────────────────────────────────────────

const STORAGE_KEY = "kinetic:lastBriefing";

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getLastBriefingDate(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setLastBriefingDate(date: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, date);
  } catch {
    // private mode — silent fallback
  }
}

// Cutoff for "since last briefing" — falls back to 24h ago for first-time
function lastBriefingTimestamp(): number {
  const last = getLastBriefingDate();
  if (last) {
    return new Date(last + "T00:00:00").getTime();
  }
  return Date.now() - 24 * 60 * 60 * 1000;
}

// ─── Data fetchers ───────────────────────────────────────────────────

async function fetchAllTickers(): Promise<MoverEntry[]> {
  const results = await Promise.allSettled(
    PAIRS.map(async (pair) => {
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${pair.symbol}`
      );
      if (!res.ok) throw new Error(`failed ${pair.symbol}`);
      const data = await res.json();
      return {
        pair,
        price: parseFloat(data.lastPrice),
        changePct: parseFloat(data.priceChangePercent),
        volume24h: parseFloat(data.quoteVolume),
      } as MoverEntry;
    })
  );
  return results
    .filter((r): r is PromiseFulfilledResult<MoverEntry> => r.status === "fulfilled")
    .map((r) => r.value);
}

async function fetchTriggeredAlerts(since: number): Promise<PriceAlert[]> {
  try {
    const res = await fetch("/api/alerts?includeTriggered=true");
    if (!res.ok) return [];
    const all = (await res.json()) as PriceAlert[];
    return all.filter((a) => {
      if (!a.triggeredAt) return false;
      return new Date(a.triggeredAt).getTime() >= since;
    });
  } catch {
    return [];
  }
}

async function fetchRecentlyClosedPositions(since: number): Promise<Position[]> {
  try {
    const res = await fetch("/api/positions?status=closed");
    if (!res.ok) return [];
    const all = (await res.json()) as Position[];
    return all.filter((p) => {
      if (!p.closedAt) return false;
      return new Date(p.closedAt).getTime() >= since;
    });
  } catch {
    return [];
  }
}

// ─── Hook ────────────────────────────────────────────────────────────

export interface UseDailyBriefingResult {
  data: BriefingData | null;
  loading: boolean;
  open: boolean;
  /** Show the briefing modal (e.g. when user clicks "View briefing"). */
  show: () => Promise<void>;
  /** Close the modal and mark today as briefed. */
  dismiss: () => void;
}

/**
 * Auto-shows the briefing once per calendar day. Skips on the first
 * visit if the user has already been seen today (e.g. another tab).
 *
 * The briefing fetches:
 *   - 24h tickers for every configured pair (Binance REST)
 *   - Alerts triggered since last briefing (our /api/alerts)
 *   - Positions closed since last briefing (our /api/positions)
 *
 * Calling `show()` manually re-fetches and opens the modal regardless
 * of the day-tracking state, so users can pull a fresh briefing on
 * demand.
 */
export function useDailyBriefing(autoShow = true): UseDailyBriefingResult {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchBriefing = useCallback(async (): Promise<BriefingData> => {
    const since = lastBriefingTimestamp();
    const [tickers, alerts, positions] = await Promise.all([
      fetchAllTickers(),
      fetchTriggeredAlerts(since),
      fetchRecentlyClosedPositions(since),
    ]);

    const sorted = [...tickers].sort((a, b) => b.changePct - a.changePct);
    const topGainers = sorted.filter((m) => m.changePct > 0).slice(0, 3);
    const topLosers = sorted
      .filter((m) => m.changePct < 0)
      .slice(-3)
      .reverse();

    return {
      generatedAt: Date.now(),
      topGainers,
      topLosers,
      triggeredAlerts: alerts,
      closedPositions: positions,
    };
  }, []);

  const show = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchBriefing();
      setData(d);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, [fetchBriefing]);

  const dismiss = useCallback(() => {
    setOpen(false);
    setLastBriefingDate(todayKey());
  }, []);

  // Auto-show on mount once per day
  useEffect(() => {
    if (!autoShow) return;
    const last = getLastBriefingDate();
    if (last === todayKey()) return; // already seen today
    // Defer slightly so the dashboard finishes its first paint before we
    // pop the modal — feels less jarring than instant overlay.
    const id = setTimeout(() => {
      show();
    }, 1500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoShow]);

  return { data, loading, open, show, dismiss };
}
