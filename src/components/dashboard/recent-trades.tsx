"use client";

import { usePrice } from "@/components/providers/price-provider";

export function RecentTrades() {
  const { trades } = usePrice();

  if (trades.length === 0) return null;

  return (
    <div className="bg-surface-container-low p-3 lg:p-4">
      <h3 className="text-xs font-medium text-on-surface-variant tracking-wider uppercase mb-2">
        Recent Trades (Live)
      </h3>

      <div className="grid grid-cols-4 text-[10px] text-on-surface-variant mb-1">
        <span>TIME</span>
        <span className="text-right">PRICE (USD)</span>
        <span className="text-right">SIZE (BTC)</span>
        <span className="text-right">SIDE</span>
      </div>

      <div className="flex flex-col max-h-[120px] overflow-hidden">
        {trades.slice(0, 10).map((trade, i) => {
          const time = new Date(trade.time);
          const timeStr = `${time.getHours().toString().padStart(2, "0")}:${time
            .getMinutes()
            .toString()
            .padStart(2, "0")}:${time
            .getSeconds()
            .toString()
            .padStart(2, "0")}`;
          const isBuy = !trade.isBuyerMaker;

          return (
            <div
              key={`${trade.time}-${i}`}
              className={`grid grid-cols-4 text-xs font-mono tabular-nums py-[2px] transition-all duration-300 ${
                i === 0 ? "animate-in fade-in-0 slide-in-from-top-1 duration-200" : ""
              }`}
            >
              <span className="text-on-surface-variant text-[10px]">
                {timeStr}
              </span>
              <span
                className={`text-right ${
                  isBuy ? "text-cyan" : "text-orange"
                }`}
              >
                {trade.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-right text-on-surface text-[10px]">
                {trade.quantity.toFixed(5)}
              </span>
              <span
                className={`text-right text-[10px] font-sans font-bold tracking-wider ${
                  isBuy ? "text-cyan" : "text-orange"
                }`}
              >
                {isBuy ? "BUY" : "SELL"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
