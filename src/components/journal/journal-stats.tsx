"use client";

import { TrendingUp, Target, Percent } from "lucide-react";
import { useJournal } from "@/hooks/use-journal";
import { formatUsd } from "@/lib/format";

export function JournalStats() {
  const { entries, loading } = useJournal();

  // Calculate stats from real entries
  const totalTrades = entries.length;
  const wins = entries.filter((e) => e.pnl > 0);
  const losses = entries.filter((e) => e.pnl < 0);
  const winRate =
    totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
  const totalPnl = entries.reduce((sum, e) => sum + e.pnl, 0);

  const avgRrr =
    entries.length > 0
      ? (() => {
          // Parse "1:2.8" -> 2.8 and average
          const ratios = entries
            .map((e) => {
              const match = e.rrr.match(/1:([\d.]+)/);
              return match ? parseFloat(match[1]) : null;
            })
            .filter((n): n is number => n !== null);
          if (ratios.length === 0) return "—";
          const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
          return `1 : ${avg.toFixed(1)}`;
        })()
      : "—";

  const stats = [
    {
      label: "TOTAL TRADES",
      value: loading ? "—" : String(totalTrades),
      icon: Target,
      sub: "All time",
    },
    {
      label: "WIN RATE",
      value: loading ? "—" : `${winRate.toFixed(1)}%`,
      icon: Percent,
      sub: `${wins.length} wins / ${losses.length} losses`,
      color:
        winRate >= 50 ? "text-emerald-accent" : "text-crimson",
    },
    {
      label: "TOTAL PNL",
      value: loading
        ? "—"
        : formatUsd(totalPnl, { signed: true }),
      icon: TrendingUp,
      sub: "Realized P&L",
      color:
        totalPnl >= 0 ? "text-emerald-accent" : "text-crimson",
    },
    {
      label: "AVG RRR",
      value: loading ? "—" : avgRrr,
      icon: TrendingUp,
      sub: "Risk/Reward Ratio",
      color: "text-cyan",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
      {stats.map((stat) => (
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
          <span className="text-[10px] text-on-surface-variant">
            {stat.sub}
          </span>
        </div>
      ))}
    </div>
  );
}
