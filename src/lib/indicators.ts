// Pure technical indicator calculations. No external dependencies.
// Each function takes an array of closing prices (oldest → newest) and
// returns an array of the same length where values before the lookback
// window is filled are `null`.

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── Simple Moving Average ────────────────────────────────────────────

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

// ─── Exponential Moving Average ───────────────────────────────────────

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    if (i === period - 1) {
      // Seed with SMA over the first `period` values
      let sum = 0;
      for (let j = 0; j < period; j++) sum += values[j];
      prev = sum / period;
      out.push(prev);
      continue;
    }
    prev = values[i] * k + (prev as number) * (1 - k);
    out.push(prev);
  }
  return out;
}

// ─── Relative Strength Index ──────────────────────────────────────────

export function rsi(values: number[], period: number = 14): (number | null)[] {
  const out: (number | null)[] = Array(values.length).fill(null);
  if (values.length < period + 1) return out;

  let avgGain = 0;
  let avgLoss = 0;

  // Seed: average gain/loss over the first `period` price changes
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;

  out[period] =
    avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    // Wilder's smoothing
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] =
      avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return out;
}

// ─── MACD (Moving Average Convergence Divergence) ─────────────────────

export interface MacdValues {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

export function macd(
  values: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MacdValues {
  const fastEma = ema(values, fastPeriod);
  const slowEma = ema(values, slowPeriod);

  const macdLine: (number | null)[] = values.map((_, i) => {
    const f = fastEma[i];
    const s = slowEma[i];
    return f !== null && s !== null ? f - s : null;
  });

  // Signal line is an EMA of MACD — skip leading nulls.
  const firstIdx = macdLine.findIndex((v) => v !== null);
  const signalLine: (number | null)[] = Array(values.length).fill(null);
  if (firstIdx >= 0) {
    const slice = macdLine
      .slice(firstIdx)
      .map((v) => (v === null ? 0 : v)) as number[];
    const sig = ema(slice, signalPeriod);
    for (let i = 0; i < sig.length; i++) {
      signalLine[firstIdx + i] = sig[i];
    }
  }

  const histogram: (number | null)[] = macdLine.map((m, i) => {
    const s = signalLine[i];
    return m !== null && s !== null ? m - s : null;
  });

  return { macd: macdLine, signal: signalLine, histogram };
}

// ─── Stochastic Oscillator ────────────────────────────────────────────

export interface StochasticValues {
  k: (number | null)[];
  d: (number | null)[];
}

/**
 * Stochastic oscillator. %K = position of close within the high/low
 * range over `kPeriod`, smoothed by `smooth`. %D = SMA of %K over
 * `dPeriod`. Both series are length-aligned to the input candles.
 */
export function stochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod = 14,
  dPeriod = 3,
  smooth = 3
): StochasticValues {
  const n = closes.length;
  const rawK: (number | null)[] = Array(n).fill(null);

  for (let i = kPeriod - 1; i < n; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (highs[j] > hh) hh = highs[j];
      if (lows[j] < ll) ll = lows[j];
    }
    const range = hh - ll;
    rawK[i] = range === 0 ? 100 : ((closes[i] - ll) / range) * 100;
  }

  const smoothK = sma(
    rawK.map((v) => (v === null ? 0 : v)),
    smooth
  ).map((v, i) => (rawK[i] === null ? null : v));

  const d = sma(
    smoothK.map((v) => (v === null ? 0 : v)),
    dPeriod
  ).map((v, i) => (smoothK[i] === null ? null : v));

  return { k: smoothK, d };
}

// ─── Average True Range ───────────────────────────────────────────────

/**
 * Average True Range (Wilder's smoothing). Measures volatility as the
 * smoothed average of true range over `period`.
 */
export function atr(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): (number | null)[] {
  const n = closes.length;
  const out: (number | null)[] = Array(n).fill(null);
  if (n < period + 1) return out;

  const tr: number[] = [0];
  for (let i = 1; i < n; i++) {
    tr.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      )
    );
  }

  let prev = 0;
  for (let i = 1; i <= period; i++) prev += tr[i];
  prev /= period;
  out[period] = prev;

  for (let i = period + 1; i < n; i++) {
    prev = (prev * (period - 1) + tr[i]) / period;
    out[i] = prev;
  }

  return out;
}

// ─── On-Balance Volume ────────────────────────────────────────────────

export function obv(closes: number[], volumes: number[]): (number | null)[] {
  const out: (number | null)[] = [];
  let acc = 0;
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      out.push(0);
      continue;
    }
    if (closes[i] > closes[i - 1]) acc += volumes[i];
    else if (closes[i] < closes[i - 1]) acc -= volumes[i];
    out.push(acc);
  }
  return out;
}

// ─── Supertrend ───────────────────────────────────────────────────────

export interface SupertrendValues {
  line: (number | null)[];
  direction: (1 | -1 | null)[]; // 1 = uptrend, -1 = downtrend
}

/**
 * Supertrend overlay. Uses ATR-based upper/lower bands; flips trend
 * when price closes through the active band. `line` is the active band
 * value at each candle, `direction` is the trend sign.
 */
export function supertrend(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 10,
  multiplier = 3
): SupertrendValues {
  const n = closes.length;
  const line: (number | null)[] = Array(n).fill(null);
  const direction: (1 | -1 | null)[] = Array(n).fill(null);
  const atrVals = atr(highs, lows, closes, period);

  let prevUpper = 0;
  let prevLower = 0;
  let prevDir: 1 | -1 = 1;

  for (let i = 0; i < n; i++) {
    const a = atrVals[i];
    if (a === null) continue;

    const mid = (highs[i] + lows[i]) / 2;
    let upper = mid + multiplier * a;
    let lower = mid - multiplier * a;

    if (prevUpper !== 0) {
      upper =
        upper < prevUpper || closes[i - 1] > prevUpper ? upper : prevUpper;
      lower =
        lower > prevLower || closes[i - 1] < prevLower ? lower : prevLower;
    }

    let dir: 1 | -1;
    if (prevUpper === 0) {
      dir = closes[i] > mid ? 1 : -1;
    } else if (prevDir === 1) {
      dir = closes[i] < prevLower ? -1 : 1;
    } else {
      dir = closes[i] > prevUpper ? 1 : -1;
    }

    line[i] = dir === 1 ? lower : upper;
    direction[i] = dir;

    prevUpper = upper;
    prevLower = lower;
    prevDir = dir;
  }

  return { line, direction };
}

// ─── Cross detection ──────────────────────────────────────────────────

/**
 * Returns the index where series `a` crosses series `b`, looking at the
 * most recent N candles. Returns null if no cross.
 * Direction:
 *   "above" = a crossed from below to above b
 *   "below" = a crossed from above to below b
 */
export function lastCross(
  a: (number | null)[],
  b: (number | null)[],
  withinLastN = 5
): { index: number; direction: "above" | "below" } | null {
  const start = Math.max(1, a.length - withinLastN);
  for (let i = a.length - 1; i >= start; i--) {
    const a0 = a[i - 1];
    const a1 = a[i];
    const b0 = b[i - 1];
    const b1 = b[i];
    if (a0 === null || a1 === null || b0 === null || b1 === null) continue;
    if (a0 <= b0 && a1 > b1) return { index: i, direction: "above" };
    if (a0 >= b0 && a1 < b1) return { index: i, direction: "below" };
  }
  return null;
}

// ─── RSI Divergence ──────────────────────────────────────────────────

/**
 * Detects bullish/bearish divergence between price and RSI in the last
 * `lookback` candles.
 *
 * Bullish divergence: price makes a lower low while RSI makes a higher low.
 * Bearish divergence: price makes a higher high while RSI makes a lower high.
 *
 * This is a simplified swing-point detector — good enough for an alert-style
 * feature, not for backtesting accuracy.
 */
export function detectDivergence(
  closes: number[],
  rsiValues: (number | null)[],
  lookback = 30
): "bullish" | "bearish" | null {
  const n = closes.length;
  if (n < lookback + 2) return null;

  // Find last swing low in closes (lowest value over lookback, excluding very end)
  const recent = closes.slice(n - lookback);
  const recentRsi = rsiValues.slice(n - lookback);
  const mid = Math.floor(lookback / 2);

  const firstHalfLow = Math.min(...recent.slice(0, mid));
  const secondHalfLow = Math.min(...recent.slice(mid));
  const firstHalfLowRsi = Math.min(
    ...(recentRsi.slice(0, mid).filter((v) => v !== null) as number[])
  );
  const secondHalfLowRsi = Math.min(
    ...(recentRsi.slice(mid).filter((v) => v !== null) as number[])
  );

  const firstHalfHigh = Math.max(...recent.slice(0, mid));
  const secondHalfHigh = Math.max(...recent.slice(mid));
  const firstHalfHighRsi = Math.max(
    ...(recentRsi.slice(0, mid).filter((v) => v !== null) as number[])
  );
  const secondHalfHighRsi = Math.max(
    ...(recentRsi.slice(mid).filter((v) => v !== null) as number[])
  );

  if (
    secondHalfLow < firstHalfLow &&
    secondHalfLowRsi > firstHalfLowRsi
  ) {
    return "bullish";
  }
  if (
    secondHalfHigh > firstHalfHigh &&
    secondHalfHighRsi < firstHalfHighRsi
  ) {
    return "bearish";
  }
  return null;
}

// ─── Volume spike ─────────────────────────────────────────────────────

export function volumeSpike(volumes: number[], period = 20, factor = 2): boolean {
  if (volumes.length < period + 1) return false;
  const lookback = volumes.slice(-period - 1, -1);
  const avg = lookback.reduce((a, b) => a + b, 0) / period;
  const last = volumes[volumes.length - 1];
  return last > avg * factor;
}

// ─── Support / Resistance zones ──────────────────────────────────────

/**
 * Derives simple support/resistance levels from the last `lookback`
 * candles by finding local minima (support) and maxima (resistance)
 * with a configurable neighborhood.
 */
export function findZones(
  candles: Candle[],
  lookback = 100,
  neighborhood = 3
): { support: number[]; resistance: number[] } {
  const slice = candles.slice(-lookback);
  const support: number[] = [];
  const resistance: number[] = [];

  for (let i = neighborhood; i < slice.length - neighborhood; i++) {
    const c = slice[i];
    let isLow = true;
    let isHigh = true;
    for (let j = 1; j <= neighborhood; j++) {
      if (slice[i - j].low < c.low || slice[i + j].low < c.low) isLow = false;
      if (slice[i - j].high > c.high || slice[i + j].high > c.high)
        isHigh = false;
    }
    if (isLow) support.push(c.low);
    if (isHigh) resistance.push(c.high);
  }

  // Keep the N most recent levels
  return {
    support: support.slice(-3),
    resistance: resistance.slice(-3),
  };
}
