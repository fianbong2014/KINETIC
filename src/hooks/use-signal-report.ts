"use client";

import { useMemo } from "react";
import { useKlines } from "@/hooks/use-klines";
import { analyze, type SignalReport } from "@/lib/signal-engine";

export function useSignalReport(
  symbol: string,
  interval: string = "4h",
  limit: number = 250
): { report: SignalReport | null; loading: boolean } {
  const { candles, loading } = useKlines(symbol, interval, limit);

  const report = useMemo(() => {
    if (candles.length < 50) return null;
    return analyze(candles);
  }, [candles]);

  return { report, loading };
}
