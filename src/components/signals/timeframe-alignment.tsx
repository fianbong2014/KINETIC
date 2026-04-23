"use client";

import { Layers, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import { useMultiTFReport } from "@/hooks/use-multi-tf-report";
import { biasHeadline } from "@/lib/multi-tf";
import type { SignalBias } from "@/lib/signal-engine";

const BIAS_STYLES: Record<
  SignalBias,
  { text: string; bg: string; border: string; Icon: typeof ArrowUp }
> = {
  bullish: {
    text: "text-emerald-accent",
    bg: "bg-emerald-accent/10",
    border: "border-emerald-accent/30",
    Icon: ArrowUp,
  },
  bearish: {
    text: "text-crimson",
    bg: "bg-crimson/10",
    border: "border-crimson/30",
    Icon: ArrowDown,
  },
  neutral: {
    text: "text-on-surface-variant",
    bg: "bg-surface-container-high",
    border: "border-outline-variant/20",
    Icon: Minus,
  },
};

const ALIGNMENT_LABEL: Record<string, string> = {
  aligned: "All timeframes agree",
  leaning: "Partial alignment",
  mixed: "Timeframes conflict",
  neutral: "No directional consensus",
};

export function TimeframeAlignment() {
  const { symbol } = usePrice();
  const { slices, summary } = useMultiTFReport(symbol);

  const summaryStyle = BIAS_STYLES[summary.bias];

  return (
    <div className="bg-surface-container-high p-4 lg:p-6">
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-on-surface-variant" />
          <h4 className="text-xs font-bold tracking-wider uppercase text-on-surface-variant">
            Multi-Timeframe Alignment
          </h4>
        </div>
        <div className={`px-3 py-1 ${summaryStyle.bg} ${summaryStyle.border} border`}>
          <span
            className={`text-[10px] font-black tracking-widest uppercase ${summaryStyle.text}`}
          >
            {biasHeadline(summary)} · {summary.confidence}%
          </span>
        </div>
      </div>

      {/* Per-timeframe cards */}
      <div className="grid grid-cols-3 gap-1 mb-4">
        {slices.map((slice) => {
          const bias = slice.report?.bias ?? "neutral";
          const confidence = slice.report?.confidence ?? 0;
          const style = BIAS_STYLES[bias];
          const { Icon } = style;
          return (
            <div
              key={slice.key}
              className={`p-3 flex flex-col items-center gap-1.5 ${style.bg} border ${style.border}`}
            >
              <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
                {slice.label}
              </span>
              <Icon className={`w-5 h-5 ${style.text}`} strokeWidth={2.5} />
              <span
                className={`text-xs font-black font-heading uppercase ${style.text}`}
              >
                {slice.loading
                  ? "…"
                  : bias === "neutral"
                    ? "Flat"
                    : bias === "bullish"
                      ? "Bull"
                      : "Bear"}
              </span>
              <span className="text-[10px] font-mono tabular-nums text-on-surface-variant">
                {slice.loading ? "—" : `${confidence}%`}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-on-surface-variant tracking-wider leading-relaxed">
        {ALIGNMENT_LABEL[summary.alignment]} · Weights grow with timeframe
        (1D &gt; 4H &gt; 1H)
      </p>

      {/* Per-timeframe top events */}
      <div className="mt-5 space-y-3">
        {slices.map((slice) => {
          if (!slice.report || slice.report.events.length === 0) return null;
          const style = BIAS_STYLES[slice.report.bias];
          return (
            <div key={`events-${slice.key}`} className="flex gap-3">
              <span
                className={`shrink-0 text-[10px] font-black tracking-widest uppercase ${style.text} w-8`}
              >
                {slice.label}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {slice.report.events.slice(0, 3).map((e) => {
                    const chipStyle = BIAS_STYLES[e.bias];
                    return (
                      <span
                        key={`${slice.key}-${e.id}`}
                        className={`text-[10px] ${chipStyle.text}`}
                      >
                        {e.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
