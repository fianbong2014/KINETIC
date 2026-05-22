"use client";

import { Globe2 } from "lucide-react";
import {
  useFearGreed,
  useBtcDominance,
} from "@/hooks/use-btc-monitor";
import { formatPct } from "@/lib/format";

function compactUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  return `$${n.toFixed(0)}`;
}

function fgiColor(v: number): string {
  if (v < 25) return "text-crimson";
  if (v < 45) return "text-orange";
  if (v < 55) return "text-on-surface-variant";
  if (v < 75) return "text-emerald-accent";
  return "text-emerald-accent";
}

function fgiLabel(v: number): string {
  if (v < 25) return "Extreme Fear";
  if (v < 45) return "Fear";
  if (v < 55) return "Neutral";
  if (v < 75) return "Greed";
  return "Extreme Greed";
}

function Tile({
  label,
  value,
  detail,
  detailClass,
}: {
  label: string;
  value: string;
  detail?: string;
  detailClass?: string;
}) {
  return (
    <div className="bg-surface-container px-3 py-2.5 flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      <span className="text-base font-mono tabular-nums text-on-surface">
        {value}
      </span>
      {detail && (
        <span
          className={`text-[10px] font-bold uppercase tracking-widest ${detailClass ?? "text-on-surface-variant"}`}
        >
          {detail}
        </span>
      )}
    </div>
  );
}

export function SymbolMacro() {
  const fgi = useFearGreed();
  const dom = useBtcDominance();
  const delta = fgi.yesterday !== null ? fgi.value - fgi.yesterday : null;

  return (
    <section className="bg-surface-container-low p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            Market Context
          </h2>
        </div>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
          Global · Live
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Tile
          label="Fear & Greed"
          value={fgi.loading ? "…" : `${fgi.value}`}
          detail={fgi.loading ? undefined : fgiLabel(fgi.value)}
          detailClass={fgiColor(fgi.value)}
        />
        <Tile
          label="FGI Δ 24h"
          value={delta === null ? "—" : (delta >= 0 ? `+${delta}` : `${delta}`)}
          detail="vs yesterday"
        />
        <Tile
          label="BTC Dom."
          value={dom.loading ? "…" : `${dom.btcDominance.toFixed(2)}%`}
          detail={
            dom.loading
              ? undefined
              : `ETH ${dom.ethDominance.toFixed(2)}%`
          }
        />
        <Tile
          label="Total Mkt Cap"
          value={dom.loading ? "…" : compactUsd(dom.totalMarketCapUsd)}
          detail={
            dom.loading
              ? undefined
              : `24h ${formatPct(dom.marketCapChange24h, { signed: true })}`
          }
          detailClass={
            dom.marketCapChange24h >= 0
              ? "text-emerald-accent"
              : "text-crimson"
          }
        />
      </div>
    </section>
  );
}
