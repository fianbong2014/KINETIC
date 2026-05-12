"use client";

import { useFundingRate } from "@/hooks/use-funding-rate";
import { TrendingUp, TrendingDown } from "lucide-react";

export function BtcFunding() {
  const { fundingRate, nextFundingTime, loading } = useFundingRate("BTCUSDT");

  const pct = fundingRate * 100;
  const isPositive = pct >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const color = isPositive ? "text-emerald-accent" : "text-crimson";

  const timeLeftMs = nextFundingTime - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeftMs / 3_600_000));
  const minutesLeft = Math.max(
    0,
    Math.floor((timeLeftMs % 3_600_000) / 60_000)
  );

  // Interpret funding context
  const interpretation = isPositive
    ? "Longs paying shorts — bullish positioning skew"
    : "Shorts paying longs — bearish positioning skew";

  return (
    <WidgetCard title="Funding Rate" subtitle="Binance Perp">
      {loading ? (
        <p className="text-xs text-on-surface-variant">Loading…</p>
      ) : (
        <>
          <div className={`flex items-center gap-2 ${color}`}>
            <Icon size={20} />
            <p className="font-heading text-2xl font-black tabular-nums">
              {isPositive ? "+" : ""}
              {pct.toFixed(4)}%
            </p>
          </div>
          <p className="text-[10px] text-on-surface-variant mt-1">
            Annualized: {(pct * 3 * 365).toFixed(2)}%
          </p>
          <p className="text-[10px] text-on-surface mt-2 leading-relaxed">
            {interpretation}
          </p>
          {timeLeftMs > 0 && (
            <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant mt-3">
              NEXT FUNDING:{" "}
              <span className="text-cyan">
                {hoursLeft}h {minutesLeft}m
              </span>
            </p>
          )}
        </>
      )}
    </WidgetCard>
  );
}

export function WidgetCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/10 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[9px] text-on-surface-variant uppercase tracking-wider">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
