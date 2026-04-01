"use client";

import { Sliders, ChevronDown } from "lucide-react";

export function TradingPreferences() {
  return (
    <section className="bg-surface-container-low p-5 space-y-6 border border-outline-variant/10">
      <div className="flex items-center gap-2">
        <Sliders className="w-4 h-4 text-cyan" />
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
          Trading Preferences
        </h2>
      </div>

      <div className="space-y-4">
        {/* Default Order Type */}
        <SettingRow label="Default Order Type">
          <SelectField options={["Market", "Limit", "Stop-Limit"]} defaultValue="Market" />
        </SettingRow>

        {/* Default Leverage */}
        <SettingRow label="Default Leverage">
          <SelectField options={["1x", "2x", "3x", "5x", "10x", "20x"]} defaultValue="3x" />
        </SettingRow>

        {/* Default Position Size */}
        <SettingRow label="Default Size (% of Balance)">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="100"
              defaultValue="5"
              className="flex-1 h-1 bg-surface-container-high appearance-none cursor-pointer accent-cyan"
            />
            <span className="text-xs font-mono text-on-surface tabular-nums w-8 text-right">
              5%
            </span>
          </div>
        </SettingRow>

        {/* Confirmations */}
        <div className="bg-surface-container p-3 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
            Confirmations
          </p>
          <ToggleRow label="Confirm before opening position" defaultOn={true} />
          <ToggleRow label="Confirm before closing position" defaultOn={true} />
          <ToggleRow label="Confirm before modifying SL/TP" defaultOn={false} />
        </div>

        {/* Slippage Tolerance */}
        <SettingRow label="Slippage Tolerance">
          <SelectField options={["0.1%", "0.5%", "1.0%", "2.0%"]} defaultValue="0.5%" />
        </SettingRow>
      </div>
    </section>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container p-3 space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
        {label}
      </span>
      {children}
    </div>
  );
}

function SelectField({
  options,
  defaultValue,
}: {
  options: string[];
  defaultValue: string;
}) {
  return (
    <div className="relative">
      <select
        defaultValue={defaultValue}
        className="w-full bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/20 focus:border-cyan focus:outline-none appearance-none pr-8"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant pointer-events-none" />
    </div>
  );
}

function ToggleRow({
  label,
  defaultOn,
}: {
  label: string;
  defaultOn: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-on-surface">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          defaultChecked={defaultOn}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-surface-container-high peer-checked:bg-cyan/30 transition-colors relative">
          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-on-surface-variant peer-checked:bg-cyan transition-all peer-checked:translate-x-4" />
        </div>
      </label>
    </div>
  );
}
