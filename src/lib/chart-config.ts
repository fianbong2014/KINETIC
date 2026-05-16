// User-customizable chart configuration shared between the FullChart
// page and its toolbar/side-panel. Persisted to localStorage so the
// user's layout sticks across reloads, per symbol.

export type Timeframe =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "4h"
  | "1d"
  | "1w";

export const TIMEFRAMES: { id: Timeframe; label: string; limit: number }[] = [
  { id: "1m", label: "1m", limit: 240 },
  { id: "5m", label: "5m", limit: 240 },
  { id: "15m", label: "15m", limit: 200 },
  { id: "30m", label: "30m", limit: 200 },
  { id: "1h", label: "1H", limit: 200 },
  { id: "4h", label: "4H", limit: 200 },
  { id: "1d", label: "1D", limit: 200 },
  { id: "1w", label: "1W", limit: 150 },
];

export type ChartType = "candles" | "heikin_ashi" | "line" | "area";

export const CHART_TYPES: { id: ChartType; label: string }[] = [
  { id: "candles", label: "Candles" },
  { id: "heikin_ashi", label: "Heikin-Ashi" },
  { id: "line", label: "Line" },
  { id: "area", label: "Area" },
];

export interface IndicatorToggles {
  ema20: boolean;
  ema50: boolean;
  ema200: boolean;
  sma50: boolean;
  bbands: boolean; // Bollinger Bands (20, 2)
  vwap: boolean;
  supertrend: boolean; // ATR-based trend overlay (10, 3)
  volume: boolean;
}

export interface OscillatorToggles {
  rsi: boolean;
  macd: boolean;
  stoch: boolean; // Stochastic %K/%D (14, 3, 3)
  atr: boolean; // Average True Range (14)
}

export type ChartEngine = "lightweight" | "tradingview";

export interface ChartConfig {
  timeframe: Timeframe;
  chartType: ChartType;
  engine: ChartEngine;
  indicators: IndicatorToggles;
  oscillators: OscillatorToggles;
}

export const DEFAULT_CHART_CONFIG: ChartConfig = {
  timeframe: "1h",
  chartType: "candles",
  engine: "lightweight",
  indicators: {
    ema20: true,
    ema50: true,
    ema200: false,
    sma50: false,
    bbands: false,
    vwap: false,
    supertrend: false,
    volume: true,
  },
  oscillators: {
    rsi: true,
    macd: false,
    stoch: false,
    atr: false,
  },
};

// ─── Indicator visuals ───────────────────────────────────────────────

export const INDICATOR_META: Record<
  keyof IndicatorToggles,
  { label: string; color: string; description: string }
> = {
  ema20: {
    label: "EMA 20",
    color: "#ffd166",
    description: "Short-term momentum",
  },
  ema50: {
    label: "EMA 50",
    color: "#06d6a0",
    description: "Mid-term trend",
  },
  ema200: {
    label: "EMA 200",
    color: "#a78bfa",
    description: "Long-term trend",
  },
  sma50: {
    label: "SMA 50",
    color: "#ff734c",
    description: "Simple 50-period average",
  },
  bbands: {
    label: "Bollinger Bands",
    color: "#00ffff",
    description: "20-period · 2 std dev",
  },
  vwap: {
    label: "VWAP",
    color: "#ff716c",
    description: "Volume-weighted average price",
  },
  supertrend: {
    label: "Supertrend",
    color: "#50c878",
    description: "ATR trend flip · 10, 3",
  },
  volume: {
    label: "Volume",
    color: "#adaaab",
    description: "Histogram bars on price",
  },
};

// ─── Persistence ─────────────────────────────────────────────────────

const STORAGE_KEY = "kinetic:chart-config";

export function loadChartConfig(): ChartConfig {
  if (typeof window === "undefined") return DEFAULT_CHART_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CHART_CONFIG;
    const parsed = JSON.parse(raw);
    // Merge with defaults so new fields don't break old configs
    return {
      ...DEFAULT_CHART_CONFIG,
      ...parsed,
      indicators: {
        ...DEFAULT_CHART_CONFIG.indicators,
        ...(parsed?.indicators ?? {}),
      },
      oscillators: {
        ...DEFAULT_CHART_CONFIG.oscillators,
        ...(parsed?.oscillators ?? {}),
      },
    };
  } catch {
    return DEFAULT_CHART_CONFIG;
  }
}

export function saveChartConfig(cfg: ChartConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // private mode — silent
  }
}

// ─── Templates ───────────────────────────────────────────────────────

export interface ChartTemplate {
  id: string;
  name: string;
  config: ChartConfig;
  createdAt: number;
}

const TEMPLATES_KEY = "kinetic:chart-templates";

export function loadTemplates(): ChartTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTemplate(name: string, config: ChartConfig): ChartTemplate {
  const template: ChartTemplate = {
    id: `tpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    config,
    createdAt: Date.now(),
  };
  const all = loadTemplates();
  all.unshift(template);
  // Cap at 20 to keep storage bounded
  while (all.length > 20) all.pop();
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TEMPLATES_KEY, JSON.stringify(all));
    }
  } catch {
    // ignore
  }
  return template;
}

export function deleteTemplate(id: string): void {
  const all = loadTemplates().filter((t) => t.id !== id);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TEMPLATES_KEY, JSON.stringify(all));
    }
  } catch {
    // ignore
  }
}

// ─── Heikin-Ashi transform ───────────────────────────────────────────

export interface OhlcCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Transforms raw OHLC candles into Heikin-Ashi candles. Each HA candle
 * smooths out small price moves so trends are easier to read.
 *
 *   HA close = avg(open, high, low, close)
 *   HA open  = avg(prev HA open, prev HA close)
 *   HA high  = max(high, HA open, HA close)
 *   HA low   = min(low, HA open, HA close)
 */
export function toHeikinAshi(candles: OhlcCandle[]): OhlcCandle[] {
  if (candles.length === 0) return [];
  const out: OhlcCandle[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen =
      i === 0
        ? (c.open + c.close) / 2
        : (out[i - 1].open + out[i - 1].close) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);
    out.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
    });
  }
  return out;
}

// ─── Bollinger Bands ─────────────────────────────────────────────────

export interface BBandsValues {
  middle: (number | null)[];
  upper: (number | null)[];
  lower: (number | null)[];
}

export function bollingerBands(
  closes: number[],
  period = 20,
  stdDev = 2
): BBandsValues {
  const middle: (number | null)[] = [];
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      middle.push(null);
      upper.push(null);
      lower.push(null);
      continue;
    }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += closes[j];
    const mean = sum / period;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) {
      variance += (closes[j] - mean) ** 2;
    }
    const sd = Math.sqrt(variance / period);
    middle.push(mean);
    upper.push(mean + stdDev * sd);
    lower.push(mean - stdDev * sd);
  }

  return { middle, upper, lower };
}

// ─── VWAP (cumulative) ───────────────────────────────────────────────

export function vwap(
  candles: { high: number; low: number; close: number; volume: number }[]
): (number | null)[] {
  let cumPV = 0;
  let cumV = 0;
  return candles.map((c) => {
    const typical = (c.high + c.low + c.close) / 3;
    cumPV += typical * c.volume;
    cumV += c.volume;
    return cumV > 0 ? cumPV / cumV : null;
  });
}
