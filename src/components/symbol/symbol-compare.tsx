"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Grid3X3, GitCompare } from "lucide-react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useKlines } from "@/hooks/use-klines";

function changeColor(pct: number): string {
  if (pct >= 5) return "bg-emerald-accent/40 text-on-surface";
  if (pct >= 2) return "bg-emerald-accent/25 text-emerald-accent";
  if (pct >= 0.5) return "bg-emerald-accent/12 text-emerald-accent";
  if (pct > -0.5) return "bg-surface-container text-on-surface-variant";
  if (pct > -2) return "bg-crimson/12 text-crimson";
  if (pct > -5) return "bg-crimson/25 text-crimson";
  return "bg-crimson/40 text-on-surface";
}

export function WatchlistHeatmap({ active }: { active: string }) {
  const { rows, loading } = useWatchlist();
  return (
    <section className="bg-surface-container-low p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            Watchlist Heatmap
          </h2>
        </div>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
          24h %
        </span>
      </div>
      {loading ? (
        <p className="text-xs text-on-surface-variant">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
          {rows.map((r) => {
            const isActive = r.pair.symbol === active;
            return (
              <Link
                key={r.pair.symbol}
                href={`/symbol/${r.pair.symbol}`}
                className={`px-3 py-3 flex flex-col gap-0.5 transition-colors ${changeColor(r.changePct)} ${
                  isActive ? "ring-1 ring-cyan" : ""
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                  {r.pair.base}
                </span>
                <span className="text-base font-mono tabular-nums font-bold">
                  {r.changePct >= 0 ? "+" : ""}
                  {r.changePct.toFixed(2)}%
                </span>
                <span className="text-[9px] opacity-70 tabular-nums">
                  Vol{" "}
                  {r.volume24h > 0
                    ? `$${(r.volume24h / 1e6).toFixed(0)}M`
                    : "—"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

// Pearson correlation on daily returns (not raw closes — returns are more
// meaningful for measuring co-movement of asset prices).
function pearsonReturns(a: number[], b: number[]): number | null {
  const len = Math.min(a.length, b.length);
  if (len < 5) return null;
  const ra: number[] = [];
  const rb: number[] = [];
  for (let i = 1; i < len; i++) {
    ra.push((a[i] - a[i - 1]) / a[i - 1]);
    rb.push((b[i] - b[i - 1]) / b[i - 1]);
  }
  const n = ra.length;
  const mean = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / n;
  const ma = mean(ra);
  const mb = mean(rb);
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = ra[i] - ma;
    const db = rb[i] - mb;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den > 0 ? num / den : null;
}

function corrTone(c: number): string {
  if (c >= 0.7) return "text-emerald-accent";
  if (c >= 0.3) return "text-on-surface";
  if (c >= -0.3) return "text-on-surface-variant";
  if (c >= -0.7) return "text-orange";
  return "text-crimson";
}

function corrLabel(c: number): string {
  if (c >= 0.7) return "Strong positive";
  if (c >= 0.3) return "Moderate positive";
  if (c >= -0.3) return "Decoupled";
  if (c >= -0.7) return "Moderate negative";
  return "Strong negative";
}

export function CorrelationCard({ symbol }: { symbol: string }) {
  const me = useKlines(symbol, "1d", 30);
  const btc = useKlines("BTCUSDT", "1d", 30);

  const corr = useMemo(() => {
    if (me.loading || btc.loading) return null;
    return pearsonReturns(
      me.candles.map((c) => c.close),
      btc.candles.map((c) => c.close),
    );
  }, [me, btc]);

  const isBtc = symbol === "BTCUSDT";

  return (
    <section className="bg-surface-container-low p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            Correlation
          </h2>
        </div>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
          vs BTC · 30d daily
        </span>
      </div>

      {isBtc ? (
        <p className="text-xs text-on-surface-variant">
          This is BTC — comparing against itself is always 1.00.
        </p>
      ) : corr === null ? (
        <p className="text-xs text-on-surface-variant">Computing…</p>
      ) : (
        <div className="flex items-center gap-4">
          <p
            className={`font-heading text-3xl font-black tabular-nums ${corrTone(corr)}`}
          >
            {corr.toFixed(2)}
          </p>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {corrLabel(corr)}
            </span>
            <div className="h-1.5 w-32 bg-surface-container-high relative">
              <div
                className="absolute top-0 bottom-0 bg-cyan"
                style={{
                  left: `${50 + Math.min(50, Math.max(-50, corr * 50))}%`,
                  width: 2,
                }}
              />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-on-surface-variant/30" />
            </div>
            <div className="flex justify-between text-[9px] text-on-surface-variant w-32 tabular-nums">
              <span>-1</span>
              <span>0</span>
              <span>+1</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function SymbolCompare({ symbol }: { symbol: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
      <WatchlistHeatmap active={symbol} />
      <CorrelationCard symbol={symbol} />
    </div>
  );
}
