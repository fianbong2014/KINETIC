"use client";

import { useState } from "react";
import { useAccount } from "@/hooks/use-account";
import { usePrice } from "@/components/providers/price-provider";
import { formatUsd } from "@/lib/format";

const PRESET_RISK = ["1.0", "2.0", "5.0"];

export function RiskCalculator() {
  const { balance, loading } = useAccount();
  const { price: livePrice, pair } = usePrice();

  const [riskPct, setRiskPct] = useState("2.0");
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  // Use live price as default entry if empty
  const effectiveEntry =
    parseFloat(entry) > 0 ? parseFloat(entry) : livePrice;
  const slNum = parseFloat(stopLoss);
  const tpNum = parseFloat(takeProfit);
  const riskPctNum = parseFloat(riskPct);

  // Risk math
  const riskDollars = (balance * riskPctNum) / 100;

  let positionSize = 0;
  let notional = 0;
  let rrr: number | null = null;

  if (effectiveEntry > 0 && slNum > 0 && riskDollars > 0) {
    const perUnitRisk = Math.abs(effectiveEntry - slNum);
    if (perUnitRisk > 0) {
      positionSize = riskDollars / perUnitRisk;
      notional = positionSize * effectiveEntry;

      if (tpNum > 0) {
        const perUnitReward = Math.abs(tpNum - effectiveEntry);
        rrr = perUnitReward / perUnitRisk;
      }
    }
  }

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
            Paper Balance
          </span>
          <span className="text-2xl font-heading font-bold text-on-surface tabular-nums">
            {loading ? "—" : formatUsd(balance)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Col 1: Entry + Stop Loss */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Entry Price (USD)
            </label>
            <input
              type="number"
              step="any"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder={livePrice > 0 ? `Live: ${livePrice.toFixed(2)}` : "—"}
              className="bg-surface-container-lowest text-on-surface font-mono text-sm tabular-nums px-3 py-2.5 border-none outline-none focus:bg-surface-bright transition-colors placeholder:text-on-surface-variant/40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Stop Loss (USD)
            </label>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="—"
              className="bg-surface-container-lowest text-on-surface font-mono text-sm tabular-nums px-3 py-2.5 border-none outline-none focus:bg-surface-bright transition-colors placeholder:text-on-surface-variant/40"
            />
          </div>
        </div>

        {/* Col 2: Risk % + Take Profit */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Risk Percentage (%)
            </label>
            <div className="flex gap-1">
              {PRESET_RISK.map((pct) => (
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
            <span className="text-[10px] text-on-surface-variant tabular-nums">
              Risking {formatUsd(riskDollars)}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Take Profit (USD)
            </label>
            <input
              type="number"
              step="any"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="—"
              className="bg-surface-container-lowest text-on-surface font-mono text-sm tabular-nums px-3 py-2.5 border-none outline-none focus:bg-surface-bright transition-colors placeholder:text-on-surface-variant/40"
            />
          </div>
        </div>

        {/* Col 3: Result */}
        <div className="border-l-4 border-primary bg-surface-container-lowest p-4 flex flex-col justify-center gap-4">
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-2">
              Recommended Position Size
            </span>
            <div className="text-2xl font-heading font-bold text-primary tabular-nums">
              {positionSize > 0
                ? `${positionSize.toFixed(pair.sizeDecimals)} ${pair.base}`
                : "—"}
            </div>
            <span className="text-xs text-on-surface-variant font-mono tabular-nums">
              {notional > 0 ? formatUsd(notional) : "—"}
            </span>
          </div>
          <div className="h-px bg-outline-dim" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Risk/Reward
            </span>
            <span
              className={`text-lg font-heading font-bold ${
                rrr && rrr >= 2
                  ? "text-emerald-accent"
                  : rrr
                    ? "text-orange"
                    : "text-on-surface-variant"
              }`}
            >
              {rrr ? `1 : ${rrr.toFixed(2)}` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
