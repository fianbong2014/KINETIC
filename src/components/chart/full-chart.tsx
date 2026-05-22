"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Camera,
  ChevronDown,
  Circle,
  Copy,
  GitCommitVertical,
  Magnet,
  Redo2,
  Spline,
  Undo2,
  Waypoints,
  Lock,
  LockOpen,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer2,
  MoveRight,
  Ruler,
  Square,
  Target,
  Trash2,
  TrendingUp,
  Triangle,
  Type,
} from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import {
  clearDrawings,
  drawingLabel,
  DRAWING_COLORS,
  generateId,
  loadDrawings,
  pickColor,
  removeDrawing,
  saveDrawings,
  type Drawing,
  type LineStyle,
  type Point,
} from "@/lib/drawings";
import {
  applyDrag,
  DrawingsPrimitive,
} from "@/lib/chart/drawings-primitive";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAlerts } from "@/hooks/use-alerts";
import { useToast } from "@/components/providers/toast-provider";
import {
  bollingerBands,
  toHeikinAshi,
  vwap,
  type ChartConfig,
  type IndicatorToggles,
  type OhlcCandle,
} from "@/lib/chart-config";
import {
  donchian,
  ema,
  ichimoku,
  keltner,
  parabolicSar,
  pivotPoints,
  sma,
  supertrend,
} from "@/lib/indicators";
import { INDICATOR_META } from "@/lib/chart-config";

interface FullChartProps {
  config: ChartConfig;
}

type DrawTool =
  | "select"
  | "level"
  | "hray"
  | "vline"
  | "trendline"
  | "ray"
  | "extline"
  | "arrow"
  | "rect"
  | "fib"
  | "text"
  | "measure"
  | "position"
  | "ellipse"
  | "fibfan"
  | "channel"
  | "pitchfork"
  | "fibext"
  | "alert";

// Tools that need three clicks to define.
const THREE_POINT_TOOLS = new Set<DrawTool>([
  "channel",
  "pitchfork",
  "fibext",
]);
const ONE_POINT_TOOLS = new Set<DrawTool>([
  "level",
  "hray",
  "vline",
  "text",
  "position",
  "alert",
]);

interface ToolDef {
  id: Exclude<DrawTool, "select">;
  label: string;
  icon: React.ReactNode;
}

const TOOL_GROUPS: { group: string; tools: ToolDef[] }[] = [
  {
    group: "Lines",
    tools: [
      { id: "trendline", label: "Trend line", icon: <TrendingUp size={14} /> },
      { id: "ray", label: "Ray", icon: <MoveRight size={14} /> },
      { id: "extline", label: "Extended line", icon: <Minus size={14} /> },
      { id: "arrow", label: "Arrow", icon: <ArrowUpRight size={14} /> },
      { id: "level", label: "Horizontal level", icon: <Minus size={14} /> },
      { id: "hray", label: "Horizontal ray", icon: <MoveRight size={14} /> },
      {
        id: "vline",
        label: "Vertical line",
        icon: <GitCommitVertical size={14} />,
      },
    ],
  },
  {
    group: "Shapes",
    tools: [
      { id: "rect", label: "Rectangle", icon: <Square size={14} /> },
      { id: "ellipse", label: "Ellipse", icon: <Circle size={14} /> },
      {
        id: "channel",
        label: "Parallel channel",
        icon: <Waypoints size={14} />,
      },
      {
        id: "pitchfork",
        label: "Pitchfork",
        icon: <Spline size={14} />,
      },
    ],
  },
  {
    group: "Fib & Measure",
    tools: [
      { id: "fib", label: "Fib retracement", icon: <Triangle size={14} /> },
      {
        id: "fibext",
        label: "Fib extension",
        icon: <Triangle size={14} />,
      },
      { id: "fibfan", label: "Fib fan", icon: <Spline size={14} /> },
      { id: "measure", label: "Measure", icon: <Ruler size={14} /> },
    ],
  },
  {
    group: "Annotate",
    tools: [{ id: "text", label: "Text note", icon: <Type size={14} /> }],
  },
  {
    group: "Trade",
    tools: [
      {
        id: "position",
        label: "Long/Short position",
        icon: <Target size={14} />,
      },
      {
        id: "alert",
        label: "Price alert",
        icon: <Bell size={14} />,
      },
    ],
  },
];

const LINE_STYLES: LineStyle[] = ["solid", "dashed", "dotted"];

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
  const { symbol, pair, price: livePrice } = usePrice();
  const { alerts, create: createAlert } = useAlerts();
  const toast = useToast();
  const [klines, setKlines] = useState<KlineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [tool, setTool] = useState<DrawTool>("select");
  const [pendingPts, setPendingPts] = useState<Point[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [toolMenu, setToolMenu] = useState(false);
  const [magnet, setMagnet] = useState(false);
  const [pendingAlert, setPendingAlert] = useState<{
    price: number;
    direction: "above" | "below";
  } | null>(null);
  // Active price-line handles for visible alerts, keyed by alert id.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alertLinesRef = useRef<Map<string, any>>(new Map());
  const livePriceRef = useRef(0);
  useEffect(() => {
    livePriceRef.current = livePrice;
  }, [livePrice]);
  const [textEdit, setTextEdit] = useState<{
    id: string;
    value: string;
  } | null>(null);
  // Last-used style applied to new drawings (persisted)
  const lastStyleRef = useRef<{
    lineWidth: number;
    lineStyle: LineStyle;
  }>({ lineWidth: 2, lineStyle: "solid" });
  // Undo/redo stacks of drawing snapshots for the active symbol
  const undoRef = useRef<Drawing[][]>([]);
  const redoRef = useRef<Drawing[][]>([]);
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
    pointIndex: number | "move";
    start: Point;
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
    setPendingPts([]);
    setSelectedId(null);
    undoRef.current = [];
    redoRef.current = [];
  }, [symbol]);

  // ─ Restore last-used drawing style once on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("kinetic:lastDrawStyle");
      if (raw) {
        const s = JSON.parse(raw);
        if (s && typeof s.lineWidth === "number" && s.lineStyle) {
          lastStyleRef.current = {
            lineWidth: s.lineWidth,
            lineStyle: s.lineStyle,
          };
        }
      }
    } catch {
      // ignore
    }
  }, []);

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
    // Touch devices need a fatter handle and a wider hit tolerance
    // so finger taps reliably grab drag points and shape bodies.
    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: coarse)").matches;
    const primitive = new DrawingsPrimitive(
      () => ({
        drawings: drawingsRef.current,
        symbol: symbolRef.current,
        selectedId: selectedRef.current,
      }),
      coarse ? { handleSize: 18, hitTol: 12 } : undefined
    );
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

  // ─ Sync active alerts as price lines on the price series.
  useEffect(() => {
    const series = priceSeriesRef.current;
    if (!series) return;
    const active = alerts.filter(
      (a) => a.symbol === symbol && a.active && !a.triggeredAt
    );
    const activeIds = new Set(active.map((a) => a.id));

    for (const [id, line] of alertLinesRef.current.entries()) {
      if (!activeIds.has(id)) {
        try {
          series.removePriceLine(line);
        } catch {
          // ignore
        }
        alertLinesRef.current.delete(id);
      }
    }
    for (const a of active) {
      if (alertLinesRef.current.has(a.id)) continue;
      try {
        const line = series.createPriceLine({
          price: a.price,
          color: "#fbbf24",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `🔔 ${a.direction === "above" ? "↑" : "↓"} ${a.price.toFixed(2)}`,
        });
        alertLinesRef.current.set(a.id, line);
      } catch {
        // ignore
      }
    }
    // Clear the local map on series rebuild so re-attach recreates lines.
    return () => {
      alertLinesRef.current.clear();
    };
  }, [alerts, symbol, priceSeriesVersion]);

  // Push the pre-change snapshot for undo (clears the redo stack).
  const pushHistory = useCallback((prev: Drawing[]) => {
    undoRef.current.push(prev);
    if (undoRef.current.length > 50) undoRef.current.shift();
    redoRef.current = [];
  }, []);

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

    // Magnet: snap a point to the nearest candle's time and the
    // closest of that candle's OHLC prices.
    const snap = (pt: Point): Point => {
      if (!magnet) return pt;
      const rows = klinesRef.current;
      if (rows.length === 0) return pt;
      let best = rows[0];
      for (const r of rows) {
        if (
          Math.abs(r.time - pt.time) < Math.abs(best.time - pt.time)
        )
          best = r;
      }
      const candidates = [best.open, best.high, best.low, best.close];
      let price = candidates[0];
      for (const c of candidates) {
        if (Math.abs(c - pt.price) < Math.abs(price - pt.price)) price = c;
      }
      return { time: best.time, price };
    };

    const setChartInteractive = (on: boolean) => {
      chartRef.current?.applyOptions({
        handleScroll: on,
        handleScale: on,
      });
    };

    const onPointerDown = (e: PointerEvent) => {
      // Ignore secondary touch fingers — keeps pinch-to-zoom intact
      // and prevents a second tap from adding stray drawing points.
      if (!e.isPrimary) return;
      const prim = primitiveRef.current;
      if (!prim) return;
      const { x, y } = relpos(e);

      // Create mode — collect points for the active tool
      if (tool !== "select") {
        const raw = prim.pointFromScreen(x, y);
        if (!raw) return;
        const p = snap(raw);
        const color = pickColor(drawingsRef.current.length);
        const st = lastStyleRef.current;
        const id = generateId();
        const sym = symbolRef.current;
        const base = {
          id,
          symbol: sym,
          color,
          lineWidth: st.lineWidth,
          lineStyle: st.lineStyle,
        };
        const create = (d: Drawing) => {
          pushHistory(drawingsRef.current);
          persist([...drawingsRef.current, d]);
          setSelectedId(id);
          setPendingPts([]);
          setTool("select");
        };

        // ─ Single-click tools
        if (tool === "level") {
          const n = drawingsRef.current.filter(
            (d) => d.type === "level"
          ).length;
          create({ ...base, type: "level", price: p.price, label: `L${n + 1}` });
          return;
        }
        if (tool === "hray") {
          create({ ...base, type: "hray", p1: p });
          return;
        }
        if (tool === "vline") {
          create({ ...base, type: "vline", time: p.time });
          return;
        }
        if (tool === "text") {
          const note: Drawing = {
            ...base,
            type: "text",
            p1: p,
            text: "Text",
          };
          create(note);
          setTextEdit({ id, value: "" });
          return;
        }
        if (tool === "position") {
          create({
            ...base,
            type: "position",
            side: "long",
            time: p.time,
            entry: p.price,
            target: p.price * 1.02,
            stop: p.price * 0.99,
          });
          return;
        }
        if (tool === "alert") {
          const cur = livePriceRef.current;
          const direction: "above" | "below" =
            cur > 0 && p.price < cur ? "below" : "above";
          setPendingAlert({ price: p.price, direction });
          setPendingPts([]);
          setTool("select");
          return;
        }

        // ─ Multi-click tools (2 or 3 points)
        const need = THREE_POINT_TOOLS.has(tool) ? 3 : 2;
        const pts = [...pendingPts, p];
        if (pts.length < need) {
          setPendingPts(pts);
          return;
        }
        const [a, b, c] = pts;
        let d: Drawing;
        if (tool === "rect") {
          d = { ...base, type: "rect", p1: a, p2: b };
        } else if (tool === "fib") {
          d = { ...base, type: "fib", p1: a, p2: b };
        } else if (tool === "measure") {
          d = { ...base, type: "measure", p1: a, p2: b };
        } else if (tool === "ellipse") {
          d = { ...base, type: "ellipse", p1: a, p2: b };
        } else if (tool === "fibfan") {
          d = { ...base, type: "fibfan", p1: a, p2: b };
        } else if (tool === "channel") {
          d = { ...base, type: "channel", p1: a, p2: b, p3: c };
        } else if (tool === "pitchfork") {
          d = { ...base, type: "pitchfork", p1: a, p2: b, p3: c };
        } else if (tool === "fibext") {
          d = { ...base, type: "fibext", p1: a, p2: b, p3: c };
        } else {
          const [f, s] = a.time <= b.time ? [a, b] : [b, a];
          d = {
            ...base,
            type: "trendline",
            p1: f,
            p2: s,
            extend:
              tool === "ray"
                ? "right"
                : tool === "extline"
                ? "both"
                : "none",
            arrow: tool === "arrow",
          };
        }
        create(d);
        return;
      }

      // Select / drag mode
      const startPt = prim.pointFromScreen(x, y);
      const handle = prim.handleAt(x, y);
      if (handle && startPt) {
        const orig = drawingsRef.current.find(
          (d) => d.id === handle.drawingId
        );
        if (!orig || orig.locked) return;
        setSelectedId(handle.drawingId);
        pushHistory(drawingsRef.current);
        dragRef.current = {
          id: handle.drawingId,
          pointIndex: handle.pointIndex,
          start: startPt,
          orig,
        };
        setChartInteractive(false);
        el.setPointerCapture(e.pointerId);
        return;
      }
      const hitId = prim.drawingAt(x, y);
      setSelectedId(hitId);
      if (hitId && startPt) {
        const orig = drawingsRef.current.find((d) => d.id === hitId);
        if (orig && !orig.locked) {
          pushHistory(drawingsRef.current);
          dragRef.current = {
            id: hitId,
            pointIndex: "move",
            start: startPt,
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
      const raw = prim.pointFromScreen(x, y);
      if (!raw) return;
      const cur = snap(raw);

      const next = drawingsRef.current.map((d) =>
        d.id === drag.id
          ? applyDrag(d, drag.pointIndex, cur, drag.start, drag.orig)
          : d
      );
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

    // Double-click a text note to edit it.
    const onDblClick = (e: MouseEvent) => {
      const prim = primitiveRef.current;
      if (!prim) return;
      const { x, y } = relpos(e as unknown as PointerEvent);
      const id = prim.drawingAt(x, y);
      if (!id) return;
      const d = drawingsRef.current.find((dd) => dd.id === id);
      if (d && d.type === "text") {
        setSelectedId(id);
        setTextEdit({ id, value: d.text });
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("dblclick", onDblClick);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("dblclick", onDblClick);
    };
  }, [tool, pendingPts, magnet, pushHistory]);

  const confirmCreateAlert = useCallback(async () => {
    if (!pendingAlert) return;
    try {
      await createAlert({
        symbol,
        price: pendingAlert.price,
        direction: pendingAlert.direction,
      });
      toast.success(
        "Alert created",
        `${pair.display} ${pendingAlert.direction === "above" ? "↑" : "↓"} ${pendingAlert.price.toFixed(2)}`
      );
    } catch (err) {
      toast.error(
        "Couldn’t save alert",
        err instanceof Error ? err.message : "Sign in to save price alerts"
      );
    } finally {
      setPendingAlert(null);
    }
  }, [pendingAlert, createAlert, symbol, pair.display, toast]);

  const commitTextEdit = useCallback(() => {
    if (!textEdit) return;
    const { id, value } = textEdit;
    setDrawings((cur) => {
      const next = cur.map((d) =>
        d.id === id && d.type === "text"
          ? { ...d, text: value.trim() || "Text" }
          : d
      );
      drawingsRef.current = next;
      saveDrawings(symbol, next);
      return next;
    });
    setTextEdit(null);
  }, [textEdit, symbol]);

  const restoreDrawings = useCallback(
    (snapshot: Drawing[]) => {
      drawingsRef.current = snapshot;
      setDrawings(snapshot);
      saveDrawings(symbol, snapshot);
      setSelectedId(null);
    },
    [symbol]
  );

  const undo = useCallback(() => {
    if (undoRef.current.length === 0) return;
    redoRef.current.push(drawingsRef.current);
    restoreDrawings(undoRef.current.pop() as Drawing[]);
  }, [restoreDrawings]);

  const redo = useCallback(() => {
    if (redoRef.current.length === 0) return;
    undoRef.current.push(drawingsRef.current);
    restoreDrawings(redoRef.current.pop() as Drawing[]);
  }, [restoreDrawings]);

  const handleRemoveDrawing = useCallback(
    (id: string) => {
      pushHistory(drawingsRef.current);
      const next = removeDrawing(symbol, id);
      drawingsRef.current = next;
      setDrawings(next);
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [symbol, pushHistory]
  );

  const confirmClearDrawings = useCallback(() => {
    pushHistory(drawingsRef.current);
    clearDrawings(symbol);
    drawingsRef.current = [];
    setDrawings([]);
    setSelectedId(null);
    setClearConfirm(false);
  }, [symbol, pushHistory]);

  // Mutate the selected drawing's style (color / width / dash / lock /
  // side) and persist.
  const patchSelected = useCallback(
    (patch: Partial<Drawing>) => {
      if (!selectedId) return;
      pushHistory(drawingsRef.current);
      // Remember width/style so new drawings inherit the last choice.
      if (patch.lineWidth || patch.lineStyle) {
        lastStyleRef.current = {
          lineWidth: patch.lineWidth ?? lastStyleRef.current.lineWidth,
          lineStyle: patch.lineStyle ?? lastStyleRef.current.lineStyle,
        };
        try {
          window.localStorage.setItem(
            "kinetic:lastDrawStyle",
            JSON.stringify(lastStyleRef.current)
          );
        } catch {
          // ignore
        }
      }
      setDrawings((cur) => {
        const next = cur.map((d) =>
          d.id === selectedId ? ({ ...d, ...patch } as Drawing) : d
        );
        drawingsRef.current = next;
        saveDrawings(symbol, next);
        return next;
      });
    },
    [selectedId, symbol, pushHistory]
  );

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    pushHistory(drawingsRef.current);
    setDrawings((cur) => {
      const src = cur.find((d) => d.id === selectedId);
      if (!src) return cur;
      const copy = { ...src, id: generateId() } as Drawing;
      const next = [...cur, copy];
      drawingsRef.current = next;
      saveDrawings(symbol, next);
      setSelectedId(copy.id);
      return next;
    });
  }, [selectedId, symbol, pushHistory]);

  // ─ Keyboard: Delete removes selection, Esc cancels/deselects
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === "Escape") {
        setPendingPts([]);
        setSelectedId(null);
        setTool("select");
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedId
      ) {
        pushHistory(drawingsRef.current);
        const next = removeDrawing(symbol, selectedId);
        setDrawings(next);
        drawingsRef.current = next;
        setSelectedId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, symbol, undo, redo, pushHistory]);

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

    const highs = klines.map((k) => k.high);
    const lows = klines.map((k) => k.low);

    if (ind.donchian) {
      const dc = donchian(highs, lows, 20);
      addLine("donchian_upper", dc.upper, INDICATOR_META.donchian.color, 1);
      addLine("donchian_lower", dc.lower, INDICATOR_META.donchian.color, 1);
      addLine(
        "donchian_middle",
        dc.middle,
        INDICATOR_META.donchian.color,
        1
      );
    }

    if (ind.keltner) {
      const kc = keltner(highs, lows, closes, 20, 10, 2);
      addLine("keltner_upper", kc.upper, INDICATOR_META.keltner.color, 1);
      addLine("keltner_lower", kc.lower, INDICATOR_META.keltner.color, 1);
      addLine("keltner_middle", kc.middle, INDICATOR_META.keltner.color, 1);
    }

    if (ind.ichimoku) {
      const ich = ichimoku(highs, lows, closes);
      addLine("ich_tenkan", ich.tenkan, "#22d3ee", 1);
      addLine("ich_kijun", ich.kijun, "#f472b6", 1);
      addLine("ich_spanA", ich.senkouA, "#50c878", 1);
      addLine("ich_spanB", ich.senkouB, "#ff716c", 1);
      addLine("ich_chikou", ich.chikou, "#a78bfa", 1);
    }

    if (ind.pivots && klines.length > 0) {
      // Compute classic pivots from prior day relative to last bar.
      const lastTime = klines[klines.length - 1].time;
      const oneDay = 86_400;
      const dayStart = Math.floor(lastTime / oneDay) * oneDay;
      const prev = klines.filter(
        (k) => k.time >= dayStart - oneDay && k.time < dayStart
      );
      if (prev.length > 0) {
        const ph = Math.max(...prev.map((k) => k.high));
        const pl = Math.min(...prev.map((k) => k.low));
        const pc = prev[prev.length - 1].close;
        const lv = pivotPoints(ph, pl, pc);
        const dotted = (label: string, price: number) => {
          const series = chart.addSeries(mod.LineSeries, {
            color: INDICATOR_META.pivots.color,
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            title: label,
          });
          series.setData(
            klines.map((k) => ({ time: k.time, value: price }))
          );
          indicatorSeriesRef.current.set(`piv_${label}`, series);
        };
        dotted("PP", lv.pp);
        dotted("R1", lv.r1);
        dotted("R2", lv.r2);
        dotted("R3", lv.r3);
        dotted("S1", lv.s1);
        dotted("S2", lv.s2);
        dotted("S3", lv.s3);
      }
    }

    if (ind.sar) {
      const sar = parabolicSar(highs, lows);
      // Dot series — render as tiny LineSeries with point markers
      // (no connecting line via lineStyle:Hidden? lightweight-charts
      // line series always draws lines; use a LineSeries with
      // crosshair markers off and per-bar values — fine for a SAR
      // dotted look. To keep it visually distinct from real lines we
      // hide the line entirely using lineVisible:false and rely on
      // point markers).
      const upPts = sar
        .map((p) =>
          p.trend === 1
            ? { time: klines[p.index].time, value: p.price }
            : null
        )
        .filter((p): p is { time: number; value: number } => p !== null);
      const dnPts = sar
        .map((p) =>
          p.trend === -1
            ? { time: klines[p.index].time, value: p.price }
            : null
        )
        .filter((p): p is { time: number; value: number } => p !== null);
      const mkSeries = (color: string, id: string, data: typeof upPts) => {
        const s = chart.addSeries(mod.LineSeries, {
          color,
          lineWidth: 1,
          lineVisible: false,
          pointMarkersVisible: true,
          pointMarkersRadius: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        s.setData(data);
        indicatorSeriesRef.current.set(id, s);
      };
      mkSeries("#50c878", "sar_up", upPts);
      mkSeries("#ff716c", "sar_dn", dnPts);
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
  const selectedDrawing =
    tool === "select"
      ? activeDrawings.find((d) => d.id === selectedId) ?? null
      : null;

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
      <div className="absolute top-3 right-3 z-30 flex items-center gap-px bg-surface-container-low/90 backdrop-blur-sm">
        <PaletteBtn
          active={tool === "select"}
          onClick={() => {
            setTool("select");
            setPendingPts([]);
            setToolMenu(false);
          }}
          title="Select / move (Esc)"
        >
          <MousePointer2 size={14} />
        </PaletteBtn>

        {/* Grouped tools dropdown */}
        <div className="relative">
          <button
            onClick={() => setToolMenu((v) => !v)}
            className={`flex items-center gap-1 p-2 transition-colors ${
              tool !== "select"
                ? "bg-cyan/15 text-cyan"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
            title="Drawing tools"
          >
            <TrendingUp size={14} />
            <ChevronDown
              size={11}
              className={toolMenu ? "rotate-180 transition-transform" : "transition-transform"}
            />
          </button>
          {toolMenu && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-surface-container-high shadow-2xl py-1">
              {TOOL_GROUPS.map((g) => (
                <div key={g.group}>
                  <p className="px-3 pt-2 pb-1 text-[9px] font-bold tracking-widest uppercase text-on-surface-variant/60">
                    {g.group}
                  </p>
                  {g.tools.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTool(t.id);
                        setPendingPts([]);
                        setToolMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors ${
                        tool === t.id
                          ? "bg-cyan/10 text-cyan"
                          : "text-on-surface hover:bg-surface-container-highest"
                      }`}
                    >
                      <span className="shrink-0">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <PaletteBtn
          active={magnet}
          onClick={() => setMagnet((v) => !v)}
          title="Magnet — snap to candle OHLC"
        >
          <Magnet size={14} />
        </PaletteBtn>
        <PaletteBtn onClick={undo} title="Undo (Ctrl+Z)">
          <Undo2 size={14} />
        </PaletteBtn>
        <PaletteBtn onClick={redo} title="Redo (Ctrl+Shift+Z)">
          <Redo2 size={14} />
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

      {/* Style popover — shown when a drawing is selected */}
      {selectedDrawing && (
        <div className="absolute top-14 right-3 z-30 w-56 bg-surface-container-high/95 backdrop-blur-sm shadow-2xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
              {drawingLabel(selectedDrawing)}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  patchSelected({ locked: !selectedDrawing.locked })
                }
                title={selectedDrawing.locked ? "Unlock" : "Lock"}
                className="p-1 text-on-surface-variant hover:text-on-surface"
              >
                {selectedDrawing.locked ? (
                  <Lock size={13} />
                ) : (
                  <LockOpen size={13} />
                )}
              </button>
              <button
                onClick={duplicateSelected}
                title="Duplicate"
                className="p-1 text-on-surface-variant hover:text-on-surface"
              >
                <Copy size={13} />
              </button>
              <button
                onClick={() => handleRemoveDrawing(selectedDrawing.id)}
                title="Delete (Del)"
                className="p-1 text-on-surface-variant hover:text-crimson"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DRAWING_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => patchSelected({ color: c })}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 ${
                  selectedDrawing.color === c
                    ? "ring-2 ring-on-surface ring-offset-1 ring-offset-surface-container-high"
                    : ""
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((w) => (
              <button
                key={w}
                onClick={() => patchSelected({ lineWidth: w })}
                className={`flex-1 py-1 text-[10px] font-bold transition-colors ${
                  (selectedDrawing.lineWidth ?? 2) === w
                    ? "bg-cyan/15 text-cyan"
                    : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {w}px
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {LINE_STYLES.map((s) => (
              <button
                key={s}
                onClick={() => patchSelected({ lineStyle: s })}
                className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  (selectedDrawing.lineStyle ?? "solid") === s
                    ? "bg-cyan/15 text-cyan"
                    : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {selectedDrawing.type === "position" && (
            <div className="flex items-center gap-1">
              {(["long", "short"] as const).map((sd) => (
                <button
                  key={sd}
                  onClick={() => patchSelected({ side: sd })}
                  className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    selectedDrawing.side === sd
                      ? sd === "long"
                        ? "bg-emerald/20 text-emerald"
                        : "bg-crimson/20 text-crimson"
                      : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {sd}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drawing-mode banner */}
      {tool !== "select" && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 bg-cyan/15 text-cyan text-[10px] font-bold tracking-widest uppercase px-3 py-1 pointer-events-none">
          {ONE_POINT_TOOLS.has(tool)
            ? "Click to place"
            : `Click point ${pendingPts.length + 1} of ${
                THREE_POINT_TOOLS.has(tool) ? 3 : 2
              }`}
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
                  {drawingLabel(d)}
                  {d.locked && (
                    <Lock size={9} className="inline ml-1 -mt-0.5" />
                  )}
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

      <ConfirmDialog
        open={pendingAlert !== null}
        title="Create price alert"
        message={
          pendingAlert
            ? `Notify when ${pair.display} crosses ${
                pendingAlert.direction
              } ${pendingAlert.price.toFixed(2)}?`
            : ""
        }
        confirmLabel="Create alert"
        onConfirm={confirmCreateAlert}
        onCancel={() => setPendingAlert(null)}
      />

      {textEdit && (
        <div
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setTextEdit(null)}
        >
          <div
            className="bg-surface-container-high w-full max-w-sm shadow-2xl p-5"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h3 className="text-sm font-black font-heading tracking-wider uppercase text-on-surface mb-3">
              Edit text
            </h3>
            <input
              autoFocus
              value={textEdit.value}
              onChange={(ev) =>
                setTextEdit({ id: textEdit.id, value: ev.target.value })
              }
              onKeyDown={(ev) => {
                if (ev.key === "Enter") commitTextEdit();
                if (ev.key === "Escape") setTextEdit(null);
              }}
              placeholder="Note text"
              className="w-full bg-surface-container px-3 py-2 text-sm text-on-surface outline-none focus:bg-surface-container-highest"
            />
            <div className="flex items-stretch mt-4 border-t border-outline-variant/10 -mx-5 -mb-5">
              <button
                onClick={() => setTextEdit(null)}
                className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <span className="w-px bg-outline-variant/10" />
              <button
                onClick={commitTextEdit}
                className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase text-cyan hover:bg-cyan/15 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
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
