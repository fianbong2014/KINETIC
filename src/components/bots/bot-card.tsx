"use client";

import { useState } from "react";
import {
  Bot,
  Pause,
  Play,
  Trash2,
  Settings2,
  Layers,
  Clock,
  Target,
} from "lucide-react";
import { useBots, type TradingBot } from "@/hooks/use-bots";
import { useToast } from "@/components/providers/toast-provider";
import { CreateBotDialog } from "@/components/bots/create-bot-dialog";
import { formatUsd } from "@/lib/format";

const TRIGGER_LABEL: Record<string, string> = {
  mtf_aligned: "Multi-TF Aligned",
  single_tf_bias: "Single TF",
  rsi_extreme: "RSI Fade",
};

const SIDE_COLOR: Record<string, string> = {
  LONG: "text-cyan",
  SHORT: "text-orange",
  ANY: "text-on-surface",
};

export function BotCard({ bot }: { bot: TradingBot }) {
  const { toggle, remove } = useBots();
  const toast = useToast();
  const [editing, setEditing] = useState(false);

  const profitable = bot.totalPnl >= 0;

  async function handleToggle() {
    try {
      await toggle(bot.id, !bot.enabled);
      toast.info(
        bot.enabled ? "Bot Paused" : "Bot Resumed",
        `"${bot.name}" is now ${bot.enabled ? "inactive" : "scanning"}`
      );
    } catch {
      toast.error("Toggle Failed", "Try again");
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete bot "${bot.name}"?\n\nClosed trades will keep their history but become detached. Active positions are NOT closed automatically.`
      )
    )
      return;
    try {
      await remove(bot.id);
      toast.success("Bot Deleted", `"${bot.name}" removed`);
    } catch {
      toast.error("Delete Failed", "Try again");
    }
  }

  return (
    <>
      <div
        className={`bg-surface-container-low p-4 lg:p-5 flex flex-col gap-4 border-l-2 ${
          bot.enabled ? "border-cyan" : "border-on-surface-variant/30"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={`w-9 h-9 flex items-center justify-center shrink-0 ${
                bot.enabled
                  ? "bg-cyan/20 text-cyan"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold font-heading uppercase tracking-tight text-on-surface truncate">
                {bot.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 ${
                    bot.enabled
                      ? "bg-emerald-accent/20 text-emerald-accent"
                      : "bg-on-surface-variant/10 text-on-surface-variant"
                  }`}
                >
                  {bot.enabled ? "Active" : "Paused"}
                </span>
                <span className="text-[10px] text-on-surface-variant tracking-wider">
                  {TRIGGER_LABEL[bot.triggerType] || bot.triggerType}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleToggle}
              aria-label={bot.enabled ? "Pause bot" : "Resume bot"}
              className={`p-2 transition-colors ${
                bot.enabled
                  ? "text-on-surface-variant hover:text-orange"
                  : "text-on-surface-variant hover:text-emerald-accent"
              }`}
            >
              {bot.enabled ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => setEditing(true)}
              aria-label="Edit bot"
              className="p-2 text-on-surface-variant hover:text-cyan transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              aria-label="Delete bot"
              className="p-2 text-on-surface-variant hover:text-crimson transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Performance metrics */}
        <div className="grid grid-cols-4 gap-2">
          <Metric
            label="Trades"
            value={String(bot.totalTrades)}
            sub={`${bot.activeCount} open`}
          />
          <Metric
            label="Win Rate"
            value={
              bot.totalTrades > 0 ? `${bot.winRate.toFixed(0)}%` : "—"
            }
            color={
              bot.totalTrades === 0
                ? "text-on-surface"
                : bot.winRate >= 50
                  ? "text-emerald-accent"
                  : "text-crimson"
            }
          />
          <Metric
            label="Net PNL"
            value={
              bot.totalTrades > 0
                ? formatUsd(bot.totalPnl, { signed: true })
                : "—"
            }
            color={
              bot.totalTrades === 0
                ? "text-on-surface"
                : profitable
                  ? "text-emerald-accent"
                  : "text-crimson"
            }
          />
          <Metric
            label="Last Trade"
            value={bot.lastTradeAt ? timeAgo(bot.lastTradeAt) : "Never"}
            sub={
              bot.lastRunAt
                ? `Last run ${timeAgo(bot.lastRunAt)}`
                : undefined
            }
          />
        </div>

        {/* Strategy summary */}
        <div className="bg-surface-container p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
          <Detail
            icon={Target}
            label="Side"
            value={bot.side}
            valueClass={SIDE_COLOR[bot.side]}
          />
          <Detail
            icon={Layers}
            label="Confidence ≥"
            value={`${bot.minConfidence}%`}
          />
          <Detail
            label="Position Size"
            value={`${bot.positionSizePct}%`}
          />
          <Detail
            label="SL / TP"
            value={`${bot.stopLossPct ?? "—"} / ${bot.takeProfitPct ?? "—"}`}
          />
          <Detail
            label="Symbols"
            value={
              bot.symbols.length === 0
                ? "All pairs"
                : bot.symbols.length <= 3
                  ? bot.symbols
                      .map((s) => s.replace(/USDT$/, ""))
                      .join(" · ")
                  : `${bot.symbols.length} pairs`
            }
          />
          <Detail
            icon={Clock}
            label="Cooldown"
            value={`${bot.cooldownMinutes}m`}
          />
        </div>
      </div>

      {editing && (
        <CreateBotDialog initial={bot} onClose={() => setEditing(false)} />
      )}
    </>
  );
}

function Metric({
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
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-on-surface-variant tracking-widest uppercase">
        {label}
      </span>
      <span
        className={`text-sm font-mono font-bold tabular-nums ${color || "text-on-surface"}`}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[9px] text-on-surface-variant/70 truncate">
          {sub}
        </span>
      )}
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {Icon && <Icon className="w-3 h-3 text-on-surface-variant shrink-0" />}
      <span className="text-on-surface-variant tracking-wider uppercase shrink-0">
        {label}:
      </span>
      <span
        className={`font-mono tabular-nums truncate ${valueClass || "text-on-surface"}`}
      >
        {value}
      </span>
    </div>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  return `${Math.floor(ms / 86_400_000)}d`;
}
