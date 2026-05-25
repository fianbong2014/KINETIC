"use client";

import { Scale, TrendingUp, Activity } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import {
  useOpenInterestFor,
  useLongShortFor,
  useTakerBuySellFor,
} from "@/hooks/use-derivatives";
import { formatPct } from "@/lib/format";

function compactUsd(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function Card({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Scale;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface-container-low p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            {title}
          </h2>
        </div>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
          {subtitle}
        </span>
      </div>
      {children}
    </section>
  );
}

function LSBar({
  longPct,
  shortPct,
}: {
  longPct: number;
  shortPct: number;
}) {
  return (
    <div className="flex h-2 overflow-hidden">
      <div className="bg-emerald-accent" style={{ width: `${longPct}%` }} />
      <div className="bg-crimson" style={{ width: `${shortPct}%` }} />
    </div>
  );
}

function LongShortCard({ symbol }: { symbol: string }) {
  const ls = useLongShortFor(symbol);

  if (ls.unavailable) {
    return (
      <Card icon={Scale} title="Long / Short" subtitle="Spot-only">
        <p className="text-xs text-on-surface-variant">
          No futures market — long/short ratio unavailable.
        </p>
      </Card>
    );
  }

  return (
    <Card icon={Scale} title="Long / Short" subtitle="Binance · 5m">
      {ls.loading ? (
        <p className="text-xs text-on-surface-variant">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {/* Global accounts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
              <span>Global Accounts</span>
              <span className="text-on-surface font-mono">
                {ls.globalRatio.toFixed(2)}
              </span>
            </div>
            <LSBar longPct={ls.globalLongPct} shortPct={ls.globalShortPct} />
            <div className="flex justify-between text-[10px] font-mono tabular-nums">
              <span className="text-emerald-accent">
                {ls.globalLongPct.toFixed(1)}%
              </span>
              <span className="text-crimson">
                {ls.globalShortPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Top trader positions */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
              <span>Top Traders (Position)</span>
              <span className="text-on-surface font-mono">
                {ls.topRatio.toFixed(2)}
              </span>
            </div>
            <LSBar longPct={ls.topLongPct} shortPct={ls.topShortPct} />
            <div className="flex justify-between text-[10px] font-mono tabular-nums">
              <span className="text-emerald-accent">
                {ls.topLongPct.toFixed(1)}%
              </span>
              <span className="text-crimson">
                {ls.topShortPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function OpenInterestCard({ symbol }: { symbol: string }) {
  const oi = useOpenInterestFor(symbol);

  if (oi.unavailable) {
    return (
      <Card icon={TrendingUp} title="Open Interest" subtitle="Spot-only">
        <p className="text-xs text-on-surface-variant">
          No futures market for this asset.
        </p>
      </Card>
    );
  }

  if (oi.loading || !oi.latest) {
    return (
      <Card icon={TrendingUp} title="Open Interest" subtitle="Binance Perp · 24h">
        <p className="text-xs text-on-surface-variant">Loading…</p>
      </Card>
    );
  }

  const isUp = oi.changePct24h >= 0;
  const color = isUp ? "var(--emerald-accent)" : "var(--crimson-accent)";

  return (
    <Card icon={TrendingUp} title="Open Interest" subtitle="Binance Perp · 24h">
      <div className="flex items-baseline justify-between">
        <p className="font-heading text-2xl font-black tabular-nums text-on-surface">
          {compactUsd(oi.latest.oiUsd)}
        </p>
        <span
          className={`text-sm font-mono tabular-nums font-bold ${
            isUp ? "text-emerald-accent" : "text-crimson"
          }`}
        >
          {formatPct(oi.changePct24h, { signed: true })}
        </span>
      </div>

      <div className="h-16 -mx-2">
        <ResponsiveContainer>
          <AreaChart data={oi.history}>
            <defs>
              <linearGradient id="oi-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Tooltip
              contentStyle={{
                background: "var(--surface-container-high)",
                border: "none",
                fontSize: 11,
              }}
              formatter={(v) => compactUsd(Number(v))}
              labelFormatter={(t) => new Date(Number(t)).toLocaleTimeString()}
            />
            <Area
              type="monotone"
              dataKey="oiUsd"
              stroke={color}
              strokeWidth={1.5}
              fill="url(#oi-grad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function TakerCard({ symbol }: { symbol: string }) {
  const t = useTakerBuySellFor(symbol);

  if (t.unavailable) {
    return (
      <Card icon={Activity} title="Taker Buy / Sell" subtitle="Spot-only">
        <p className="text-xs text-on-surface-variant">
          No futures market for this asset.
        </p>
      </Card>
    );
  }

  const total = t.buyVol + t.sellVol;
  const buyPct = total > 0 ? (t.buyVol / total) * 100 : 50;
  const sellPct = 100 - buyPct;

  return (
    <Card icon={Activity} title="Taker Buy / Sell" subtitle="Binance · 5m">
      {t.loading ? (
        <p className="text-xs text-on-surface-variant">Loading…</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="font-heading text-2xl font-black tabular-nums text-on-surface">
              {t.ratio.toFixed(2)}
            </p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Buy / Sell
            </p>
          </div>
          <LSBar longPct={buyPct} shortPct={sellPct} />
          <div className="flex justify-between text-[10px] font-mono tabular-nums">
            <span className="text-emerald-accent">{buyPct.toFixed(1)}%</span>
            <span className="text-crimson">{sellPct.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </Card>
  );
}

export function SymbolDerivatives({ symbol }: { symbol: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
      <LongShortCard symbol={symbol} />
      <OpenInterestCard symbol={symbol} />
      <TakerCard symbol={symbol} />
    </div>
  );
}
