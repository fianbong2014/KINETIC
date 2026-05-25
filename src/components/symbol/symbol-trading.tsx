"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { OrderBook } from "@/components/dashboard/order-book";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { useFundingRate } from "@/hooks/use-funding-rate";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "—";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function FundingCard({ symbol }: { symbol: string }) {
  const { fundingRate, nextFundingTime, markPrice, loading, unavailable } =
    useFundingRate(symbol);

  // Tick state so the countdown to next funding refreshes once a minute —
  // computing Date.now() during render is impure (React Compiler rule).
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const ratePct = fundingRate * 100;
  const positive = fundingRate >= 0;
  const countdown =
    nextFundingTime > 0 ? formatCountdown(nextFundingTime - nowMs) : "—";

  return (
    <section className="bg-surface-container-low p-4 lg:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-cyan" />
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
          Perp Funding
        </h2>
        {loading && (
          <span className="text-[10px] text-cyan tracking-wider">…</span>
        )}
      </div>

      {unavailable ? (
        <p className="text-xs text-on-surface-variant">
          No perpetual futures market for this symbol on Binance.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Cell label="Funding Rate">
            <span
              className={`font-mono tabular-nums font-bold ${
                positive ? "text-emerald-accent" : "text-crimson"
              }`}
            >
              {loading ? "…" : `${positive ? "+" : ""}${ratePct.toFixed(4)}%`}
            </span>
          </Cell>
          <Cell label="Next In">
            <span className="font-mono tabular-nums text-on-surface">
              {countdown}
            </span>
          </Cell>
          <Cell label="Mark Price">
            <span className="font-mono tabular-nums text-on-surface">
              {loading ? "…" : `$${markPrice.toFixed(2)}`}
            </span>
          </Cell>
        </div>
      )}
    </section>
  );
}

function Cell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container px-3 py-2 flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

export function SymbolTrading({ symbol }: { symbol: string }) {
  // OrderBook / RecentTrades read the active pair from the global
  // PriceProvider, which SymbolPage already syncs to the URL symbol.
  return (
    <div className="flex flex-col gap-3 lg:gap-6">
      <FundingCard symbol={symbol} />
      <OrderBook />
      <RecentTrades />
    </div>
  );
}
