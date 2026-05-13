"use client";

import { useState } from "react";
import { Activity, BarChart3, Heart, Layers, Waves } from "lucide-react";

import { BtcHero } from "@/components/btc/btc-hero";
import { BtcFunding } from "@/components/btc/btc-funding";
import { BtcOpenInterest } from "@/components/btc/btc-open-interest";
import { BtcLongShort } from "@/components/btc/btc-long-short";
import { BtcFearGreed } from "@/components/btc/btc-fear-greed";
import { BtcDominance } from "@/components/btc/btc-dominance";
import { BtcMempool } from "@/components/btc/btc-mempool";
import { BtcLiquidations } from "@/components/btc/btc-liquidations";
import { BtcWhales } from "@/components/btc/btc-whales";

import { useBtcTicker } from "@/hooks/use-btc-monitor";
import { useFundingRate } from "@/hooks/use-funding-rate";
import {
  useOpenInterest,
  useLongShortRatio,
  useFearGreed,
} from "@/hooks/use-btc-monitor";
import { formatPct } from "@/lib/format";

// Google-style BTC monitor — Material 3-inspired tabbed layout with
// generous whitespace, sectioned content, and a quick-stats overview.

type Tab = "overview" | "derivatives" | "sentiment" | "onchain" | "flow";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] =
  [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "derivatives", label: "Derivatives", icon: BarChart3 },
    { id: "sentiment", label: "Sentiment", icon: Heart },
    { id: "onchain", label: "On-chain", icon: Activity },
    { id: "flow", label: "Flow", icon: Waves },
  ];

export function BtcWorkspaceGoogle() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <header className="flex items-baseline justify-between flex-wrap gap-3 px-1">
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-black text-on-surface">
            Bitcoin Monitor
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Real-time BTC market intelligence
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
          <span className="w-1.5 h-1.5 bg-emerald-accent pulse-glow" />
          <span className="font-bold uppercase tracking-widest">Live</span>
        </div>
      </header>

      {/* Material 3-style tab bar */}
      <nav
        role="tablist"
        aria-label="BTC monitor sections"
        className="flex items-end gap-1 border-b border-outline-variant/15 overflow-x-auto"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-xs font-medium tracking-wide whitespace-nowrap transition-colors ${
                active
                  ? "text-cyan"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon size={14} />
              {label}
              {active && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-cyan" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Tab content */}
      {tab === "overview" && <OverviewTab />}
      {tab === "derivatives" && <DerivativesTab />}
      {tab === "sentiment" && <SentimentTab />}
      {tab === "onchain" && <OnChainTab />}
      {tab === "flow" && <FlowTab />}
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="flex flex-col gap-6">
      <BtcHero />
      <QuickStatsRow />

      <Section title="Market Pulse" subtitle="Dominance & on-chain activity">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BtcDominance />
          <BtcMempool />
        </div>
      </Section>
    </div>
  );
}

function DerivativesTab() {
  return (
    <Section
      title="Perpetual Futures"
      subtitle="Binance USD-M · positioning & flow"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BtcFunding />
        <BtcLongShort />
      </div>
      <div className="mt-4">
        <BtcOpenInterest />
      </div>
    </Section>
  );
}

function SentimentTab() {
  return (
    <Section
      title="Market Sentiment"
      subtitle="Index-level positioning across crypto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BtcFearGreed />
        <BtcDominance />
      </div>
    </Section>
  );
}

function OnChainTab() {
  return (
    <Section
      title="Network Activity"
      subtitle="Bitcoin base layer · mempool & fees"
    >
      <BtcMempool />
    </Section>
  );
}

function FlowTab() {
  return (
    <Section
      title="Order Flow"
      subtitle="Liquidations & whale movements"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BtcLiquidations />
        <BtcWhales />
      </div>
    </Section>
  );
}

// ─── Building blocks ────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h2 className="text-sm font-bold tracking-wider uppercase text-on-surface">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] text-on-surface-variant">{subtitle}</p>
        )}
        <span className="flex-1 h-px bg-outline-variant/15" />
      </div>
      {children}
    </section>
  );
}

// Quick-stats row for the Overview tab — Material card-style with big
// numbers and small labels. Pulls live data inline.
function QuickStatsRow() {
  const { priceChangePct, loading: tickerLoading } = useBtcTicker();
  const { fundingRate, loading: fundingLoading } = useFundingRate("BTCUSDT");
  const { latest: oi, changePct24h, loading: oiLoading } = useOpenInterest();
  const { ratio, loading: lsLoading } = useLongShortRatio();
  const { value: fgValue, classification, loading: fgLoading } = useFearGreed();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <BigStat
        label="24h Change"
        value={
          tickerLoading
            ? "—"
            : formatPct(priceChangePct, { signed: true })
        }
        valueColor={priceChangePct >= 0 ? "text-emerald-accent" : "text-crimson"}
        hint="vs 24h ago"
      />
      <BigStat
        label="Funding"
        value={
          fundingLoading
            ? "—"
            : `${fundingRate >= 0 ? "+" : ""}${(fundingRate * 100).toFixed(3)}%`
        }
        valueColor={fundingRate >= 0 ? "text-emerald-accent" : "text-crimson"}
        hint="Binance perp"
      />
      <BigStat
        label="Open Interest"
        value={
          oiLoading || !oi
            ? "—"
            : `$${(oi.oiUsd / 1e9).toFixed(2)}B`
        }
        valueColor="text-on-surface"
        hint={
          oiLoading
            ? ""
            : `${formatPct(changePct24h, { signed: true })} 24h`
        }
        hintColor={changePct24h >= 0 ? "text-emerald-accent" : "text-crimson"}
      />
      <BigStat
        label="Long / Short"
        value={lsLoading ? "—" : ratio.toFixed(2)}
        valueColor={ratio >= 1 ? "text-emerald-accent" : "text-crimson"}
        hint={ratio >= 1 ? "longs > shorts" : "shorts > longs"}
      />
      <BigStat
        label="Fear & Greed"
        value={fgLoading ? "—" : String(fgValue)}
        valueColor="text-on-surface"
        hint={fgLoading ? "" : classification}
      />
    </div>
  );
}

function BigStat({
  label,
  value,
  valueColor,
  hint,
  hintColor,
}: {
  label: string;
  value: string;
  valueColor: string;
  hint: string;
  hintColor?: string;
}) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/10 p-4">
      <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <p
        className={`font-heading text-xl lg:text-2xl font-black tabular-nums mt-2 ${valueColor}`}
      >
        {value}
      </p>
      {hint && (
        <p
          className={`text-[10px] mt-1 ${
            hintColor || "text-on-surface-variant"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
