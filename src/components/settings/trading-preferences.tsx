"use client";

import { Sliders, ChevronDown } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";

export function TradingPreferences() {
  const { settings, loading, saving, update } = useSettings();
  const trading = settings.trading || {};

  function patch(key: string, value: unknown) {
    update({ trading: { ...trading, [key]: value } });
  }

  return (
    <section className="bg-surface-container-low p-5 space-y-6 border border-outline-variant/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            Trading Preferences
          </h2>
        </div>
        {saving && (
          <span className="text-[10px] text-cyan tracking-wider">SAVING…</span>
        )}
      </div>

      <div className={`space-y-4 ${loading ? "opacity-50" : ""}`}>
        <SettingRow label="Default Order Type">
          <SelectField
            options={["Market", "Limit", "Stop-Limit"]}
            value={trading.defaultOrderType || "Market"}
            onChange={(v) => patch("defaultOrderType", v)}
          />
        </SettingRow>

        <SettingRow label="Default Leverage">
          <SelectField
            options={["1x", "2x", "3x", "5x", "10x", "20x"]}
            value={trading.defaultLeverage || "3x"}
            onChange={(v) => patch("defaultLeverage", v)}
          />
        </SettingRow>

        <SettingRow label="Default Size (% of Balance)">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="100"
              value={trading.defaultSizePercent ?? 5}
              onChange={(e) =>
                patch("defaultSizePercent", parseInt(e.target.value))
              }
              className="flex-1 h-1 bg-surface-container-high appearance-none cursor-pointer accent-cyan"
            />
            <span className="text-xs font-mono text-on-surface tabular-nums w-8 text-right">
              {trading.defaultSizePercent ?? 5}%
            </span>
          </div>
        </SettingRow>

        <div className="bg-surface-container p-3 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
            Confirmations
          </p>
          <ToggleRow
            label="Confirm before opening position"
            checked={trading.confirmBeforeOpen ?? true}
            onChange={(v) => patch("confirmBeforeOpen", v)}
          />
          <ToggleRow
            label="Confirm before closing position"
            checked={trading.confirmBeforeClose ?? true}
            onChange={(v) => patch("confirmBeforeClose", v)}
          />
          <ToggleRow
            label="Confirm before modifying SL/TP"
            checked={trading.confirmBeforeModifySLTP ?? false}
            onChange={(v) => patch("confirmBeforeModifySLTP", v)}
          />
        </div>

        <SettingRow label="Slippage Tolerance">
          <SelectField
            options={["0.1%", "0.5%", "1.0%", "2.0%"]}
            value={trading.slippageTolerance || "0.5%"}
            onChange={(v) => patch("slippageTolerance", v)}
          />
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
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-on-surface">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-surface-container-high peer-checked:bg-cyan/30 transition-colors relative">
          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-on-surface-variant peer-checked:bg-cyan transition-all peer-checked:translate-x-4" />
        </div>
      </label>
    </div>
  );
}
