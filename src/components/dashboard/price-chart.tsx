"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePrice } from "@/components/providers/price-provider";
import {
  Camera,
  Maximize2,
  Pencil,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface VolumeData {
  time: number;
  value: number;
  color: string;
}

const TIMEFRAMES = [
  { label: "1M", interval: "1m", limit: 120 },
  { label: "15M", interval: "15m", limit: 96 },
  { label: "1H", interval: "1h", limit: 120 },
  { label: "4H", interval: "4h", limit: 120 },
  { label: "1D", interval: "1d", limit: 120 },
];

const BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines";

async function fetchKlines(
  interval: string,
  limit: number
): Promise<{ candles: CandleData[]; volumes: VolumeData[] }> {
  const res = await fetch(
    `${BINANCE_KLINES_URL}?symbol=BTCUSDT&interval=${interval}&limit=${limit}`
  );
  const data = await res.json();

  const candles: CandleData[] = [];
  const volumes: VolumeData[] = [];

  for (const k of data) {
    const time = Math.floor(k[0] / 1000);
    const open = parseFloat(k[1]);
    const high = parseFloat(k[2]);
    const low = parseFloat(k[3]);
    const close = parseFloat(k[4]);
    const volume = parseFloat(k[5]);

    candles.push({ time, open, high, low, close });
    volumes.push({
      time,
      value: volume,
      color: close >= open ? "rgba(0,255,255,0.25)" : "rgba(255,115,76,0.25)",
    });
  }

  return { candles, volumes };
}

export function PriceChart() {
  const [activeTimeframe, setActiveTimeframe] = useState("1H");
  const { price, priceChangePercent24h, high24h, low24h } = usePrice();

  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candleSeriesRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volumeSeriesRef = useRef<any>(null);
  const lastCandleRef = useRef<CandleData | null>(null);
  const currentIntervalRef = useRef("1h");

  // Load kline data — defined before useEffect so it can be called during init
  const loadData = useCallback(
    async (interval: string, limit: number) => {
      try {
        const { candles, volumes } = await fetchKlines(interval, limit);
        if (candleSeriesRef.current && volumeSeriesRef.current) {
          candleSeriesRef.current.setData(candles as any);
          volumeSeriesRef.current.setData(volumes as any);
          lastCandleRef.current = candles[candles.length - 1] || null;
          currentIntervalRef.current = interval;
          chartRef.current?.timeScale().fitContent();
        }
      } catch (err) {
        console.error("Failed to load klines:", err);
      }
    },
    []
  );

  // Initialize chart
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    let isMounted = true;
    let ro: ResizeObserver | null = null;

    import("lightweight-charts").then(({ createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries }) => {
      // Bail out if component unmounted while we were importing
      if (!isMounted || !chartContainerRef.current) return;

      // Clear any leftover content from a previous chart instance
      chartContainerRef.current.innerHTML = "";

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#0e0e0f" },
          textColor: "#adaaab",
          fontFamily: "'Inter', sans-serif",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: "rgba(72,72,73,0.12)" },
          horzLines: { color: "rgba(72,72,73,0.12)" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
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
          scaleMargins: { top: 0.1, bottom: 0.2 },
        },
        timeScale: {
          borderColor: "rgba(72,72,73,0.15)",
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: true,
        handleScale: true,
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#00ffff",
        downColor: "#ff734c",
        borderUpColor: "#00ffff",
        borderDownColor: "#ff734c",
        wickUpColor: "#00ffff",
        wickDownColor: "#ff734c",
      });

      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "",
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;

      // Load initial data
      loadData("1h", 120);

      // Handle resize
      ro = new ResizeObserver((entries) => {
        if (!isMounted) return;
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          chart.applyOptions({ width, height });
        }
      });
      ro.observe(chartContainerRef.current);
    });

    return () => {
      isMounted = false;
      ro?.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      lastCandleRef.current = null;
    };
  }, [loadData]);

  // Switch timeframe
  const handleTimeframeChange = useCallback(
    (tf: (typeof TIMEFRAMES)[number]) => {
      setActiveTimeframe(tf.label);
      loadData(tf.interval, tf.limit);
    },
    [loadData]
  );

  // Update last candle with live price
  useEffect(() => {
    if (
      !candleSeriesRef.current ||
      !volumeSeriesRef.current ||
      price <= 0 ||
      !lastCandleRef.current
    )
      return;

    const last = lastCandleRef.current;
    const now = Math.floor(Date.now() / 1000);

    // Determine candle interval in seconds
    const intervalMap: Record<string, number> = {
      "1m": 60,
      "15m": 900,
      "1h": 3600,
      "4h": 14400,
      "1d": 86400,
    };
    const intervalSec = intervalMap[currentIntervalRef.current] || 3600;
    const candleTime = Math.floor(now / intervalSec) * intervalSec;

    if (candleTime > last.time) {
      // New candle
      const newCandle: CandleData = {
        time: candleTime,
        open: price,
        high: price,
        low: price,
        close: price,
      };
      candleSeriesRef.current.update(newCandle as any);
      volumeSeriesRef.current.update({
        time: candleTime,
        value: 0,
        color:
          price >= last.close
            ? "rgba(0,255,255,0.25)"
            : "rgba(255,115,76,0.25)",
      } as any);
      lastCandleRef.current = newCandle;
    } else {
      // Update current candle
      const updated: CandleData = {
        ...last,
        time: last.time,
        high: Math.max(last.high, price),
        low: Math.min(last.low, price),
        close: price,
      };
      candleSeriesRef.current.update(updated as any);
      lastCandleRef.current = updated;
    }
  }, [price]);

  // Price info for header
  const changeColor =
    (priceChangePercent24h ?? 0) >= 0 ? "text-cyan" : "text-orange";
  const changeSign = (priceChangePercent24h ?? 0) >= 0 ? "+" : "";

  return (
    <div className="flex-1 bg-surface-container-low relative overflow-hidden flex flex-col border border-outline-variant/10 min-h-0">
      {/* Chart Header */}
      <div className="p-3 lg:p-4 flex justify-between items-center bg-surface-container-high/50 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-lg font-heading font-black text-on-surface">
              BTC / USDT
            </span>
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
              Binance Spot
            </span>
          </div>
          <div className="h-8 w-[1px] bg-outline-variant hidden lg:block" />

          {/* Live price info */}
          <div className="hidden lg:flex items-center gap-3">
            <span className="text-sm font-heading font-bold text-on-surface tabular-nums">
              {price > 0
                ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                : "---"}
            </span>
            {priceChangePercent24h !== 0 && (
              <span className={`text-[10px] font-bold ${changeColor}`}>
                {changeSign}
                {priceChangePercent24h?.toFixed(2)}%
              </span>
            )}
          </div>

          <div className="h-8 w-[1px] bg-outline-variant hidden lg:block" />

          {/* Timeframe buttons */}
          <div className="flex items-center gap-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.label}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-2 lg:px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  activeTimeframe === tf.label
                    ? "text-on-surface border-b-2 border-cyan"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right side info */}
        <div className="flex items-center gap-3">
          {high24h > 0 && (
            <div className="hidden xl:flex items-center gap-4 text-[10px] font-bold tabular-nums mr-2">
              <span className="text-on-surface-variant">
                H:{" "}
                <span className="text-on-surface">
                  ${high24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </span>
              <span className="text-on-surface-variant">
                L:{" "}
                <span className="text-on-surface">
                  ${low24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </span>
            </div>
          )}
          <button className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors">
            <Camera size={14} />
          </button>
          <button className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="flex-1 min-h-[250px]" />

      {/* Chart Footer / Tools Bar */}
      <div className="p-2 flex items-center justify-between bg-surface-container-high border-t border-outline-variant/10 shrink-0">
        <div className="flex gap-1">
          <button className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors">
            <Pencil size={13} />
          </button>
          <button className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors">
            <TrendingUp size={13} />
          </button>
          <button className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors">
            <ArrowUpRight size={13} />
          </button>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono tabular-nums">
          <span className="text-on-surface-variant">
            ETH <span className="text-on-surface">$3,421.50</span>
          </span>
          <span className="text-on-surface-variant">
            SOL <span className="text-on-surface">$142.80</span>
          </span>
        </div>
      </div>
    </div>
  );
}
