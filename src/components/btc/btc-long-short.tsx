"use client";

import { useLongShortRatio } from "@/hooks/use-btc-monitor";
import { WidgetCard } from "./btc-funding";

export function BtcLongShort() {
  const { longPct, shortPct, ratio, loading } = useLongShortRatio();

  return (
    <WidgetCard title="Long / Short" subtitle="Global Accounts · 5m">
      {loading ? (
        <p className="text-xs text-on-surface-variant">Loading…</p>
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <p className="font-heading text-2xl font-black tabular-nums text-on-surface">
              {ratio.toFixed(2)}
            </p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              L/S Ratio
            </p>
          </div>

          {/* Bar visualization */}
          <div className="flex h-3 mt-3 overflow-hidden">
            <div
              className="bg-emerald-accent flex items-center justify-start pl-1.5"
              style={{ width: `${longPct}%` }}
            >
              <span className="text-[8px] font-bold text-[#003a1c]">
                {longPct.toFixed(1)}%
              </span>
            </div>
            <div
              className="bg-crimson flex items-center justify-end pr-1.5"
              style={{ width: `${shortPct}%` }}
            >
              <span className="text-[8px] font-bold text-[#3a0000]">
                {shortPct.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px] font-bold">
            <span className="text-emerald-accent">LONG</span>
            <span className="text-crimson">SHORT</span>
          </div>
        </>
      )}
    </WidgetCard>
  );
}
