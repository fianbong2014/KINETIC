"use client";

import { usePrice } from "@/components/providers/price-provider";

export function StatusBar() {
  const { isConnected } = usePrice();

  return (
    <footer className="h-7 bg-surface-container-lowest flex items-center justify-between px-4 text-[10px] text-on-surface-variant font-mono border-t border-outline-dim">
      <div className="flex items-center gap-4">
        <span>LATENCY: 12MS</span>
        <span>UPTIME: 99.98%</span>
        <span className="flex items-center gap-1">
          <span
            className={`w-1.5 h-1.5 inline-block ${
              isConnected ? "bg-emerald-accent animate-pulse" : "bg-crimson"
            }`}
          />
          {isConnected ? "LIVE ENGINE" : "RECONNECTING..."}
        </span>
      </div>
      <span>KINETIC_OS V3.4.4-STABLE // BUILD_ID: 0XAF822</span>
    </footer>
  );
}
