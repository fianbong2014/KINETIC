"use client";

import {
  TrendingUp,
  Target,
  Percent,
  Activity,
  TrendingDown,
  Zap,
} from "lucide-react";
import { useJournal } from "@/hooks/use-journal";
import { computeStats } from "@/lib/analytics";
import { formatUsd } from "@/lib/format";

export function JournalStats() {
  const { entries, loading } = useJournal();
  const s = computeStats(entries);

  const statGroups = [
    {
      label: "TOTAL TRADES",
      value: loading ? "—" : String(s.totalTrades),
      icon: Target,
      sub: `${s.wins} wins / ${s.losses} losses`,
    },
    {
      label: "WIN RATE",
      value: loading ? "—" : `${s.winRate.toFixed(1)}%`,
      icon: Percent,
      sub: `Expectancy ${formatUsd(s.expectancy, { signed: true })}`,
      color:
        s.winRate >= 50 ? "text-emerald-accent" : "text-crimson",
    },
    {
      label: "TOTAL PNL",
      value: loading ? "—" : formatUsd(s.totalPnl, { signed: true }),
      icon: TrendingUp,
      sub: `PF ${s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2)}`,
      color:
        s.totalPnl >= 0 ? "text-emerald-accent" : "text-crimson",
    },
    {
      label: "AVG RRR",
      value: loading ? "—" : s.avgRrr ? `1 : ${s.avgRrr.toFixed(2)}` : "—",
      icon: TrendingUp,
      sub: `Sharpe ${s.sharpe !== null ? s.sharpe.toFixed(2) : "—"}`,
      color: "text-cyan",
    },
    {
      label: "BEST TRADE",
      value: loading ? "—" : formatUsd(s.bestTrade, { signed: true }),
      icon: Zap,
      sub: `Avg win ${formatUsd(s.avgWin)}`,
      color: "text-emerald-accent",
    },
    {
      label: "WORST TRADE",
      value: loading ? "—" : formatUsd(s.worstTrade, { signed: true }),
      icon: TrendingDown,
      sub: `Avg loss ${formatUsd(s.avgLoss)}`,
      color: "text-crimson",
    },
    {
      label: "MAX DRAWDOWN",
      value: loading ? "—" : `${s.maxDrawdown.toFixed(2)}%`,
      icon: Activity,
      sub: "Peak to trough",
      color: s.maxDrawdown < -10 ? "text-crimson" : "text-orange",
    },
    {
      label: "PROFIT FACTOR",
      value: loading
        ? "—"
        : s.profitFactor === Infinity
          ? "∞"
          : s.profitFactor.toFixed(2),
      icon: Activity,
      sub: `${formatUsd(s.grossProfit)} / ${formatUsd(s.grossLoss)}`,
      color:
        s.profitFactor >= 1.5
          ? "text-emerald-accent"
          : s.profitFactor >= 1
            ? "text-cyan"
            : "text-crimson",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
      {statGroups.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface-container-low p-3 lg:p-4 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-on-surface-variant tracking-wider">
              {stat.label}
            </span>
            <stat.icon className="w-3.5 h-3.5 text-on-surface-variant" />
          </div>
          <span
            className={`text-lg lg:text-xl font-heading font-bold tabular-nums ${
              stat.color || "text-on-surface"
            }`}
          >
            {stat.value}
          </span>
          <span className="text-[10px] text-on-surface-variant truncate">
            {stat.sub}
          </span>
        </div>
      ))}
    </div>
  );
}
