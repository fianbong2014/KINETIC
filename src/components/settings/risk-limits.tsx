"use client";

import { ShieldAlert } from "lucide-react";

export function RiskLimits() {
  return (
    <section className="bg-surface-container-low p-5 space-y-6 border border-outline-variant/10">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-orange" />
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
          Risk Limits
        </h2>
      </div>

      <div className="space-y-4">
        <LimitRow
          label="Max Daily Loss"
          value="5"
          unit="%"
          description="Auto-halt trading when daily loss exceeds this threshold"
          color="text-orange"
        />
        <LimitRow
          label="Max Drawdown"
          value="15"
          unit="%"
          description="Circuit breaker: locks all positions beyond this drawdown"
          color="text-crimson"
        />
        <LimitRow
          label="Max Position Size"
          value="25"
          unit="% bal"
          description="Maximum single position as percentage of total balance"
          color="text-cyan"
        />
        <LimitRow
          label="Max Open Positions"
          value="5"
          unit="pos"
          description="Maximum number of concurrent open positions"
          color="text-cyan"
        />
        <LimitRow
          label="Max Leverage"
          value="10"
          unit="x"
          description="Hard cap on leverage regardless of trading pair"
          color="text-orange"
        />

        {/* Kill Switch */}
        <div className="bg-surface-container p-3 border border-crimson/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-crimson">
                Emergency Kill Switch
              </p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                Immediately close all positions and halt trading
              </p>
            </div>
            <button className="px-3 py-1.5 bg-crimson/10 text-crimson text-[10px] font-bold uppercase tracking-widest hover:bg-crimson/20 transition-colors">
              Armed
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function LimitRow({
  label,
  value,
  unit,
  description,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  description: string;
  color: string;
}) {
  return (
    <div className="bg-surface-container p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
          {label}
        </span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            defaultValue={value}
            className="w-14 bg-surface-container-high text-on-surface text-xs px-2 py-1 border border-outline-variant/20 focus:border-cyan focus:outline-none text-right font-mono tabular-nums"
          />
          <span className={`text-[10px] font-bold ${color}`}>{unit}</span>
        </div>
      </div>
      <p className="text-[10px] text-on-surface-variant leading-relaxed">
        {description}
      </p>
    </div>
  );
}
