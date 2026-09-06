"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Bot, CandlestickChart, FileText, LineChart, Shield } from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import { PriceChart } from "@/components/dashboard/price-chart";
import { Watchlist } from "@/components/dashboard/watchlist";
import { formatUsd } from "@/lib/format";

const tools = [
  { icon: CandlestickChart, label: "Advanced chart", description: "Indicators, drawings & saved layouts", href: "/chart" },
  { icon: LineChart, label: "Signal analysis", description: "Technical signals across timeframes", href: "/signals" },
  { icon: Bot, label: "Trading bots", description: "Manage automated strategies", href: "/bots" },
  { icon: Shield, label: "Risk management", description: "Exposure, limits & position sizing", href: "/risk" },
  { icon: FileText, label: "Trade journal", description: "Review trades & track performance", href: "/journal" },
];

export default function Home() {
  const { pair, price, high24h, low24h, priceChangePercent24h, isConnected } = usePrice();
  const positive = priceChangePercent24h >= 0;
  return (
    <div className="kx-enter mx-auto max-w-[1800px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="kx-eyebrow mb-2">YOUR WORKSPACE</p><h1 className="text-3xl font-medium tracking-[-0.045em] sm:text-4xl">Market overview<span className="text-cyan">.</span></h1><p className="mt-2 text-xs text-on-surface-variant sm:text-sm">Follow the market. Manage your next move.</p></div>
        <Link href="/dashboard" className="kx-primary-button">Open terminal<ArrowUpRight size={16} /></Link>
      </div>
      <section aria-label="Selected market" className="mb-6 grid grid-cols-2 gap-y-5 border-y border-border py-5 sm:grid-cols-4">
        <div><p className="kx-eyebrow">{pair.display}</p><p className="mt-2 text-2xl font-medium tracking-tight tabular-nums">{price > 0 ? formatUsd(price) : "—"}</p></div>
        <div className="pl-5 sm:border-l sm:border-border"><p className="kx-eyebrow">24h change</p><p className={`mt-2 flex items-center gap-1 text-xl tabular-nums ${positive ? "text-emerald-accent" : "text-crimson"}`}>{price > 0 ? <>{positive ? <ArrowUpRight size={19} /> : <ArrowDownRight size={19} />}{positive ? "+" : ""}{priceChangePercent24h.toFixed(2)}%</> : "—"}</p></div>
        <div className="sm:border-l sm:border-border sm:pl-5"><p className="kx-eyebrow">24h high</p><p className="mt-2 text-xl tabular-nums">{high24h > 0 ? formatUsd(high24h) : "—"}</p></div>
        <div className="pl-5 sm:border-l sm:border-border"><p className="kx-eyebrow">24h low</p><p className="mt-2 text-xl tabular-nums">{low24h > 0 ? formatUsd(low24h) : "—"}</p></div>
      </section>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-medium">Market activity</h2><span className="flex items-center gap-2 text-[10px] text-on-surface-variant"><span className={`size-1.5 rounded-full ${isConnected ? "bg-emerald-accent" : "bg-orange"}`} />{isConnected ? "Live feed" : "Connecting"}</span></div>
          <div className="kx-chart-frame flex h-[420px] min-w-0 flex-col overflow-hidden rounded-xl border border-border sm:h-[510px]"><PriceChart /></div>
          <div className="mt-4 flex items-center justify-between border-b border-border pb-4 text-xs"><span className="text-on-surface-variant">Explore Bitcoin market data and network activity</span><Link href="/btc" className="ml-4 flex shrink-0 items-center gap-2 text-cyan">BTC monitor<ArrowRight size={14} /></Link></div>
        </section>
        <aside className="min-w-0">
          <Watchlist />
          <h2 className="mb-2 mt-7 text-sm font-medium">Trading tools</h2>
          <div>{tools.map((item) => <Link key={item.href} href={item.href} className="kx-tool-link group flex items-center gap-3 border-b border-border py-4"><item.icon size={18} strokeWidth={1.6} className="shrink-0 text-on-surface-variant group-hover:text-cyan" /><div className="min-w-0 flex-1"><h3 className="text-xs font-medium">{item.label}</h3><p className="mt-1 text-[10px] text-on-surface-variant">{item.description}</p></div><ArrowUpRight size={14} className="text-on-surface-variant group-hover:text-cyan" /></Link>)}</div>
        </aside>
      </div>
    </div>
  );
}
