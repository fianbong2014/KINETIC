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
import {
  AboutCard,
  CommunityCard,
  DeveloperCard,
  ResourcesCard,
} from "./symbol-about";
import { NewsCard, WikipediaCard } from "./symbol-news-wiki";
import { WatchlistHeatmap, CorrelationCard } from "./symbol-compare";
import { SymbolDerivatives } from "./symbol-derivatives";
import { SymbolTA } from "./symbol-ta";
import { SymbolTvl } from "./symbol-tvl";

// ─── Info-Browse layout (Workspace 1) ─────────────────────────────────
//
// Dense 12-column magazine grid — designed for someone landing here to
// LEARN about a coin, not place trades. Every row uses horizontal space
// instead of stacking full-width, so a normal viewport sees ~4-5 rows of
// information without scrolling.
//
// Reading flow:
//   Row 1  Chart (8) · Performance (4)        — what does the price do?
//   Row 2  Market (4) · Supply (4) · Funding (4) — key numbers at a glance
//   Row 3  About (6) · Wikipedia (6)          — what *is* this coin?
//   Row 4  News (12)                          — what's happening right now?
//   Row 5  Community (4) · Developer (4) · Resources (4) — social proof + links
//   Row 6  Watchlist Heatmap (8) · Correlation vs BTC (4) — how does it stand?
//   Row 7  DeFi TVL (12, only when L1 chain)  — ecosystem context
//   Row 8  Technical Read (12)                — for traders who scroll this far
//   Row 9  Derivatives Pack (12)              — futures-market sentiment
//   Row 10 Order Book (7) · Recent Trades (5) — microstructure, bottom of page
//
// Below sm the grid collapses to a single column stack automatically.
export function SymbolWorkspaceDefault({
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
  const hasCoin = coin !== null;

  return (
    <div className="grid grid-cols-12 gap-3 lg:gap-6">
      {/* Row 1 — Chart + Performance */}
      <div className="col-span-12 lg:col-span-8">
        <SymbolChart symbol={symbol} />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <PerformanceCard coin={coin} loading={loading} />
      </div>

      {/* Row 2 — Market · Supply · Funding */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <MarketCard coin={coin} />
      </div>
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <SupplyCard coin={coin} />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <FundingCard symbol={symbol} />
      </div>

      {/* Row 3 — About + Wikipedia (reading content side-by-side) */}
      {hasCoin && coin && (
        <div className="col-span-12 lg:col-span-6">
          <AboutCard coin={coin} />
        </div>
      )}
      {pair.wikipediaTitle && (
        <div className="col-span-12 lg:col-span-6">
          <WikipediaCard title={pair.wikipediaTitle} />
        </div>
      )}

      {/* Row 4 — News (full width — pulse of the world) */}
      {pair.newsKeyword && (
        <div className="col-span-12">
          <NewsCard keyword={pair.newsKeyword} />
        </div>
      )}

      {/* Row 5 — Community · Developer · Resources */}
      {hasCoin && coin && (
        <>
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <CommunityCard coin={coin} />
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <DeveloperCard coin={coin} />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <ResourcesCard coin={coin} />
          </div>
        </>
      )}

      {/* Row 6 — Watchlist heatmap + correlation */}
      <div className="col-span-12 lg:col-span-8">
        <WatchlistHeatmap active={symbol} />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <CorrelationCard symbol={symbol} />
      </div>

      {/* Row 7 — Ecosystem (L1 chains only) */}
      {pair.defillamaChain && (
        <div className="col-span-12">
          <SymbolTvl chain={pair.defillamaChain} />
        </div>
      )}

      {/* Row 8 — Technical Read */}
      <div className="col-span-12">
        <SymbolTA symbol={symbol} />
      </div>

      {/* Row 9 — Derivatives pack (its own 3-up grid) */}
      <div className="col-span-12">
        <SymbolDerivatives symbol={symbol} />
      </div>

      {/* Row 10 — Microstructure at the bottom */}
      <div className="col-span-12 lg:col-span-7">
        <OrderBook />
      </div>
      <div className="col-span-12 lg:col-span-5">
        <RecentTrades />
      </div>
    </div>
  );
}
