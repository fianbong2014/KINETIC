// Drawings store — persists every drawing-tool object per symbol in
// localStorage. No backend round-trip; drawings are intentionally a
// per-device thing. The model is shared by the canvas primitive
// (rendering + hit-testing) and the FullChart interaction controller.

export interface Point {
  time: number;
  price: number;
}

export type LineStyle = "solid" | "dashed" | "dotted";

// Visual style shared by every drawing. All optional so older saved
// payloads keep working — the primitive falls back to sane defaults.
interface Styled {
  color: string;
  lineWidth?: number;
  lineStyle?: LineStyle;
  locked?: boolean;
}

export interface HorizontalLevel extends Styled {
  id: string;
  type: "level";
  symbol: string;
  price: number;
  label: string;
}

// Horizontal ray: constant price starting at p1.time, extending right.
export interface HorizontalRay extends Styled {
  id: string;
  type: "hray";
  symbol: string;
  p1: Point;
}

export interface VerticalLine extends Styled {
  id: string;
  type: "vline";
  symbol: string;
  time: number;
}

export interface TrendLine extends Styled {
  id: string;
  type: "trendline";
  symbol: string;
  p1: Point;
  p2: Point;
  // none = segment, right = ray, both = extended line
  extend?: "none" | "right" | "both";
  arrow?: boolean;
  ray?: boolean; // legacy — treated as extend:"right"
}

export interface RectZone extends Styled {
  id: string;
  type: "rect";
  symbol: string;
  p1: Point;
  p2: Point;
}

export interface FibRetracement extends Styled {
  id: string;
  type: "fib";
  symbol: string;
  p1: Point;
  p2: Point;
}

export interface TextNote extends Styled {
  id: string;
  type: "text";
  symbol: string;
  p1: Point;
  text: string;
}

// Measure: shows Δprice, Δ%, bar count between p1 and p2.
export interface MeasureTool extends Styled {
  id: string;
  type: "measure";
  symbol: string;
  p1: Point;
  p2: Point;
}

// Long/Short position tool — TradingView-style risk/reward box.
export interface PositionTool extends Styled {
  id: string;
  type: "position";
  symbol: string;
  side: "long" | "short";
  time: number; // left anchor
  entry: number;
  target: number;
  stop: number;
}

export type Drawing =
  | HorizontalLevel
  | HorizontalRay
  | VerticalLine
  | TrendLine
  | RectZone
  | FibRetracement
  | TextNote
  | MeasureTool
  | PositionTool;

export type DrawingType = Drawing["type"];

// Fibonacci retracement levels rendered between p1 and p2.
export const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1] as const;

const STORAGE_PREFIX = "kinetic:drawings:";

function keyFor(symbol: string): string {
  return STORAGE_PREFIX + symbol;
}

export function loadDrawings(symbol: string): Drawing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor(symbol));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Drawing[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDrawings(symbol: string, drawings: Drawing[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(symbol), JSON.stringify(drawings));
  } catch {
    // localStorage may be disabled (private mode) — silent fallback
  }
}

export function addDrawing(symbol: string, drawing: Drawing): Drawing[] {
  const next = [...loadDrawings(symbol), drawing];
  saveDrawings(symbol, next);
  return next;
}

export function removeDrawing(symbol: string, id: string): Drawing[] {
  const next = loadDrawings(symbol).filter((d) => d.id !== id);
  saveDrawings(symbol, next);
  return next;
}

export function clearDrawings(symbol: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(symbol));
  } catch {
    // ignore
  }
}

export function generateId(): string {
  return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Default colors for new drawings (cycled through)
export const DRAWING_COLORS = [
  "#00ffff", // cyan
  "#50c878", // emerald
  "#ff734c", // orange
  "#ff716c", // crimson
  "#a78bfa", // purple
  "#fbbf24", // yellow
];

export function pickColor(existingCount: number): string {
  return DRAWING_COLORS[existingCount % DRAWING_COLORS.length];
}

// Human label for the drawings list / UI.
export function drawingLabel(d: Drawing): string {
  switch (d.type) {
    case "level":
      return `${d.label} · ${d.price.toFixed(2)}`;
    case "hray":
      return `Ray · ${d.p1.price.toFixed(2)}`;
    case "vline":
      return "Vertical line";
    case "trendline":
      return d.arrow
        ? "Arrow"
        : d.extend === "both"
        ? "Extended line"
        : d.extend === "right" || d.ray
        ? "Ray line"
        : "Trend line";
    case "rect":
      return "Rectangle";
    case "fib":
      return "Fibonacci";
    case "text":
      return d.text ? `“${d.text.slice(0, 16)}”` : "Text";
    case "measure":
      return "Measure";
    case "position":
      return d.side === "long" ? "Long position" : "Short position";
  }
}
