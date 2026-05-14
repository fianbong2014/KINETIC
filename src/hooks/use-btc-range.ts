"use client";

import { useEffect, useState } from "react";

export type BtcRange = "1D" | "7D" | "30D";

interface RangeConfig {
  interval: string;
  limit: number;
}

const CONFIG: Record<BtcRange, RangeConfig> = {
  "1D": { interval: "1h", limit: 24 },
  "7D": { interval: "4h", limit: 42 },
  "30D": { interval: "1d", limit: 30 },
};

export interface RangeStats {
  candles: { time: number; close: number }[];
  open: number;       // first close of window
  current: number;    // last close of window
  high: number;
  low: number;
  changePct: number;
  loading: boolean;
}

const EMPTY: RangeStats = {
  candles: [],
  open: 0,
  current: 0,
  high: 0,
  low: 0,
  changePct: 0,
  loading: true,
};

/**
 * Fetches BTCUSDT klines for the given range and derives summary stats
 * (open/close/high/low/change%) plus a closes-only series for plotting
 * a sparkline. Refreshes every 60 seconds — fine-grained price updates
 * still come from useBtcTicker's WebSocket.
 */
export function useBtcRange(range: BtcRange): RangeStats {
  const [state, setState] = useState<RangeStats>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    const { interval, limit } = CONFIG[range];

    async function load() {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`
        );
        if (!res.ok) throw new Error("Klines fetch failed");
        const rows = (await res.json()) as Array<
          [number, string, string, string, string, string]
        >;
        if (cancelled || rows.length === 0) return;

        const candles = rows.map((r) => ({
          time: r[0],
          close: parseFloat(r[4]),
        }));
        const open = parseFloat(rows[0][1]);
        const current = candles[candles.length - 1].close;
        let high = -Infinity;
        let low = Infinity;
        for (const r of rows) {
          const h = parseFloat(r[2]);
          const l = parseFloat(r[3]);
          if (h > high) high = h;
          if (l < low) low = l;
        }
        const changePct = open > 0 ? ((current - open) / open) * 100 : 0;

        setState({
          candles,
          open,
          current,
          high,
          low,
          changePct,
          loading: false,
        });
      } catch {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    setState((prev) => ({ ...prev, loading: true }));
    load();
    const id = setInterval(load, 60_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [range]);

  return state;
}
