"use client";

import { useEffect, useState } from "react";
import type { Candle } from "@/lib/indicators";

const BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines";

export function useKlines(
  symbol: string,
  interval: string,
  limit: number = 120
): { candles: Candle[]; loading: boolean; error: string | null } {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchKlines() {
      setLoading(true);
      try {
        const res = await fetch(
          `${BINANCE_KLINES_URL}?symbol=${symbol}&interval=${interval}&limit=${limit}`
        );
        if (!res.ok) throw new Error("Failed to fetch klines");
        const data = await res.json();
        if (cancelled) return;

        const parsed: Candle[] = data.map(
          (k: (string | number)[]): Candle => ({
            time: Math.floor(Number(k[0]) / 1000),
            open: parseFloat(String(k[1])),
            high: parseFloat(String(k[2])),
            low: parseFloat(String(k[3])),
            close: parseFloat(String(k[4])),
            volume: parseFloat(String(k[5])),
          })
        );
        setCandles(parsed);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchKlines();
    // Refresh klines periodically so indicators stay fresh without a WS subscription
    const id = setInterval(fetchKlines, 60000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol, interval, limit]);

  return { candles, loading, error };
}
