"use client";

import { useOpenInterest } from "@/hooks/use-btc-monitor";
import { WidgetCard } from "./btc-funding";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import { formatPct } from "@/lib/format";

export function BtcOpenInterest() {
  const { latest, history, changePct24h, loading } = useOpenInterest();
  const isUp = changePct24h >= 0;
  const color = isUp ? "#50c878" : "#ff716c";

  const oiUsdB = latest ? latest.oiUsd / 1e9 : 0;
  const oiBtc = latest?.oiBtc ?? 0;

  return (
    <WidgetCard title="Open Interest" subtitle="Binance Perp · 24h">
      {loading ? (
        <p className="text-xs text-on-surface-variant">Loading…</p>
      ) : (
        <>
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <p className="font-heading text-2xl font-black tabular-nums text-on-surface">
              ${oiUsdB.toFixed(2)}B
            </p>
            <p
              className={`text-xs font-bold tabular-nums ${
                isUp ? "text-emerald-accent" : "text-crimson"
              }`}
            >
              {formatPct(changePct24h, { signed: true })}
            </p>
          </div>
          <p className="text-[10px] text-on-surface-variant mt-1">
            {oiBtc.toLocaleString("en-US", { maximumFractionDigits: 0 })} BTC
            outstanding
          </p>

          <div className="h-[80px] mt-3 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="oiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis domain={["dataMin", "dataMax"]} hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#262627",
                    border: "none",
                    borderRadius: 0,
                    fontSize: 10,
                    padding: "4px 8px",
                  }}
                  formatter={(value) => [
                    `$${(Number(value) / 1e9).toFixed(2)}B`,
                    "OI",
                  ]}
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as
                      | { time: number }
                      | undefined;
                    if (!p) return "";
                    return new Date(p.time).toLocaleTimeString();
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="oiUsd"
                  stroke={color}
                  strokeWidth={1.5}
                  fill="url(#oiGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </WidgetCard>
  );
}
