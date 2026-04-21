"use client";

import { Monitor } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";

const TIMEFRAMES = ["1M", "15M", "1H", "4H", "1D"] as const;

const NUMBER_FORMATS = [
  { value: "comma", label: "1,234.56 (Comma)" },
  { value: "dot", label: "1.234,56 (Dot)" },
  { value: "space", label: "1 234.56 (Space)" },
];

const TIMEZONES = [
  "UTC+7",
  "UTC+0",
  "UTC-5",
  "UTC+8",
  "UTC+9",
];

const TIMEZONE_LABELS: Record<string, string> = {
  "UTC+7": "UTC+7 (Bangkok)",
  "UTC+0": "UTC+0 (London)",
  "UTC-5": "UTC-5 (New York)",
  "UTC+8": "UTC+8 (Singapore)",
  "UTC+9": "UTC+9 (Tokyo)",
};

export function DisplaySettings() {
  const { settings, loading, saving, update } = useSettings();
  const display = settings.display || {};

  function patch(key: string, value: unknown) {
    update({ display: { ...display, [key]: value } });
  }

  const currentTf = display.defaultChartTimeframe || "1H";

  return (
    <section className="bg-surface-container-low p-5 space-y-6 border border-outline-variant/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            Display
          </h2>
        </div>
        {saving && (
          <span className="text-[10px] text-cyan tracking-wider">SAVING…</span>
        )}
      </div>

      <div className={`space-y-4 ${loading ? "opacity-50" : ""}`}>
        <SettingRow label="Default Chart Timeframe">
          <div className="flex gap-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => patch("defaultChartTimeframe", tf)}
                className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  tf === currentTf
                    ? "bg-cyan/10 text-cyan border border-cyan/30"
                    : "bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </SettingRow>

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

        <SettingRow label="Number Format">
          <select
            value={display.numberFormat || "comma"}
            onChange={(e) => patch("numberFormat", e.target.value)}
            className="w-full bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/20 focus:border-cyan focus:outline-none"
          >
            {NUMBER_FORMATS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label}
              </option>
            ))}
          </select>
        </SettingRow>

        <SettingRow label="Timezone">
          <select
            value={display.timezone || "UTC+7"}
            onChange={(e) => patch("timezone", e.target.value)}
            className="w-full bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/20 focus:border-cyan focus:outline-none"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {TIMEZONE_LABELS[tz]}
              </option>
            ))}
          </select>
        </SettingRow>

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
                checked={display.priceFlashAnimations ?? true}
                onChange={(e) =>
                  patch("priceFlashAnimations", e.target.checked)
                }
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
