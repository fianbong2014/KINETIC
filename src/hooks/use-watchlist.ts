"use client";

import { useEffect, useState } from "react";
import { PAIRS, type TradingPair } from "@/lib/symbols";
import { analyze, type SignalReport, type SignalBias } from "@/lib/signal-engine";
import type { Candle } from "@/lib/indicators";

export interface WatchlistRow {
  pair: TradingPair;
  price: number;
  changePct: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  // Multi-TF bias snapshot — null while still loading
  mtf: {
    "1h": SignalBias | null;
    "4h": SignalBias | null;
    "1d": SignalBias | null;
  };
  // Composite confidence (0–99) when all three TFs are loaded
  confidence: number | null;
  // Source of truth for "did all 3 TFs finish" — controls progress UI
  ready: boolean;
}

const TICKER_REFRESH_MS = 30_000; // 30s — 24h ticker doesn't change fast
const MTF_REFRESH_MS = 5 * 60_000; // 5min — higher TFs change slowly

const KLINE_CONFIGS = [
  { interval: "1h", limit: 250 },
  { interval: "4h", limit: 250 },
  { interval: "1d", limit: 200 },
] as const;

async function fetchTicker(symbol: string) {
  const res = await fetch(
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
  );
  if (!res.ok) throw new Error("ticker failed");
  return res.json();
}

async function fetchKlines(symbol: string, interval: string, limit: number) {
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  if (!res.ok) throw new Error("klines failed");
  const data = await res.json();
  return (data as (string | number)[][]).map(
    (k): Candle => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: parseFloat(String(k[1])),
      high: parseFloat(String(k[2])),
      low: parseFloat(String(k[3])),
      close: parseFloat(String(k[4])),
      volume: parseFloat(String(k[5])),
    })
  );
}

function reportToBias(report: SignalReport | null): SignalBias | null {
  return report?.bias ?? null;
}

/**
 * Computes a confidence score for a row whose 3 TF reports are known.
 * Mirrors the multi-TF summarize() logic but lighter — we only need
 * the magnitude here, not the full breakdown.
 */
function compositeConfidence(reports: (SignalReport | null)[]): number {
  const weights = [1, 2, 3]; // 1H, 4H, 1D
  let score = 0;
  let totalWeight = 0;
  for (let i = 0; i < reports.length; i++) {
    const r = reports[i];
    if (!r) continue;
    const dir = r.bias === "bullish" ? 1 : r.bias === "bearish" ? -1 : 0;
    score += dir * weights[i] * (r.confidence / 100);
    totalWeight += weights[i];
  }
  const normalized = totalWeight > 0 ? score / totalWeight : 0;
  return Math.min(99, Math.round(30 + Math.abs(normalized) * 70));
}

/**
 * Watches every pair in PAIRS for 24h ticker (every 30s) + multi-TF
 * analysis (every 5min). Returns a row per pair with live price,
 * 24h change, and per-TF bias dots ready to render in a list/table.
 *
 * 21 klines fetches every 5 minutes (7 pairs × 3 TFs) — comfortably
 * inside Binance's 1200 weight/min limit and capped to once per
 * interval to avoid thrashing.
 */
export function useWatchlist(): { rows: WatchlistRow[]; loading: boolean } {
  const [rows, setRows] = useState<WatchlistRow[]>(() =>
    PAIRS.map((pair) => ({
      pair,
      price: 0,
      changePct: 0,
      high24h: 0,
      low24h: 0,
      volume24h: 0,
      mtf: { "1h": null, "4h": null, "1d": null },
      confidence: null,
      ready: false,
    }))
  );
  const [loading, setLoading] = useState(true);

  // Tickers — fast, every 30s
  useEffect(() => {
    let cancelled = false;

    async function refreshTickers() {
      const results = await Promise.allSettled(
        PAIRS.map((pair) => fetchTicker(pair.symbol))
      );
      if (cancelled) return;

      setRows((prev) =>
        prev.map((row, i) => {
          const r = results[i];
          if (r.status !== "fulfilled") return row;
          const t = r.value;
          return {
            ...row,
            price: parseFloat(t.lastPrice),
            changePct: parseFloat(t.priceChangePercent),
            high24h: parseFloat(t.highPrice),
            low24h: parseFloat(t.lowPrice),
            volume24h: parseFloat(t.quoteVolume),
          };
        })
      );
    }

    refreshTickers();
    const id = setInterval(refreshTickers, TICKER_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // MTF analysis — slower, every 5min
  useEffect(() => {
    let cancelled = false;

    async function refreshAll() {
      // Run pairs in parallel — each pair runs its 3 TFs in parallel too
      const reports = await Promise.allSettled(
        PAIRS.map(async (pair) => {
          const klineResults = await Promise.allSettled(
            KLINE_CONFIGS.map((c) => fetchKlines(pair.symbol, c.interval, c.limit))
          );
          const candles = klineResults.map((r) =>
            r.status === "fulfilled" ? r.value : []
          );
          return candles.map((cs) => (cs.length >= 50 ? analyze(cs) : null));
        })
      );

      if (cancelled) return;

      setRows((prev) =>
        prev.map((row, i) => {
          const r = reports[i];
          if (r.status !== "fulfilled") return { ...row, ready: false };
          const [r1h, r4h, r1d] = r.value;
          return {
            ...row,
            mtf: {
              "1h": reportToBias(r1h),
              "4h": reportToBias(r4h),
              "1d": reportToBias(r1d),
            },
            confidence: compositeConfidence([r1h, r4h, r1d]),
            ready: r1h !== null && r4h !== null && r1d !== null,
          };
        })
      );
      setLoading(false);
    }

    refreshAll();
    const id = setInterval(refreshAll, MTF_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { rows, loading };
}
