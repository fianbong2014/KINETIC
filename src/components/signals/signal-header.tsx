"use client";

import { usePrice } from "@/components/providers/price-provider";
import { useSignalReport } from "@/hooks/use-signal-report";

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

export function SignalHeader() {
  const { pair, symbol } = usePrice();
  const { report } = useSignalReport(symbol, "4h", 250);

  const confidence = report?.confidence ?? 0;
  const bias = report?.bias ?? "neutral";

  return (
    <div className="border-b border-outline-variant/10 pb-4 sm:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left side */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span
              className={`text-[10px] font-bold tracking-wider uppercase px-3 py-1 ${
                bias === "bullish"
                  ? "bg-primary-container text-on-primary-container"
                  : bias === "bearish"
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {bias === "neutral" ? "Monitoring" : "Active Signal"}
            </span>
            <span className="text-[10px] text-on-surface-variant font-mono">
              {symbol} · 4H
            </span>
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
              Confidence Score
            </span>
          </div>
          <div className="sm:text-right">
            <span className="text-xl sm:text-2xl font-black font-heading text-on-surface tracking-tighter">
              {report?.events.length ?? 0} Signals
            </span>
            <span className="block text-[10px] text-on-surface-variant tracking-wider uppercase mt-1">
              Detected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
