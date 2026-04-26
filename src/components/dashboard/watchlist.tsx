"use client";

import { useState } from "react";
import { Eye, ArrowUpDown } from "lucide-react";
import { useWatchlist, type WatchlistRow } from "@/hooks/use-watchlist";
import { usePrice } from "@/components/providers/price-provider";
import { formatPrice } from "@/lib/format";
import type { SignalBias } from "@/lib/signal-engine";

type SortKey = "change" | "volume" | "confidence" | "default";

const BIAS_DOT: Record<string, string> = {
  bullish: "bg-emerald-accent",
  bearish: "bg-crimson",
  neutral: "bg-on-surface-variant/40",
  loading: "bg-on-surface-variant/20 animate-pulse",
};

function dotClass(bias: SignalBias | null): string {
  if (bias === null) return BIAS_DOT.loading;
  return BIAS_DOT[bias];
}

function sortRows(rows: WatchlistRow[], key: SortKey): WatchlistRow[] {
  if (key === "default") return rows;
  const copy = [...rows];
  copy.sort((a, b) => {
    if (key === "change") return Math.abs(b.changePct) - Math.abs(a.changePct);
    if (key === "volume") return b.volume24h - a.volume24h;
    if (key === "confidence") {
      return (b.confidence ?? 0) - (a.confidence ?? 0);
    }
    return 0;
  });
  return copy;
}

export function Watchlist() {
  const { rows, loading } = useWatchlist();
  const { symbol, setSymbol } = usePrice();
  const [sortKey, setSortKey] = useState<SortKey>("default");

  const sorted = sortRows(rows, sortKey);

  return (
    <section className="bg-surface-container-low p-4 lg:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            Watchlist
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <SortButton
            active={sortKey === "default"}
            onClick={() => setSortKey("default")}
            label="Default"
          />
          <SortButton
            active={sortKey === "change"}
            onClick={() => setSortKey("change")}
            label="±%"
          />
          <SortButton
            active={sortKey === "confidence"}
            onClick={() => setSortKey("confidence")}
            label="Conf"
          />
        </div>
      </div>

      {/* Header row */}
      <div className="hidden sm:grid grid-cols-[1fr_70px_60px_70px_30px] text-[9px] text-on-surface-variant tracking-widest uppercase font-bold gap-2 px-1">
        <span>Pair</span>
        <span className="text-right">Price</span>
        <span className="text-right">24h%</span>
        <span className="text-center">1H · 4H · 1D</span>
        <span className="text-right">→</span>
      </div>

      <div className="flex flex-col gap-0.5">
        {sorted.map((row) => (
          <WatchlistRowCmp
            key={row.pair.symbol}
            row={row}
            isActive={row.pair.symbol === symbol}
            onSelect={() => setSymbol(row.pair.symbol)}
          />
        ))}
      </div>

      {loading && (
        <p className="text-[10px] text-on-surface-variant text-center pt-1 tracking-widest uppercase">
          Loading multi-TF analysis…
        </p>
      )}
    </section>
  );
}

function WatchlistRowCmp({
  row,
  isActive,
  onSelect,
}: {
  row: WatchlistRow;
  isActive: boolean;
  onSelect: () => void;
}) {
  const positive = row.changePct >= 0;
  const changeColor = positive ? "text-emerald-accent" : "text-crimson";

  return (
    <button
      onClick={onSelect}
      className={`grid grid-cols-[1fr_70px_60px_70px_30px] items-center gap-2 px-1 py-2 text-left transition-colors ${
        isActive
          ? "bg-cyan/10 hover:bg-cyan/15"
          : "hover:bg-surface-container"
      }`}
    >
      {/* Pair */}
      <div className="flex flex-col min-w-0">
        <span
          className={`text-xs font-bold tracking-wider ${
            isActive ? "text-cyan" : "text-on-surface"
          }`}
        >
          {row.pair.display}
        </span>
        <span className="text-[9px] text-on-surface-variant tabular-nums">
          Vol{" "}
          {row.volume24h > 0
            ? `$${(row.volume24h / 1_000_000).toFixed(1)}M`
            : "—"}
        </span>
      </div>

      {/* Price */}
      <span className="text-xs font-mono tabular-nums text-on-surface text-right">
        {row.price > 0 ? `$${formatPrice(row.price)}` : "—"}
      </span>

      {/* 24h % */}
      <span
        className={`text-xs font-mono tabular-nums font-bold text-right ${changeColor}`}
      >
        {row.price > 0
          ? `${positive ? "+" : ""}${row.changePct.toFixed(2)}%`
          : "—"}
      </span>

      {/* MTF dots + composite confidence */}
      <div className="flex items-center justify-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotClass(row.mtf["1h"])}`}
          title="1H"
        />
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotClass(row.mtf["4h"])}`}
          title="4H"
        />
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotClass(row.mtf["1d"])}`}
          title="1D"
        />
        {row.confidence !== null && (
          <span className="text-[9px] font-mono tabular-nums text-on-surface-variant ml-1">
            {row.confidence}
          </span>
        )}
      </div>

      {/* Active indicator */}
      <span className="text-[10px] text-on-surface-variant text-right">
        {isActive ? "●" : "›"}
      </span>
    </button>
  );
}

function SortButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase transition-colors ${
        active
          ? "bg-surface-container-highest text-cyan"
          : "text-on-surface-variant hover:text-on-surface"
      }`}
    >
      <ArrowUpDown className="w-2.5 h-2.5" />
      {label}
    </button>
  );
}
