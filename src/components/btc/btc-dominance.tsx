"use client";

import { useBtcDominance } from "@/hooks/use-btc-monitor";
import { WidgetCard } from "./btc-funding";
import { formatPct } from "@/lib/format";

export function BtcDominance() {
  const {
    btcDominance,
    ethDominance,
    totalMarketCapUsd,
    marketCapChange24h,
    loading,
  } = useBtcDominance();
  const otherDominance = Math.max(0, 100 - btcDominance - ethDominance);
  const totalTrillion = totalMarketCapUsd / 1e12;
  const isUp = marketCapChange24h >= 0;

  return (
    <WidgetCard title="BTC Dominance" subtitle="CoinGecko">
      {loading ? (
        <p className="text-xs text-on-surface-variant">Loading…</p>
      ) : (
        <>
          <p className="font-heading text-2xl font-black tabular-nums text-cyan">
            {btcDominance.toFixed(2)}%
          </p>
          <p className="text-[10px] text-on-surface-variant mt-1">
            of ${totalTrillion.toFixed(2)}T global market cap
          </p>

          {/* Stacked horizontal bar */}
          <div className="flex h-2 mt-3 overflow-hidden">
            <div
              className="bg-cyan"
              style={{ width: `${btcDominance}%` }}
              title={`BTC ${btcDominance.toFixed(1)}%`}
            />
            <div
              className="bg-on-surface-variant"
              style={{ width: `${ethDominance}%` }}
              title={`ETH ${ethDominance.toFixed(1)}%`}
            />
            <div
              className="bg-surface-container-high"
              style={{ width: `${otherDominance}%` }}
              title={`Other ${otherDominance.toFixed(1)}%`}
            />
          </div>

          <div className="grid grid-cols-3 text-[9px] mt-2 gap-1">
            <span className="text-cyan font-bold">
              BTC {btcDominance.toFixed(1)}%
            </span>
            <span className="text-on-surface-variant font-bold text-center">
              ETH {ethDominance.toFixed(1)}%
            </span>
            <span className="text-on-surface-variant font-bold text-right">
              Other {otherDominance.toFixed(1)}%
            </span>
          </div>

          <p
            className={`text-[10px] mt-3 font-bold ${
              isUp ? "text-emerald-accent" : "text-crimson"
            }`}
          >
            24H Market Cap: {formatPct(marketCapChange24h, { signed: true })}
          </p>
        </>
      )}
    </WidgetCard>
  );
}
