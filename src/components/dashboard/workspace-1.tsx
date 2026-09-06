"use client";
import { PriceChart } from "@/components/dashboard/price-chart";
import { OrderBook } from "@/components/dashboard/order-book";
import { OpenPositions } from "@/components/dashboard/open-positions";
import { TradeExecution } from "@/components/dashboard/trade-execution";
import { RiskControl } from "@/components/dashboard/risk-control";
import { SignalLogic } from "@/components/dashboard/signal-logic";
import { AlertCenter } from "@/components/dashboard/alert-center";
import { Watchlist } from "@/components/dashboard/watchlist";

export function Workspace1() {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="flex min-w-0 flex-col gap-4 xl:col-span-8 2xl:col-span-9">
        <div className="kx-chart-frame flex h-[420px] min-w-0 flex-col overflow-hidden rounded-xl border border-border md:h-[520px] 2xl:h-[600px]"><PriceChart /></div>
        <OpenPositions />
      </div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:col-span-4 xl:flex xl:flex-col 2xl:col-span-3">
        <TradeExecution /><OrderBook />
      </div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:col-span-12 2xl:grid-cols-4">
        <Watchlist /><RiskControl /><SignalLogic /><AlertCenter />
      </div>
    </div>
  );
}
