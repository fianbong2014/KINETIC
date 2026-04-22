import { PriceChart } from "@/components/dashboard/price-chart";
import { OrderBook } from "@/components/dashboard/order-book";
import { OpenPositions } from "@/components/dashboard/open-positions";
import { TradeExecution } from "@/components/dashboard/trade-execution";
import { RiskControl } from "@/components/dashboard/risk-control";
import { SignalLogic } from "@/components/dashboard/signal-logic";
import { PositionMonitor } from "@/components/dashboard/position-monitor";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-12 gap-3 lg:gap-6">
      {/* Renderless: auto-closes positions when SL/TP is hit */}
      <PositionMonitor />

      {/* Mobile-only: Trade Execution pinned near the top so users can place
          orders without scrolling past the chart. */}
      <div className="col-span-12 xl:hidden order-1">
        <TradeExecution />
      </div>

      {/* Left Col: Risk & Signal Analysis */}
      <div className="col-span-12 xl:col-span-3 flex flex-col gap-3 lg:gap-6 order-3 xl:order-1">
        <RiskControl />
        <SignalLogic />
      </div>

      {/* Middle Col: Chart + Open Positions */}
      <div className="col-span-12 xl:col-span-6 flex flex-col gap-3 lg:gap-6 order-2 xl:order-2">
        <div className="flex-1 min-h-[360px] lg:min-h-[400px]">
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
