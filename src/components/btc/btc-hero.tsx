"use client";

import { useBtcTicker } from "@/hooks/use-btc-monitor";
import { formatPct, formatPrice } from "@/lib/format";

export function BtcHero() {
  const {
    price,
    priceChangePct,
    high24h,
    low24h,
    volume24h,
    quoteVolume24h,
    loading,
  } = useBtcTicker();

  const isUp = priceChangePct >= 0;
  const changeColor = isUp ? "text-emerald-accent" : "text-crimson";

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 p-4 lg:p-6 flex flex-col gap-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Bitcoin · BTCUSDT
          </p>
          <p className="font-heading text-3xl lg:text-5xl font-black tabular-nums text-on-surface mt-1">
            {loading || price === 0 ? "—" : `$${formatPrice(price)}`}
          </p>
        </div>
        <div className={`text-right ${changeColor}`}>
          <p className="text-xs font-bold tabular-nums">
            {loading ? "—" : formatPct(priceChangePct, { signed: true })}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
            24h Change
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="24H High" value={high24h ? `$${formatPrice(high24h)}` : "—"} />
        <Stat label="24H Low" value={low24h ? `$${formatPrice(low24h)}` : "—"} />
        <Stat
          label="Volume (BTC)"
          value={
            volume24h
              ? volume24h.toLocaleString("en-US", { maximumFractionDigits: 0 })
              : "—"
          }
        />
        <Stat
          label="Volume (USD)"
          value={
            quoteVolume24h
              ? `$${(quoteVolume24h / 1e9).toFixed(2)}B`
              : "—"
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
