"use client";

import { useState } from "react";
import { Activity, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import {
  useCustomIndicators,
  type CustomIndicator,
  type NewIndicator,
} from "@/hooks/use-custom-indicators";
import {
  compileExpression,
  INDICATOR_EXAMPLES,
} from "@/lib/custom-indicators";

const DEFAULT_COLORS = [
  "#00ffff",
  "#ff734c",
  "#50c878",
  "#ff716c",
  "#f5b700",
  "#c678dd",
  "#8ae1ff",
];

export function CustomIndicatorsSettings() {
  const { indicators, loading, create, update, remove } =
    useCustomIndicators();
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="bg-surface-container-low p-5 space-y-4 border border-outline-variant/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            Custom Indicators
          </h2>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cyan hover:opacity-80 transition-opacity"
        >
          <Plus size={12} />
          {showForm ? "Cancel" : "New"}
        </button>
      </div>

      <p className="text-[10px] text-on-surface-variant leading-relaxed">
        เขียน expression แบบ JavaScript return array ของตัวเลขยาวเท่ากับจำนวน
        candle ใช้ตัวแปร{" "}
        <code className="text-cyan">open/high/low/close/volume</code> และ
        helpers เช่น <code className="text-cyan">ema, sma, rsi, macd</code>
      </p>

      {showForm && (
        <IndicatorForm
          onSubmit={async (input) => {
            await create(input);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className={`space-y-2 ${loading ? "opacity-50" : ""}`}>
        {indicators.length === 0 && !loading && !showForm && (
          <p className="text-[11px] text-on-surface-variant italic">
            ยังไม่มี indicator — กด New เพื่อสร้าง
          </p>
        )}
        {indicators.map((ind) => (
          <IndicatorRow
            key={ind.id}
            indicator={ind}
            onToggle={() => update(ind.id, { enabled: !ind.enabled })}
            onDelete={() => {
              if (confirm(`Delete "${ind.name}"?`)) remove(ind.id);
            }}
          />
        ))}
      </div>
    </section>
  );
}

function IndicatorRow({
  indicator,
  onToggle,
  onDelete,
}: {
  indicator: CustomIndicator;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-surface-container p-3 flex items-center gap-3">
      <span
        className="w-3 h-3 shrink-0"
        style={{ backgroundColor: indicator.color }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-on-surface truncate">
          {indicator.name}
        </p>
        <p className="text-[10px] text-on-surface-variant font-mono truncate">
          {indicator.expression}
        </p>
      </div>
      <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider shrink-0">
        {indicator.overlay ? "PRICE" : "PANE"}
      </span>
      <button
        onClick={onToggle}
        className={`shrink-0 p-1.5 transition-colors ${
          indicator.enabled
            ? "text-cyan"
            : "text-on-surface-variant hover:text-on-surface"
        }`}
        title={indicator.enabled ? "Hide on chart" : "Show on chart"}
      >
        {indicator.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
      </button>
      <button
        onClick={onDelete}
        className="shrink-0 p-1.5 text-on-surface-variant hover:text-crimson transition-colors"
        title="Delete"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function IndicatorForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: NewIndicator) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [expression, setExpression] = useState("ema(close, 20)");
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [overlay, setOverlay] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(expr: string): string | null {
    const res = compileExpression(expr);
    return res.ok ? null : res.error || "Invalid expression";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    const vErr = validate(expression);
    if (vErr) {
      setError(vErr);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        expression,
        color,
        overlay,
        enabled: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-container p-3 space-y-3"
    >
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Fast EMA"
          className="w-full bg-surface-container-high text-xs text-on-surface px-2 py-1.5 outline-none focus:ring-1 focus:ring-cyan"
          maxLength={60}
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          Expression
        </label>
        <textarea
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          className="w-full bg-surface-container-high text-xs text-on-surface font-mono px-2 py-1.5 outline-none focus:ring-1 focus:ring-cyan resize-none"
          rows={3}
          maxLength={2000}
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Color
          </label>
          <div className="flex gap-1">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-5 h-5 ${
                  color === c ? "ring-2 ring-offset-1 ring-offset-surface-container ring-on-surface" : ""
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Pick ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Pane
          </label>
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={() => setOverlay(true)}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                overlay
                  ? "bg-cyan/20 text-cyan"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              On price
            </button>
            <button
              type="button"
              onClick={() => setOverlay(false)}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                !overlay
                  ? "bg-cyan/20 text-cyan"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              Separate
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          Examples
        </label>
        <div className="flex flex-wrap gap-1">
          {INDICATOR_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => {
                setExpression(ex.expression);
                if (!name) setName(ex.label);
              }}
              className="text-[10px] px-2 py-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-[10px] text-crimson font-mono">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-cyan text-[#004343] font-bold text-[10px] uppercase tracking-wider px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-on-surface-variant hover:text-on-surface text-[10px] font-bold uppercase tracking-wider px-3 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
