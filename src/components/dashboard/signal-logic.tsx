"use client";

import { Brain } from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import { useSignalReport } from "@/hooks/use-signal-report";

const BIAS_COLORS: Record<string, { bar: string; text: string; label: string }> = {
  bullish: { bar: "bg-cyan", text: "text-cyan", label: "Bullish" },
  bearish: { bar: "bg-orange", text: "text-orange", label: "Bearish" },
  neutral: { bar: "bg-emerald-accent", text: "text-emerald-accent", label: "Neutral" },
};

export function SignalLogic() {
  const { symbol, pair } = usePrice();
  const { report, loading } = useSignalReport(symbol, "4h", 250);

  const bias = report?.bias ?? "neutral";
  const biasColor = BIAS_COLORS[bias];
  const confidence = report?.confidence ?? 0;

  const displayEvents = report?.events.slice(0, 4) ?? [];

  return (
    <section className="bg-surface-container-low p-5 flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
          Signal Logic
        </h2>
        <span className="text-[9px] text-on-surface-variant font-bold tracking-wider">
          {pair.display} · 4H
        </span>
      </div>

      <div className="space-y-4 flex-1">
        {loading && displayEvents.length === 0 ? (
          <p className="text-xs text-on-surface-variant">
            Analyzing {pair.display}...
          </p>
        ) : displayEvents.length === 0 ? (
          <p className="text-xs text-on-surface-variant">
            No significant signals detected.
          </p>
        ) : (
          displayEvents.map((event) => {
            const color = BIAS_COLORS[event.bias];
            return (
              <div key={event.id} className="flex gap-4 group">
                <div
                  className={`w-1 h-auto ${color.bar} group-hover:brightness-125 transition-colors shrink-0`}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-tight truncate">
                    {event.label}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Bias */}
      <div className="mt-6 p-4 border border-outline-dim bg-surface-container-lowest">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className={`w-3 h-3 ${biasColor.text}`} />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase">
              Terminal Bias
            </span>
          </div>
          {report && (
            <span className="text-[10px] font-mono text-on-surface-variant">
              {confidence}%
            </span>
          )}
        </div>
        <span
          className={`text-xl font-heading font-black ${biasColor.text} uppercase italic`}
        >
          {bias === "bullish"
            ? confidence >= 70
              ? "AGGRESSIVE BUY"
              : "BUY"
            : bias === "bearish"
              ? confidence >= 70
                ? "AGGRESSIVE SELL"
                : "SELL"
              : "NEUTRAL"}
        </span>
      </div>
    </section>
  );
}
