"use client";

import { useState } from "react";
import { usePositions } from "@/hooks/use-positions";
import { useAccount, notifyAccountChanged } from "@/hooks/use-account";
import { useSettings } from "@/hooks/use-settings";
import { usePrice } from "@/components/providers/price-provider";
import { useToast } from "@/components/providers/toast-provider";
import { writeNotification } from "@/hooks/use-notifications";
import { formatPrice, formatUsd } from "@/lib/format";
import { isLiveTradable } from "@/lib/symbols";

export function TradeExecution() {
  const { create } = usePositions();
  const { balance, loading: accountLoading } = useAccount();
  const { settings } = useSettings();
  const { price: livePrice, symbol, pair } = usePrice();
  const toast = useToast();

  const [tradeMode, setTradeMode] = useState<"paper" | "live">("paper");
  const [leverage, setLeverage] = useState("3");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [amount, setAmount] = useState("0.05");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [trailingDistance, setTrailingDistance] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const confirmBeforeOpen = settings.trading?.confirmBeforeOpen ?? true;

  const liveAvailable = isLiveTradable(symbol);

  async function handleSubmit(side: "LONG" | "SHORT") {
    setMessage(null);
    const size = parseFloat(amount);
    if (isNaN(size) || size <= 0) {
      setMessage({ type: "err", text: "Invalid amount" });
      return;
    }

    const isLive = tradeMode === "live";
    if (isLive) {
      if (!liveAvailable) {
        setMessage({
          type: "err",
          text: `${pair.base} not available for live trading on OKX`,
        });
        return;
      }
      if (orderType === "LIMIT") {
        setMessage({
          type: "err",
          text: "Live mode supports MARKET orders only (Phase 2)",
        });
        return;
      }
    }

    const entryPrice =
      orderType === "LIMIT" && limitPrice
        ? parseFloat(limitPrice)
        : livePrice;

    if (!entryPrice || entryPrice <= 0) {
      setMessage({
        type: "err",
        text: "Live price unavailable — try again",
      });
      return;
    }

    const notional = size * entryPrice;

    // Paper balance check only applies to paper trades — live trades
    // draw on OKX margin (with leverage), not the in-app paper balance.
    if (!isLive && notional > balance) {
      setMessage({
        type: "err",
        text: `Exceeds balance ($${formatPrice(balance)})`,
      });
      return;
    }

    const sl = stopLoss ? parseFloat(stopLoss) : undefined;
    const tp = takeProfit ? parseFloat(takeProfit) : undefined;
    const trail = trailingDistance
      ? parseFloat(trailingDistance)
      : undefined;

    // Validate SL/TP direction
    if (sl !== undefined) {
      if (side === "LONG" && sl >= entryPrice) {
        setMessage({ type: "err", text: "SL must be below entry for LONG" });
        return;
      }
      if (side === "SHORT" && sl <= entryPrice) {
        setMessage({ type: "err", text: "SL must be above entry for SHORT" });
        return;
      }
    }
    if (tp !== undefined) {
      if (side === "LONG" && tp <= entryPrice) {
        setMessage({ type: "err", text: "TP must be above entry for LONG" });
        return;
      }
      if (side === "SHORT" && tp >= entryPrice) {
        setMessage({ type: "err", text: "TP must be below entry for SHORT" });
        return;
      }
    }

    const lev = isLive
      ? Math.max(1, Math.min(125, Math.floor(parseFloat(leverage) || 3)))
      : undefined;

    // Live orders ALWAYS confirm (ignore the paper "confirmBeforeOpen"
    // preference) and the dialog is explicit about real funds.
    const confirmText = isLive
      ? `⚠️ LIVE OKX ORDER — REAL FUNDS\n\n${side} ${size} ${pair.base} @ ~$${formatPrice(
          entryPrice
        )}\nLeverage: ${lev}x · Notional ~${formatUsd(
          notional
        )}\n\nPlace REAL market order on OKX?`
      : `${side} ${size} ${pair.base} @ $${formatPrice(
          entryPrice
        )}\nNotional: ${formatUsd(notional)}\n\nPlace order?`;

    if ((isLive || confirmBeforeOpen) && !confirm(confirmText)) {
      return;
    }

    setSubmitting(true);
    try {
      await create({
        asset: symbol,
        side,
        size,
        entry: entryPrice,
        stopLoss: sl,
        takeProfit: tp,
        trailingDistance: trail && trail > 0 ? trail : undefined,
        mode: tradeMode,
        leverage: lev,
      });
      notifyAccountChanged();
      const tag = isLive ? "[LIVE] " : "";
      const successMsg = `${tag}${side} ${size} ${pair.base} @ $${formatPrice(entryPrice)}`;
      setMessage({ type: "ok", text: successMsg });
      toast.success(
        `${tag}${side} Order Placed`,
        `${size} ${pair.base} @ $${formatPrice(entryPrice)} · Notional ${formatUsd(notional)}`
      );
      writeNotification({
        type: "trade",
        title: `${tag}${side} Order Placed`,
        body: `${size} ${pair.base} @ $${formatPrice(entryPrice)} · Notional ${formatUsd(notional)}`,
        meta: {
          symbol,
          side,
          size,
          entry: entryPrice,
          notional,
          mode: tradeMode,
        },
      });
      // Clear form
      setStopLoss("");
      setTakeProfit("");
      setLimitPrice("");
      setTrailingDistance("");
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Failed to place order";
      setMessage({ type: "err", text: errMsg });
      toast.error("Order Failed", errMsg);
    } finally {
      setSubmitting(false);
    }
  }

  const notional =
    parseFloat(amount) && livePrice ? parseFloat(amount) * livePrice : 0;

  return (
    <section className="bg-surface-container-high p-5 space-y-4">
      {/* Paper / Live mode toggle */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setTradeMode("paper")}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
              tradeMode === "paper"
                ? "bg-on-surface text-surface-container-lowest"
                : "bg-surface-container-lowest text-on-surface-variant"
            }`}
          >
            Paper
          </button>
          <button
            onClick={() => {
              if (!liveAvailable) return;
              setTradeMode("live");
              setOrderType("MARKET");
            }}
            disabled={!liveAvailable}
            title={
              liveAvailable
                ? "Place real orders on OKX"
                : `${pair.base} not available for live trading on OKX`
            }
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
              tradeMode === "live"
                ? "bg-crimson text-white"
                : "bg-surface-container-lowest text-on-surface-variant"
            } ${!liveAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            Live ⚠
          </button>
        </div>
        {tradeMode === "live" && (
          <div className="flex items-center gap-2 bg-crimson/10 p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-crimson shrink-0">
              Leverage
            </span>
            <input
              type="number"
              min={1}
              max={125}
              step={1}
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
              className="w-16 bg-surface-container-lowest text-xs font-bold py-1 px-2 text-on-surface focus:ring-1 focus:ring-crimson outline-none tabular-nums"
            />
            <span className="text-[9px] text-on-surface-variant leading-tight">
              REAL funds on OKX · requires trade lock ENABLED in Settings
            </span>
          </div>
        )}
      </div>

      {/* Market / Limit toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setOrderType("MARKET")}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
            orderType === "MARKET"
              ? "bg-cyan text-primary-foreground"
              : "bg-surface-container-lowest text-on-surface-variant"
          }`}
        >
          Market
        </button>
        <button
          onClick={() => setOrderType("LIMIT")}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
            orderType === "LIMIT"
              ? "bg-cyan text-primary-foreground"
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
            Amount ({pair.base})
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
              placeholder={livePrice ? formatPrice(livePrice) : "Market"}
              className="w-full bg-surface-container-lowest border-0 text-sm font-heading font-bold py-3 px-3 text-on-surface focus:ring-1 focus:ring-cyan focus:bg-surface-bright transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <label className="absolute -top-2 left-2 px-1 bg-surface-container-high text-[8px] font-bold text-on-surface-variant uppercase">
              Stop Loss
            </label>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="—"
              className="w-full bg-surface-container-lowest border-0 text-sm font-heading font-bold py-3 px-3 text-on-surface focus:ring-1 focus:ring-crimson focus:bg-surface-bright transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
          <div className="relative">
            <label className="absolute -top-2 left-2 px-1 bg-surface-container-high text-[8px] font-bold text-on-surface-variant uppercase">
              Take Profit
            </label>
            <input
              type="number"
              step="any"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="—"
              className="w-full bg-surface-container-lowest border-0 text-sm font-heading font-bold py-3 px-3 text-on-surface focus:ring-1 focus:ring-emerald-accent focus:bg-surface-bright transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-[10px] text-on-surface-variant hover:text-on-surface tracking-wider uppercase font-bold"
        >
          {showAdvanced ? "− Hide Advanced" : "+ Advanced"}
        </button>

        {showAdvanced && (
          <div className="relative">
            <label className="absolute -top-2 left-2 px-1 bg-surface-container-high text-[8px] font-bold text-on-surface-variant uppercase">
              Trailing Stop Distance ($)
            </label>
            <input
              type="number"
              step="any"
              value={trailingDistance}
              onChange={(e) => setTrailingDistance(e.target.value)}
              placeholder="e.g. 500 — SL trails price by $500"
              className="w-full bg-surface-container-lowest border-0 text-sm font-heading font-bold py-3 px-3 text-on-surface focus:ring-1 focus:ring-cyan focus:bg-surface-bright transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
        )}
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
          className="flex-1 bg-orange text-secondary-foreground py-4 font-heading font-black uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "..." : "Sell / Short"}
        </button>
      </div>

      {/* Balance / Notional */}
      <div className="pt-2 grid grid-cols-2 gap-2 text-[10px] font-bold uppercase text-on-surface-variant">
        <div className="flex flex-col">
          <span>Market</span>
          <span className="text-on-surface font-mono tabular-nums normal-case">
            ${livePrice ? formatPrice(livePrice) : "—"}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span>Balance</span>
          <span
            className={`font-mono tabular-nums normal-case ${
              notional > balance && !accountLoading
                ? "text-crimson"
                : "text-on-surface"
            }`}
          >
            {accountLoading ? "—" : formatUsd(balance)}
          </span>
        </div>
      </div>

      {notional > 0 && (
        <div className="text-[10px] font-bold uppercase text-on-surface-variant text-center">
          Notional:{" "}
          <span className="text-on-surface font-mono tabular-nums normal-case">
            {formatUsd(notional)}
          </span>
        </div>
      )}
    </section>
  );
}
