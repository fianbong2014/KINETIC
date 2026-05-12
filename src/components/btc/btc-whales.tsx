"use client";

import { useEffect, useState } from "react";
import { WidgetCard } from "./btc-funding";
import { Fish, ArrowRight } from "lucide-react";

interface WhaleMove {
  id: string;
  amount: number;       // BTC
  usd: number;
  from: string;
  to: string;
  ts: number;
}

const ENTITIES = [
  "Binance",
  "Coinbase",
  "Kraken",
  "Bitfinex",
  "OKX",
  "Bybit",
  "Cold Wallet",
  "Unknown Wallet",
  "Grayscale",
  "MicroStrategy",
];

function pickPair() {
  const from = ENTITIES[Math.floor(Math.random() * ENTITIES.length)];
  let to = ENTITIES[Math.floor(Math.random() * ENTITIES.length)];
  while (to === from) to = ENTITIES[Math.floor(Math.random() * ENTITIES.length)];
  return { from, to };
}

function synthesize(price: number): WhaleMove {
  const amount = Math.floor(Math.random() * 1500 + 50);
  const { from, to } = pickPair();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    amount,
    usd: amount * price,
    from,
    to,
    ts: Date.now() - Math.floor(Math.random() * 600_000),
  };
}

// Mock whale tracker. A real feed would come from Whale Alert API
// (rate-limited free tier) or Arkham Intelligence (paid). For v1 we
// generate plausible flows between known exchanges/custodians.
export function BtcWhales() {
  const [items, setItems] = useState<WhaleMove[]>([]);
  // Pull a rough BTC price reference from window.btcPriceRef if available,
  // else hardcode a sane value. The exact price doesn't matter for mocking.
  const price = 80000;

  useEffect(() => {
    const seeded: WhaleMove[] = [];
    for (let i = 0; i < 6; i++) seeded.push(synthesize(price));
    setItems(seeded.sort((a, b) => b.ts - a.ts));

    const id = setInterval(() => {
      if (Math.random() > 0.6) {
        setItems((prev) => [synthesize(price), ...prev].slice(0, 10));
      }
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const totalInflow = items
    .filter((i) => /Binance|Coinbase|Kraken|Bitfinex|OKX|Bybit/.test(i.to))
    .reduce((s, i) => s + i.usd, 0);
  const totalOutflow = items
    .filter((i) => /Binance|Coinbase|Kraken|Bitfinex|OKX|Bybit/.test(i.from))
    .reduce((s, i) => s + i.usd, 0);
  const netFlow = totalInflow - totalOutflow;

  return (
    <WidgetCard title="Whale Tracker" subtitle="Simulated · Net exchange flow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Fish size={14} className="text-cyan" />
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
            Net flow (last hour)
          </span>
        </div>
        <p
          className={`text-xs font-bold font-mono tabular-nums ${
            netFlow > 0 ? "text-crimson" : "text-emerald-accent"
          }`}
        >
          {netFlow > 0 ? "+" : "-"}${(Math.abs(netFlow) / 1e6).toFixed(2)}M
        </p>
      </div>
      <p className="text-[10px] text-on-surface-variant mb-3 leading-relaxed">
        Inflow to exchanges{" "}
        <span className="text-crimson font-bold">
          ${(totalInflow / 1e6).toFixed(2)}M
        </span>{" "}
        · Outflow{" "}
        <span className="text-emerald-accent font-bold">
          ${(totalOutflow / 1e6).toFixed(2)}M
        </span>
      </p>

      <div className="space-y-1 max-h-[220px] overflow-y-auto">
        {items.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2 text-[10px] py-1.5 px-2 bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            <span className="font-mono tabular-nums font-bold text-on-surface w-16 shrink-0">
              {m.amount.toLocaleString()} BTC
            </span>
            <span className="text-on-surface-variant truncate flex-1 flex items-center gap-1 min-w-0">
              <span className="truncate">{m.from}</span>
              <ArrowRight size={10} className="text-cyan shrink-0" />
              <span className="truncate text-on-surface">{m.to}</span>
            </span>
            <span className="text-cyan font-mono tabular-nums shrink-0">
              ${(m.usd / 1e6).toFixed(2)}M
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
