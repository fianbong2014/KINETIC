"use client";

import { LayoutDashboard } from "lucide-react";
import { useBackofficeOverview } from "@/hooks/use-backoffice-overview";
import { formatUsd } from "@/lib/format";

export default function OverviewPage() {
  const { data, loading, error } = useBackofficeOverview();

  return (
    <div className="flex flex-col gap-3 lg:gap-5">
      {/* Header */}
      <div className="ig-panel p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <div className="ig-tile w-12 h-12 bg-cyan flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black font-heading uppercase tracking-tighter text-on-surface">
              Overview
            </h1>
            <p className="text-xs text-on-surface-variant tracking-wider mt-0.5">
              System metrics at a glance
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="ig-panel p-8 text-center text-xs text-on-surface-variant">
          Loading metrics...
        </div>
      ) : error ? (
        <div className="ig-card bg-destructive/10 border border-destructive/20 p-4 text-xs text-crimson">
          {error}
        </div>
      ) : !data ? (
        <div className="ig-panel p-8 text-center text-xs text-on-surface-variant">
          No metrics available.
        </div>
      ) : (
        <>
          {/* Metric tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <Stat label="Total Users" value={String(data.totalUsers)} />
            <Stat label="Admins" value={String(data.adminCount)} color="text-cyan" />
            <Stat
              label="Disabled"
              value={String(data.disabledCount)}
              color={data.disabledCount > 0 ? "text-crimson" : "text-on-surface"}
            />
            <Stat
              label="Total Paper Balance"
              value={formatUsd(data.totalPaperBalance)}
            />
            <Stat label="Active Traders" value={String(data.activeTraders)} />
            <Stat
              label="Open Positions"
              value={`${data.openPositions} / ${data.totalPositions}`}
            />
            <Stat
              label="Total Closed PnL"
              value={formatUsd(data.totalClosedPnl, { signed: true })}
              color={data.totalClosedPnl >= 0 ? "text-emerald-accent" : "text-crimson"}
            />
            <Stat
              label="Active Bots"
              value={`${data.activeBots} / ${data.totalBots}`}
            />
            <Stat label="New Users (7d)" value={String(data.newUsers7d)} />
            <Stat label="New Users (30d)" value={String(data.newUsers30d)} />
          </div>

          {/* Top accounts by balance */}
          <div className="ig-panel overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5">
              <h2 className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
                Top Accounts by Balance
              </h2>
            </div>
            {data.topByBalance.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs text-on-surface-variant">
                No accounts yet.
              </div>
            ) : (
              data.topByBalance.map((u, i) => (
                <div
                  key={u.id}
                  className={`flex items-center gap-3 px-5 py-3.5 ${
                    i > 0 ? "border-t border-white/5" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-on-surface truncate">
                      {u.name || "—"}
                    </p>
                    <p className="text-[10px] text-on-surface-variant truncate">
                      {u.email}
                    </p>
                  </div>
                  <span
                    className={`ig-badge inline-flex w-fit px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase border ${
                      u.role === "ADMIN"
                        ? "bg-cyan/15 text-cyan border-cyan/25"
                        : "bg-white/5 text-on-surface-variant border-white/10"
                    }`}
                  >
                    {u.role}
                  </span>
                  <span className="text-xs font-mono tabular-nums text-on-surface text-right w-32 shrink-0">
                    {formatUsd(u.paperBalance)}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="ig-card ig-inset p-3.5 flex flex-col gap-1">
      <span className="text-[9px] text-on-surface-variant tracking-widest uppercase font-bold">
        {label}
      </span>
      <span
        className={`text-lg font-heading font-bold tabular-nums ${
          color || "text-on-surface"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
