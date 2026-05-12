"use client";

import { ChevronDown, Layers, Activity, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PairSelector } from "@/components/layout/pair-selector";
import {
  CHART_TYPES,
  INDICATOR_META,
  TIMEFRAMES,
  type ChartConfig,
  type ChartType,
  type IndicatorToggles,
  type OscillatorToggles,
  type Timeframe,
} from "@/lib/chart-config";

interface ChartToolbarProps {
  config: ChartConfig;
  onConfigChange: (next: ChartConfig) => void;
  onSaveTemplate?: () => void;
  onLoadTemplate?: () => void;
  templateCount?: number;
}

export function ChartToolbar({
  config,
  onConfigChange,
  onSaveTemplate,
  onLoadTemplate,
  templateCount = 0,
}: ChartToolbarProps) {
  function setTimeframe(tf: Timeframe) {
    onConfigChange({ ...config, timeframe: tf });
  }
  function setChartType(t: ChartType) {
    onConfigChange({ ...config, chartType: t });
  }
  function toggleIndicator(key: keyof IndicatorToggles) {
    onConfigChange({
      ...config,
      indicators: { ...config.indicators, [key]: !config.indicators[key] },
    });
  }
  function toggleOscillator(key: keyof OscillatorToggles) {
    onConfigChange({
      ...config,
      oscillators: { ...config.oscillators, [key]: !config.oscillators[key] },
    });
  }

  return (
    <div className="bg-surface-container-low border-b border-outline-variant/10 flex flex-wrap items-center gap-1.5 lg:gap-2 px-3 py-2">
      {/* Pair selector */}
      <PairSelector />

      <Divider />

      {/* Timeframes */}
      <div className="flex bg-surface-container">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.id}
            onClick={() => setTimeframe(tf.id)}
            className={`px-2 py-1 text-[10px] font-bold tracking-widest uppercase transition-colors ${
              config.timeframe === tf.id
                ? "bg-cyan/15 text-cyan"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <Divider />

      {/* Chart type */}
      <Dropdown
        label={CHART_TYPES.find((c) => c.id === config.chartType)?.label || "Type"}
        icon={null}
      >
        {CHART_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setChartType(t.id)}
            className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${
              config.chartType === t.id
                ? "bg-cyan/10 text-cyan"
                : "text-on-surface hover:bg-surface-container-highest"
            }`}
          >
            {t.label}
          </button>
        ))}
      </Dropdown>

      {/* Indicators dropdown */}
      <Dropdown
        label={
          <>
            <Layers className="w-3 h-3" />
            Indicators
          </>
        }
        badge={countActive(config.indicators)}
      >
        <div className="py-1 min-w-[220px]">
          {(Object.keys(INDICATOR_META) as (keyof IndicatorToggles)[]).map(
            (key) => (
              <button
                key={key}
                onClick={() => toggleIndicator(key)}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-surface-container-highest transition-colors"
              >
                <span
                  className="w-2.5 h-0.5 shrink-0"
                  style={{ backgroundColor: INDICATOR_META[key].color }}
                />
                <span className="flex-1 text-left">
                  <span
                    className={
                      config.indicators[key]
                        ? "text-on-surface font-bold"
                        : "text-on-surface-variant"
                    }
                  >
                    {INDICATOR_META[key].label}
                  </span>
                  <span className="block text-[9px] text-on-surface-variant/70">
                    {INDICATOR_META[key].description}
                  </span>
                </span>
                <span
                  className={`w-3 h-3 border ${
                    config.indicators[key]
                      ? "bg-cyan border-cyan"
                      : "border-on-surface-variant/30"
                  }`}
                />
              </button>
            )
          )}
        </div>
      </Dropdown>

      {/* Oscillators dropdown */}
      <Dropdown
        label={
          <>
            <Activity className="w-3 h-3" />
            Oscillators
          </>
        }
        badge={countActive(config.oscillators)}
      >
        <div className="py-1 min-w-[180px]">
          <OscRow
            label="RSI 14"
            description="Relative Strength Index"
            on={config.oscillators.rsi}
            onClick={() => toggleOscillator("rsi")}
          />
          <OscRow
            label="MACD 12,26,9"
            description="Momentum convergence"
            on={config.oscillators.macd}
            onClick={() => toggleOscillator("macd")}
          />
        </div>
      </Dropdown>

      <Divider />

      {/* Templates */}
      {onSaveTemplate && (
        <button
          onClick={onSaveTemplate}
          className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold tracking-widest uppercase text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          title="Save current layout as template"
        >
          <Save className="w-3 h-3" />
          Save
        </button>
      )}
      {onLoadTemplate && templateCount > 0 && (
        <button
          onClick={onLoadTemplate}
          className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold tracking-widest uppercase text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          Load ({templateCount})
        </button>
      )}
    </div>
  );
}

function countActive(obj: Record<string, boolean> | object): number {
  return Object.values(obj).filter(Boolean).length;
}

function Divider() {
  return <span className="w-px h-5 bg-outline-variant/20" />;
}

function OscRow({
  label,
  description,
  on,
  onClick,
}: {
  label: string;
  description: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-surface-container-highest transition-colors"
    >
      <span className="flex-1 text-left">
        <span
          className={
            on ? "text-on-surface font-bold" : "text-on-surface-variant"
          }
        >
          {label}
        </span>
        <span className="block text-[9px] text-on-surface-variant/70">
          {description}
        </span>
      </span>
      <span
        className={`w-3 h-3 border ${
          on ? "bg-cyan border-cyan" : "border-on-surface-variant/30"
        }`}
      />
    </button>
  );
}

// ─── Dropdown shell ──────────────────────────────────────────────────

function Dropdown({
  label,
  children,
  badge,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  badge?: number;
  icon?: null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold tracking-widest uppercase transition-colors ${
          open
            ? "bg-cyan/10 text-cyan"
            : "text-on-surface hover:bg-surface-container"
        }`}
      >
        <span className="flex items-center gap-1.5">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="bg-cyan/20 text-cyan text-[9px] px-1 py-0.5 leading-none tabular-nums">
            {badge}
          </span>
        )}
        <ChevronDown
          className={`w-3 h-3 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-surface-container-high border border-outline-variant/20 shadow-xl z-50">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Templates dialog ────────────────────────────────────────────────

interface TemplateDialogProps {
  templates: Array<{ id: string; name: string; createdAt: number }>;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function TemplateDialog({
  templates,
  onLoad,
  onDelete,
  onClose,
}: TemplateDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-low w-full max-w-md border border-outline-variant/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
          <h3 className="text-sm font-black font-heading tracking-wider uppercase text-on-surface">
            Chart Templates
          </h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-[10px] font-bold tracking-widest uppercase"
          >
            Close
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {templates.length === 0 ? (
            <p className="text-center text-xs text-on-surface-variant py-8">
              No saved templates yet
            </p>
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors border-b border-outline-variant/5 last:border-0"
              >
                <button
                  onClick={() => onLoad(t.id)}
                  className="flex-1 text-left"
                >
                  <p className="text-xs font-bold text-on-surface">{t.name}</p>
                  <p className="text-[9px] text-on-surface-variant tracking-wider mt-0.5">
                    Saved {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete template "${t.name}"?`)) onDelete(t.id);
                  }}
                  className="text-on-surface-variant hover:text-crimson p-1"
                  aria-label="Delete template"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
