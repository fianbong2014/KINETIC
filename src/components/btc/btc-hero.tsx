"use client";

import { useState } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { useBtcTicker } from "@/hooks/use-btc-monitor";
import { useBtcRange, type BtcRange } from "@/hooks/use-btc-range";
import { formatPct, formatPrice } from "@/lib/format";

const RANGES: { id: BtcRange; label: string }[] = [
  { id: "1D", label: "24H" },
  { id: "7D", label: "7D" },
  { id: "30D", label: "30D" },
];

export function BtcHero() {
  const [range, setRange] = useState<BtcRange>("1D");

  // Live ticker — always tracks the latest BTC price via WebSocket.
  const {
    price: livePrice,
    priceChangePct: live24hChange,
    volume24h,
    quoteVolume24h,
    loading: tickerLoading,
  } = useBtcTicker();

  // Range stats — drives the sparkline + H/L/change% for the selected window.
  const {
    candles,
    high,
    low,
    changePct: rangeChangePct,
    loading: rangeLoading,
  } = useBtcRange(range);

  // For the headline we show the live price (always real-time). The
  // change% reflects whichever range the user picked — 24h matches the
  // ticker, 7D/30D comes from klines.
  const headlineChange = range === "1D" ? live24hChange : rangeChangePct;
  const isUp = headlineChange >= 0;
  const changeColor = isUp ? "text-emerald-accent" : "text-crimson";
  const sparkColor = isUp ? "#50c878" : "#ff716c";

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 p-4 lg:p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Bitcoin · BTCUSDT
          </p>
          <p className="font-heading text-3xl lg:text-5xl font-black tabular-nums text-on-surface mt-1">
            {tickerLoading || livePrice === 0
              ? "—"
              : `$${formatPrice(livePrice)}`}
          </p>
        </div>
        <div className="flex items-start gap-4">
          <div className={`text-right ${changeColor}`}>
            <p className="text-xs font-bold tabular-nums">
              {rangeLoading && range !== "1D"
                ? "—"
                : formatPct(headlineChange, { signed: true })}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
              {range === "1D" ? "24h" : range === "7D" ? "7d" : "30d"} change
            </p>
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-[80px] lg:h-[100px] -mx-1">
        {candles.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[10px] text-on-surface-variant">
            {rangeLoading ? "Loading…" : "No data"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={candles}>
              <defs>
                <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={["dataMin", "dataMax"]} hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#262627",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 11,
                  padding: "6px 10px",
                }}
                formatter={(value) => [
                  `$${formatPrice(Number(value))}`,
                  "BTC",
                ]}
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload as
                    | { time: number }
                    | undefined;
                  if (!p) return "";
                  return new Date(p.time).toLocaleString();
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={sparkColor}
                strokeWidth={2}
                fill="url(#heroSpark)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Range tabs */}
      <div
        role="tablist"
        aria-label="Price range"
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

      {/* Stats — H/L reflect the selected range; volume always shows 24h
          (Binance only exposes a rolling 24h figure via the ticker). */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label={`${range === "1D" ? "24H" : range === "7D" ? "7D" : "30D"} High`}
          value={high > 0 ? `$${formatPrice(high)}` : "—"}
        />
        <Stat
          label={`${range === "1D" ? "24H" : range === "7D" ? "7D" : "30D"} Low`}
          value={low > 0 && Number.isFinite(low) ? `$${formatPrice(low)}` : "—"}
        />
        <Stat
          label="Volume (BTC) · 24H"
          value={
            volume24h
              ? volume24h.toLocaleString("en-US", { maximumFractionDigits: 0 })
              : "—"
          }
        />
        <Stat
          label="Volume (USD) · 24H"
          value={
            quoteVolume24h ? `$${(quoteVolume24h / 1e9).toFixed(2)}B` : "—"
          }
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums text-on-surface mt-0.5 font-mono">
        {value}
      </p>
    </div>
  );
}
