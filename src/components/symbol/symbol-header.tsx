"use client";

import { AnimatedPrice } from "@/components/ui/animated-price";
import { usePrice } from "@/components/providers/price-provider";
import { formatPct } from "@/lib/format";
import type { TradingPair } from "@/lib/symbols";
import type { CoinInfo } from "@/hooks/use-coin-info";

function compactUsd(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function Sparkline({ values }: { values: number[] }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 220;
  const h = 56;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`)
    .join(" ");
  const positive = values[values.length - 1] >= values[0];
  const stroke = positive ? "var(--emerald-accent)" : "var(--crimson-accent)";
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className="overflow-visible"
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SymbolHeader({
  pair,
  coin,
  loading,
}: {
  pair: TradingPair;
  coin: CoinInfo | null;
  loading: boolean;
}) {
  const { price, priceChangePercent24h } = usePrice();
  const change = priceChangePercent24h ?? coin?.market.priceChangePct.h24 ?? 0;
  const changePositive = change >= 0;

  return (
    <section className="bg-surface-container-low p-4 lg:p-6 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
      {/* Identity */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {coin?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coin.image}
            alt={coin.name}
            width={48}
            height={48}
            className="shrink-0 w-12 h-12"
          />
        ) : (
          <div className="w-12 h-12 bg-surface-container-high shrink-0" />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading text-2xl lg:text-3xl font-black tracking-tighter uppercase text-on-surface">
              {coin?.name || pair.base}
            </h1>
            <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">
              {pair.display}
            </span>
            {coin?.marketCapRank && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan bg-cyan/10 px-2 py-1">
                Rank #{coin.marketCapRank}
              </span>
            )}
          </div>
          <p className="text-[10px] text-on-surface-variant tracking-wider uppercase mt-1">
            {loading ? "Loading…" : coin?.categories.slice(0, 3).join(" · ") || "—"}
          </p>
        </div>
      </div>

      {/* Live price + change */}
      <div className="flex items-end gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
            Price
          </span>
          <AnimatedPrice
            value={price}
            size="lg"
            className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-on-surface"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
            24h
          </span>
          <span
            className={`text-lg lg:text-xl font-bold font-mono tabular-nums ${
              changePositive ? "text-emerald-accent" : "text-crimson"
            }`}
          >
            {formatPct(change, { signed: true })}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
            Mkt Cap
          </span>
          <span className="text-lg lg:text-xl font-bold font-mono tabular-nums text-on-surface">
            {coin ? compactUsd(coin.market.marketCapUsd) : "—"}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="hidden lg:flex flex-col items-end shrink-0">
        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">
          7d
        </span>
        <Sparkline values={coin?.market.sparkline7d ?? []} />
      </div>

    </section>
  );
}
