"use client";

import { useState } from "react";

export function RiskCalculator() {
  const [riskPct, setRiskPct] = useState("2.0");

  return (
    <div className="col-span-12 lg:col-span-8 bg-surface-container-low p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-on-surface tracking-wider uppercase mb-2">
            Risk Calculator
          </h3>
          <div className="h-[1px] w-12 bg-primary" />
        </div>
        <div className="text-right">
          <span className="text-[10px] text-on-surface-variant block mb-1 uppercase tracking-wider">
            Account Balance
          </span>
          <span className="text-2xl font-heading font-bold text-on-surface tabular-nums">
            $250,000.00
          </span>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Col 1: Entry Price + Stop Loss */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Entry Price (USD)
            </label>
            <input
              type="text"
              defaultValue="$42,069.00"
              className="bg-surface-container-lowest text-on-surface font-mono text-sm tabular-nums px-3 py-2.5 border-none outline-none focus:bg-surface-bright transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Stop Loss (USD)
            </label>
            <input
              type="text"
              defaultValue="$41,200.00"
              className="bg-surface-container-lowest text-on-surface font-mono text-sm tabular-nums px-3 py-2.5 border-none outline-none focus:bg-surface-bright transition-colors"
            />
          </div>
        </div>

        {/* Col 2: Risk % Buttons + Take Profit */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Risk Percentage (%)
            </label>
            <div className="flex gap-1">
              {["1.0", "2.0", "5.0"].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setRiskPct(pct)}
                  className={`flex-1 py-2.5 text-xs font-mono transition-colors ${
                    riskPct === pct
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Take Profit (USD)
            </label>
            <input
              type="text"
              defaultValue="$45,000.00"
              className="bg-surface-container-lowest text-on-surface font-mono text-sm tabular-nums px-3 py-2.5 border-none outline-none focus:bg-surface-bright transition-colors"
            />
          </div>
        </div>

        {/* Col 3: Result card */}
        <div className="border-l-4 border-primary bg-surface-container-lowest p-4 flex flex-col justify-center gap-4">
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-2">
              Recommended Position Size
            </span>
            <div className="text-2xl font-heading font-bold text-primary tabular-nums">
              2.876 BTC
            </div>
            <span className="text-xs text-on-surface-variant font-mono tabular-nums">
              $120,990.00
            </span>
          </div>
          <div className="h-px bg-outline-dim" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Risk/Reward
            </span>
            <span className="text-lg font-heading font-bold text-primary">
              1:3.4
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
