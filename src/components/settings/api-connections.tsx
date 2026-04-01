"use client";

import { Link2, Plus, Check, AlertTriangle } from "lucide-react";

const connections = [
  {
    name: "Binance",
    status: "connected" as const,
    label: "Spot + Futures",
    lastSync: "2 min ago",
  },
  {
    name: "CoinGecko",
    status: "connected" as const,
    label: "Market Data",
    lastSync: "Live",
  },
  {
    name: "TradingView",
    status: "disconnected" as const,
    label: "Charts & Alerts",
    lastSync: "---",
  },
];

export function ApiConnections() {
  return (
    <section className="bg-surface-container-low p-5 space-y-6 border border-outline-variant/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            API Connections
          </h2>
        </div>
        <button className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan hover:bg-cyan/10 transition-colors">
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      <div className="space-y-3">
        {connections.map((conn) => (
          <div
            key={conn.name}
            className="bg-surface-container p-3 flex items-center gap-3 group"
          >
            {/* Status indicator */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={`w-1 h-8 ${
                  conn.status === "connected"
                    ? "bg-emerald-accent"
                    : "bg-on-surface-variant/30"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface">
                    {conn.name}
                  </span>
                  {conn.status === "connected" ? (
                    <Check className="w-3 h-3 text-emerald-accent" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-on-surface-variant" />
                  )}
                </div>
                <p className="text-[10px] text-on-surface-variant">
                  {conn.label}
                </p>
              </div>
            </div>

            {/* Last sync */}
            <div className="text-right">
              <p className="text-[10px] text-on-surface-variant font-mono tabular-nums">
                {conn.lastSync}
              </p>
              <button
                className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${
                  conn.status === "connected"
                    ? "text-on-surface-variant hover:text-crimson"
                    : "text-cyan hover:text-cyan/80"
                } transition-colors`}
              >
                {conn.status === "connected" ? "Revoke" : "Connect"}
              </button>
            </div>
          </div>
        ))}

        {/* API Key warning */}
        <div className="flex items-start gap-2 p-2">
          <AlertTriangle className="w-3 h-3 text-orange mt-0.5 shrink-0" />
          <p className="text-[10px] text-on-surface-variant leading-relaxed">
            API keys are encrypted and stored locally. Never share your keys
            with anyone.
          </p>
        </div>
      </div>
    </section>
  );
}
