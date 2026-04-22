import { PriceChart } from "@/components/dashboard/price-chart";
import { OrderBook } from "@/components/dashboard/order-book";
import { OpenPositions } from "@/components/dashboard/open-positions";
import { TradeExecution } from "@/components/dashboard/trade-execution";
import { RiskControl } from "@/components/dashboard/risk-control";
import { SignalLogic } from "@/components/dashboard/signal-logic";
import { PositionMonitor } from "@/components/dashboard/position-monitor";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Renderless: auto-closes positions when SL/TP is hit */}
      <PositionMonitor />

      {/* Left Col: Risk & Analysis (3 cols, stacks on mobile) */}
      <div className="col-span-12 xl:col-span-3 flex flex-col gap-6">
        <RiskControl />
        <SignalLogic />
      </div>

      {/* Middle Col: Chart + Open Positions (6 cols on xl, 9 on lg) */}
      <div className="col-span-12 lg:col-span-9 xl:col-span-6 flex flex-col gap-6">
        {/* Main Chart Area */}
        <div className="flex-1 min-h-[400px]">
          <PriceChart />
        </div>

        {/* Open Positions */}
        <OpenPositions />
      </div>

      {/* Right Col: Order Book & Execution (3 cols, hidden below xl) */}
      <div className="hidden xl:flex col-span-3 flex-col gap-6">
        <OrderBook />
        <TradeExecution />
      </div>
    </div>
  );
}
