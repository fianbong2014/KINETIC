"use client";

import { useState } from "react";
import { usePositions } from "@/hooks/use-positions";
import { usePrice } from "@/components/providers/price-provider";
import { formatPrice } from "@/lib/format";

export function TradeExecution() {
  const { create } = usePositions();
  const { price: btcPrice } = usePrice();

  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [amount, setAmount] = useState("0.50");
  const [stopLoss, setStopLoss] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  async function handleSubmit(side: "LONG" | "SHORT") {
    setMessage(null);
    const size = parseFloat(amount);
    if (isNaN(size) || size <= 0) {
      setMessage({ type: "err", text: "Invalid amount" });
      return;
    }

    const entryPrice =
      orderType === "LIMIT" && limitPrice
        ? parseFloat(limitPrice)
        : btcPrice;

    if (!entryPrice || entryPrice <= 0) {
      setMessage({
        type: "err",
        text: "Live price unavailable — try again",
      });
      return;
    }

    const sl = stopLoss ? parseFloat(stopLoss) : undefined;

    setSubmitting(true);
    try {
      await create({
        asset: "BTCUSDT",
        side,
        size,
        entry: entryPrice,
        stopLoss: sl,
      });
      setMessage({
        type: "ok",
        text: `${side} ${size} BTC @ $${formatPrice(entryPrice)}`,
      });
      // Clear form
      setStopLoss("");
      setLimitPrice("");
    } catch (e) {
      setMessage({
        type: "err",
        text: e instanceof Error ? e.message : "Failed to place order",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-surface-container-high p-5 space-y-4">
      {/* Market / Limit toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setOrderType("MARKET")}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
            orderType === "MARKET"
              ? "bg-cyan text-[#004343]"
              : "bg-surface-container-lowest text-on-surface-variant"
          }`}
        >
          Market
        </button>
        <button
          onClick={() => setOrderType("LIMIT")}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
            orderType === "LIMIT"
              ? "bg-cyan text-[#004343]"
              : "bg-surface-container-lowest text-on-surface-variant"
          }`}
        >
          Limit
        </button>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        <div className="relative">
          <label className="absolute -top-2 left-2 px-1 bg-surface-container-high text-[8px] font-bold text-on-surface-variant uppercase">
            Amount (BTC)
          </label>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-surface-container-lowest border-0 text-sm font-heading font-bold py-3 px-3 text-on-surface focus:ring-1 focus:ring-cyan focus:bg-surface-bright transition-all"
          />
        </div>

        {orderType === "LIMIT" && (
          <div className="relative">
            <label className="absolute -top-2 left-2 px-1 bg-surface-container-high text-[8px] font-bold text-on-surface-variant uppercase">
              Limit Price
            </label>
            <input
              type="number"
              step="any"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={btcPrice ? formatPrice(btcPrice) : "Market"}
              className="w-full bg-surface-container-lowest border-0 text-sm font-heading font-bold py-3 px-3 text-on-surface focus:ring-1 focus:ring-cyan focus:bg-surface-bright transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
        )}

        <div className="relative">
          <label className="absolute -top-2 left-2 px-1 bg-surface-container-high text-[8px] font-bold text-on-surface-variant uppercase">
            Stop Loss (optional)
          </label>
          <input
            type="number"
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="No stop loss"
            className="w-full bg-surface-container-lowest border-0 text-sm font-heading font-bold py-3 px-3 text-on-surface focus:ring-1 focus:ring-cyan focus:bg-surface-bright transition-all placeholder:text-on-surface-variant/50"
          />
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`text-[10px] font-bold tracking-wider uppercase p-2 ${
            message.type === "ok"
              ? "bg-emerald-accent/10 text-emerald-accent"
              : "bg-destructive/10 text-crimson-accent"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Buy / Sell buttons */}
      <div className="flex gap-4 pt-2">
        <button
          onClick={() => handleSubmit("LONG")}
          disabled={submitting}
          className="flex-1 bg-cyan text-[#006767] py-4 font-heading font-black uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "..." : "Buy / Long"}
        </button>
        <button
          onClick={() => handleSubmit("SHORT")}
          disabled={submitting}
          className="flex-1 bg-orange text-[#430b00] py-4 font-heading font-black uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "..." : "Sell / Short"}
        </button>
      </div>

      {/* Fee / Available */}
      <div className="pt-2 flex justify-between text-[10px] font-bold uppercase text-on-surface-variant">
        <span>Market: ${btcPrice ? formatPrice(btcPrice) : "—"}</span>
        <span>Paper Trading</span>
      </div>
    </section>
  );
}
