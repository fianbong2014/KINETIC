"use client";

import { useMemo } from "react";
import { useKlines } from "@/hooks/use-klines";
import { analyze } from "@/lib/signal-engine";
import {
  TIMEFRAMES,
  summarize,
  type MultiTFSummary,
  type TimeframeSlice,
} from "@/lib/multi-tf";

export interface MultiTFReport {
  slices: TimeframeSlice[];
  summary: MultiTFSummary;
  loading: boolean;
}

/**
 * Runs the signal engine across all standard timeframes in parallel
 * and produces a consolidated summary for the given symbol.
 *
 * Each timeframe hits Binance's klines REST endpoint independently
 * (three parallel fetches, each refreshed every 60s inside useKlines).
 * Analysis is memoized so bias/confidence don't churn between paint
 * cycles.
 */
export function useMultiTFReport(symbol: string): MultiTFReport {
  // We must call hooks in a stable order — no mapping over TIMEFRAMES
  // at this level. Three fixed calls:
  const k1h = useKlines(symbol, TIMEFRAMES[0].key, TIMEFRAMES[0].limit);
  const k4h = useKlines(symbol, TIMEFRAMES[1].key, TIMEFRAMES[1].limit);
  const k1d = useKlines(symbol, TIMEFRAMES[2].key, TIMEFRAMES[2].limit);

  const slices = useMemo<TimeframeSlice[]>(() => {
    const results = [k1h, k4h, k1d];
    return TIMEFRAMES.map((tf, i) => {
      const k = results[i];
      const report =
        !k.loading && k.candles.length >= 50 ? analyze(k.candles) : null;
      return {
        key: tf.key,
        label: tf.label,
        report,
        loading: k.loading,
      };
    });
  }, [k1h, k4h, k1d]);

  const summary = useMemo(() => summarize(slices), [slices]);
  const loading = slices.every((s) => s.loading);

  return { slices, summary, loading };
}
