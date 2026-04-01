"use client";

import { Brain } from "lucide-react";

export function SignalLogic() {
  return (
    <section className="bg-surface-container-low p-5 flex-1 flex flex-col">
      <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface mb-6">
        Signal Logic
      </h2>

      <div className="space-y-4 flex-1">
        {/* RSI Divergence */}
        <div className="flex gap-4 group">
          <div className="w-1 h-auto bg-cyan group-hover:brightness-125 transition-colors" />
          <div>
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-tight">
              RSI Divergence
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Bullish divergence confirmed on 4H timeframe. Price making lower
              lows while RSI makes higher lows.
            </p>
          </div>
        </div>

        {/* Zone Rejection */}
        <div className="flex gap-4 group">
          <div className="w-1 h-auto bg-orange group-hover:brightness-125 transition-colors" />
          <div>
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-tight">
              Zone Rejection
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Failed breakout at $43.2k supply zone. High volume selling
              pressure detected on tape.
            </p>
          </div>
        </div>

        {/* Volume Spike */}
        <div className="flex gap-4 group">
          <div className="w-1 h-auto bg-emerald-accent group-hover:brightness-125 transition-colors" />
          <div>
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-tight">
              Volume Spike
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Institutional buy walls identified at $41.8k. Liquidity sweep
              complete.
            </p>
          </div>
        </div>
      </div>

      {/* Terminal Bias */}
      <div className="mt-6 p-4 border border-outline-dim bg-surface-container-lowest">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-3 h-3 text-cyan" />
          <span className="text-[10px] font-bold text-on-surface-variant uppercase">
            Terminal Bias
          </span>
        </div>
        <span className="text-xl font-heading font-black text-cyan uppercase italic">
          AGGRESSIVE BUY
        </span>
      </div>
    </section>
  );
}
