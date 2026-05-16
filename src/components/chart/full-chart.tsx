"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Crosshair,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer2,
  Square,
  Trash2,
  TrendingUp,
  Triangle,
} from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import {
  clearDrawings,
  generateId,
  loadDrawings,
  pickColor,
  removeDrawing,
  saveDrawings,
  type Drawing,
  type Point,
} from "@/lib/drawings";
import { DrawingsPrimitive } from "@/lib/chart/drawings-primitive";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  bollingerBands,
  toHeikinAshi,
  vwap,
  type ChartConfig,
  type IndicatorToggles,
  type OhlcCandle,
} from "@/lib/chart-config";
import { ema, sma, supertrend } from "@/lib/indicators";
import { INDICATOR_META } from "@/lib/chart-config";

interface FullChartProps {
  config: ChartConfig;
}

type DrawTool =
  | "select"
  | "level"
  | "trendline"
  | "ray"
  | "rect"
  | "fib";

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
  const [fullscreen, setFullscreen] = useState(false);
  const [tool, setTool] = useState<DrawTool>("select");
  const [pendingPoint, setPendingPoint] = useState<Point | null>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  // Bumped whenever the price series is rebuilt so the drawings
  // primitive can re-attach to the new series.
  const [priceSeriesVersion, setPriceSeriesVersion] = useState(0);
  const [readout, setReadout] = useState<{
    o: number;
    h: number;
    l: number;
    c: number;
    chg: number;
  } | null>(null);

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
  // Drawings overlay primitive + live snapshot it reads from
  const primitiveRef = useRef<DrawingsPrimitive | null>(null);
  const drawingsRef = useRef<Drawing[]>([]);
  const selectedRef = useRef<string | null>(null);
  const symbolRef = useRef(symbol);
  // Active drag operation
  const dragRef = useRef<{
    id: string;
    mode: "p1" | "p2" | "move";
    startX: number;
    startY: number;
    orig: Drawing;
  } | null>(null);
  // Latest klines for crosshair readout without re-subscribing
  const klinesRef = useRef<KlineRow[]>([]);

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

      // Crosshair OHLC readout — resolve the hovered candle by time
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chart.subscribeCrosshairMove((param: any) => {
        if (!param.time) {
          setReadout(null);
          return;
        }
        const t = Number(param.time);
        const k = klinesRef.current.find((r) => r.time === t);
        if (!k) {
          setReadout(null);
          return;
        }
        setReadout({
          o: k.open,
          h: k.high,
          l: k.low,
          c: k.close,
          chg: k.open === 0 ? 0 : ((k.close - k.open) / k.open) * 100,
        });
      });

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
      primitiveRef.current = null;
    };
  }, []);

  // ─ Keep the primitive's snapshot refs current
  useEffect(() => {
    symbolRef.current = symbol;
    drawingsRef.current = drawings;
    selectedRef.current = selectedId;
    primitiveRef.current?.redraw();
  }, [symbol, drawings, selectedId]);

  // ─ Hydrate drawings from localStorage per symbol
  useEffect(() => {
    setDrawings(loadDrawings(symbol));
    setTool("select");
    setPendingPoint(null);
    setSelectedId(null);
  }, [symbol]);

  // ─ Body scroll lock while fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  // ─ Attach the drawings primitive to the active price series.
  // Re-runs when the series is rebuilt (chart type / timeframe).
  useEffect(() => {
    const series = priceSeriesRef.current;
    if (!series) return;
    const primitive = new DrawingsPrimitive(() => ({
      drawings: drawingsRef.current,
      symbol: symbolRef.current,
      selectedId: selectedRef.current,
    }));
    try {
      series.attachPrimitive(primitive);
      primitiveRef.current = primitive;
    } catch {
      // attach failed — drawings just won't render
    }
    return () => {
      try {
        series.detachPrimitive(primitive);
      } catch {
        // series already disposed
      }
      if (primitiveRef.current === primitive) primitiveRef.current = null;
    };
  }, [priceSeriesVersion]);

  // ─ Pointer interaction: create new drawings + drag handles/bodies
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const relpos = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const persist = (next: Drawing[]) => {
      drawingsRef.current = next;
      setDrawings(next);
      saveDrawings(symbolRef.current, next);
    };

    const setChartInteractive = (on: boolean) => {
      chartRef.current?.applyOptions({
        handleScroll: on,
        handleScale: on,
      });
    };

    const onPointerDown = (e: PointerEvent) => {
      const prim = primitiveRef.current;
      if (!prim) return;
      const { x, y } = relpos(e);

      // Create mode — collect points for the active tool
      if (tool !== "select") {
        const p = prim.pointFromScreen(x, y);
        if (!p) return;
        if (tool === "level") {
          const count = drawingsRef.current.filter(
            (d) => d.type === "level"
          ).length;
          const lvl: Drawing = {
            id: generateId(),
            type: "level",
            symbol: symbolRef.current,
            price: p.price,
            label: `L${count + 1}`,
            color: pickColor(drawingsRef.current.length),
          };
          persist([...drawingsRef.current, lvl]);
          setSelectedId(lvl.id);
          setTool("select");
          return;
        }
        if (!pendingPoint) {
          setPendingPoint(p);
          return;
        }
        const a = pendingPoint;
        const color = pickColor(drawingsRef.current.length);
        let d: Drawing;
        if (tool === "rect") {
          d = {
            id: generateId(),
            type: "rect",
            symbol: symbolRef.current,
            p1: a,
            p2: p,
            color,
          };
        } else if (tool === "fib") {
          d = {
            id: generateId(),
            type: "fib",
            symbol: symbolRef.current,
            p1: a,
            p2: p,
            color,
          };
        } else {
          const [f, s] = a.time <= p.time ? [a, p] : [p, a];
          d = {
            id: generateId(),
            type: "trendline",
            symbol: symbolRef.current,
            p1: f,
            p2: s,
            color,
            ray: tool === "ray",
          };
        }
        persist([...drawingsRef.current, d]);
        setSelectedId(d.id);
        setPendingPoint(null);
        setTool("select");
        return;
      }

      // Select / drag mode
      const handle = prim.handleAt(x, y);
      if (handle) {
        const orig = drawingsRef.current.find(
          (d) => d.id === handle.drawingId
        );
        if (!orig) return;
        setSelectedId(handle.drawingId);
        dragRef.current = {
          id: handle.drawingId,
          mode: handle.pointIndex === 0 ? "p1" : "p2",
          startX: x,
          startY: y,
          orig,
        };
        setChartInteractive(false);
        el.setPointerCapture(e.pointerId);
        return;
      }
      const hitId = prim.drawingAt(x, y);
      setSelectedId(hitId);
      if (hitId) {
        const orig = drawingsRef.current.find((d) => d.id === hitId);
        if (orig) {
          dragRef.current = {
            id: hitId,
            mode: "move",
            startX: x,
            startY: y,
            orig,
          };
          setChartInteractive(false);
          el.setPointerCapture(e.pointerId);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      const prim = primitiveRef.current;
      if (!drag || !prim) return;
      const { x, y } = relpos(e);
      const cur = prim.pointFromScreen(x, y);
      if (!cur) return;

      const next = drawingsRef.current.map((d) => {
        if (d.id !== drag.id) return d;
        if (d.type === "level") {
          return { ...d, price: cur.price };
        }
        const o = drag.orig as Extract<
          Drawing,
          { p1: Point; p2: Point }
        >;
        if (drag.mode === "p1") return { ...d, p1: cur };
        if (drag.mode === "p2") return { ...d, p2: cur };
        // move: shift both points by the drag delta in data space
        const start = prim.pointFromScreen(drag.startX, drag.startY);
        if (!start) return d;
        const dt = cur.time - start.time;
        const dp = cur.price - start.price;
        return {
          ...d,
          p1: { time: o.p1.time + dt, price: o.p1.price + dp },
          p2: { time: o.p2.time + dt, price: o.p2.price + dp },
        };
      });
      drawingsRef.current = next;
      setDrawings(next);
      prim.redraw();
    };

    const endDrag = (e: PointerEvent) => {
      if (!dragRef.current) return;
      dragRef.current = null;
      setChartInteractive(true);
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // not captured
      }
      saveDrawings(symbolRef.current, drawingsRef.current);
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
    };
  }, [tool, pendingPoint]);

  const handleRemoveDrawing = useCallback(
    (id: string) => {
      setDrawings(removeDrawing(symbol, id));
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [symbol]
  );

  const confirmClearDrawings = useCallback(() => {
    clearDrawings(symbol);
    setDrawings([]);
    setSelectedId(null);
    setClearConfirm(false);
  }, [symbol]);

  const handleScreenshot = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    try {
      const canvas = chart.takeScreenshot();
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pair.display.replace("/", "-")}_${config.timeframe}_${Date.now()}.png`;
      a.click();
    } catch {
      // ignore
    }
  }, [pair.display, config.timeframe]);

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
          klinesRef.current = rows;
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
        if (!cancelled) {
          setKlines(rows);
          klinesRef.current = rows;
        }
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

    // Remove existing price series before rebuilding. The drawings
    // primitive is attached to it, so bumping priceSeriesVersion
    // afterwards re-attaches it to the fresh series.
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
    setPriceSeriesVersion((v) => v + 1);
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

    if (ind.supertrend) {
      const { line, direction } = supertrend(
        klines.map((k) => k.high),
        klines.map((k) => k.low),
        closes,
        10,
        3
      );
      // Two series so up/down legs render in their own colour. Points
      // belonging to the other trend become whitespace (time-only) so
      // the line breaks instead of cutting diagonally across a flip.
      const upData = klines.map((k, i) =>
        direction[i] === 1 && line[i] !== null
          ? { time: k.time, value: line[i] as number }
          : { time: k.time }
      );
      const downData = klines.map((k, i) =>
        direction[i] === -1 && line[i] !== null
          ? { time: k.time, value: line[i] as number }
          : { time: k.time }
      );
      const upSeries = chart.addSeries(mod.LineSeries, {
        color: "#50c878",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      upSeries.setData(upData);
      indicatorSeriesRef.current.set("supertrend_up", upSeries);

      const downSeries = chart.addSeries(mod.LineSeries, {
        color: "#ff716c",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      downSeries.setData(downData);
      indicatorSeriesRef.current.set("supertrend_down", downSeries);
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

  const activeDrawings = drawings.filter((d) => d.symbol === symbol);

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[60] bg-[#0e0e0f] flex flex-col"
          : "relative w-full h-full bg-[#0e0e0f] flex flex-col"
      }
    >
      {/* Pair label + OHLC readout overlay */}
      <div className="absolute top-3 left-3 z-10 bg-surface-container-low/80 backdrop-blur-sm px-3 py-1.5 flex items-center gap-3 pointer-events-none">
        <span className="text-sm font-black font-heading tracking-tighter uppercase text-on-surface">
          {pair.display}
        </span>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
          {config.timeframe} · {config.chartType.replace("_", "-")}
        </span>
        {readout && (
          <span className="flex items-center gap-2 text-[10px] tabular-nums">
            <Ohlc label="O" value={readout.o} />
            <Ohlc label="H" value={readout.h} />
            <Ohlc label="L" value={readout.l} />
            <Ohlc label="C" value={readout.c} />
            <span
              className={
                readout.chg >= 0 ? "text-emerald" : "text-crimson"
              }
            >
              {readout.chg >= 0 ? "+" : ""}
              {readout.chg.toFixed(2)}%
            </span>
          </span>
        )}
      </div>

      {/* Tool palette */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-px bg-surface-container-low/90 backdrop-blur-sm">
        <PaletteBtn
          active={tool === "select"}
          onClick={() => {
            setTool("select");
            setPendingPoint(null);
          }}
          title="Select / move"
        >
          <MousePointer2 size={14} />
        </PaletteBtn>
        <PaletteBtn
          active={tool === "level"}
          onClick={() => {
            setTool(tool === "level" ? "select" : "level");
            setPendingPoint(null);
          }}
          title="Horizontal level"
        >
          <Minus size={14} />
        </PaletteBtn>
        <PaletteBtn
          active={tool === "trendline"}
          onClick={() => {
            setTool(tool === "trendline" ? "select" : "trendline");
            setPendingPoint(null);
          }}
          title="Trend line"
        >
          <TrendingUp size={14} />
        </PaletteBtn>
        <PaletteBtn
          active={tool === "ray"}
          onClick={() => {
            setTool(tool === "ray" ? "select" : "ray");
            setPendingPoint(null);
          }}
          title="Ray (extended line)"
        >
          <Crosshair size={14} />
        </PaletteBtn>
        <PaletteBtn
          active={tool === "rect"}
          onClick={() => {
            setTool(tool === "rect" ? "select" : "rect");
            setPendingPoint(null);
          }}
          title="Rectangle / zone"
        >
          <Square size={14} />
        </PaletteBtn>
        <PaletteBtn
          active={tool === "fib"}
          onClick={() => {
            setTool(tool === "fib" ? "select" : "fib");
            setPendingPoint(null);
          }}
          title="Fibonacci retracement"
        >
          <Triangle size={14} />
        </PaletteBtn>
        {activeDrawings.length > 0 && (
          <PaletteBtn
            onClick={() => setClearConfirm(true)}
            title="Clear all drawings"
          >
            <Trash2 size={14} />
          </PaletteBtn>
        )}
        <span className="w-px h-5 bg-outline-variant/20" />
        <PaletteBtn onClick={handleScreenshot} title="Save screenshot">
          <Camera size={14} />
        </PaletteBtn>
        <PaletteBtn
          onClick={() => setFullscreen((v) => !v)}
          title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </PaletteBtn>
      </div>

      {/* Drawing-mode banner */}
      {tool !== "select" && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 bg-cyan/15 text-cyan text-[10px] font-bold tracking-widest uppercase px-3 py-1 pointer-events-none">
          {tool === "level"
            ? "Click to place a horizontal level"
            : pendingPoint
            ? "Click the second point"
            : "Click the first point"}
        </div>
      )}

      {loading && klines.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-xs text-on-surface-variant tracking-widest uppercase animate-pulse pointer-events-none">
          Loading candles...
        </div>
      )}

      <div
        ref={containerRef}
        className={`flex-1 min-h-0 ${
          tool !== "select" ? "cursor-crosshair" : ""
        }`}
      />

      {/* Drawings list */}
      {activeDrawings.length > 0 && (
        <div className="absolute bottom-3 right-3 z-20 max-w-[200px] bg-surface-container-low/90 backdrop-blur-sm">
          <p className="px-2 py-1 text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">
            {activeDrawings.length} Drawing
            {activeDrawings.length !== 1 ? "s" : ""}
          </p>
          <div className="max-h-40 overflow-y-auto">
            {activeDrawings.map((d) => (
              <div
                key={d.id}
                onClick={() => {
                  setTool("select");
                  setSelectedId(d.id);
                }}
                className={`flex items-center gap-2 px-2 py-1 cursor-pointer transition-colors ${
                  d.id === selectedId
                    ? "bg-cyan/10"
                    : "hover:bg-surface-container"
                }`}
              >
                <span
                  className="w-2 h-2 shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="flex-1 text-[10px] text-on-surface truncate">
                  {d.type === "level"
                    ? `${d.label} · ${d.price.toFixed(2)}`
                    : d.type === "trendline"
                    ? d.ray
                      ? "Ray"
                      : "Trend line"
                    : d.type === "rect"
                    ? "Rectangle"
                    : "Fibonacci"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveDrawing(d.id);
                  }}
                  className="text-on-surface-variant hover:text-crimson"
                  aria-label="Remove drawing"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={clearConfirm}
        title="Clear drawings"
        message={`Remove all ${activeDrawings.length} drawing${
          activeDrawings.length !== 1 ? "s" : ""
        } on ${pair.display}? This can't be undone.`}
        confirmLabel="Clear all"
        destructive
        onConfirm={confirmClearDrawings}
        onCancel={() => setClearConfirm(false)}
      />
    </div>
  );
}

function Ohlc({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-on-surface-variant">
      {label}
      <span className="text-on-surface ml-0.5">
        {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </span>
    </span>
  );
}

function PaletteBtn({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 transition-colors ${
        active
          ? "bg-cyan/15 text-cyan"
          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
      }`}
    >
      {children}
    </button>
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
