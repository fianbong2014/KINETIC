import {
  detectDivergence,
  ema,
  findZones,
  lastCross,
  macd,
  rsi,
  sma,
  volumeSpike,
  type Candle,
} from "@/lib/indicators";

export type SignalBias = "bullish" | "bearish" | "neutral";

export interface SignalEvent {
  id: string;            // Stable id for UI keys
  label: string;         // Short human-readable name
  description: string;   // One-sentence explanation
  bias: SignalBias;      // Color-coding hint
  indicator: string;     // Which indicator family
}

export interface SignalReport {
  price: number;
  rsi: number | null;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  volumeSpike: boolean;

  events: SignalEvent[];

  // Overall directional bias + a crude confidence score (0–100)
  bias: SignalBias;
  confidence: number;

  // Zones derived from swing highs/lows
  supportZones: number[];
  resistanceZones: number[];

  // Suggested trade plan (best-effort)
  plan: {
    entry: number;
    stopLoss: number;
    takeProfit: number;
    rrr: number;
  } | null;
}

/**
 * Runs every indicator over the supplied candle series and produces a
 * structured report of events + overall bias. Safe to call on every
 * render — it's pure and O(n) in the number of candles.
 */
export function analyze(candles: Candle[]): SignalReport {
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const last = candles.length - 1;
  const price = candles[last]?.close ?? 0;

  const rsiValues = rsi(closes, 14);
  const ema20Values = ema(closes, 20);
  const ema50Values = ema(closes, 50);
  const ema200Values = ema(closes, 200);
  const { macd: macdLine, signal: macdSignal, histogram } = macd(closes);

  const rsiNow = rsiValues[last] ?? null;
  const ema20Now = ema20Values[last] ?? null;
  const ema50Now = ema50Values[last] ?? null;
  const ema200Now = ema200Values[last] ?? null;
  const macdNow = macdLine[last] ?? null;
  const macdSigNow = macdSignal[last] ?? null;
  const histNow = histogram[last] ?? null;

  const events: SignalEvent[] = [];

  // ── EMA crossover (20/50) ────────────────────────────────────────
  const emaCross = lastCross(ema20Values, ema50Values, 3);
  if (emaCross) {
    events.push({
      id: "ema-cross",
      label: emaCross.direction === "above" ? "EMA 20/50 Golden Cross" : "EMA 20/50 Death Cross",
      description:
        emaCross.direction === "above"
          ? "20-period EMA crossed above the 50-period EMA — short-term momentum turning bullish."
          : "20-period EMA crossed below the 50-period EMA — short-term momentum turning bearish.",
      bias: emaCross.direction === "above" ? "bullish" : "bearish",
      indicator: "EMA",
    });
  }

  // ── Price vs EMA 200 ─────────────────────────────────────────────
  if (ema200Now !== null) {
    if (price > ema200Now) {
      events.push({
        id: "above-ema-200",
        label: "Price above EMA 200",
        description: "Price trading above the 200-period EMA — long-term trend bullish.",
        bias: "bullish",
        indicator: "EMA",
      });
    } else {
      events.push({
        id: "below-ema-200",
        label: "Price below EMA 200",
        description: "Price trading below the 200-period EMA — long-term trend bearish.",
        bias: "bearish",
        indicator: "EMA",
      });
    }
  }

  // ── RSI zones ────────────────────────────────────────────────────
  if (rsiNow !== null) {
    if (rsiNow >= 70) {
      events.push({
        id: "rsi-overbought",
        label: `RSI Overbought (${rsiNow.toFixed(1)})`,
        description: "RSI in overbought territory (≥ 70) — risk of short-term pullback.",
        bias: "bearish",
        indicator: "RSI",
      });
    } else if (rsiNow <= 30) {
      events.push({
        id: "rsi-oversold",
        label: `RSI Oversold (${rsiNow.toFixed(1)})`,
        description: "RSI in oversold territory (≤ 30) — potential mean-reversion bounce.",
        bias: "bullish",
        indicator: "RSI",
      });
    }
  }

  // ── RSI divergence ───────────────────────────────────────────────
  const divergence = detectDivergence(closes, rsiValues, 30);
  if (divergence === "bullish") {
    events.push({
      id: "rsi-bull-div",
      label: "RSI Bullish Divergence",
      description: "Price making a lower low while RSI makes a higher low — potential trend reversal.",
      bias: "bullish",
      indicator: "RSI",
    });
  } else if (divergence === "bearish") {
    events.push({
      id: "rsi-bear-div",
      label: "RSI Bearish Divergence",
      description: "Price making a higher high while RSI makes a lower high — momentum weakening.",
      bias: "bearish",
      indicator: "RSI",
    });
  }

  // ── MACD cross ───────────────────────────────────────────────────
  const macdCross = lastCross(macdLine, macdSignal, 3);
  if (macdCross) {
    events.push({
      id: "macd-cross",
      label: macdCross.direction === "above" ? "MACD Bullish Cross" : "MACD Bearish Cross",
      description:
        macdCross.direction === "above"
          ? "MACD crossed above signal line — momentum shifting upward."
          : "MACD crossed below signal line — momentum shifting downward.",
      bias: macdCross.direction === "above" ? "bullish" : "bearish",
      indicator: "MACD",
    });
  }

  // ── Volume spike ─────────────────────────────────────────────────
  const vSpike = volumeSpike(volumes, 20, 2);
  if (vSpike) {
    const last2 = candles.slice(-1)[0];
    const isUp = last2 && last2.close >= last2.open;
    events.push({
      id: "volume-spike",
      label: "Volume Spike Detected",
      description: `Current candle volume > 2× 20-period average — institutional footprint, ${isUp ? "buying" : "selling"} side.`,
      bias: isUp ? "bullish" : "bearish",
      indicator: "Volume",
    });
  }

  // ── SMA 50 as support/resistance ─────────────────────────────────
  const sma50 = sma(closes, 50);
  const sma50Now = sma50[last];
  if (sma50Now !== null && ema200Now !== null) {
    const distPct = Math.abs((price - sma50Now) / sma50Now) * 100;
    if (distPct < 1.5) {
      events.push({
        id: "sma-50-touch",
        label: "SMA 50 retest",
        description: `Price within ${distPct.toFixed(2)}% of SMA 50 — zone in play.`,
        bias: "neutral",
        indicator: "SMA",
      });
    }
  }

  // ── Zones ────────────────────────────────────────────────────────
  const { support, resistance } = findZones(candles);

  // ── Composite bias + confidence ──────────────────────────────────
  const bullishCount = events.filter((e) => e.bias === "bullish").length;
  const bearishCount = events.filter((e) => e.bias === "bearish").length;
  let bias: SignalBias = "neutral";
  if (bullishCount > bearishCount + 1) bias = "bullish";
  else if (bearishCount > bullishCount + 1) bias = "bearish";

  // Confidence: weighted by total events considered (capped)
  const totalSignals = bullishCount + bearishCount;
  const directionalCount = Math.abs(bullishCount - bearishCount);
  const confidence =
    totalSignals === 0
      ? 0
      : Math.min(
          99,
          Math.round(40 + (directionalCount / Math.max(1, totalSignals)) * 60)
        );

  // ── Suggested plan from zones ────────────────────────────────────
  let plan: SignalReport["plan"] = null;
  if (bias === "bullish" && support.length > 0 && resistance.length > 0) {
    const entry = price;
    const stopLoss = Math.min(...support);
    const takeProfit = Math.max(...resistance);
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(takeProfit - entry);
    const rrr = risk > 0 ? reward / risk : 0;
    if (rrr > 0.5) plan = { entry, stopLoss, takeProfit, rrr };
  } else if (bias === "bearish" && support.length > 0 && resistance.length > 0) {
    const entry = price;
    const stopLoss = Math.max(...resistance);
    const takeProfit = Math.min(...support);
    const risk = Math.abs(stopLoss - entry);
    const reward = Math.abs(entry - takeProfit);
    const rrr = risk > 0 ? reward / risk : 0;
    if (rrr > 0.5) plan = { entry, stopLoss, takeProfit, rrr };
  }

  return {
    price,
    rsi: rsiNow,
    ema20: ema20Now,
    ema50: ema50Now,
    ema200: ema200Now,
    macd: macdNow,
    macdSignal: macdSigNow,
    macdHistogram: histNow,
    volumeSpike: vSpike,
    events,
    bias,
    confidence,
    supportZones: support,
    resistanceZones: resistance,
    plan,
  };
}
