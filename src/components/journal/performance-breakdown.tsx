"use client";

const pairPerformance = [
  { pair: "BTC/USD", trades: 82, winRate: 71, pnl: "+$28,400", color: "bg-cyan" },
  { pair: "ETH/USD", trades: 38, winRate: 58, pnl: "+$3,220", color: "bg-orange" },
  { pair: "SOL/USD", trades: 22, winRate: 72, pnl: "+$3,200", color: "bg-emerald-accent" },
];

const strategyPerformance = [
  { strategy: "Liquidity Grab", trades: 34, winRate: 76, avgRrr: "1:3.4" },
  { strategy: "EMA Cross", trades: 28, winRate: 64, avgRrr: "1:2.1" },
  { strategy: "Supply/Demand", trades: 42, winRate: 69, avgRrr: "1:2.6" },
  { strategy: "Breakout", trades: 18, winRate: 72, avgRrr: "1:3.8" },
  { strategy: "Divergence", trades: 20, winRate: 60, avgRrr: "1:1.9" },
];

export function PerformanceBreakdown() {
  return (
    <div className="flex flex-col sm:flex-row gap-1">
      {/* By Pair */}
      <div className="flex-1 bg-surface-container-low p-3 lg:p-4 flex flex-col gap-3">
        <h3 className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">
          Performance by Pair
        </h3>
        <div className="flex flex-col gap-2">
          {pairPerformance.map((item) => (
            <div key={item.pair} className="flex items-center gap-3">
              <span className="text-xs font-medium text-on-surface w-16">
                {item.pair}
              </span>
              <div className="flex-1 h-5 bg-surface-container-highest relative">
                <div
                  className={`h-full ${item.color} opacity-30`}
                  style={{ width: `${item.winRate}%` }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-[10px] font-mono tabular-nums text-on-surface">
                  {item.winRate}% WR | {item.trades} trades
                </span>
              </div>
              <span
                className={`text-xs font-mono tabular-nums w-20 text-right ${
                  item.pnl.startsWith("+")
                    ? "text-emerald-accent"
                    : "text-crimson"
                }`}
              >
                {item.pnl}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* By Strategy */}
      <div className="flex-1 bg-surface-container-low p-3 lg:p-4 flex flex-col gap-3">
        <h3 className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">
          Performance by Strategy
        </h3>
        <div className="grid grid-cols-4 text-[10px] text-on-surface-variant mb-1">
          <span>STRATEGY</span>
          <span className="text-right">TRADES</span>
          <span className="text-right">WIN RATE</span>
          <span className="text-right">AVG RRR</span>
        </div>
        <div className="flex flex-col gap-[2px]">
          {strategyPerformance.map((item) => (
            <div
              key={item.strategy}
              className="grid grid-cols-4 text-xs py-1.5 hover:bg-surface-container-high transition-colors"
            >
              <span className="text-on-surface text-[10px]">
                {item.strategy}
              </span>
              <span className="text-right font-mono tabular-nums text-on-surface-variant">
                {item.trades}
              </span>
              <span
                className={`text-right font-mono tabular-nums ${
                  item.winRate >= 70
                    ? "text-emerald-accent"
                    : item.winRate >= 60
                    ? "text-cyan"
                    : "text-orange"
                }`}
              >
                {item.winRate}%
              </span>
              <span className="text-right font-mono tabular-nums text-cyan">
                {item.avgRrr}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
