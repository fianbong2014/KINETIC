"use client";

import { usePrice } from "@/components/providers/price-provider";
import { useMultiTFReport } from "@/hooks/use-multi-tf-report";
import { biasHeadline } from "@/lib/multi-tf";

const BIAS_LABEL: Record<string, string> = {
  bullish: "Bullish Momentum",
  bearish: "Bearish Pressure",
  neutral: "Neutral — Awaiting Catalyst",
};

const BIAS_COLOR: Record<string, string> = {
  bullish: "text-emerald-accent",
  bearish: "text-crimson",
  neutral: "text-on-surface-variant",
};

const DOT_COLOR: Record<string, string> = {
  bullish: "bg-emerald-accent",
  bearish: "bg-crimson",
  neutral: "bg-on-surface-variant/40",
};

export function SignalHeader() {
  const { pair, symbol } = usePrice();
  const { slices, summary } = useMultiTFReport(symbol);

  const confidence = summary.confidence;
  const bias = summary.bias;
  const totalEvents = slices.reduce(
    (sum, s) => sum + (s.report?.events.length ?? 0),
    0
  );

  return (
    <div className="border-b border-outline-variant/10 pb-4 sm:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left side */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`text-[10px] font-bold tracking-wider uppercase px-3 py-1 ${
                bias === "bullish"
                  ? "bg-primary-container text-on-primary-container"
                  : bias === "bearish"
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {biasHeadline(summary)}
            </span>
            <span className="text-[10px] text-on-surface-variant font-mono">
              {symbol} · MTF
            </span>

            {/* Per-timeframe dots */}
            <div className="flex items-center gap-1.5">
              {slices.map((s) => {
                const sliceBias = s.report?.bias ?? "neutral";
                return (
                  <div
                    key={s.key}
                    className="flex items-center gap-1"
                    title={`${s.label}: ${sliceBias}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[sliceBias]}`}
                    />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tighter uppercase text-on-surface">
            {pair.base} / {pair.quote}
          </h1>
          <p className={`text-sm ${BIAS_COLOR[bias]}`}>{BIAS_LABEL[bias]}</p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-6">
          <div className="sm:text-right">
            <span
              className={`text-3xl sm:text-4xl font-black font-heading tabular-nums ${
                bias === "bullish"
                  ? "text-emerald-accent"
                  : bias === "bearish"
                    ? "text-crimson"
                    : "text-on-surface"
              }`}
            >
              {confidence}%
            </span>
            <span className="block text-[10px] text-on-surface-variant tracking-wider uppercase mt-1">
              Composite Confidence
            </span>
          </div>
          <div className="sm:text-right">
            <span className="text-xl sm:text-2xl font-black font-heading text-on-surface tracking-tighter">
              {totalEvents} Signals
            </span>
            <span className="block text-[10px] text-on-surface-variant tracking-wider uppercase mt-1">
              Across 1H · 4H · 1D
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
