"use client";

import { useJournal } from "@/hooks/use-journal";
import { groupByPair, groupByStrategy } from "@/lib/analytics";
import { formatUsd } from "@/lib/format";

const PAIR_COLORS = [
  "bg-cyan",
  "bg-orange",
  "bg-emerald-accent",
  "bg-[#a78bfa]",
  "bg-crimson",
];

export function PerformanceBreakdown() {
  const { entries, loading } = useJournal();
  const pairPerformance = groupByPair(entries);
  const strategyPerformance = groupByStrategy(entries);

  if (loading) {
    return (
      <div className="bg-surface-container-low p-3 lg:p-4 text-xs text-on-surface-variant text-center">
        Loading performance breakdown...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-surface-container-low p-3 lg:p-4 text-xs text-on-surface-variant text-center">
        No trades yet. Close a position to see performance breakdown.
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-1">
      {/* By Pair */}
      <div className="flex-1 bg-surface-container-low p-3 lg:p-4 flex flex-col gap-3">
        <h3 className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">
          Performance by Pair
        </h3>
        <div className="flex flex-col gap-2">
          {pairPerformance.map((item, i) => (
            <div key={item.pair} className="flex items-center gap-3">
              <span className="text-xs font-medium text-on-surface w-16 shrink-0">
                {item.pair}
              </span>
              <div className="flex-1 h-5 bg-surface-container-highest relative">
                <div
                  className={`h-full ${PAIR_COLORS[i % PAIR_COLORS.length]} opacity-30`}
                  style={{ width: `${Math.min(100, item.winRate)}%` }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-[10px] font-mono tabular-nums text-on-surface">
                  {item.winRate.toFixed(0)}% WR | {item.trades} trades
                </span>
              </div>
              <span
                className={`text-xs font-mono tabular-nums w-20 text-right shrink-0 ${
                  item.pnl >= 0 ? "text-emerald-accent" : "text-crimson"
                }`}
              >
                {formatUsd(item.pnl, { signed: true })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* By Strategy */}
      <div className="flex-1 bg-surface-container-low p-3 lg:p-4 flex flex-col gap-3">
        <h3 className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">
          Performance by Strategy
        </h3>
        <div className="grid grid-cols-4 text-[10px] text-on-surface-variant mb-1">
          <span>STRATEGY</span>
          <span className="text-right">TRADES</span>
          <span className="text-right">WIN RATE</span>
          <span className="text-right">AVG RRR</span>
        </div>
        <div className="flex flex-col gap-[2px]">
          {strategyPerformance.map((item) => (
            <div
              key={item.strategy}
              className="grid grid-cols-4 text-xs py-1.5 hover:bg-surface-container-high transition-colors"
            >
              <span className="text-on-surface text-[10px] truncate pr-2">
                {item.strategy}
              </span>
              <span className="text-right font-mono tabular-nums text-on-surface-variant">
                {item.trades}
              </span>
              <span
                className={`text-right font-mono tabular-nums ${
                  item.winRate >= 70
                    ? "text-emerald-accent"
                    : item.winRate >= 50
                      ? "text-cyan"
                      : "text-orange"
                }`}
              >
                {item.winRate.toFixed(0)}%
              </span>
              <span className="text-right font-mono tabular-nums text-cyan">
                {item.avgRrr ? `1:${item.avgRrr.toFixed(1)}` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
