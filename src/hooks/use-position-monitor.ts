"use client";

import { useEffect, useRef } from "react";
import { usePositions } from "@/hooks/use-positions";
import { notifyAccountChanged } from "@/hooks/use-account";
import { usePrice } from "@/components/providers/price-provider";

/**
 * Client-side Stop Loss / Take Profit trigger monitor.
 *
 * Watches positions whose asset matches the currently selected pair and
 * auto-closes them when the live price crosses their SL or TP level.
 * Only active while the dashboard is open — there is no server-side
 * background worker in this MVP.
 */
export function usePositionMonitor() {
  const { positions, close } = usePositions("active");
  const { price, symbol } = usePrice();
  // Guard so we don't fire multiple close requests for the same position
  // while a close is still in flight.
  const closingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!price || price <= 0) return;

    const eligible = positions.filter(
      (p) =>
        p.asset === symbol &&
        p.status === "active" &&
        !closingRef.current.has(p.id)
    );

    for (const pos of eligible) {
      let triggered: "SL" | "TP" | null = null;

      if (pos.side === "LONG") {
        if (pos.stopLoss && price <= pos.stopLoss) triggered = "SL";
        else if (pos.takeProfit && price >= pos.takeProfit) triggered = "TP";
      } else {
        if (pos.stopLoss && price >= pos.stopLoss) triggered = "SL";
        else if (pos.takeProfit && price <= pos.takeProfit) triggered = "TP";
      }

      if (!triggered) continue;

      // Use the trigger level as exit price (not the current tick), so PNL
      // matches user expectations — same as a real exchange's stop order.
      const exitPrice =
        triggered === "SL" ? pos.stopLoss! : pos.takeProfit!;
      const pnl =
        pos.side === "LONG"
          ? (exitPrice - pos.entry) * pos.size
          : (pos.entry - exitPrice) * pos.size;

      closingRef.current.add(pos.id);
      close(pos.id, exitPrice, pnl)
        .then(() => {
          notifyAccountChanged();
        })
        .catch(() => {
          // If close failed, allow retry on next tick
          closingRef.current.delete(pos.id);
        });
    }
  }, [price, positions, symbol, close]);
}
