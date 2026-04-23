"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePrice } from "@/components/providers/price-provider";
import { useFundingRate } from "@/hooks/use-funding-rate";
import { usePositions } from "@/hooks/use-positions";
import {
  Maximize2,
  Minimize2,
  Minus,
  TrendingUp,
  Trash2,
  X,
} from "lucide-react";
import {
  loadDrawings,
  addDrawing,
  removeDrawing,
  clearDrawings,
  generateId,
  pickColor,
  type Drawing,
  type HorizontalLevel,
  type TrendLine,
} from "@/lib/drawings";
import { useCustomIndicators } from "@/hooks/use-custom-indicators";
import {
  compileExpression,
  candlesToContext,
} from "@/lib/custom-indicators";

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
  symbol: string,
  interval: string,
  limit: number
): Promise<{ candles: CandleData[]; volumes: VolumeData[] }> {
  const res = await fetch(
    `${BINANCE_KLINES_URL}?symbol=${symbol}&interval=${interval}&limit=${limit}`
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

type DrawTool = "none" | "level" | "trendline";

export function PriceChart() {
  const [activeTimeframe, setActiveTimeframe] = useState("1H");
  const [fullscreen, setFullscreen] = useState(false);
  const [tool, setTool] = useState<DrawTool>("none");
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [pendingPoint, setPendingPoint] = useState<
    { time: number; price: number } | null
  >(null);

  const { price, priceChangePercent24h, high24h, low24h, symbol, pair } =
    usePrice();
  const { positions } = usePositions("active");
  const { indicators } = useCustomIndicators();
  const [candlesVersion, setCandlesVersion] = useState(0);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candleSeriesRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volumeSeriesRef = useRef<any>(null);
  const lastCandleRef = useRef<CandleData | null>(null);
  const currentIntervalRef = useRef("1h");
  const candlesDataRef = useRef<CandleData[]>([]);
  const volumesDataRef = useRef<VolumeData[]>([]);
  // Track LineSeries for each custom indicator by id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const indicatorSeriesRef = useRef<Map<string, any>>(new Map());

  // Track price lines per position id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const positionLinesRef = useRef<Map<string, any[]>>(new Map());
  // Track price line objects by drawing id (for horizontal levels)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const levelLinesRef = useRef<Map<string, any>>(new Map());
  // Track LineSeries objects by drawing id (for trend lines)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trendSeriesRef = useRef<Map<string, any>>(new Map());
  // Module reference used for adding trend line series after mount
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lwcModuleRef = useRef<any>(null);

  // Load kline data — defined before useEffect so it can be called during init
  const loadData = useCallback(
    async (sym: string, interval: string, limit: number) => {
      try {
        const { candles, volumes } = await fetchKlines(sym, interval, limit);
        if (candleSeriesRef.current && volumeSeriesRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          candleSeriesRef.current.setData(candles as any);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          volumeSeriesRef.current.setData(volumes as any);
          lastCandleRef.current = candles[candles.length - 1] || null;
          currentIntervalRef.current = interval;
          candlesDataRef.current = candles;
          volumesDataRef.current = volumes;
          setCandlesVersion((v) => v + 1);
          chartRef.current?.timeScale().fitContent();
        }
      } catch (err) {
        console.error("Failed to load klines:", err);
      }
    },
    []
  );

  // Hydrate drawings from localStorage on symbol change
  useEffect(() => {
    setDrawings(loadDrawings(symbol));
  }, [symbol]);

  // Initialize chart
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    let isMounted = true;
    let ro: ResizeObserver | null = null;

    import("lightweight-charts").then((mod) => {
      const {
        createChart,
        ColorType,
        CrosshairMode,
        CandlestickSeries,
        HistogramSeries,
      } = mod;

      if (!isMounted || !chartContainerRef.current) return;
      lwcModuleRef.current = mod;

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
      loadData(symbol, "1h", 120);

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
      positionLinesRef.current.clear();
      levelLinesRef.current.clear();
      trendSeriesRef.current.clear();
      indicatorSeriesRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData]);

  // Sync custom indicators — create LineSeries for each enabled overlay
  // indicator and recompute values whenever candles or indicator list change.
  useEffect(() => {
    const chart = chartRef.current;
    const mod = lwcModuleRef.current;
    if (!chart || !mod) return;

    const active = indicators.filter((i) => i.enabled && i.overlay);
    const activeIds = new Set(active.map((i) => i.id));

    // Remove series for indicators no longer active
    for (const [id, series] of indicatorSeriesRef.current.entries()) {
      if (!activeIds.has(id)) {
        try {
          chart.removeSeries(series);
        } catch {
          // ignore
        }
        indicatorSeriesRef.current.delete(id);
      }
    }

    const candles = candlesDataRef.current;
    if (candles.length === 0) return;

    const ctx = candlesToContext(
      candles.map((c) => ({ ...c, volume: 0 }))
    );
    // Hydrate volumes from volumesDataRef for VWMA-style expressions
    const volumes = volumesDataRef.current;
    for (let i = 0; i < ctx.volume.length && i < volumes.length; i++) {
      ctx.volume[i] = volumes[i]?.value ?? 0;
    }

    for (const ind of active) {
      const compiled = compileExpression(ind.expression);
      if (!compiled.ok || !compiled.run) continue;
      let values: (number | null)[];
      try {
        values = compiled.run(ctx);
      } catch {
        continue;
      }

      const points = values
        .map((v, i) =>
          v === null
            ? null
            : { time: candles[i].time, value: v }
        )
        .filter((p): p is { time: number; value: number } => p !== null);

      let series = indicatorSeriesRef.current.get(ind.id);
      if (!series) {
        try {
          series = chart.addSeries(mod.LineSeries, {
            color: ind.color,
            lineWidth: 2,
            lastValueVisible: true,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
            title: ind.name,
          });
          indicatorSeriesRef.current.set(ind.id, series);
        } catch {
          continue;
        }
      } else {
        try {
          series.applyOptions({ color: ind.color, title: ind.name });
        } catch {
          // ignore
        }
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        series.setData(points as any);
      } catch {
        // ignore
      }
    }
  }, [indicators, candlesVersion]);

  // Click-to-draw handling — subscribe to chart clicks when tool is trendline/level
  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    if (tool === "none") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (param: any) => {
      if (!param.point || !param.time) return;
      const price = candleSeries.coordinateToPrice(param.point.y);
      if (price === null || price === undefined) return;

      const time = Number(param.time);

      if (tool === "level") {
        const level: HorizontalLevel = {
          id: generateId(),
          type: "level",
          symbol,
          price,
          label: `L${drawings.filter((d) => d.type === "level").length + 1}`,
          color: pickColor(drawings.length),
        };
        const next = addDrawing(symbol, level);
        setDrawings(next);
        setTool("none");
        return;
      }

      if (tool === "trendline") {
        if (!pendingPoint) {
          setPendingPoint({ time, price });
        } else {
          // Second click — create the line
          const p1 = pendingPoint;
          const p2 = { time, price };
          // Ensure chronological order for LineSeries
          const [first, second] =
            p1.time <= p2.time ? [p1, p2] : [p2, p1];
          const line: TrendLine = {
            id: generateId(),
            type: "trendline",
            symbol,
            p1: first,
            p2: second,
            color: pickColor(drawings.length),
          };
          const next = addDrawing(symbol, line);
          setDrawings(next);
          setPendingPoint(null);
          setTool("none");
        }
      }
    };

    chart.subscribeClick(handler);
    return () => {
      chart.unsubscribeClick(handler);
    };
  }, [tool, symbol, drawings, pendingPoint]);

  // Sync horizontal levels with chart (create/remove price lines)
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    const levels = drawings.filter(
      (d): d is HorizontalLevel => d.type === "level" && d.symbol === symbol
    );
    const activeIds = new Set(levels.map((l) => l.id));

    // Remove lines that no longer exist
    for (const [id, line] of levelLinesRef.current.entries()) {
      if (!activeIds.has(id)) {
        try {
          series.removePriceLine(line);
        } catch {
          // ignore
        }
        levelLinesRef.current.delete(id);
      }
    }

    // Add/update
    for (const level of levels) {
      if (levelLinesRef.current.has(level.id)) continue;
      try {
        const line = series.createPriceLine({
          price: level.price,
          color: level.color,
          lineWidth: 2,
          lineStyle: 0, // solid
          axisLabelVisible: true,
          title: level.label,
        });
        levelLinesRef.current.set(level.id, line);
      } catch {
        // ignore
      }
    }
  }, [drawings, symbol]);

  // Sync trend lines as LineSeries
  useEffect(() => {
    const chart = chartRef.current;
    const mod = lwcModuleRef.current;
    if (!chart || !mod) return;

    const lines = drawings.filter(
      (d): d is TrendLine => d.type === "trendline" && d.symbol === symbol
    );
    const activeIds = new Set(lines.map((l) => l.id));

    // Remove outdated
    for (const [id, series] of trendSeriesRef.current.entries()) {
      if (!activeIds.has(id)) {
        try {
          chart.removeSeries(series);
        } catch {
          // ignore
        }
        trendSeriesRef.current.delete(id);
      }
    }

    // Add new
    for (const line of lines) {
      if (trendSeriesRef.current.has(line.id)) continue;
      try {
        const series = chart.addSeries(mod.LineSeries, {
          color: line.color,
          lineWidth: 2,
          lineStyle: 0,
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        series.setData([
          { time: line.p1.time, value: line.p1.price },
          { time: line.p2.time, value: line.p2.price },
        ] as any);
        trendSeriesRef.current.set(line.id, series);
      } catch {
        // ignore
      }
    }
  }, [drawings, symbol]);

  // Switch timeframe
  const handleTimeframeChange = useCallback(
    (tf: (typeof TIMEFRAMES)[number]) => {
      setActiveTimeframe(tf.label);
      loadData(symbol, tf.interval, tf.limit);
    },
    [loadData, symbol]
  );

  // Reload data when symbol changes
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    const tf = TIMEFRAMES.find((t) => t.label === activeTimeframe);
    if (!tf) return;
    loadData(symbol, tf.interval, tf.limit);
  }, [symbol, activeTimeframe, loadData]);

  // Sync price lines (entry / SL / TP) for active positions matching the
  // currently selected pair.
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    const relevant = positions.filter(
      (p) => p.asset === symbol && p.status === "active"
    );
    const activeIds = new Set(relevant.map((p) => p.id));

    for (const [id, lines] of positionLinesRef.current.entries()) {
      if (!activeIds.has(id)) {
        for (const line of lines) {
          try {
            series.removePriceLine(line);
          } catch {
            // already removed
          }
        }
        positionLinesRef.current.delete(id);
      }
    }

    for (const pos of relevant) {
      const existing = positionLinesRef.current.get(pos.id);
      if (existing) {
        for (const line of existing) {
          try {
            series.removePriceLine(line);
          } catch {
            // ignore
          }
        }
      }

      const lines: unknown[] = [];
      const sideColor = pos.side === "LONG" ? "#00ffff" : "#ff734c";

      lines.push(
        series.createPriceLine({
          price: pos.entry,
          color: sideColor,
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `${pos.side} ${pos.size}`,
        })
      );

      if (pos.stopLoss) {
        lines.push(
          series.createPriceLine({
            price: pos.stopLoss,
            color: "#ff716c",
            lineWidth: 1,
            lineStyle: 3,
            axisLabelVisible: true,
            title: "SL",
          })
        );
      }

      if (pos.takeProfit) {
        lines.push(
          series.createPriceLine({
            price: pos.takeProfit,
            color: "#50c878",
            lineWidth: 1,
            lineStyle: 3,
            axisLabelVisible: true,
            title: "TP",
          })
        );
      }

      positionLinesRef.current.set(pos.id, lines);
    }
  }, [positions, symbol]);

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
      const newCandle: CandleData = {
        time: candleTime,
        open: price,
        high: price,
        low: price,
        close: price,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      candleSeriesRef.current.update(newCandle as any);
      const newVolume: VolumeData = {
        time: candleTime,
        value: 0,
        color:
          price >= last.close
            ? "rgba(0,255,255,0.25)"
            : "rgba(255,115,76,0.25)",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      volumeSeriesRef.current.update(newVolume as any);
      lastCandleRef.current = newCandle;
      candlesDataRef.current = [...candlesDataRef.current, newCandle];
      volumesDataRef.current = [...volumesDataRef.current, newVolume];
      setCandlesVersion((v) => v + 1);
    } else {
      const updated: CandleData = {
        ...last,
        time: last.time,
        high: Math.max(last.high, price),
        low: Math.min(last.low, price),
        close: price,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      candleSeriesRef.current.update(updated as any);
      lastCandleRef.current = updated;
      const arr = candlesDataRef.current;
      if (arr.length > 0) arr[arr.length - 1] = updated;
    }
  }, [price]);

  // Toggle fullscreen — apply body scroll lock while active
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [fullscreen]);

  const handleRemoveDrawing = useCallback(
    (id: string) => {
      const next = removeDrawing(symbol, id);
      setDrawings(next);
    },
    [symbol]
  );

  const handleClearAllDrawings = useCallback(() => {
    if (drawings.length === 0) return;
    if (!confirm(`Clear all ${drawings.length} drawings on ${pair.display}?`))
      return;
    clearDrawings(symbol);
    setDrawings([]);
  }, [symbol, drawings.length, pair.display]);

  const cancelTool = useCallback(() => {
    setTool("none");
    setPendingPoint(null);
  }, []);

  // Price info for header
  const changeColor =
    (priceChangePercent24h ?? 0) >= 0 ? "text-cyan" : "text-orange";
  const changeSign = (priceChangePercent24h ?? 0) >= 0 ? "+" : "";

  const activeDrawings = drawings.filter((d) => d.symbol === symbol);
  const levelsCount = activeDrawings.filter(
    (d) => d.type === "level"
  ).length;
  const trendsCount = activeDrawings.filter(
    (d) => d.type === "trendline"
  ).length;

  const containerClasses = fullscreen
    ? "fixed inset-0 z-[60] bg-surface-container-low flex flex-col"
    : "flex-1 bg-surface-container-low relative overflow-hidden flex flex-col border border-outline-variant/10 min-h-0";

  return (
    <div className={containerClasses}>
      {/* Chart Header */}
      <div className="p-3 lg:p-4 flex justify-between items-center bg-surface-container-high/50 backdrop-blur-sm z-10 shrink-0 gap-2">
        <div className="flex items-center gap-2 lg:gap-4 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="text-sm lg:text-lg font-heading font-black text-on-surface truncate">
              {pair.base} / {pair.quote}
            </span>
            <span className="text-[9px] lg:text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
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
                className={`px-1.5 lg:px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
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
        <div className="flex items-center gap-2 lg:gap-3">
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
          <button
            onClick={() => setFullscreen((v) => !v)}
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Drawing-mode banner */}
      {tool !== "none" && (
        <div className="px-3 py-2 bg-cyan/10 border-b border-cyan/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-cyan font-bold tracking-wider uppercase">
            {tool === "level" && <Minus size={12} />}
            {tool === "trendline" && <TrendingUp size={12} />}
            <span>
              {tool === "level"
                ? "Click chart to place horizontal level"
                : pendingPoint
                  ? "Click second point to complete trend line"
                  : "Click first point for trend line"}
            </span>
          </div>
          <button
            onClick={cancelTool}
            className="flex items-center gap-1 text-[10px] text-on-surface-variant hover:text-on-surface font-bold tracking-wider uppercase"
          >
            <X size={12} /> Cancel
          </button>
        </div>
      )}

      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        className={`flex-1 ${tool !== "none" ? "cursor-crosshair" : ""}`}
        style={{ minHeight: fullscreen ? 0 : 400 }}
      />

      {/* Chart Footer / Tools Bar */}
      <div className="p-2 flex items-center justify-between bg-surface-container-high border-t border-outline-variant/10 shrink-0 gap-2 flex-wrap">
        {/* Drawing tools */}
        <div className="flex items-center gap-1">
          <ToolButton
            active={tool === "level"}
            onClick={() => setTool(tool === "level" ? "none" : "level")}
            title="Horizontal level"
          >
            <Minus size={13} />
            <span className="hidden sm:inline text-[10px] font-bold">
              LEVEL
            </span>
          </ToolButton>
          <ToolButton
            active={tool === "trendline"}
            onClick={() => {
              if (tool === "trendline") {
                cancelTool();
              } else {
                setTool("trendline");
                setPendingPoint(null);
              }
            }}
            title="Trend line"
          >
            <TrendingUp size={13} />
            <span className="hidden sm:inline text-[10px] font-bold">
              TREND
            </span>
          </ToolButton>

          {activeDrawings.length > 0 && (
            <>
              <div className="h-4 w-[1px] bg-outline-variant mx-1" />
              <span className="text-[9px] text-on-surface-variant font-bold tracking-wider uppercase">
                {levelsCount} L · {trendsCount} T
              </span>
              <button
                onClick={handleClearAllDrawings}
                title="Clear all drawings"
                className="p-1.5 text-on-surface-variant hover:text-crimson transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>

        {/* Funding rate */}
        <FundingRateInline symbol={symbol} />
      </div>

      {/* Drawings list popover — only when there are drawings */}
      {activeDrawings.length > 0 && (
        <DrawingList
          drawings={activeDrawings}
          onRemove={handleRemoveDrawing}
        />
      )}
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1.5 px-2 py-1.5 transition-colors ${
        active
          ? "bg-cyan/20 text-cyan"
          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
      }`}
    >
      {children}
    </button>
  );
}

function DrawingList({
  drawings,
  onRemove,
}: {
  drawings: Drawing[];
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute top-16 right-3 z-10 max-w-[200px]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="bg-surface-container-high/80 backdrop-blur-sm px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-on-surface-variant hover:text-on-surface transition-colors"
      >
        {drawings.length} Drawing{drawings.length !== 1 ? "s" : ""}
      </button>
      {expanded && (
        <div className="mt-1 bg-surface-container-high/95 backdrop-blur-sm border border-outline-variant/10 flex flex-col gap-0.5 p-1 max-h-[200px] overflow-auto">
          {drawings.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-2 p-1.5 hover:bg-surface-container-highest"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="w-2 h-2 shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-[10px] text-on-surface truncate">
                  {d.type === "level"
                    ? `${d.label} · $${d.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : `Trend · ${(
                        (d.p2.price - d.p1.price) /
                        d.p1.price *
                        100
                      ).toFixed(2)}%`}
                </span>
              </div>
              <button
                onClick={() => onRemove(d.id)}
                className="text-on-surface-variant hover:text-crimson"
                aria-label="Remove"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FundingRateInline({ symbol }: { symbol: string }) {
  const { fundingRate, nextFundingTime, loading, unavailable } =
    useFundingRate(symbol);

  if (loading) {
    return (
      <span className="text-[10px] font-mono tabular-nums text-on-surface-variant">
        FUNDING: —
      </span>
    );
  }

  if (unavailable) {
    return (
      <span className="text-[10px] font-mono tabular-nums text-on-surface-variant/60">
        SPOT ONLY
      </span>
    );
  }

  const pct = fundingRate * 100;
  const isPositive = pct >= 0;
  const timeLeftMs = nextFundingTime - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeftMs / 3600000));
  const minutesLeft = Math.max(0, Math.floor((timeLeftMs % 3600000) / 60000));

  return (
    <div className="flex items-center gap-3 text-[10px] font-mono tabular-nums">
      <span className="text-on-surface-variant">
        FUNDING:{" "}
        <span
          className={isPositive ? "text-emerald-accent" : "text-crimson"}
        >
          {isPositive ? "+" : ""}
          {pct.toFixed(4)}%
        </span>
      </span>
      {timeLeftMs > 0 && (
        <span className="text-on-surface-variant hidden sm:inline">
          NEXT:{" "}
          <span className="text-on-surface">
            {hoursLeft}h {minutesLeft}m
          </span>
        </span>
      )}
    </div>
  );
}
