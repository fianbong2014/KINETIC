"use client";

import { useEffect, useRef } from "react";
import { useAlerts } from "@/hooks/use-alerts";
import { useSettings } from "@/hooks/use-settings";
import { usePrice } from "@/components/providers/price-provider";
import { useToast } from "@/components/providers/toast-provider";
import { notify } from "@/lib/notifications";
import { formatPrice } from "@/lib/format";

/**
 * Client-side price alert monitor.
 *
 * Watches active alerts whose symbol matches the currently selected pair and
 * fires an in-app toast + browser notification when the price crosses the
 * target, then marks the alert as triggered so it won't fire again.
 *
 * Like the position monitor, this only runs while the dashboard is open —
 * there is no background worker in this MVP.
 */
export function useAlertMonitor() {
  const { alerts, refresh } = useAlerts();
  const { settings } = useSettings();
  const { price, symbol } = usePrice();
  const toast = useToast();

  // Avoid double-firing while the PATCH request is in flight
  const firingRef = useRef<Set<string>>(new Set());

  const alertEnabled =
    settings.notifications?.alertTypes?.priceTarget ?? true;

  useEffect(() => {
    if (!price || price <= 0) return;

    const eligible = alerts.filter(
      (a) =>
        a.active &&
        a.symbol === symbol &&
        !a.triggeredAt &&
        !firingRef.current.has(a.id)
    );

    for (const alert of eligible) {
      const hit =
        alert.direction === "above"
          ? price >= alert.price
          : price <= alert.price;

      if (!hit) continue;

      firingRef.current.add(alert.id);

      const title = `Price Alert — ${alert.symbol}`;
      const body = `${alert.direction === "above" ? "↑" : "↓"} $${formatPrice(alert.price)}${alert.message ? ` · ${alert.message}` : ""}`;

      // In-app toast
      toast.info(title, body);

      // Browser notification (respects user setting)
      if (alertEnabled) {
        notify({
          title,
          body,
          tag: `alert-${alert.id}`,
        });
      }

      // Mark as triggered so it doesn't fire on every tick
      fetch(`/api/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: false,
          triggeredAt: new Date().toISOString(),
        }),
      })
        .then(() => refresh())
        .catch(() => {
          // Retry next tick if the PATCH failed
          firingRef.current.delete(alert.id);
        });
    }
  }, [price, alerts, symbol, toast, refresh, alertEnabled]);
}
