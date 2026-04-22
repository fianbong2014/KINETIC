"use client";

import { useEffect, useRef } from "react";
import { usePositions } from "@/hooks/use-positions";
import { notifyAccountChanged } from "@/hooks/use-account";
import { useSettings } from "@/hooks/use-settings";
import { usePrice } from "@/components/providers/price-provider";
import { useToast } from "@/components/providers/toast-provider";
import { notify } from "@/lib/notifications";
import { formatPrice, formatUsd } from "@/lib/format";

/**
 * Client-side Stop Loss / Take Profit / Trailing Stop trigger monitor.
 *
 * Watches positions whose asset matches the currently selected pair and:
 *   1. Tightens the SL when price moves favorably (trailing stop)
 *   2. Auto-closes positions when price crosses SL or TP
 *
 * Only active while the dashboard is open — no server-side worker.
 */
export function usePositionMonitor() {
  const { positions, close, modifySLTP } = usePositions("active");
  const { settings } = useSettings();
  const { price, symbol } = usePrice();

  // Guard so we don't fire multiple close requests for the same position
  // while a close is still in flight.
  const closingRef = useRef<Set<string>>(new Set());
  // Remember last trailing update to avoid write storms on every tick.
  const lastTrailUpdateRef = useRef<Map<string, number>>(new Map());

  const toast = useToast();

  const slAlertEnabled =
    settings.notifications?.alertTypes?.stopLossTriggered ?? true;
  const tpAlertEnabled =
    settings.notifications?.alertTypes?.takeProfitHit ?? true;

  useEffect(() => {
    if (!price || price <= 0) return;

    const eligible = positions.filter(
      (p) =>
        p.asset === symbol &&
        p.status === "active" &&
        !closingRef.current.has(p.id)
    );

    for (const pos of eligible) {
      // ── Trailing stop update ────────────────────────────────────
      if (pos.trailingDistance && pos.trailingDistance > 0) {
        const prevHwm = pos.trailingHighWater ?? pos.entry;
        let newHwm = prevHwm;
        let newSL = pos.stopLoss;
        let shouldUpdate = false;

        if (pos.side === "LONG") {
          if (price > prevHwm) {
            newHwm = price;
            const candidateSL = price - pos.trailingDistance;
            // Only tighten (never loosen)
            if (candidateSL > (pos.stopLoss ?? -Infinity)) {
              newSL = candidateSL;
              shouldUpdate = true;
            }
          }
        } else {
          if (price < prevHwm) {
            newHwm = price;
            const candidateSL = price + pos.trailingDistance;
            if (candidateSL < (pos.stopLoss ?? Infinity)) {
              newSL = candidateSL;
              shouldUpdate = true;
            }
          }
        }

        if (shouldUpdate && newSL !== null) {
          // Throttle: don't send more than one trail update per 2 seconds per position
          const now = Date.now();
          const last = lastTrailUpdateRef.current.get(pos.id) ?? 0;
          if (now - last > 2000) {
            lastTrailUpdateRef.current.set(pos.id, now);
            modifySLTP(pos.id, {
              stopLoss: newSL,
              trailingHighWater: newHwm,
            }).catch(() => {
              // Rewind the throttle on failure so we retry quickly
              lastTrailUpdateRef.current.delete(pos.id);
            });
          }
        }
      }

      // ── SL / TP trigger ─────────────────────────────────────────
      let triggered: "SL" | "TP" | null = null;

      if (pos.side === "LONG") {
        if (pos.stopLoss && price <= pos.stopLoss) triggered = "SL";
        else if (pos.takeProfit && price >= pos.takeProfit) triggered = "TP";
      } else {
        if (pos.stopLoss && price >= pos.stopLoss) triggered = "SL";
        else if (pos.takeProfit && price <= pos.takeProfit) triggered = "TP";
      }

      if (!triggered) continue;

      const exitPrice =
        triggered === "SL" ? pos.stopLoss! : pos.takeProfit!;
      const pnl =
        pos.side === "LONG"
          ? (exitPrice - pos.entry) * pos.size
          : (pos.entry - exitPrice) * pos.size;

      closingRef.current.add(pos.id);
      const alertEnabled =
        triggered === "SL" ? slAlertEnabled : tpAlertEnabled;

      close(pos.id, exitPrice, pnl)
        .then(() => {
          notifyAccountChanged();

          const toastTitle = `${triggered} hit — ${pos.asset} ${pos.side}`;
          const toastBody = `Exit $${formatPrice(exitPrice)} · PNL ${formatUsd(pnl, { signed: true })}`;
          if (triggered === "TP") toast.success(toastTitle, toastBody);
          else toast.warning(toastTitle, toastBody);

          if (alertEnabled) {
            notify({
              title: toastTitle,
              body: toastBody,
              tag: `pos-${pos.id}`,
            });
          }
        })
        .catch(() => {
          closingRef.current.delete(pos.id);
        });
    }
  }, [
    price,
    positions,
    symbol,
    close,
    modifySLTP,
    toast,
    slAlertEnabled,
    tpAlertEnabled,
  ]);
}
