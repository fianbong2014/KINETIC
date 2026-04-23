"use client";

import { useState, useEffect } from "react";
import { X, Bell } from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import { useAlerts, type NewAlert } from "@/hooks/use-alerts";
import { useToast } from "@/components/providers/toast-provider";
import { formatPrice } from "@/lib/format";

interface CreateAlertDialogProps {
  onClose: () => void;
  // Optional pre-filled price (e.g. when clicking on order book level)
  prefilledPrice?: number;
}

const PRESET_OFFSETS = [
  { label: "-5%", pct: -5 },
  { label: "-2%", pct: -2 },
  { label: "-1%", pct: -1 },
  { label: "+1%", pct: 1 },
  { label: "+2%", pct: 2 },
  { label: "+5%", pct: 5 },
];

export function CreateAlertDialog({
  onClose,
  prefilledPrice,
}: CreateAlertDialogProps) {
  const { symbol, price: livePrice, pair } = usePrice();
  const { create } = useAlerts();
  const toast = useToast();

  const initialPrice = prefilledPrice ?? livePrice;
  const [price, setPrice] = useState(
    initialPrice > 0 ? initialPrice.toFixed(2) : ""
  );
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Auto-derive direction from target price vs current
  useEffect(() => {
    // No-op placeholder; direction is derived at submit time
  }, []);

  function applyOffset(pct: number) {
    if (livePrice <= 0) return;
    const newPrice = livePrice * (1 + pct / 100);
    setPrice(newPrice.toFixed(2));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const priceNum = parseFloat(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Enter a valid target price");
      return;
    }

    // Auto-determine direction based on target vs live
    const direction: NewAlert["direction"] =
      priceNum > livePrice ? "above" : "below";

    setSubmitting(true);
    try {
      await create({
        symbol,
        price: priceNum,
        direction,
        message: message.trim() || undefined,
      });
      toast.success(
        "Alert Created",
        `${pair.display} ${direction === "above" ? "↑" : "↓"} $${formatPrice(priceNum)}`
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create alert");
    } finally {
      setSubmitting(false);
    }
  }

  const priceNum = parseFloat(price);
  const validPrice = Number.isFinite(priceNum) && priceNum > 0;
  const direction =
    validPrice && livePrice > 0
      ? priceNum > livePrice
        ? "above"
        : "below"
      : null;
  const diffPct =
    validPrice && livePrice > 0
      ? ((priceNum - livePrice) / livePrice) * 100
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-low w-full max-w-md border border-outline-variant/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/10">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan" />
            <h3 className="text-sm font-black font-heading tracking-wider uppercase text-on-surface">
              New Price Alert
            </h3>
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

          {/* Symbol + Current */}
          <div className="bg-surface-container p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                Pair
              </p>
              <p className="text-sm font-bold text-on-surface">
                {pair.display}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                Current
              </p>
              <p className="text-sm font-mono tabular-nums text-on-surface">
                ${formatPrice(livePrice)}
              </p>
            </div>
          </div>

          {/* Target Price */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant tracking-wider uppercase font-bold">
              Target Price
            </label>
            <input
              type="number"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full bg-surface-container-lowest border border-outline-variant/10 text-lg font-mono tabular-nums text-on-surface px-3 py-2.5 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Quick offsets */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-on-surface-variant tracking-wider uppercase font-bold">
              Quick Offset
            </label>
            <div className="grid grid-cols-6 gap-1">
              {PRESET_OFFSETS.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => applyOffset(o.pct)}
                  className={`py-1.5 text-[10px] font-bold tracking-wider transition-colors ${
                    o.pct < 0
                      ? "bg-crimson/10 text-crimson hover:bg-crimson/20"
                      : "bg-emerald-accent/10 text-emerald-accent hover:bg-emerald-accent/20"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant tracking-wider uppercase font-bold">
              Note (optional)
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Key resistance level"
              className="w-full bg-surface-container-lowest border border-outline-variant/10 text-sm text-on-surface px-3 py-2.5 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Preview */}
          {validPrice && livePrice > 0 && (
            <div
              className={`p-3 text-[10px] ${
                direction === "above"
                  ? "bg-emerald-accent/5 border-l-2 border-emerald-accent"
                  : "bg-crimson/5 border-l-2 border-crimson"
              }`}
            >
              <p className="text-on-surface-variant uppercase tracking-wider">
                Alert fires when price goes{" "}
                <span
                  className={
                    direction === "above"
                      ? "text-emerald-accent font-bold"
                      : "text-crimson font-bold"
                  }
                >
                  {direction === "above" ? "above" : "below"} $
                  {formatPrice(priceNum)}
                </span>
              </p>
              <p className="text-on-surface-variant/80 mt-0.5">
                {diffPct >= 0 ? "+" : ""}
                {diffPct.toFixed(2)}% from current
              </p>
            </div>
          )}

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
              disabled={submitting || !validPrice}
              className="flex-1 bg-cyan text-[#004343] font-heading font-bold text-xs uppercase tracking-wider py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Alert"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
