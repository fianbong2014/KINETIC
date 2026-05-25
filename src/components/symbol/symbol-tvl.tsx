"use client";

import { Layers } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { useTvl } from "@/hooks/use-tvl";
import { formatPct } from "@/lib/format";

function compactUsd(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}

export function SymbolTvl({ chain }: { chain: string }) {
  const { data, loading } = useTvl(chain);
  const change = data?.changePct30d ?? null;
  const up = (change ?? 0) >= 0;
  const color = up ? "var(--emerald-accent)" : "var(--crimson-accent)";

  return (
    <section className="bg-surface-container-low p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            DeFi TVL · {chain}
          </h2>
        </div>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
          DeFiLlama · 30d
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-on-surface-variant">Loading…</p>
      ) : !data || data.latestTvlUsd === null ? (
        <p className="text-xs text-on-surface-variant">No TVL data.</p>
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <p className="font-heading text-2xl font-black tabular-nums text-on-surface">
              {compactUsd(data.latestTvlUsd)}
            </p>
            {change !== null && (
              <span
                className={`text-sm font-mono tabular-nums font-bold ${
                  up ? "text-emerald-accent" : "text-crimson"
                }`}
              >
                {formatPct(change, { signed: true })}
              </span>
            )}
          </div>
          <div className="h-16 -mx-2">
            <ResponsiveContainer>
              <AreaChart data={data.history}>
                <defs>
                  <linearGradient id={`tvl-${chain}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-container-high)",
                    border: "none",
                    fontSize: 11,
                  }}
                  formatter={(v) => compactUsd(Number(v))}
                  labelFormatter={(t) =>
                    new Date(Number(t) * 1000).toISOString().split("T")[0]
                  }
                />
                <Area
                  type="monotone"
                  dataKey="tvl"
                  stroke={color}
                  strokeWidth={1.5}
                  fill={`url(#tvl-${chain})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
