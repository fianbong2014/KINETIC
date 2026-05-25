"use client";

import { useEffect, useRef, useState } from "react";
import { CandlestickChart } from "lucide-react";
import { useKlines } from "@/hooks/use-klines";
import { getChartTheme, CHART_THEME_EVENT } from "@/lib/chart-theme";

// Lightweight-charts types are loaded dynamically; we only need to keep
// the chart + series handles so we can update them on theme changes.
type AnyChart = { applyOptions: (o: unknown) => void; remove: () => void };
type AnySeries = {
  applyOptions: (o: unknown) => void;
  setData: (d: unknown[]) => void;
};

const INTERVALS = [
  { id: "15m", label: "15M" },
  { id: "1h", label: "1H" },
  { id: "4h", label: "4H" },
  { id: "1d", label: "1D" },
] as const;
type Interval = (typeof INTERVALS)[number]["id"];

export function SymbolChart({ symbol }: { symbol: string }) {
  const [interval, setInterval] = useState<Interval>("1h");
  const { candles, loading } = useKlines(symbol, interval, 180);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<AnyChart | null>(null);
  const seriesRef = useRef<AnySeries | null>(null);

  // Create the chart once. Theme + data effects update it in place.
  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;
    let ro: ResizeObserver | null = null;

    (async () => {
      const mod = await import("lightweight-charts");
      if (!mounted || !containerRef.current) return;
      const t = getChartTheme();
      const chart = mod.createChart(containerRef.current, {
        layout: {
          background: { type: mod.ColorType.Solid, color: t.background },
          textColor: t.text,
          fontFamily: t.fontFamily,
          fontSize: 10,
        },
        grid: {
          vertLines: { color: t.grid },
          horzLines: { color: t.grid },
        },
        rightPriceScale: { borderColor: t.border },
        timeScale: { borderColor: t.border, timeVisible: true, secondsVisible: false },
        handleScroll: true,
        handleScale: true,
      });
      const series = chart.addSeries(mod.CandlestickSeries, {
        upColor: t.up,
        downColor: t.down,
        borderUpColor: t.up,
        borderDownColor: t.down,
        wickUpColor: t.up,
        wickDownColor: t.down,
      });
      chartRef.current = chart as unknown as AnyChart;
      seriesRef.current = series as unknown as AnySeries;

      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          chart.applyOptions({ width, height });
        }
      });
      ro.observe(containerRef.current);
    })();

    return () => {
      mounted = false;
      ro?.disconnect();
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Push candles whenever they update.
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;
    seriesRef.current.setData(
      candles.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
  }, [candles]);

  // Re-skin when the theme toolbar fires its event.
  useEffect(() => {
    function reskin() {
      const chart = chartRef.current;
      const series = seriesRef.current;
      if (!chart || !series) return;
      const t = getChartTheme();
      chart.applyOptions({
        layout: { background: { color: t.background }, textColor: t.text, fontFamily: t.fontFamily },
        grid: { vertLines: { color: t.grid }, horzLines: { color: t.grid } },
        rightPriceScale: { borderColor: t.border },
        timeScale: { borderColor: t.border },
      });
      series.applyOptions({
        upColor: t.up,
        downColor: t.down,
        borderUpColor: t.up,
        borderDownColor: t.down,
        wickUpColor: t.up,
        wickDownColor: t.down,
      });
    }
    window.addEventListener(CHART_THEME_EVENT, reskin);
    return () => window.removeEventListener(CHART_THEME_EVENT, reskin);
  }, []);

  return (
    <section className="bg-surface-container-low p-4 lg:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CandlestickChart className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            Price Chart
          </h2>
          {loading && (
            <span className="text-[10px] text-cyan tracking-wider">LOADING…</span>
          )}
        </div>
        <div className="flex gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv.id}
              onClick={() => setInterval(iv.id)}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                interval === iv.id
                  ? "bg-cyan/10 text-cyan border border-cyan/30"
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20"
              }`}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="w-full h-[360px]" />
    </section>
  );
}
