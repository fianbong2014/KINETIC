"use client";

import { ShieldAlert } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";

export function RiskLimits() {
  const { settings, loading, saving, update } = useSettings();
  const risk = settings.risk || {};

  function patch(key: string, value: unknown) {
    update({ risk: { ...risk, [key]: value } });
  }

  return (
    <section className="bg-surface-container-low p-5 space-y-6 border border-outline-variant/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-orange" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            Risk Limits
          </h2>
        </div>
        {saving && (
          <span className="text-[10px] text-cyan tracking-wider">SAVING…</span>
        )}
      </div>

      <div className={`space-y-4 ${loading ? "opacity-50" : ""}`}>
        <LimitRow
          label="Max Daily Loss"
          value={risk.maxDailyLossPercent ?? 5}
          unit="%"
          description="Auto-halt trading when daily loss exceeds this threshold"
          color="text-orange"
          onChange={(v) => patch("maxDailyLossPercent", v)}
        />
        <LimitRow
          label="Max Drawdown"
          value={risk.maxDrawdownPercent ?? 15}
          unit="%"
          description="Circuit breaker: locks all positions beyond this drawdown"
          color="text-crimson"
          onChange={(v) => patch("maxDrawdownPercent", v)}
        />
        <LimitRow
          label="Max Position Size"
          value={risk.maxPositionSizePercent ?? 25}
          unit="% bal"
          description="Maximum single position as percentage of total balance"
          color="text-cyan"
          onChange={(v) => patch("maxPositionSizePercent", v)}
        />
        <LimitRow
          label="Max Open Positions"
          value={risk.maxOpenPositions ?? 5}
          unit="pos"
          description="Maximum number of concurrent open positions"
          color="text-cyan"
          onChange={(v) => patch("maxOpenPositions", v)}
        />
        <LimitRow
          label="Max Leverage"
          value={risk.maxLeverage ?? 10}
          unit="x"
          description="Hard cap on leverage regardless of trading pair"
          color="text-orange"
          onChange={(v) => patch("maxLeverage", v)}
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
            <button
              onClick={() => patch("killSwitch", !risk.killSwitch)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                risk.killSwitch
                  ? "bg-crimson/20 text-crimson"
                  : "bg-crimson/10 text-crimson hover:bg-crimson/20"
              }`}
            >
              {risk.killSwitch ? "Armed" : "Disarmed"}
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
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  description: string;
  color: string;
  onChange: (value: number) => void;
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
            value={value}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              if (!isNaN(n)) onChange(n);
            }}
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
