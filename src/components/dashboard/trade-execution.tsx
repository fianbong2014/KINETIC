"use client";

import { useState } from "react";

export function TradeExecution() {
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");

  return (
    <section className="bg-surface-container-high p-5 space-y-4">
      {/* Market / Limit toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setOrderType("MARKET")}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
            orderType === "MARKET"
              ? "bg-cyan text-[#004343]"
              : "bg-surface-container-lowest text-on-surface-variant"
          }`}
        >
          Market
        </button>
        <button
          onClick={() => setOrderType("LIMIT")}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
            orderType === "LIMIT"
              ? "bg-cyan text-[#004343]"
              : "bg-surface-container-lowest text-on-surface-variant"
          }`}
        >
          Limit
        </button>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        <div className="relative">
          <label className="absolute -top-2 left-2 px-1 bg-surface-container-high text-[8px] font-bold text-on-surface-variant uppercase">
            Amount (BTC)
          </label>
          <input
            type="text"
            defaultValue="0.50"
            className="w-full bg-surface-container-lowest border-0 text-sm font-heading font-bold py-3 px-3 text-on-surface focus:ring-1 focus:ring-cyan focus:bg-surface-bright transition-all"
          />
        </div>
        <div className="relative">
          <label className="absolute -top-2 left-2 px-1 bg-surface-container-high text-[8px] font-bold text-on-surface-variant uppercase">
            Stop Loss
          </label>
          <input
            type="text"
            placeholder="Auto-calc (1%)"
            className="w-full bg-surface-container-lowest border-0 text-sm font-heading font-bold py-3 px-3 text-on-surface focus:ring-1 focus:ring-cyan focus:bg-surface-bright transition-all placeholder:text-on-surface-variant/50"
          />
        </div>
      </div>

      {/* Buy / Sell buttons */}
      <div className="flex gap-4 pt-2">
        <button className="flex-1 bg-cyan text-[#006767] py-4 font-heading font-black uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all text-sm">
          Buy / Long
        </button>
        <button className="flex-1 bg-orange text-[#430b00] py-4 font-heading font-black uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all text-sm">
          Sell / Short
        </button>
      </div>

      {/* Fee / Available */}
      <div className="pt-2 flex justify-between text-[10px] font-bold uppercase text-on-surface-variant">
        <span>Fee: 0.04%</span>
        <span>Avail: 1.24 BTC</span>
      </div>
    </section>
  );
}
