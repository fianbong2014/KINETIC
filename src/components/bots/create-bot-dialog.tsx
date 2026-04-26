"use client";

import { useState } from "react";
import { X, Bot } from "lucide-react";
import { useBots, type TradingBot, type NewBot, type BotPatch } from "@/hooks/use-bots";
import { useToast } from "@/components/providers/toast-provider";
import { PAIRS } from "@/lib/symbols";

interface CreateBotDialogProps {
  /** Pass an existing bot to edit, omit to create. */
  initial?: TradingBot;
  onClose: () => void;
}

const TRIGGER_OPTIONS = [
  {
    value: "mtf_aligned",
    label: "Multi-TF Aligned",
    description: "All 3 timeframes (1H · 4H · 1D) agree on direction",
  },
  {
    value: "single_tf_bias",
    label: "Single TF Bias",
    description: "Selected timeframe is bullish or bearish",
  },
  {
    value: "rsi_extreme",
    label: "RSI Extreme (Fade)",
    description: "Counter-trend: short overbought / long oversold",
  },
] as const;

const SIDE_OPTIONS = [
  { value: "ANY", label: "Auto", hint: "Follow detected bias" },
  { value: "LONG", label: "Long Only", hint: "Skip bearish setups" },
  { value: "SHORT", label: "Short Only", hint: "Skip bullish setups" },
] as const;

export function CreateBotDialog({ initial, onClose }: CreateBotDialogProps) {
  const { create, update } = useBots();
  const toast = useToast();
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [symbols, setSymbols] = useState<string[]>(initial?.symbols ?? []);
  const [triggerType, setTriggerType] = useState(
    initial?.triggerType ?? "mtf_aligned"
  );
  const [tfFilter, setTfFilter] = useState(initial?.tfFilter ?? "4h");
  const [minConfidence, setMinConfidence] = useState(
    initial?.minConfidence ?? 70
  );
  const [side, setSide] = useState(initial?.side ?? "ANY");
  const [positionSizePct, setPositionSizePct] = useState(
    initial?.positionSizePct ?? 5
  );
  const [stopLossPct, setStopLossPct] = useState(
    initial?.stopLossPct?.toString() ?? "2"
  );
  const [takeProfitPct, setTakeProfitPct] = useState(
    initial?.takeProfitPct?.toString() ?? "5"
  );
  const [trailingPct, setTrailingPct] = useState(
    initial?.trailingPct?.toString() ?? ""
  );
  const [maxOpenPositions, setMaxOpenPositions] = useState(
    initial?.maxOpenPositions ?? 1
  );
  const [cooldownMinutes, setCooldownMinutes] = useState(
    initial?.cooldownMinutes ?? 60
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleSymbol(symbol: string) {
    setSymbols((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    const payload = {
      name: name.trim(),
      symbols,
      triggerType: triggerType as NewBot["triggerType"],
      tfFilter,
      minConfidence,
      side: side as NewBot["side"],
      positionSizePct,
      stopLossPct: stopLossPct ? parseFloat(stopLossPct) : null,
      takeProfitPct: takeProfitPct ? parseFloat(takeProfitPct) : null,
      trailingPct: trailingPct ? parseFloat(trailingPct) : null,
      maxOpenPositions,
      cooldownMinutes,
    };

    setSubmitting(true);
    try {
      if (isEdit && initial) {
        await update(initial.id, payload as BotPatch);
        toast.success("Bot Updated", `"${payload.name}" is now active`);
      } else {
        await create(payload as NewBot);
        toast.success("Bot Created", `"${payload.name}" is enabled`);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save bot");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-low w-full max-w-2xl border border-outline-variant/10 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#004343]" />
            </div>
            <div>
              <h3 className="text-sm font-black font-heading tracking-wider uppercase text-on-surface">
                {isEdit ? "Edit Bot" : "Create Trading Bot"}
              </h3>
              <p className="text-[10px] text-on-surface-variant tracking-wider mt-0.5">
                {isEdit
                  ? "Update strategy parameters"
                  : "Auto-trade when signals match"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 max-h-[70vh] overflow-y-auto flex flex-col gap-5"
        >
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 p-2 text-xs text-crimson-accent">
              {error}
            </div>
          )}

          {/* Name */}
          <Field label="Bot Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. MTF Trend Follower"
              className="w-full bg-surface-container-lowest border border-outline-variant/10 text-sm text-on-surface px-3 py-2.5 focus:outline-none focus:border-primary"
            />
          </Field>

          {/* Trigger type */}
          <Field label="Trigger Strategy">
            <div className="flex flex-col gap-1">
              {TRIGGER_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`bg-surface-container-lowest p-3 cursor-pointer border-l-2 transition-colors ${
                    triggerType === opt.value
                      ? "border-cyan bg-cyan/5"
                      : "border-transparent hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="trigger"
                      value={opt.value}
                      checked={triggerType === opt.value}
                      onChange={() => setTriggerType(opt.value)}
                      className="accent-cyan"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-surface">
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        {opt.description}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </Field>

          {/* TF filter (only relevant for non-MTF triggers) */}
          {triggerType !== "mtf_aligned" && (
            <Field label="Timeframe Filter">
              <div className="flex gap-1">
                {["1h", "4h", "1d"].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTfFilter(tf)}
                    className={`flex-1 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${
                      tfFilter === tf
                        ? "bg-cyan text-[#004343]"
                        : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* Min confidence */}
          <Field
            label={`Min Confidence — ${minConfidence}%`}
            hint="Only trade when composite confidence ≥ this value"
          >
            <input
              type="range"
              min="0"
              max="99"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseInt(e.target.value))}
              className="w-full h-1 bg-surface-container-high appearance-none cursor-pointer accent-cyan"
            />
          </Field>

          {/* Side */}
          <Field label="Trade Side">
            <div className="grid grid-cols-3 gap-1">
              {SIDE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSide(opt.value)}
                  className={`p-2 flex flex-col items-center gap-0.5 transition-colors ${
                    side === opt.value
                      ? opt.value === "LONG"
                        ? "bg-cyan/20 text-cyan"
                        : opt.value === "SHORT"
                          ? "bg-orange/20 text-orange"
                          : "bg-surface-container-highest text-on-surface"
                      : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="text-[10px] font-bold tracking-wider uppercase">
                    {opt.label}
                  </span>
                  <span className="text-[9px] opacity-80">{opt.hint}</span>
                </button>
              ))}
            </div>
          </Field>

          {/* Symbols */}
          <Field
            label={`Symbols ${symbols.length > 0 ? `(${symbols.length} selected)` : "(All pairs)"}`}
            hint="Leave empty to scan all configured pairs"
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
              {PAIRS.map((p) => {
                const active = symbols.includes(p.symbol);
                return (
                  <button
                    key={p.symbol}
                    type="button"
                    onClick={() => toggleSymbol(p.symbol)}
                    className={`py-2 text-[10px] font-bold tracking-wider transition-colors ${
                      active
                        ? "bg-primary/20 text-primary"
                        : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {p.base}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Position sizing */}
          <Field
            label={`Position Size — ${positionSizePct}% of balance`}
            hint="Per trade. e.g. $10k balance × 5% = $500 per trade"
          >
            <input
              type="range"
              min="0.5"
              max="50"
              step="0.5"
              value={positionSizePct}
              onChange={(e) => setPositionSizePct(parseFloat(e.target.value))}
              className="w-full h-1 bg-surface-container-high appearance-none cursor-pointer accent-cyan"
            />
          </Field>

          {/* SL / TP / Trailing */}
          <div className="grid grid-cols-3 gap-2">
            <Field label="Stop Loss %">
              <input
                type="number"
                step="any"
                value={stopLossPct}
                onChange={(e) => setStopLossPct(e.target.value)}
                placeholder="2"
                className="w-full bg-surface-container-lowest border border-outline-variant/10 text-sm text-on-surface font-mono px-2 py-2 focus:outline-none focus:border-crimson"
              />
            </Field>
            <Field label="Take Profit %">
              <input
                type="number"
                step="any"
                value={takeProfitPct}
                onChange={(e) => setTakeProfitPct(e.target.value)}
                placeholder="5"
                className="w-full bg-surface-container-lowest border border-outline-variant/10 text-sm text-on-surface font-mono px-2 py-2 focus:outline-none focus:border-emerald-accent"
              />
            </Field>
            <Field label="Trailing %">
              <input
                type="number"
                step="any"
                value={trailingPct}
                onChange={(e) => setTrailingPct(e.target.value)}
                placeholder="—"
                className="w-full bg-surface-container-lowest border border-outline-variant/10 text-sm text-on-surface font-mono px-2 py-2 focus:outline-none focus:border-primary"
              />
            </Field>
          </div>

          {/* Concurrency */}
          <div className="grid grid-cols-2 gap-2">
            <Field
              label={`Max Concurrent — ${maxOpenPositions}`}
              hint="Max simultaneous bot positions"
            >
              <input
                type="range"
                min="1"
                max="10"
                value={maxOpenPositions}
                onChange={(e) =>
                  setMaxOpenPositions(parseInt(e.target.value))
                }
                className="w-full h-1 bg-surface-container-high appearance-none cursor-pointer accent-cyan"
              />
            </Field>
            <Field
              label={`Cooldown — ${cooldownMinutes}m`}
              hint="Wait between trades"
            >
              <input
                type="range"
                min="0"
                max="240"
                step="5"
                value={cooldownMinutes}
                onChange={(e) =>
                  setCooldownMinutes(parseInt(e.target.value))
                }
                className="w-full h-1 bg-surface-container-high appearance-none cursor-pointer accent-cyan"
              />
            </Field>
          </div>

          {/* Action row */}
          <div className="flex gap-2 mt-2 sticky bottom-0 bg-surface-container-low pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-surface-container text-on-surface-variant text-xs font-bold uppercase tracking-widest py-3 hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-cyan text-[#004343] font-heading font-bold text-xs uppercase tracking-wider py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Deploy Bot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-on-surface-variant tracking-wider uppercase font-bold">
        {label}
      </label>
      {children}
      {hint && (
        <span className="text-[10px] text-on-surface-variant/70 leading-tight">
          {hint}
        </span>
      )}
    </div>
  );
}
