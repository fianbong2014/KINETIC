"use client";

import { Activity } from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import { useFundingRate } from "@/hooks/use-funding-rate";

export function MarketStats() {
  const { high24h, low24h, volume24h, priceChangePercent24h, symbol } =
    usePrice();
  const {
    fundingRate,
    loading: fundingLoading,
    unavailable: fundingUnavailable,
  } = useFundingRate(symbol);

  const fundingPct = fundingRate * 100;

  const stats = [
    {
      label: "24H CHANGE",
      value: `${priceChangePercent24h >= 0 ? "+" : ""}${priceChangePercent24h.toFixed(2)}%`,
      color: priceChangePercent24h >= 0 ? "text-emerald-accent" : "text-crimson",
    },
    {
      label: "24H HIGH",
      value:
        high24h > 0
          ? `$${high24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          : "---",
      color: "text-on-surface",
    },
    {
      label: "24H LOW",
      value:
        low24h > 0
          ? `$${low24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          : "---",
      color: "text-on-surface",
    },
    {
      label: "VOLUME 24H",
      value: volume24h > 0 ? `$${(volume24h / 1e9).toFixed(2)}B` : "---",
      color: "text-on-surface",
    },
    {
      label: "FUNDING",
      value: fundingLoading
        ? "---"
        : fundingUnavailable
          ? "SPOT ONLY"
          : `${fundingPct >= 0 ? "+" : ""}${fundingPct.toFixed(4)}%`,
      color: fundingUnavailable
        ? "text-on-surface-variant/60"
        : !fundingLoading && fundingPct >= 0
          ? "text-emerald-accent"
          : "text-crimson",
    },
    {
      label: "SYMBOL",
      value: symbol,
      color: "text-cyan",
    },
  ];

  return (
    <div className="bg-surface-container-low p-3 lg:p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">
          Market Overview
        </h3>
        <Activity className="w-3.5 h-3.5 text-on-surface-variant" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1">
            <span className="text-[10px] text-on-surface-variant">
              {stat.label}
            </span>
            <span
              className={`text-sm font-mono font-semibold tabular-nums ${stat.color}`}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
