"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useJournal } from "@/hooks/use-journal";
import { useAccount } from "@/hooks/use-account";
import { buildEquityCurve } from "@/lib/analytics";
import { formatUsd, formatPct } from "@/lib/format";

export function EquityCurve() {
  const { entries, loading } = useJournal();
  const { startingBalance } = useAccount();

  const curve = buildEquityCurve(entries, startingBalance);

  // Always prepend the starting point so the line has a visible origin
  const data = [
    {
      date: "Start",
      equity: startingBalance,
    },
    ...curve.map((point) => ({
      date: new Date(point.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      equity: point.equity,
    })),
  ];

  const firstEquity = startingBalance;
  const lastEquity =
    curve.length > 0 ? curve[curve.length - 1].equity : startingBalance;
  const totalChange = lastEquity - firstEquity;
  const totalChangePct =
    firstEquity > 0 ? (totalChange / firstEquity) * 100 : 0;

  const isUp = totalChange >= 0;
  const lineColor = isUp ? "#50c878" : "#ff716c";
  const gradientId = isUp ? "equityUp" : "equityDown";

  return (
    <div className="bg-surface-container-low p-3 lg:p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">
          Equity Curve
        </h3>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-on-surface-variant">STARTING:</span>
          <span className="font-mono tabular-nums text-on-surface">
            {formatUsd(firstEquity)}
          </span>
          <span className="text-on-surface-variant mx-1">→</span>
          <span
            className={`font-mono tabular-nums ${
              isUp ? "text-emerald-accent" : "text-crimson"
            }`}
          >
            {formatUsd(lastEquity)}
          </span>
          <span className={isUp ? "text-emerald-accent" : "text-crimson"}>
            ({formatPct(totalChangePct, { signed: true })})
          </span>
        </div>
      </div>

      <div className="h-[200px] lg:h-[250px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-on-surface-variant">
            Loading equity curve...
          </div>
        ) : entries.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-on-surface-variant">
            No closed trades yet. Close a position to populate the curve.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(72,72,73,0.15)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#adaaab", fontSize: 9 }}
              />
              <YAxis
                domain={["dataMin - 100", "dataMax + 100"]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#adaaab", fontSize: 9 }}
                tickFormatter={(val) =>
                  val >= 1000 ? `$${(val / 1000).toFixed(1)}k` : `$${val.toFixed(0)}`
                }
                orientation="right"
                width={55}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#262627",
                  border: "none",
                  borderRadius: 0,
                  fontSize: 11,
                  color: "#fff",
                }}
                formatter={(value) => [formatUsd(Number(value)), "Equity"]}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke={lineColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
