import type { SignalBias, SignalReport } from "@/lib/signal-engine";

// Standard timeframes we analyze in parallel. Short → long.
// Weight grows with timeframe because longer frames are more reliable for bias.
export const TIMEFRAMES = [
  { key: "1h", label: "1H", limit: 250, weight: 1 },
  { key: "4h", label: "4H", limit: 250, weight: 2 },
  { key: "1d", label: "1D", limit: 200, weight: 3 },
] as const;

export type TimeframeKey = (typeof TIMEFRAMES)[number]["key"];

export interface TimeframeSlice {
  key: TimeframeKey;
  label: string;
  report: SignalReport | null;
  loading: boolean;
}

export type Alignment = "aligned" | "leaning" | "mixed" | "neutral";

export interface MultiTFSummary {
  bias: SignalBias;
  confidence: number; // 0–99 composite
  alignment: Alignment;
  // Per-TF bias snapshot for dots/pills rendering
  biases: { key: TimeframeKey; label: string; bias: SignalBias; confidence: number }[];
}

/**
 * Computes the consolidated bias across timeframes, weighted so that
 * higher timeframes (1D) pull harder than lower ones (1H).
 *
 * Weighting: each TF contributes weight×(confidence/100) in its direction.
 * A final score > 0 means bullish, < 0 means bearish, |score| scales
 * the confidence.
 */
export function summarize(slices: TimeframeSlice[]): MultiTFSummary {
  const biases = slices.map((s) => ({
    key: s.key,
    label: s.label,
    bias: s.report?.bias ?? ("neutral" as SignalBias),
    confidence: s.report?.confidence ?? 0,
  }));

  // Weighted directional score
  let score = 0;
  let totalWeight = 0;

  for (const slice of slices) {
    const tf = TIMEFRAMES.find((t) => t.key === slice.key);
    if (!tf || !slice.report) continue;
    const dir =
      slice.report.bias === "bullish"
        ? 1
        : slice.report.bias === "bearish"
          ? -1
          : 0;
    score += dir * tf.weight * (slice.report.confidence / 100);
    totalWeight += tf.weight;
  }

  // Normalize: final score range roughly [-1, 1] (when every TF is at
  // max confidence + aligned direction).
  const normalized = totalWeight > 0 ? score / totalWeight : 0;

  let bias: SignalBias = "neutral";
  if (normalized > 0.15) bias = "bullish";
  else if (normalized < -0.15) bias = "bearish";

  // Confidence is the magnitude of the normalized score, mapped to 0–99.
  // Anchor at 30 so a single directional signal still shows meaningful
  // confidence, and cap so the number feels earned.
  const confidence = Math.min(
    99,
    Math.round(30 + Math.abs(normalized) * 70)
  );

  // Alignment classification — how unanimous are the TFs?
  const directionalBiases = biases.filter((b) => b.bias !== "neutral");
  const bullishCount = biases.filter((b) => b.bias === "bullish").length;
  const bearishCount = biases.filter((b) => b.bias === "bearish").length;
  const total = biases.length;

  let alignment: Alignment = "neutral";
  if (directionalBiases.length === 0) {
    alignment = "neutral";
  } else if (bullishCount === total || bearishCount === total) {
    alignment = "aligned"; // Unanimous
  } else if (bullishCount > 0 && bearishCount > 0) {
    alignment = "mixed"; // Conflicting
  } else {
    alignment = "leaning"; // Some directional + some neutral
  }

  return { bias, confidence, alignment, biases };
}

/**
 * Human-readable label for a bias + alignment combination, used in
 * headlines like "Aligned Buy", "Mixed Signals", "Leaning Sell".
 */
export function biasHeadline(summary: MultiTFSummary): string {
  const { bias, alignment } = summary;
  if (bias === "neutral") {
    return alignment === "mixed" ? "Mixed Signals" : "Neutral";
  }
  const action = bias === "bullish" ? "Buy" : "Sell";
  if (alignment === "aligned") return `Aligned ${action}`;
  if (alignment === "leaning") return `Leaning ${action}`;
  return action;
}
