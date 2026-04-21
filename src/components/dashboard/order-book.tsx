"use client";

import { useOrderBook, type DepthLevel } from "@/hooks/use-order-book";
import { usePrice } from "@/components/providers/price-provider";
import { formatPrice } from "@/lib/format";

const DISPLAY_LEVELS = 8; // rows to show per side

export function OrderBook() {
  const { symbol, pair } = usePrice();
  const { bids, asks, bestBid, bestAsk, spread, spreadPct, isConnected } =
    useOrderBook(symbol, 20);

  // Trim to DISPLAY_LEVELS per side
  const visibleBids = bids.slice(0, DISPLAY_LEVELS);
  // For asks we show them price-desc (worst ask at top, best ask just above spread)
  const visibleAsks = asks.slice(0, DISPLAY_LEVELS).slice().reverse();

  // Compute max cumulative quantity for depth bar scaling
  const maxQty = Math.max(
    ...visibleBids.map((b) => b.quantity),
    ...visibleAsks.map((a) => a.quantity),
    0.0001
  );

  const midPrice = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : 0;

  return (
    <section className="bg-surface-container-low flex-1 flex flex-col p-5 overflow-hidden min-h-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
          Order Book
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">
            {pair.display}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? "bg-emerald-accent animate-pulse" : "bg-on-surface-variant/40"
            }`}
          />
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-2 gap-2 text-[9px] text-on-surface-variant uppercase tracking-widest font-bold pb-1 border-b border-outline-variant/10">
        <span>Price (USDT)</span>
        <span className="text-right">Size ({pair.base})</span>
      </div>

      <div className="flex-1 flex flex-col text-[10px] overflow-hidden mt-1">
        {/* Asks (sellers) - highest on top */}
        <div className="flex-1 flex flex-col-reverse overflow-hidden">
          {visibleAsks.length === 0 ? (
            <div className="text-center text-on-surface-variant/60 py-3 text-[10px]">
              {isConnected ? "Loading asks..." : "Connecting..."}
            </div>
          ) : (
            visibleAsks.map((ask, i) => (
              <DepthRow
                key={`ask-${i}`}
                level={ask}
                maxQty={maxQty}
                side="ask"
                pair={pair}
              />
            ))
          )}
        </div>

        {/* Spread */}
        <div className="py-2 px-1 flex justify-between items-center border-y border-outline-dim my-1 shrink-0">
          <span className="text-xs font-black text-on-surface font-mono tabular-nums">
            {midPrice > 0 ? formatPrice(midPrice) : "—"}
          </span>
          <span className="text-[9px] text-on-surface-variant uppercase font-bold tabular-nums">
            Spread: {spread.toFixed(pair.priceDecimals)} ({spreadPct.toFixed(3)}%)
          </span>
        </div>

        {/* Bids (buyers) - highest on top */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {visibleBids.length === 0 ? (
            <div className="text-center text-on-surface-variant/60 py-3 text-[10px]">
              {isConnected ? "Loading bids..." : "Connecting..."}
            </div>
          ) : (
            visibleBids.map((bid, i) => (
              <DepthRow
                key={`bid-${i}`}
                level={bid}
                maxQty={maxQty}
                side="bid"
                pair={pair}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function DepthRow({
  level,
  maxQty,
  side,
  pair,
}: {
  level: DepthLevel;
  maxQty: number;
  side: "bid" | "ask";
  pair: { priceDecimals: number; sizeDecimals: number };
}) {
  const width = Math.min(100, (level.quantity / maxQty) * 100);
  const isBid = side === "bid";

  return (
    <div
      className={`relative flex justify-between py-0.5 ${
        isBid ? "text-cyan" : "text-orange"
      }`}
    >
      <div
        className={`absolute inset-y-0 ${isBid ? "left-0" : "right-0"} ${
          isBid ? "bg-cyan/5" : "bg-orange/5"
        }`}
        style={{ width: `${width}%` }}
      />
      <span className="z-10 font-mono tabular-nums px-1">
        {level.price.toLocaleString(undefined, {
          minimumFractionDigits: pair.priceDecimals,
          maximumFractionDigits: pair.priceDecimals,
        })}
      </span>
      <span className="z-10 text-on-surface-variant font-mono tabular-nums px-1">
        {level.quantity.toLocaleString(undefined, {
          minimumFractionDigits: Math.min(pair.sizeDecimals, 4),
          maximumFractionDigits: Math.min(pair.sizeDecimals, 4),
        })}
      </span>
    </div>
  );
}
