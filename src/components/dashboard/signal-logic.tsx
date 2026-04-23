"use client";

import { Brain } from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import { useMultiTFReport } from "@/hooks/use-multi-tf-report";
import { biasHeadline } from "@/lib/multi-tf";

const BIAS_COLORS: Record<
  string,
  { bar: string; text: string; dot: string }
> = {
  bullish: { bar: "bg-cyan", text: "text-cyan", dot: "bg-emerald-accent" },
  bearish: { bar: "bg-orange", text: "text-orange", dot: "bg-crimson" },
  neutral: {
    bar: "bg-emerald-accent",
    text: "text-emerald-accent",
    dot: "bg-on-surface-variant/40",
  },
};

export function SignalLogic() {
  const { pair, symbol } = usePrice();
  const { slices, summary, loading } = useMultiTFReport(symbol);

  const biasColor = BIAS_COLORS[summary.bias];
  const confidence = summary.confidence;

  // Pick the strongest 4 events across all timeframes for the preview list
  const allEvents = slices.flatMap((s) =>
    (s.report?.events ?? []).map((e) => ({ ...e, tf: s.label }))
  );
  // Prefer events from aligned-bias TFs first, otherwise show all
  const ordered =
    summary.bias !== "neutral"
      ? [
          ...allEvents.filter((e) => e.bias === summary.bias),
          ...allEvents.filter((e) => e.bias !== summary.bias),
        ]
      : allEvents;
  const displayEvents = ordered.slice(0, 4);

  return (
    <section className="bg-surface-container-low p-5 flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
          Signal Logic
        </h2>
        <span className="text-[9px] text-on-surface-variant font-bold tracking-wider">
          {pair.display} · MTF
        </span>
      </div>

      {/* Per-TF alignment pills */}
      <div className="flex items-center gap-2 mb-5">
        {slices.map((s) => {
          const sliceBias = s.report?.bias ?? "neutral";
          const color = BIAS_COLORS[sliceBias];
          return (
            <div
              key={s.key}
              className="flex items-center gap-1.5 bg-surface-container px-2 py-1 flex-1"
              title={`${s.label}: ${sliceBias} ${s.report?.confidence ?? 0}%`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
              <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">
                {s.label}
              </span>
              <span
                className={`ml-auto text-[10px] font-mono tabular-nums ${color.text}`}
              >
                {s.report?.confidence ?? 0}
              </span>
            </div>
          );
        })}
      </div>

      <div className="space-y-4 flex-1">
        {loading && displayEvents.length === 0 ? (
          <p className="text-xs text-on-surface-variant">
            Analyzing {pair.display} across 1H · 4H · 1D...
          </p>
        ) : displayEvents.length === 0 ? (
          <p className="text-xs text-on-surface-variant">
            No significant signals detected.
          </p>
        ) : (
          displayEvents.map((event) => {
            const color = BIAS_COLORS[event.bias];
            return (
              <div key={`${event.tf}-${event.id}`} className="flex gap-4 group">
                <div
                  className={`w-1 h-auto ${color.bar} group-hover:brightness-125 transition-colors shrink-0`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xs font-bold text-on-surface uppercase tracking-tight truncate">
                      {event.label}
                    </h3>
                    <span className="text-[9px] font-mono text-on-surface-variant tracking-wider uppercase shrink-0">
                      {event.tf}
                    </span>
                  </div>
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
          <span className="text-[10px] font-mono text-on-surface-variant">
            {confidence}%
          </span>
        </div>
        <span
          className={`text-xl font-heading font-black ${biasColor.text} uppercase italic`}
        >
          {biasHeadline(summary).toUpperCase()}
        </span>
      </div>
    </section>
  );
}
