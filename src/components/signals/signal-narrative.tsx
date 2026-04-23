"use client";

import { usePrice } from "@/components/providers/price-provider";
import { useMultiTFReport } from "@/hooks/use-multi-tf-report";
import { useSignalReport } from "@/hooks/use-signal-report";

export function SignalNarrative() {
  const { pair, symbol } = usePrice();
  const { slices, summary } = useMultiTFReport(symbol);
  // Keep the 4H single-TF report for detailed indicator readouts
  const { report } = useSignalReport(symbol, "4h", 250);

  const allBullish =
    summary.alignment === "aligned" && summary.bias === "bullish";
  const allBearish =
    summary.alignment === "aligned" && summary.bias === "bearish";
  const allEvents = slices.flatMap((s) => s.report?.events ?? []);

  if (slices.every((s) => s.loading)) {
    return (
      <div className="bg-surface-container-low p-8">
        <h4 className="text-xl font-black uppercase tracking-tighter font-heading text-on-surface mb-4">
          Signal Narrative
        </h4>
        <p className="text-sm text-on-surface-variant">
          Running analysis on {pair.display} across 1H · 4H · 1D...
        </p>
      </div>
    );
  }

  const hasSignals = allEvents.length > 0;

  return (
    <div className="bg-surface-container-low p-8">
      <h4 className="text-xl font-black uppercase tracking-tighter font-heading text-on-surface mb-4">
        Signal Narrative
      </h4>

      {!hasSignals ? (
        <p className="text-sm text-on-surface-variant leading-relaxed">
          No significant technical signals detected on {pair.display} across
          any of the scanned timeframes. Price action suggests a waiting
          market — watch for confluence between volume, momentum, and key
          zones before committing capital.
        </p>
      ) : (
        <div className="text-sm text-on-surface-variant leading-relaxed space-y-3">
          <p>
            Multi-timeframe scan of{" "}
            <span className="text-on-surface font-semibold">
              {pair.display}
            </span>{" "}
            reveals a{" "}
            <span
              className={
                summary.bias === "bullish"
                  ? "text-emerald-accent font-semibold"
                  : summary.bias === "bearish"
                    ? "text-crimson font-semibold"
                    : "text-on-surface font-semibold"
              }
            >
              {summary.bias}
            </span>{" "}
            bias with{" "}
            <span className="text-on-surface font-semibold">
              {summary.confidence}%
            </span>{" "}
            composite confidence.{" "}
            {allBullish &&
              "All three timeframes agree — a high-quality alignment that historically precedes sustained moves."}
            {allBearish &&
              "All three timeframes are bearish — a rare full alignment signaling strong downward pressure."}
            {summary.alignment === "mixed" &&
              "However, timeframes conflict — lower timeframes may be trading counter to the higher-timeframe trend, which often marks unstable entries."}
            {summary.alignment === "leaning" &&
              "Some timeframes are directional while others remain neutral, suggesting the move is still developing."}
          </p>

          {/* Per-TF quick summary */}
          <div className="space-y-1.5 text-xs">
            {slices.map((s) => {
              if (!s.report) return null;
              const biasText =
                s.report.bias === "bullish"
                  ? "Bullish"
                  : s.report.bias === "bearish"
                    ? "Bearish"
                    : "Neutral";
              const biasColor =
                s.report.bias === "bullish"
                  ? "text-emerald-accent"
                  : s.report.bias === "bearish"
                    ? "text-crimson"
                    : "text-on-surface-variant";
              const top = s.report.events.slice(0, 2);
              return (
                <div key={s.key} className="flex items-baseline gap-3">
                  <span className="w-10 text-on-surface-variant font-mono text-[10px] uppercase tracking-wider shrink-0">
                    {s.label}
                  </span>
                  <span className={`font-semibold ${biasColor}`}>
                    {biasText}
                  </span>
                  {top.length > 0 && (
                    <span className="text-on-surface-variant/80 truncate">
                      · {top.map((e) => e.label).join(", ")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {report?.rsi !== null && report?.rsi !== undefined && (
            <p className="text-[10px] font-mono tabular-nums text-on-surface-variant/80 pt-3 border-t border-outline-variant/10">
              4H · RSI {report.rsi.toFixed(1)}
              {report.macd !== null
                ? ` · MACD ${report.macd.toFixed(2)}`
                : ""}
              {report.ema200 !== null
                ? ` · EMA200 $${report.ema200.toFixed(2)}`
                : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
