"use client";

import { Shield } from "lucide-react";

export function RiskControl() {
  return (
    <section className="bg-surface-container-low p-5 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
          Risk Control
        </h2>
        <Shield className="w-4 h-4 text-cyan" />
      </div>

      <div className="space-y-4">
        {/* Max Loss Per Trade */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
            <span className="text-on-surface-variant">Max Loss Per Trade</span>
            <span className="text-on-surface">$250.00</span>
          </div>
          <div className="h-1 bg-surface-container w-full">
            <div className="h-full bg-cyan w-[65%]" />
          </div>
        </div>

        {/* Account Heat */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
            <span className="text-on-surface-variant">Account Heat</span>
            <span className="text-on-surface">3.2%</span>
          </div>
          <div className="h-1 bg-surface-container w-full">
            <div className="h-full bg-orange w-[40%]" />
          </div>
        </div>

        {/* Current Drawdown */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
            <span className="text-on-surface-variant">Current Drawdown</span>
            <span className="text-crimson">-$1,120.40</span>
          </div>
          <div className="h-1 bg-surface-container w-full">
            <div className="h-full bg-crimson w-[15%]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <div className="bg-surface-container p-3">
          <span className="block text-[10px] text-on-surface-variant uppercase font-bold">
            Leverage Cap
          </span>
          <span className="text-lg font-heading font-black text-on-surface">
            10.0X
          </span>
        </div>
        <div className="bg-surface-container p-3">
          <span className="block text-[10px] text-on-surface-variant uppercase font-bold">
            Sharpe Ratio
          </span>
          <span className="text-lg font-heading font-black text-cyan">
            2.84
          </span>
        </div>
      </div>
    </section>
  );
}
