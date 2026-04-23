// Custom indicator evaluator — lightweight JS expression sandbox.
//
// Users author indicators as single JS expressions that return an array of
// (number | null) values, one per candle. The expression runs inside a
// Function() built with a whitelisted set of helpers; the global object
// (window, document, fetch, etc.) is masked with `undefined` parameters so
// a rogue expression cannot reach the DOM or network.
//
// This is "trust-your-own-account" level isolation, not a hostile sandbox.

import {
  sma,
  ema,
  rsi,
  macd,
  type Candle,
} from "./indicators";

export interface IndicatorContext {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  time: number[];
}

export interface CompiledIndicator {
  name: string;
  color: string;
  overlay: boolean;
  run: (ctx: IndicatorContext) => (number | null)[];
}

// ─── Helpers exposed to user expressions ─────────────────────────────

function highest(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    let max = -Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (values[j] > max) max = values[j];
    }
    out.push(max);
  }
  return out;
}

function lowest(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    let min = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (values[j] < min) min = values[j];
    }
    out.push(min);
  }
  return out;
}

function stdev(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    const mean = sum / period;
    let sqDiff = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sqDiff += (values[j] - mean) ** 2;
    }
    out.push(Math.sqrt(sqDiff / period));
  }
  return out;
}

// Element-wise add/sub/mul/div across (number|null)[] arrays or with scalars.
type Series = (number | null)[];

function elementwise(
  a: Series | number,
  b: Series | number,
  op: (x: number, y: number) => number
): Series {
  const len = Array.isArray(a) ? a.length : Array.isArray(b) ? b.length : 0;
  const out: Series = new Array(len);
  for (let i = 0; i < len; i++) {
    const av = Array.isArray(a) ? a[i] : a;
    const bv = Array.isArray(b) ? b[i] : b;
    if (av === null || bv === null || typeof av !== "number" || typeof bv !== "number") {
      out[i] = null;
    } else {
      out[i] = op(av, bv);
    }
  }
  return out;
}

const helpers = Object.freeze({
  sma,
  ema,
  rsi,
  macd: (values: number[], fast = 12, slow = 26, signal = 9) =>
    macd(values, fast, slow, signal).macd,
  macdSignal: (values: number[], fast = 12, slow = 26, signal = 9) =>
    macd(values, fast, slow, signal).signal,
  macdHist: (values: number[], fast = 12, slow = 26, signal = 9) =>
    macd(values, fast, slow, signal).histogram,
  highest,
  lowest,
  stdev,
  add: (a: Series | number, b: Series | number) =>
    elementwise(a, b, (x, y) => x + y),
  sub: (a: Series | number, b: Series | number) =>
    elementwise(a, b, (x, y) => x - y),
  mul: (a: Series | number, b: Series | number) =>
    elementwise(a, b, (x, y) => x * y),
  div: (a: Series | number, b: Series | number) =>
    elementwise(a, b, (x, y) => (y === 0 ? 0 : x / y)),
  // Shorthand: Bollinger upper/lower bands
  bbUpper: (values: number[], period = 20, mult = 2) =>
    elementwise(sma(values, period), mul(stdev(values, period), mult), (x, y) => x + y),
  bbLower: (values: number[], period = 20, mult = 2) =>
    elementwise(sma(values, period), mul(stdev(values, period), mult), (x, y) => x - y),
  // Exposed math essentials
  min: Math.min,
  max: Math.max,
  abs: Math.abs,
  sqrt: Math.sqrt,
  log: Math.log,
});

function mul(a: Series, b: number): Series {
  return elementwise(a, b, (x, y) => x * y);
}

// Names that must be shadowed as `undefined` so user code can't reach them.
const BLOCKED_GLOBALS = [
  "window",
  "document",
  "globalThis",
  "self",
  "top",
  "parent",
  "frames",
  "location",
  "navigator",
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "process",
  "require",
  "module",
  "exports",
  "eval",
  "Function",
  "setTimeout",
  "setInterval",
  "setImmediate",
  "queueMicrotask",
  "importScripts",
  "postMessage",
  "console",
];

export interface CompileResult {
  ok: boolean;
  run?: CompiledIndicator["run"];
  error?: string;
}

// Compile a user expression into a runnable function. The expression is
// evaluated with candle arrays and indicator helpers in scope.
export function compileExpression(expression: string): CompileResult {
  const trimmed = expression.trim();
  if (!trimmed) return { ok: false, error: "Expression is empty" };

  // Lightweight syntactic guard — block obvious escapes. Not a real AST
  // analysis; the masked-globals approach is the actual defense.
  if (/\b(constructor|prototype|__proto__|import)\b/.test(trimmed)) {
    return {
      ok: false,
      error: "Expression references a blocked identifier",
    };
  }

  const helperKeys = Object.keys(helpers) as (keyof typeof helpers)[];
  const paramNames = [
    "open",
    "high",
    "low",
    "close",
    "volume",
    "time",
    ...helperKeys,
    ...BLOCKED_GLOBALS,
  ];

  try {
    // Non-strict so `eval` can be shadowed as a parameter name.
    const body = `return (${trimmed});`;
    const fn = new Function(...paramNames, body) as (
      ...args: unknown[]
    ) => unknown;

    const run = (ctx: IndicatorContext): Series => {
      const helperVals = helperKeys.map((k) => helpers[k]);
      const blocked = BLOCKED_GLOBALS.map(() => undefined);
      const result = fn(
        ctx.open,
        ctx.high,
        ctx.low,
        ctx.close,
        ctx.volume,
        ctx.time,
        ...helperVals,
        ...blocked
      );
      return normalizeResult(result, ctx.close.length);
    };

    return { ok: true, run };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Compile failed",
    };
  }
}

// Coerce any expression output into a Series aligned with the candles.
function normalizeResult(result: unknown, length: number): Series {
  if (Array.isArray(result)) {
    if (result.length === length) {
      return result.map((v) =>
        typeof v === "number" && Number.isFinite(v) ? v : null
      );
    }
    // Pad front with nulls if shorter
    const out: Series = new Array(length).fill(null);
    const offset = length - result.length;
    for (let i = 0; i < result.length; i++) {
      const v = result[i];
      const idx = offset + i;
      if (idx >= 0 && idx < length) {
        out[idx] = typeof v === "number" && Number.isFinite(v) ? v : null;
      }
    }
    return out;
  }
  // Scalar → flat line
  if (typeof result === "number" && Number.isFinite(result)) {
    return new Array(length).fill(result);
  }
  return new Array(length).fill(null);
}

export function candlesToContext(candles: Candle[]): IndicatorContext {
  const open: number[] = [];
  const high: number[] = [];
  const low: number[] = [];
  const close: number[] = [];
  const volume: number[] = [];
  const time: number[] = [];
  for (const c of candles) {
    open.push(c.open);
    high.push(c.high);
    low.push(c.low);
    close.push(c.close);
    volume.push(c.volume);
    time.push(c.time);
  }
  return { open, high, low, close, volume, time };
}

export const INDICATOR_EXAMPLES: { label: string; expression: string }[] = [
  { label: "EMA 20", expression: "ema(close, 20)" },
  { label: "EMA 50", expression: "ema(close, 50)" },
  { label: "SMA 200", expression: "sma(close, 200)" },
  { label: "RSI 14", expression: "rsi(close, 14)" },
  { label: "Bollinger Upper", expression: "bbUpper(close, 20, 2)" },
  { label: "Bollinger Lower", expression: "bbLower(close, 20, 2)" },
  { label: "MACD Histogram", expression: "macdHist(close)" },
  {
    label: "VWMA 20",
    expression: "div(sma(mul(close, volume), 20), sma(volume, 20))",
  },
];
