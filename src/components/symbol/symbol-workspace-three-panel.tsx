"use client";

import type { TradingPair } from "@/lib/symbols";
import type { CoinInfo } from "@/hooks/use-coin-info";
import { OrderBook } from "@/components/dashboard/order-book";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { SymbolChart } from "./symbol-chart";
import {
  PerformanceCard,
  MarketCard,
  SupplyCard,
} from "./symbol-stats";
import { FundingCard } from "./symbol-trading";
import { SymbolAbout } from "./symbol-about";
import { SymbolDerivatives } from "./symbol-derivatives";
import { SymbolTA } from "./symbol-ta";
import { SymbolCompare } from "./symbol-compare";
import { SymbolTvl } from "./symbol-tvl";
import { SymbolNewsWiki } from "./symbol-news-wiki";

// ─── Three-panel layout (Workspace 2) ─────────────────────────────────
//
// Bloomberg-style cockpit. The top zone keeps Stats, Chart+TA, and the
// live trading rail visible side-by-side so a trader can monitor numbers,
// price action and order flow simultaneously. Long-tail info content
// (derivatives, about, news, compare, TVL) is stacked full-width BELOW
// the cockpit so each card has full breathing room.
//
//  ┌─ L 3/12 ┬─ M 6/12 ────────┬─ R 3/12 ┐
//  │ Perf    │ Chart           │ Funding │
//  │ Market  │ TA Readout      │ OB      │
//  │ Supply  │                 │ Trades  │
//  └─────────┴─────────────────┴─────────┘
//  [Derivatives — full width]
//  [About 2x2 — full width]
//  [News + Wiki — full width 2-col]
//  [Compare — full width 2-col]
//  [TVL — if L1]
//
// Below lg the cockpit collapses to a single column stack.
export function SymbolWorkspaceThreePanel({
  symbol,
  pair,
  coin,
  loading,
}: {
  symbol: string;
  pair: TradingPair;
  coin: CoinInfo | null;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 lg:gap-6">
      {/* ── Top cockpit (3 / 6 / 3) ──────────────────────────────── */}
      <div className="grid grid-cols-12 gap-3 lg:gap-6">
        {/* Left rail — quick numbers */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-3 lg:gap-6">
          <PerformanceCard coin={coin} loading={loading} />
          <MarketCard coin={coin} />
          <SupplyCard coin={coin} />
        </aside>

        {/* Center — visual + analysis */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-3 lg:gap-6">
          <SymbolChart symbol={symbol} />
          <SymbolTA symbol={symbol} />
        </section>

        {/* Right rail — live trading */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-3 lg:gap-6">
          <FundingCard symbol={symbol} />
          <OrderBook />
          <RecentTrades />
        </aside>
      </div>

      {/* ── Below cockpit: full-width info rows ─────────────────── */}
      <SymbolDerivatives symbol={symbol} />
      <SymbolAbout coin={coin} loading={loading} />
      <SymbolNewsWiki
        newsKeyword={pair.newsKeyword}
        wikipediaTitle={pair.wikipediaTitle}
      />
      <SymbolCompare symbol={symbol} />
      {pair.defillamaChain && <SymbolTvl chain={pair.defillamaChain} />}
    </div>
  );
}
