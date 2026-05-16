"use client";

import { useEffect, useRef, useState } from "react";
import { usePrice } from "@/components/providers/price-provider";
import { atr, macd, rsi, stochastic } from "@/lib/indicators";
import type { Timeframe } from "@/lib/chart-config";

type OscType = "rsi" | "macd" | "stoch" | "atr";

interface OscillatorPaneProps {
  type: OscType;
  timeframe: Timeframe;
  height?: number;
}

interface KlineRow {
  time: number;
  high: number;
  low: number;
  close: number;
}

const OSC_TITLE: Record<OscType, string> = {
  rsi: "RSI 14",
  macd: "MACD 12,26,9",
  stoch: "STOCH 14,3,3",
  atr: "ATR 14",
};

async function fetchCloses(
  symbol: string,
  interval: string,
  limit: number
): Promise<KlineRow[]> {
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  const data = await res.json();
  return (data as (string | number)[][]).map((k) => ({
    time: Math.floor(Number(k[0]) / 1000),
    high: parseFloat(String(k[2])),
    low: parseFloat(String(k[3])),
    close: parseFloat(String(k[4])),
  }));
}

/**
 * Standalone oscillator pane (RSI or MACD) for the FullChart page.
 * Each instance fetches its own klines for the active pair/timeframe
 * and draws a separate lightweight-charts canvas below the main price
 * chart. Re-renders on symbol or timeframe change.
 */
export function OscillatorPane({
  type,
  timeframe,
  height = 140,
}: OscillatorPaneProps) {
  const { symbol } = usePrice();
  const [closes, setCloses] = useState<KlineRow[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  // ─ Init chart
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let ro: ResizeObserver | null = null;

    import("lightweight-charts").then((mod) => {
      if (cancelled || !containerRef.current) return;
      containerRef.current.innerHTML = "";

      const chart = mod.createChart(containerRef.current, {
        layout: {
          background: { type: mod.ColorType.Solid, color: "#0e0e0f" },
          textColor: "#adaaab",
          fontFamily: "'Inter', sans-serif",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: "rgba(72,72,73,0.10)" },
          horzLines: { color: "rgba(72,72,73,0.10)" },
        },
        crosshair: { mode: mod.CrosshairMode.Normal },
        rightPriceScale: { borderColor: "rgba(72,72,73,0.15)" },
        timeScale: {
          borderColor: "rgba(72,72,73,0.15)",
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: true,
        handleScale: true,
      });
      chartRef.current = chart;

      // Build initial series — these handles live for the chart's lifetime
      if (type === "rsi") {
        const line = chart.addSeries(mod.LineSeries, {
          color: "#ff734c",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        const overbought = line.createPriceLine({
          price: 70,
          color: "rgba(255,113,108,0.4)",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "70",
        });
        const oversold = line.createPriceLine({
          price: 30,
          color: "rgba(80,200,120,0.4)",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "30",
        });
        const midline = line.createPriceLine({
          price: 50,
          color: "rgba(173,170,171,0.25)",
          lineWidth: 1,
          lineStyle: 3,
          axisLabelVisible: false,
        });
        void overbought;
        void oversold;
        void midline;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chart as any)._rsiSeries = line;
      } else if (type === "stoch") {
        const kLine = chart.addSeries(mod.LineSeries, {
          color: "#00ffff",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        const dLine = chart.addSeries(mod.LineSeries, {
          color: "#ff734c",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        kLine.createPriceLine({
          price: 80,
          color: "rgba(255,113,108,0.4)",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "80",
        });
        kLine.createPriceLine({
          price: 20,
          color: "rgba(80,200,120,0.4)",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "20",
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chart as any)._stochK = kLine;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chart as any)._stochD = dLine;
      } else if (type === "atr") {
        const line = chart.addSeries(mod.LineSeries, {
          color: "#a78bfa",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chart as any)._atrSeries = line;
      } else {
        const macdLine = chart.addSeries(mod.LineSeries, {
          color: "#00ffff",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        const signalLine = chart.addSeries(mod.LineSeries, {
          color: "#ff734c",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        const histogram = chart.addSeries(mod.HistogramSeries, {
          priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
          priceLineVisible: false,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chart as any)._macdLine = macdLine;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chart as any)._macdSignal = signalLine;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chart as any)._macdHist = histogram;
      }

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
          // ignore
        }
        chartRef.current = null;
      }
    };
  }, [type]);

  // ─ Load + refresh closes
  useEffect(() => {
    let cancelled = false;
    const limit = 240;
    fetchCloses(symbol, timeframe, limit).then((rows) => {
      if (!cancelled) setCloses(rows);
    });

    const refreshMs = timeframe === "1m" ? 15_000 : 60_000;
    const id = setInterval(() => {
      fetchCloses(symbol, timeframe, limit).then((rows) => {
        if (!cancelled) setCloses(rows);
      });
    }, refreshMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol, timeframe]);

  // ─ Update series whenever closes change
  useEffect(() => {
    if (closes.length === 0 || !chartRef.current) return;
    const closePrices = closes.map((c) => c.close);
    const highs = closes.map((c) => c.high);
    const lows = closes.map((c) => c.low);

    const toLine = (values: (number | null)[]) =>
      closes
        .map((c, i) => {
          const v = values[i];
          return v === null ? null : { time: c.time, value: v };
        })
        .filter((p): p is { time: number; value: number } => p !== null);

    if (type === "rsi") {
      const values = rsi(closePrices, 14);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const series = (chartRef.current as any)._rsiSeries;
      if (!series) return;
      series.setData(toLine(values));
    } else if (type === "stoch") {
      const { k, d } = stochastic(highs, lows, closePrices, 14, 3, 3);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chart = chartRef.current as any;
      if (!chart._stochK || !chart._stochD) return;
      chart._stochK.setData(toLine(k));
      chart._stochD.setData(toLine(d));
    } else if (type === "atr") {
      const values = atr(highs, lows, closePrices, 14);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const series = (chartRef.current as any)._atrSeries;
      if (!series) return;
      series.setData(toLine(values));
    } else {
      const { macd: macdLineVals, signal, histogram } = macd(closePrices);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chart = chartRef.current as any;
      const macdLineSeries = chart._macdLine;
      const signalLineSeries = chart._macdSignal;
      const histSeries = chart._macdHist;
      if (!macdLineSeries || !signalLineSeries || !histSeries) return;

      const dataM = closes
        .map((c, i) => {
          const v = macdLineVals[i];
          return v === null ? null : { time: c.time, value: v };
        })
        .filter((p): p is { time: number; value: number } => p !== null);
      const dataS = closes
        .map((c, i) => {
          const v = signal[i];
          return v === null ? null : { time: c.time, value: v };
        })
        .filter((p): p is { time: number; value: number } => p !== null);
      const dataH = closes
        .map((c, i) => {
          const v = histogram[i];
          if (v === null) return null;
          return {
            time: c.time,
            value: v,
            color: v >= 0 ? "rgba(0,255,255,0.4)" : "rgba(255,115,76,0.4)",
          };
        })
        .filter(
          (p): p is { time: number; value: number; color: string } => p !== null
        );

      macdLineSeries.setData(dataM);
      signalLineSeries.setData(dataS);
      histSeries.setData(dataH);
    }

    chartRef.current.timeScale().fitContent();
  }, [closes, type]);

  return (
    <div
      className="relative w-full bg-[#0e0e0f] border-t border-outline-variant/10"
      style={{ height }}
    >
      <div className="absolute top-2 left-3 z-10 text-[10px] font-bold tracking-widest uppercase text-on-surface-variant pointer-events-none">
        {OSC_TITLE[type]}
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
