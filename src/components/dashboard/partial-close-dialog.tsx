"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Position } from "@/hooks/use-positions";
import { formatPrice, formatUsd } from "@/lib/format";

interface PartialCloseDialogProps {
  position: Position;
  markPrice: number;
  onConfirm: (closeSize: number, exitPrice: number) => Promise<void>;
  onClose: () => void;
}

const PRESET_PCTS = [25, 50, 75, 100];

export function PartialCloseDialog({
  position,
  markPrice,
  onConfirm,
  onClose,
}: PartialCloseDialogProps) {
  const [pct, setPct] = useState(50);
  const [exitPrice, setExitPrice] = useState(
    markPrice > 0 ? markPrice.toFixed(2) : position.entry.toFixed(2)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const closeSize = (position.size * pct) / 100;
  const exitNum = parseFloat(exitPrice);
  const remainingSize = position.size - closeSize;

  const pnl =
    Number.isFinite(exitNum) && exitNum > 0
      ? position.side === "LONG"
        ? (exitNum - position.entry) * closeSize
        : (position.entry - exitNum) * closeSize
      : 0;
  const pnlPct =
    position.entry > 0 && closeSize > 0
      ? (pnl / (position.entry * closeSize)) * 100
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!Number.isFinite(exitNum) || exitNum <= 0) {
      setError("Invalid exit price");
      return;
    }
    if (closeSize <= 0 || closeSize > position.size) {
      setError("Invalid close size");
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(closeSize, exitNum);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to close");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-low w-full max-w-md border border-outline-variant/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/10">
          <div>
            <h3 className="text-sm font-black font-heading tracking-wider uppercase text-on-surface">
              Close Position
            </h3>
            <p className="text-[10px] text-on-surface-variant mt-1">
              {position.asset}{" "}
              <span
                className={
                  position.side === "LONG" ? "text-cyan" : "text-orange"
                }
              >
                {position.side}
              </span>{" "}
              · {position.size}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 p-2 text-xs text-crimson-accent">
              {error}
            </div>
          )}

          {/* Percentage presets */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-on-surface-variant tracking-wider uppercase font-bold">
              Close Amount
            </label>
            <div className="grid grid-cols-4 gap-1">
              {PRESET_PCTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPct(p)}
                  className={`py-2.5 text-xs font-bold tracking-widest transition-colors ${
                    pct === p
                      ? "bg-primary text-[#004343]"
                      : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={pct}
              onChange={(e) => setPct(parseInt(e.target.value))}
              className="w-full h-1 bg-surface-container-high appearance-none cursor-pointer accent-cyan"
            />
          </div>

          {/* Exit price */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant tracking-wider uppercase font-bold">
              Exit Price
            </label>
            <input
              type="number"
              step="any"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/10 text-sm text-on-surface font-mono px-3 py-2.5 focus:outline-none focus:border-primary"
            />
            {markPrice > 0 && (
              <button
                type="button"
                onClick={() => setExitPrice(markPrice.toFixed(2))}
                className="self-start text-[9px] text-cyan hover:underline tracking-wider uppercase font-bold"
              >
                Use mark ${formatPrice(markPrice)}
              </button>
            )}
          </div>

          {/* Preview */}
          <div className="bg-surface-container p-3 grid grid-cols-2 gap-3 text-[10px]">
            <div>
              <span className="block text-on-surface-variant uppercase tracking-wider">
                Closing
              </span>
              <span className="text-sm font-mono tabular-nums text-on-surface">
                {closeSize.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="block text-on-surface-variant uppercase tracking-wider">
                Remaining
              </span>
              <span className="text-sm font-mono tabular-nums text-on-surface">
                {remainingSize.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="block text-on-surface-variant uppercase tracking-wider">
                Realized PNL
              </span>
              <span
                className={`text-sm font-mono tabular-nums font-bold ${
                  pnl >= 0 ? "text-emerald-accent" : "text-crimson"
                }`}
              >
                {formatUsd(pnl, { signed: true })}
              </span>
            </div>
            <div>
              <span className="block text-on-surface-variant uppercase tracking-wider">
                PNL %
              </span>
              <span
                className={`text-sm font-mono tabular-nums font-bold ${
                  pnlPct >= 0 ? "text-emerald-accent" : "text-crimson"
                }`}
              >
                {pnlPct >= 0 ? "+" : ""}
                {pnlPct.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex gap-2">
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
              className={`flex-1 font-heading font-bold text-xs uppercase tracking-wider py-3 transition-opacity hover:opacity-90 disabled:opacity-50 ${
                pnl >= 0
                  ? "bg-emerald-accent text-[#0b3a1f]"
                  : "bg-crimson text-white"
              }`}
            >
              {submitting
                ? "Closing..."
                : pct === 100
                  ? "Close Full"
                  : `Close ${pct}%`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
