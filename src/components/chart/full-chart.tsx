"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePrice } from "@/components/providers/price-provider";
import {
  bollingerBands,
  toHeikinAshi,
  vwap,
  type ChartConfig,
  type IndicatorToggles,
  type OhlcCandle,
} from "@/lib/chart-config";
import { ema, sma } from "@/lib/indicators";
import { INDICATOR_META } from "@/lib/chart-config";

interface FullChartProps {
  config: ChartConfig;
}

interface KlineRow {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines";

async function fetchKlines(
  symbol: string,
  interval: string,
  limit: number
): Promise<KlineRow[]> {
  const res = await fetch(
    `${BINANCE_KLINES_URL}?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  const data = await res.json();
  return (data as (string | number)[][]).map((k) => ({
    time: Math.floor(Number(k[0]) / 1000),
    open: parseFloat(String(k[1])),
    high: parseFloat(String(k[2])),
    low: parseFloat(String(k[3])),
    close: parseFloat(String(k[4])),
    volume: parseFloat(String(k[5])),
  }));
}

/**
 * Reads the user's ChartConfig and renders a fully-customizable
 * lightweight-charts price view. All overlays (EMA/SMA/BBands/VWAP)
 * and the candle/HA/line/area type are re-derived from raw klines on
 * every config change.
 *
 * Drawing tools and position lines from the dashboard chart are
 * intentionally NOT included here — this page is focused on visual
 * customization, not trade execution.
 */
export function FullChart({ config }: FullChartProps) {
  const { symbol, pair } = usePrice();
  const [klines, setKlines] = useState<KlineRow[]>([]);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lwcRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceSeriesRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volumeSeriesRef = useRef<any>(null);
  // Indicator series keyed by indicator id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const indicatorSeriesRef = useRef<Map<string, any>>(new Map());

  // ─ Initial chart setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let ro: ResizeObserver | null = null;

    import("lightweight-charts").then((mod) => {
      if (cancelled || !containerRef.current) return;
      lwcRef.current = mod;
      containerRef.current.innerHTML = "";

      const chart = mod.createChart(containerRef.current, {
        layout: {
          background: { type: mod.ColorType.Solid, color: "#0e0e0f" },
          textColor: "#adaaab",
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "rgba(72,72,73,0.12)" },
          horzLines: { color: "rgba(72,72,73,0.12)" },
        },
        crosshair: {
          mode: mod.CrosshairMode.Normal,
          vertLine: {
            color: "rgba(0,255,255,0.3)",
            labelBackgroundColor: "#00ffff",
          },
          horzLine: {
            color: "rgba(0,255,255,0.3)",
            labelBackgroundColor: "#00ffff",
          },
        },
        rightPriceScale: {
          borderColor: "rgba(72,72,73,0.15)",
          scaleMargins: { top: 0.08, bottom: 0.2 },
        },
        timeScale: {
          borderColor: "rgba(72,72,73,0.15)",
          timeVisible: true,
          secondsVisible: false,
        },
      });

      chartRef.current = chart;

      ro = new ResizeObserver(() => {
        if (!containerRef.current) return;
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      });
      ro.observe(containerRef.current);
    });

    return () => {
      cancelled = true;
      ro?.disconnect();
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch {
          // already disposed
        }
        chartRef.current = null;
      }
      priceSeriesRef.current = null;
      volumeSeriesRef.current = null;
      indicatorSeriesRef.current.clear();
    };
  }, []);

  // ─ Load klines whenever symbol or timeframe changes
  useEffect(() => {
    const tf = config.timeframe;
    let cancelled = false;
    setLoading(true);

    const limit =
      tf === "1m" || tf === "5m" ? 240 : tf === "1w" ? 150 : 200;

    fetchKlines(symbol, tf, limit)
      .then((rows) => {
        if (!cancelled) {
          setKlines(rows);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    // Auto-refresh: faster for low TFs, slower for high TFs.
    const refreshMs =
      tf === "1m" ? 15_000 : tf === "5m" ? 30_000 : tf === "1w" ? 600_000 : 60_000;
    const id = setInterval(() => {
      fetchKlines(symbol, tf, limit).then((rows) => {
        if (!cancelled) setKlines(rows);
      });
    }, refreshMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol, config.timeframe]);

  // ─ Apply price series whenever chartType or klines change
  const buildPriceSeries = useCallback(() => {
    const chart = chartRef.current;
    const mod = lwcRef.current;
    if (!chart || !mod || klines.length === 0) return;

    // Remove existing price series before rebuilding
    if (priceSeriesRef.current) {
      try {
        chart.removeSeries(priceSeriesRef.current);
      } catch {
        // already removed
      }
      priceSeriesRef.current = null;
    }

    const ohlc: OhlcCandle[] =
      config.chartType === "heikin_ashi"
        ? toHeikinAshi(
            klines.map((k) => ({
              time: k.time,
              open: k.open,
              high: k.high,
              low: k.low,
              close: k.close,
            }))
          )
        : klines.map((k) => ({
            time: k.time,
            open: k.open,
            high: k.high,
            low: k.low,
            close: k.close,
          }));

    if (config.chartType === "line") {
      const series = chart.addSeries(mod.LineSeries, {
        color: "#00ffff",
        lineWidth: 2,
      });
      series.setData(
        ohlc.map((c) => ({ time: c.time, value: c.close }))
      );
      priceSeriesRef.current = series;
    } else if (config.chartType === "area") {
      const series = chart.addSeries(mod.AreaSeries, {
        lineColor: "#00ffff",
        topColor: "rgba(0,255,255,0.4)",
        bottomColor: "rgba(0,255,255,0.0)",
        lineWidth: 2,
      });
      series.setData(
        ohlc.map((c) => ({ time: c.time, value: c.close }))
      );
      priceSeriesRef.current = series;
    } else {
      // candles or heikin_ashi
      const series = chart.addSeries(mod.CandlestickSeries, {
        upColor: "#00ffff",
        downColor: "#ff734c",
        borderUpColor: "#00ffff",
        borderDownColor: "#ff734c",
        wickUpColor: "#00ffff",
        wickDownColor: "#ff734c",
      });
      series.setData(ohlc);
      priceSeriesRef.current = series;
    }

    chart.timeScale().fitContent();
  }, [klines, config.chartType]);

  // ─ Apply volume series
  const buildVolume = useCallback(() => {
    const chart = chartRef.current;
    const mod = lwcRef.current;
    if (!chart || !mod || klines.length === 0) return;

    // Remove existing
    if (volumeSeriesRef.current) {
      try {
        chart.removeSeries(volumeSeriesRef.current);
      } catch {
        // ignore
      }
      volumeSeriesRef.current = null;
    }

    if (!config.indicators.volume) return;

    const volSeries = chart.addSeries(mod.HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    volSeries.setData(
      klines.map((k) => ({
        time: k.time,
        value: k.volume,
        color:
          k.close >= k.open
            ? "rgba(0,255,255,0.25)"
            : "rgba(255,115,76,0.25)",
      }))
    );
    volumeSeriesRef.current = volSeries;
  }, [klines, config.indicators.volume]);

  // ─ Apply overlay indicators
  const buildIndicators = useCallback(() => {
    const chart = chartRef.current;
    const mod = lwcRef.current;
    if (!chart || !mod || klines.length === 0) return;

    // Clear all existing indicator series
    for (const series of indicatorSeriesRef.current.values()) {
      try {
        chart.removeSeries(series);
      } catch {
        // already removed
      }
    }
    indicatorSeriesRef.current.clear();

    const closes = klines.map((k) => k.close);

    // Helper to add a single-line overlay
    const addLine = (
      id: string,
      values: (number | null)[],
      color: string,
      width: number = 1
    ) => {
      const series = chart.addSeries(mod.LineSeries, {
        color,
        lineWidth: width,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      series.setData(
        klines
          .map((k, i) => {
            const v = values[i];
            return v === null ? null : { time: k.time, value: v };
          })
          .filter((p): p is { time: number; value: number } => p !== null)
      );
      indicatorSeriesRef.current.set(id, series);
    };

    const ind = config.indicators;

    if (ind.ema20) addLine("ema20", ema(closes, 20), INDICATOR_META.ema20.color);
    if (ind.ema50) addLine("ema50", ema(closes, 50), INDICATOR_META.ema50.color);
    if (ind.ema200)
      addLine("ema200", ema(closes, 200), INDICATOR_META.ema200.color);
    if (ind.sma50) addLine("sma50", sma(closes, 50), INDICATOR_META.sma50.color);

    if (ind.bbands) {
      const bb = bollingerBands(closes, 20, 2);
      addLine("bb_upper", bb.upper, INDICATOR_META.bbands.color, 1);
      addLine("bb_middle", bb.middle, INDICATOR_META.bbands.color, 1);
      addLine("bb_lower", bb.lower, INDICATOR_META.bbands.color, 1);
    }

    if (ind.vwap) {
      const v = vwap(klines);
      addLine("vwap", v, INDICATOR_META.vwap.color, 2);
    }
  }, [klines, config.indicators]);

  // Re-render layers when their inputs change
  useEffect(() => {
    buildPriceSeries();
  }, [buildPriceSeries]);

  useEffect(() => {
    buildVolume();
  }, [buildVolume]);

  useEffect(() => {
    buildIndicators();
  }, [buildIndicators]);

  return (
    <div className="relative w-full h-full bg-[#0e0e0f] flex flex-col">
      {/* Pair label overlay */}
      <div className="absolute top-3 left-3 z-10 bg-surface-container-low/80 backdrop-blur-sm px-3 py-1.5 flex items-center gap-3 pointer-events-none">
        <span className="text-sm font-black font-heading tracking-tighter uppercase text-on-surface">
          {pair.display}
        </span>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
          {config.timeframe} · {config.chartType.replace("_", "-")}
        </span>
      </div>

      {loading && klines.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-xs text-on-surface-variant tracking-widest uppercase animate-pulse pointer-events-none">
          Loading candles...
        </div>
      )}

      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}

// Visual key for active indicators — rendered in the toolbar
export function IndicatorLegend({
  indicators,
}: {
  indicators: IndicatorToggles;
}) {
  const active = (Object.keys(indicators) as (keyof IndicatorToggles)[]).filter(
    (k) => indicators[k]
  );
  if (active.length === 0) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap text-[10px] tracking-wider uppercase">
      {active.map((id) => (
        <span key={id} className="flex items-center gap-1.5">
          <span
            className="w-2 h-0.5"
            style={{ backgroundColor: INDICATOR_META[id].color }}
          />
          <span className="text-on-surface-variant">
            {INDICATOR_META[id].label}
          </span>
        </span>
      ))}
    </div>
  );
}
