"use client";

import { useState } from "react";
import { Bot, Plus, Activity } from "lucide-react";
import { useBots } from "@/hooks/use-bots";
import { BotCard } from "@/components/bots/bot-card";
import { CreateBotDialog } from "@/components/bots/create-bot-dialog";
import { formatUsd } from "@/lib/format";

export default function BotsPage() {
  const { bots, loading } = useBots();
  const [creating, setCreating] = useState(false);

  const enabledCount = bots.filter((b) => b.enabled).length;
  const totalActiveTrades = bots.reduce((s, b) => s + b.activeCount, 0);
  const totalPnl = bots.reduce((s, b) => s + b.totalPnl, 0);
  const totalTrades = bots.reduce((s, b) => s + b.totalTrades, 0);

  return (
    <div className="flex flex-col gap-3 lg:gap-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-surface-container-low p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan flex items-center justify-center">
              <Bot className="w-6 h-6 text-[#004343]" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black font-heading uppercase tracking-tighter text-on-surface">
                Trade Bots
              </h1>
              <p className="text-xs text-on-surface-variant tracking-wider mt-0.5">
                Auto-execute trades when signals match your strategy
              </p>
            </div>
          </div>

          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-cyan text-[#004343] font-heading font-bold text-xs uppercase tracking-wider px-4 py-2.5 hover:opacity-90 transition-opacity self-start"
          >
            <Plus className="w-4 h-4" />
            New Bot
          </button>
        </div>

        {/* Aggregate stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mt-5">
          <Stat
            label="Bots"
            value={String(bots.length)}
            sub={`${enabledCount} active`}
          />
          <Stat
            label="Open Trades"
            value={String(totalActiveTrades)}
            sub="across all bots"
          />
          <Stat
            label="Total Trades"
            value={String(totalTrades)}
            sub="closed"
          />
          <Stat
            label="Net PNL"
            value={
              totalTrades > 0
                ? formatUsd(totalPnl, { signed: true })
                : "—"
            }
            color={
              totalTrades === 0
                ? "text-on-surface"
                : totalPnl >= 0
                  ? "text-emerald-accent"
                  : "text-crimson"
            }
          />
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-surface-container border-l-2 border-primary p-3 flex items-start gap-3">
        <Activity className="w-4 h-4 text-primary shrink-0 mt-0.5 animate-pulse" />
        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-on-surface font-bold tracking-wider uppercase">
            Bots run while Dashboard is open
          </p>
          <p className="text-[10px] text-on-surface-variant leading-relaxed">
            The engine evaluates signals every ~5 minutes when you have the
            dashboard open. For continuous 24/7 operation, keep a tab open.
          </p>
        </div>
      </div>

      {/* Bot list */}
      {loading ? (
        <div className="bg-surface-container-low p-8 text-center text-xs text-on-surface-variant">
          Loading bots...
        </div>
      ) : bots.length === 0 ? (
        <div className="bg-surface-container-low p-8 lg:p-12 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-surface-container-high flex items-center justify-center">
            <Bot className="w-8 h-8 text-on-surface-variant" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading uppercase tracking-tight text-on-surface mb-1">
              No bots yet
            </h2>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
              Create your first bot to auto-execute trades when multi-timeframe
              signals align. Each bot has its own strategy, risk settings, and
              symbol filter.
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-cyan text-[#004343] font-heading font-bold text-xs uppercase tracking-wider px-5 py-3 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Create First Bot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
          {bots.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      )}

      {creating && <CreateBotDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-surface-container p-3 flex flex-col gap-1">
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
      {sub && (
        <span className="text-[9px] text-on-surface-variant tracking-wider truncate">
          {sub}
        </span>
      )}
    </div>
  );
}
