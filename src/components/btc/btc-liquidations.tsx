"use client";

import { useEffect, useState } from "react";
import { useBtcTicker } from "@/hooks/use-btc-monitor";
import { WidgetCard } from "./btc-funding";
import { formatPrice } from "@/lib/format";
import { Flame } from "lucide-react";

interface Liquidation {
  id: string;
  side: "LONG" | "SHORT";
  size: number;     // USD
  price: number;
  exchange: string;
  ts: number;
}

const EXCHANGES = ["Binance", "Bybit", "OKX", "Bitget"];

// Public liquidation streams are auth-gated on most exchanges; for v1 we
// synthesize plausible liquidations around the live BTC price so the
// widget feels alive. Replace with a real feed (e.g. Coinglass WS, paid)
// once available.
function synthesize(price: number, side: "LONG" | "SHORT"): Liquidation {
  const size = Math.floor(Math.exp(Math.random() * 5 + 8)); // ~3k – 1M USD
  const offset = price * (Math.random() * 0.003 + 0.0001);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    side,
    size,
    price: side === "LONG" ? price - offset : price + offset,
    exchange: EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)],
    ts: Date.now(),
  };
}

export function BtcLiquidations() {
  const { price } = useBtcTicker();
  const [items, setItems] = useState<Liquidation[]>([]);

  useEffect(() => {
    if (price <= 0) return;
    // Seed
    const seeded: Liquidation[] = [];
    for (let i = 0; i < 8; i++) {
      seeded.push(
        synthesize(price, Math.random() > 0.5 ? "LONG" : "SHORT")
      );
    }
    setItems(seeded);

    const id = setInterval(() => {
      // 35% chance of a new liq per tick
      if (Math.random() > 0.65) {
        setItems((prev) =>
          [
            synthesize(price, Math.random() > 0.5 ? "LONG" : "SHORT"),
            ...prev,
          ].slice(0, 12)
        );
      }
    }, 4000);
    return () => clearInterval(id);
  }, [price]);

  const longTotal = items
    .filter((i) => i.side === "LONG")
    .reduce((s, i) => s + i.size, 0);
  const shortTotal = items
    .filter((i) => i.side === "SHORT")
    .reduce((s, i) => s + i.size, 0);

  return (
    <WidgetCard
      title="Recent Liquidations"
      subtitle="Simulated · Replace with paid feed"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[10px]">
          <Flame size={12} className="text-crimson" />
          <span className="text-on-surface-variant uppercase tracking-wider font-bold">
            Last {items.length} liquidations
          </span>
        </div>
        <div className="text-[10px] font-bold font-mono tabular-nums">
          <span className="text-emerald-accent">
            ${(longTotal / 1000).toFixed(1)}k
          </span>
          <span className="text-on-surface-variant mx-1">/</span>
          <span className="text-crimson">
            ${(shortTotal / 1000).toFixed(1)}k
          </span>
        </div>
      </div>

      <div className="space-y-0.5 max-h-[220px] overflow-y-auto">
        {items.map((item) => {
          const isLong = item.side === "LONG";
          const sizeColor = isLong ? "text-crimson" : "text-emerald-accent";
          // Liquidated longs are red events (forced sell); shorts are green.
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 text-[10px] font-mono py-1 px-2 hover:bg-surface-container"
            >
              <span
                className={`font-bold w-12 shrink-0 ${
                  isLong ? "text-crimson" : "text-emerald-accent"
                }`}
              >
                {isLong ? "LONG" : "SHORT"}
              </span>
              <span className={`tabular-nums shrink-0 font-bold ${sizeColor}`}>
                ${item.size.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
              <span className="text-on-surface tabular-nums shrink-0">
                ${formatPrice(item.price)}
              </span>
              <span className="text-on-surface-variant text-right flex-1 truncate">
                {item.exchange}
              </span>
              <span className="text-on-surface-variant text-[9px]">
                {timeAgo(item.ts)}
              </span>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}
