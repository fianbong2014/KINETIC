// Drawings store — persists horizontal levels and trend lines per symbol
// in localStorage. No backend round-trip; drawings are intentionally a
// per-device / per-user-session thing.

export interface HorizontalLevel {
  id: string;
  type: "level";
  symbol: string;
  price: number;
  label: string;
  color: string;
}

export interface Point {
  time: number;
  price: number;
}

export interface TrendLine {
  id: string;
  type: "trendline";
  symbol: string;
  p1: Point;
  p2: Point;
  color: string;
  // When true the segment is extended forward past p2 (a ray).
  ray?: boolean;
}

export interface RectZone {
  id: string;
  type: "rect";
  symbol: string;
  p1: Point;
  p2: Point;
  color: string;
}

export interface FibRetracement {
  id: string;
  type: "fib";
  symbol: string;
  // p1 = swing start (level 0), p2 = swing end (level 1)
  p1: Point;
  p2: Point;
  color: string;
}

export type Drawing =
  | HorizontalLevel
  | TrendLine
  | RectZone
  | FibRetracement;

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
