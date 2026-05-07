"use client";

import { PriceChart } from "@/components/dashboard/price-chart";
import { OrderBook } from "@/components/dashboard/order-book";
import { OpenPositions } from "@/components/dashboard/open-positions";
import { TradeExecution } from "@/components/dashboard/trade-execution";
import { RiskControl } from "@/components/dashboard/risk-control";
import { SignalLogic } from "@/components/dashboard/signal-logic";
import { AlertCenter } from "@/components/dashboard/alert-center";
import { Watchlist } from "@/components/dashboard/watchlist";

// Workspace #1 — original fixed grid layout. Kept as-is so the default
// experience is unchanged when users don't opt into the freeform layout.
export function Workspace1() {
  return (
    <div className="grid grid-cols-12 gap-3 lg:gap-6">
      {/* Mobile-only: Trade Execution pinned near the top */}
      <div className="col-span-12 xl:hidden order-1">
        <TradeExecution />
      </div>

      {/* Left Col: Watchlist, Risk, Signal, Alerts */}
      <div className="col-span-12 xl:col-span-3 flex flex-col gap-3 lg:gap-6 order-3 xl:order-1">
        <Watchlist />
        <RiskControl />
        <SignalLogic />
        <AlertCenter />
      </div>

      {/* Middle Col: Chart + Open Positions */}
      <div className="col-span-12 xl:col-span-6 flex flex-col gap-3 lg:gap-6 order-2 xl:order-2">
        <div className="flex flex-col h-[420px] md:h-[460px] xl:h-[500px] 2xl:h-[560px]">
          <PriceChart />
        </div>
        <OpenPositions />
      </div>

      {/* Right Col on xl+: Order Book & Execution */}
      <div className="hidden xl:flex xl:col-span-3 flex-col gap-6 order-3">
        <OrderBook />
        <TradeExecution />
      </div>

      {/* Tablet/mobile: Order Book as its own row */}
      <div className="col-span-12 xl:hidden order-4">
        <OrderBook />
      </div>
    </div>
  );
}
