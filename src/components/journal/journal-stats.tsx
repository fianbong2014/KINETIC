"use client";

import { TrendingUp, TrendingDown, Target, Percent } from "lucide-react";

const stats = [
  {
    label: "TOTAL TRADES",
    value: "142",
    icon: Target,
    sub: "Last 30 days",
  },
  {
    label: "WIN RATE",
    value: "68.3%",
    icon: Percent,
    sub: "97 wins / 45 losses",
    color: "text-emerald-accent",
  },
  {
    label: "TOTAL PNL",
    value: "+$34,820.45",
    icon: TrendingUp,
    sub: "Realized P&L",
    color: "text-emerald-accent",
  },
  {
    label: "AVG RRR",
    value: "1 : 2.8",
    icon: TrendingUp,
    sub: "Risk/Reward Ratio",
    color: "text-cyan",
  },
];

export function JournalStats() {
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
