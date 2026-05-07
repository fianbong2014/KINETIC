"use client";

import { useMemo, useState } from "react";
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

type Range = "1D" | "7D" | "ALL";

const RANGES: { id: Range; label: string; hours: number | null }[] = [
  { id: "1D", label: "1D", hours: 24 },
  { id: "7D", label: "7D", hours: 24 * 7 },
  { id: "ALL", label: "All", hours: null },
];

export function EquityCurve() {
  const { entries, loading } = useJournal();
  const { startingBalance } = useAccount();
  const [range, setRange] = useState<Range>("1D");

  const fullCurve = useMemo(
    () => buildEquityCurve(entries, startingBalance),
    [entries, startingBalance]
  );

  const { data, baselineEquity } = useMemo(() => {
    const cfg = RANGES.find((r) => r.id === range)!;

    if (cfg.hours === null) {
      // All-time view — original behavior, prepend starting balance.
      return {
        baselineEquity: startingBalance,
        data: [
          { ts: 0, label: "Start", equity: startingBalance },
          ...fullCurve.map((p) => ({
            ts: new Date(p.date).getTime(),
            label: formatTickAll(new Date(p.date)),
            equity: p.equity,
          })),
        ],
      };
    }

    // Time-windowed view. Find the equity *at* the cutoff (the last
    // closed-trade equity before the window starts) so the curve
    // begins from the correct origin instead of $startingBalance.
    const cutoff = Date.now() - cfg.hours * 3600 * 1000;
    let baseline = startingBalance;
    const inWindow: { ts: number; equity: number; date: Date }[] = [];

    for (const p of fullCurve) {
      const t = new Date(p.date).getTime();
      if (t < cutoff) {
        baseline = p.equity;
      } else {
        inWindow.push({ ts: t, equity: p.equity, date: new Date(p.date) });
      }
    }

    const formatLabel =
      cfg.hours <= 24 ? formatTick1D : formatTick7D;

    const points = [
      { ts: cutoff, label: formatLabel(new Date(cutoff)), equity: baseline },
      ...inWindow.map((p) => ({
        ts: p.ts,
        label: formatLabel(p.date),
        equity: p.equity,
      })),
      // Anchor the right edge to "now" so a flat tail is visible when
      // there have been no recent trades.
      {
        ts: Date.now(),
        label: formatLabel(new Date()),
        equity:
          inWindow.length > 0
            ? inWindow[inWindow.length - 1].equity
            : baseline,
      },
    ];

    return { baselineEquity: baseline, data: points };
  }, [fullCurve, range, startingBalance]);

  const lastEquity = data.length > 0 ? data[data.length - 1].equity : baselineEquity;
  const totalChange = lastEquity - baselineEquity;
  const totalChangePct =
    baselineEquity > 0 ? (totalChange / baselineEquity) * 100 : 0;

  const isUp = totalChange >= 0;
  const lineColor = isUp ? "#50c878" : "#ff716c";
  const gradientId = isUp ? "equityUp" : "equityDown";

  // Did this window have any actual trade activity?
  const hasActivity =
    range === "ALL"
      ? entries.length > 0
      : data.length > 2; // baseline + at least one trade + now-anchor

  return (
    <div className="bg-surface-container-low p-3 lg:p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">
          Equity Curve
        </h3>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant">START:</span>
            <span className="font-mono tabular-nums text-on-surface">
              {formatUsd(baselineEquity)}
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
      </div>

      {/* Range tabs */}
      <div
        role="tablist"
        aria-label="Equity curve range"
        className="inline-flex bg-surface-container border border-outline-variant/10 p-0.5 self-start"
      >
        {RANGES.map((r) => (
          <button
            key={r.id}
            role="tab"
            aria-selected={range === r.id}
            onClick={() => setRange(r.id)}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              range === r.id
                ? "bg-cyan/15 text-cyan"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {r.label}
          </button>
        ))}
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
        ) : !hasActivity ? (
          <div className="h-full flex items-center justify-center text-xs text-on-surface-variant text-center px-4">
            No trades closed in the last {range === "1D" ? "24 hours" : "7 days"}.
            <br />
            Switch to <span className="text-cyan font-bold">All</span> to see full history.
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
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#adaaab", fontSize: 9 }}
                minTickGap={20}
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

// 1D view — hours and minutes only (24h clock).
function formatTick1D(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// 7D view — short day + 24h time so multiple trades per day are
// distinguishable on the axis.
function formatTick7D(d: Date): string {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// All-time view — coarser month/day labels.
function formatTickAll(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
