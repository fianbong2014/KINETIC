"use client";

import { usePrice } from "@/components/providers/price-provider";
import { useSignalReport } from "@/hooks/use-signal-report";

export function SignalNarrative() {
  const { pair, symbol } = usePrice();
  const { report, loading } = useSignalReport(symbol, "4h", 250);

  const bullishEvents =
    report?.events.filter((e) => e.bias === "bullish") ?? [];
  const bearishEvents =
    report?.events.filter((e) => e.bias === "bearish") ?? [];

  return (
    <div className="bg-surface-container-low p-8">
      <h4 className="text-xl font-black uppercase tracking-tighter font-heading text-on-surface mb-4">
        Signal Narrative
      </h4>

      {loading ? (
        <p className="text-sm text-on-surface-variant">
          Running analysis on {pair.display}...
        </p>
      ) : !report || report.events.length === 0 ? (
        <p className="text-sm text-on-surface-variant leading-relaxed">
          No significant technical signals detected on {pair.display} 4H timeframe.
          Price action suggests a waiting market — watch for confluence between
          volume, momentum, and key zones before committing capital.
        </p>
      ) : (
        <div className="text-sm text-on-surface-variant leading-relaxed space-y-3">
          <p>
            Current 4H analysis of{" "}
            <span className="text-on-surface font-semibold">{pair.display}</span>{" "}
            reveals{" "}
            <span className="text-on-surface font-semibold">
              {report.events.length} active signals
            </span>{" "}
            with {report.confidence}% directional confidence. Overall bias is{" "}
            <span
              className={
                report.bias === "bullish"
                  ? "text-emerald-accent font-semibold"
                  : report.bias === "bearish"
                    ? "text-crimson font-semibold"
                    : "text-on-surface font-semibold"
              }
            >
              {report.bias}
            </span>
            .
          </p>

          {bullishEvents.length > 0 && (
            <p>
              Bullish confluence:{" "}
              {bullishEvents
                .slice(0, 3)
                .map((e, i, arr) => (
                  <span key={e.id}>
                    <span className="text-on-surface font-semibold">
                      {e.label}
                    </span>
                    {i < arr.length - 1 ? ", " : ""}
                  </span>
                ))}
              .
            </p>
          )}

          {bearishEvents.length > 0 && (
            <p>
              Bearish confluence:{" "}
              {bearishEvents
                .slice(0, 3)
                .map((e, i, arr) => (
                  <span key={e.id}>
                    <span className="text-on-surface font-semibold">
                      {e.label}
                    </span>
                    {i < arr.length - 1 ? ", " : ""}
                  </span>
                ))}
              .
            </p>
          )}

          {report.rsi !== null && (
            <p className="text-[10px] font-mono tabular-nums text-on-surface-variant/80 pt-2 border-t border-outline-variant/10">
              RSI {report.rsi.toFixed(1)}
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
