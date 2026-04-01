"use client";

const asks = [
  { price: 43245.1, size: 1.442 },
  { price: 43244.5, size: 0.891 },
  { price: 43243.2, size: 0.405 },
];

const bids = [
  { price: 43241.8, size: 0.512 },
  { price: 43240.5, size: 1.908 },
  { price: 43239.0, size: 0.22 },
];

export function OrderBook() {
  return (
    <section className="bg-surface-container-low flex-1 flex flex-col p-5 overflow-hidden">
      <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface mb-4">
        Order Book
      </h2>

      <div className="flex-1 space-y-[2px] text-[10px] overflow-hidden">
        {/* Sellers (asks) */}
        {asks.map((ask, i) => (
          <div key={i} className="flex justify-between text-orange py-0.5 relative">
            <div
              className="absolute inset-0 bg-orange/5"
              style={{ width: `${(ask.size / 1.5) * 100}%`, marginLeft: "auto" }}
            />
            <span className="z-10 font-mono tabular-nums">
              {ask.price.toFixed(2)}
            </span>
            <span className="z-10 text-on-surface-variant font-mono tabular-nums">
              {ask.size.toFixed(3)}
            </span>
          </div>
        ))}

        {/* Spread */}
        <div className="py-3 flex justify-between items-center border-y border-outline-dim my-2">
          <span className="text-xs font-black text-on-surface font-mono tabular-nums">
            43,242.00
          </span>
          <span className="text-[9px] text-on-surface-variant uppercase font-bold">
            Spread: 1.20
          </span>
        </div>

        {/* Buyers (bids) */}
        {bids.map((bid, i) => (
          <div key={i} className="flex justify-between text-cyan py-0.5 relative">
            <div
              className="absolute inset-0 bg-cyan/5"
              style={{ width: `${(bid.size / 2) * 100}%` }}
            />
            <span className="z-10 font-mono tabular-nums">
              {bid.price.toFixed(2)}
            </span>
            <span className="z-10 text-on-surface-variant font-mono tabular-nums">
              {bid.size.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
