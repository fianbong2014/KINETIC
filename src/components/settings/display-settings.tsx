"use client";

import { Monitor } from "lucide-react";

export function DisplaySettings() {
  return (
    <section className="bg-surface-container-low p-5 space-y-6 border border-outline-variant/10">
      <div className="flex items-center gap-2">
        <Monitor className="w-4 h-4 text-cyan" />
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
          Display
        </h2>
      </div>

      <div className="space-y-4">
        {/* Chart Default Timeframe */}
        <SettingRow label="Default Chart Timeframe">
          <div className="flex gap-1">
            {["1M", "15M", "1H", "4H", "1D"].map((tf) => (
              <button
                key={tf}
                className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  tf === "1H"
                    ? "bg-cyan/10 text-cyan border border-cyan/30"
                    : "bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </SettingRow>

        {/* Candle Style */}
        <SettingRow label="Candle Colors">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-cyan" />
              <span className="text-[10px] text-on-surface-variant">
                Bullish
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange" />
              <span className="text-[10px] text-on-surface-variant">
                Bearish
              </span>
            </div>
          </div>
        </SettingRow>

        {/* Price Format */}
        <SettingRow label="Number Format">
          <select className="w-full bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/20 focus:border-cyan focus:outline-none">
            <option>1,234.56 (Comma)</option>
            <option>1.234,56 (Dot)</option>
            <option>1 234.56 (Space)</option>
          </select>
        </SettingRow>

        {/* Timezone */}
        <SettingRow label="Timezone">
          <select className="w-full bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/20 focus:border-cyan focus:outline-none">
            <option>UTC+7 (Bangkok)</option>
            <option>UTC+0 (London)</option>
            <option>UTC-5 (New York)</option>
            <option>UTC+8 (Singapore)</option>
            <option>UTC+9 (Tokyo)</option>
          </select>
        </SettingRow>

        {/* Animation */}
        <div className="bg-surface-container p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-on-surface">Price flash animations</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                Green/red flash on price updates
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={true}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-container-high peer-checked:bg-cyan/30 transition-colors relative">
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-on-surface-variant peer-checked:bg-cyan transition-all peer-checked:translate-x-4" />
              </div>
            </label>
          </div>
        </div>
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
