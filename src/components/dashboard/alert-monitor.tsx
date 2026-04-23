"use client";

import { useAlertMonitor } from "@/hooks/use-alert-monitor";

/**
 * Renderless component — just runs useAlertMonitor while mounted so
 * that the dashboard monitors price crossings on every active alert.
 */
export function AlertMonitor() {
  useAlertMonitor();
  return null;
}
