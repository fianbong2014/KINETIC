"use client";

import { usePositionMonitor } from "@/hooks/use-position-monitor";

// Renderless client component that runs the SL/TP trigger loop.
// Mounted on the dashboard so monitoring is active while the page is open.
export function PositionMonitor() {
  usePositionMonitor();
  return null;
}
