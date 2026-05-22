"use client";

import { BarChart3, Coins, TrendingUp } from "lucide-react";
import { formatPct } from "@/lib/format";
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

function compactNum(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toISOString().split("T")[0];
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof BarChart3;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-cyan" />
      <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
        {title}
      </h2>
    </div>
  );
}

function PctCell({ value }: { value: number | null }) {
  if (value === null || !Number.isFinite(value)) {
    return <span className="text-on-surface-variant font-mono">—</span>;
  }
  const color = value >= 0 ? "text-emerald-accent" : "text-crimson";
  return (
    <span className={`font-mono tabular-nums font-bold ${color}`}>
      {formatPct(value, { signed: true })}
    </span>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container px-3 py-2.5 flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      <span className="text-sm text-on-surface font-mono tabular-nums">
        {value}
      </span>
    </div>
  );
}

// ─── Sub-cards exposed for fine-grained layout composition ────────────

export function PerformanceCard({
  coin,
  loading,
}: {
  coin: CoinInfo | null;
  loading: boolean;
}) {
  const pc = coin?.market.priceChangePct;
  const skeleton = !coin && loading;
  return (
    <section className="bg-surface-container-low p-5">
      <SectionTitle icon={TrendingUp} title="Performance" />
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["1H", pc?.h1 ?? null],
            ["24H", pc?.h24 ?? null],
            ["7D", pc?.d7 ?? null],
            ["14D", pc?.d14 ?? null],
            ["30D", pc?.d30 ?? null],
            ["60D", pc?.d60 ?? null],
            ["200D", pc?.d200 ?? null],
            ["1Y", pc?.y1 ?? null],
          ] as const
        ).map(([label, v]) => (
          <div
            key={label}
            className="bg-surface-container px-3 py-2 flex items-center justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {label}
            </span>
            {skeleton ? (
              <span className="text-on-surface-variant font-mono">…</span>
            ) : (
              <PctCell value={v} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function MarketCard({ coin }: { coin: CoinInfo | null }) {
  const m = coin?.market;
  return (
    <section className="bg-surface-container-low p-5">
      <SectionTitle icon={BarChart3} title="Market" />
      <div className="grid grid-cols-1 gap-2">
        <Field label="Market Cap" value={compactUsd(m?.marketCapUsd ?? null)} />
        <Field
          label="Fully Diluted Val"
          value={compactUsd(m?.fdvUsd ?? null)}
        />
        <Field label="24h Volume" value={compactUsd(m?.volume24hUsd ?? null)} />
        <Field
          label="ATH"
          value={
            <span className="flex items-baseline gap-2">
              {compactUsd(m?.athUsd ?? null)}
              {m?.athChangePct !== null && m?.athChangePct !== undefined && (
                <span className="text-[10px]">
                  <PctCell value={m.athChangePct} />
                </span>
              )}
              <span className="text-[9px] text-on-surface-variant ml-auto">
                {formatDate(m?.athDate ?? null)}
              </span>
            </span>
          }
        />
        <Field
          label="ATL"
          value={
            <span className="flex items-baseline gap-2">
              {compactUsd(m?.atlUsd ?? null)}
              {m?.atlChangePct !== null && m?.atlChangePct !== undefined && (
                <span className="text-[10px]">
                  <PctCell value={m.atlChangePct} />
                </span>
              )}
              <span className="text-[9px] text-on-surface-variant ml-auto">
                {formatDate(m?.atlDate ?? null)}
              </span>
            </span>
          }
        />
      </div>
    </section>
  );
}

export function SupplyCard({ coin }: { coin: CoinInfo | null }) {
  const m = coin?.market;
  return (
    <section className="bg-surface-container-low p-5">
      <SectionTitle icon={Coins} title="Supply" />
      <div className="grid grid-cols-1 gap-2">
        <Field
          label="Circulating"
          value={compactNum(m?.circulatingSupply ?? null)}
        />
        <Field label="Total" value={compactNum(m?.totalSupply ?? null)} />
        <Field
          label="Max"
          value={
            m?.maxSupply === null || m?.maxSupply === undefined
              ? "∞"
              : compactNum(m.maxSupply)
          }
        />
        {m?.maxSupply &&
          m.circulatingSupply &&
          Number.isFinite(m.maxSupply) && (
            <div className="bg-surface-container px-3 py-2.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
                <span>Issued</span>
                <span className="text-on-surface font-mono">
                  {((m.circulatingSupply / m.maxSupply) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-surface-container-high">
                <div
                  className="h-full bg-cyan"
                  style={{
                    width: `${Math.min(100, (m.circulatingSupply / m.maxSupply) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
      </div>
    </section>
  );
}

// Composite — kept for the three-panel workspace.
export function SymbolStats({
  coin,
  loading,
}: {
  coin: CoinInfo | null;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
      <PerformanceCard coin={coin} loading={loading} />
      <MarketCard coin={coin} />
      <SupplyCard coin={coin} />
    </div>
  );
}
