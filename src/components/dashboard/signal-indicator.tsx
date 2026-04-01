"use client";

import { Zap, ArrowUpRight } from "lucide-react";

export function SignalIndicator() {
  return (
    <div className="bg-surface-container-low p-4 flex flex-col gap-3">
      <h3 className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">
        Signal Lines
      </h3>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-on-surface-variant">EMA 12</span>
          <span className="text-xs font-mono tabular-nums text-on-surface">
            $41,892.40
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-on-surface-variant">EMA 26</span>
          <span className="text-xs font-mono tabular-nums text-on-surface">
            $41,654.80
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-on-surface-variant">RSI (14)</span>
          <span className="text-xs font-mono tabular-nums text-cyan">
            62.4
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-on-surface-variant">MACD</span>
          <span className="text-xs font-mono tabular-nums text-emerald-accent">
            +237.60
          </span>
        </div>
      </div>

      <div className="h-px bg-outline-dim" />

      <h3 className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">
        Cumulative
      </h3>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-on-surface-variant">CVD</span>
        <span className="text-xs font-mono tabular-nums text-emerald-accent">
          +$12.4M
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-on-surface-variant">
          OI CHANGE (24H)
        </span>
        <span className="text-xs font-mono tabular-nums text-cyan">
          +$340M
        </span>
      </div>

      <div className="h-px bg-outline-dim" />

      {/* Active Signal */}
      <div className="bg-surface-container p-3 glow-cyan">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3.5 h-3.5 text-cyan" />
          <span className="text-[10px] text-cyan tracking-wider uppercase font-medium">
            Active Signal
          </span>
        </div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-heading font-bold text-on-surface">
            AGGRESSIVE BUY
          </span>
          <ArrowUpRight className="w-4 h-4 text-emerald-accent" />
        </div>
        <span className="text-[10px] text-on-surface-variant">
          Confidence: 84% | K-8829-SIG
        </span>
      </div>
    </div>
  );
}
