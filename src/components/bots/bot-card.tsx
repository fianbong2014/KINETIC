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
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useBots, type TradingBot } from "@/hooks/use-bots";
import { useBotDiagnostics } from "@/hooks/use-bot-diagnostics";
import { useBotEngineContext } from "@/components/providers/bot-engine-provider";
import { useToast } from "@/components/providers/toast-provider";
import { CreateBotDialog } from "@/components/bots/create-bot-dialog";
import { formatUsd } from "@/lib/format";
import type { EvalDecision } from "@/lib/bot-diagnostics";

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
  const { forceRun } = useBotEngineContext();
  const { latest } = useBotDiagnostics(bot.id);
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [testing, setTesting] = useState(false);

  const profitable = bot.totalPnl >= 0;

  async function handleTestRun() {
    setTesting(true);
    try {
      // ignoreCooldown so user can test immediately after a recent trade
      await forceRun(bot.id, { ignoreCooldown: true });
      toast.info("Test Run Complete", "Check the diagnostic panel below");
    } catch (e) {
      toast.error(
        "Test Run Failed",
        e instanceof Error ? e.message : "Unknown error"
      );
    } finally {
      setTesting(false);
    }
  }

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

        {/* Diagnostic panel — explains why the bot did/didn't trade */}
        <DiagnosticPanel
          latest={latest}
          onTestRun={handleTestRun}
          testing={testing}
        />
      </div>

      {editing && (
        <CreateBotDialog initial={bot} onClose={() => setEditing(false)} />
      )}
    </>
  );
}

function DiagnosticPanel({
  latest,
  onTestRun,
  testing,
}: {
  latest: ReturnType<typeof useBotDiagnostics>["latest"];
  onTestRun: () => void;
  testing: boolean;
}) {
  const decisionStyle = latest ? DECISION_STYLES[latest.decision] : null;

  return (
    <div className="border-t border-outline-variant/10 pt-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-on-surface-variant tracking-widest uppercase font-bold">
          Last Evaluation
        </span>
        <button
          onClick={onTestRun}
          disabled={testing}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase bg-cyan/10 text-cyan hover:bg-cyan/20 transition-colors disabled:opacity-50"
        >
          <Zap className="w-3 h-3" />
          {testing ? "Running..." : "Test Run"}
        </button>
      </div>

      {!latest ? (
        <div className="bg-surface-container p-3 text-[10px] text-on-surface-variant tracking-wider">
          <span className="text-on-surface-variant/70">
            No evaluations yet. Click <span className="text-cyan">Test Run</span> to evaluate immediately,
            or wait for the watchlist to refresh (~5min).
          </span>
        </div>
      ) : (
        <div
          className={`bg-surface-container p-3 border-l-2 ${
            decisionStyle?.border ?? "border-on-surface-variant/20"
          }`}
        >
          <div className="flex items-start gap-2 mb-2">
            {decisionStyle?.Icon && (
              <decisionStyle.Icon
                className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${decisionStyle.color}`}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-bold tracking-widest uppercase ${decisionStyle?.color ?? "text-on-surface"}`}
                >
                  {decisionStyle?.label ?? latest.decision}
                </span>
                <span className="text-[9px] text-on-surface-variant tracking-wider">
                  {timeAgo(new Date(latest.at).toISOString())} ago
                </span>
              </div>
              {latest.detail && (
                <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed break-words">
                  {latest.detail}
                </p>
              )}
            </div>
          </div>

          {latest.best && (
            <div className="mt-2 pt-2 border-t border-outline-variant/10 flex items-center gap-2 text-[10px]">
              <span className="text-on-surface-variant tracking-widest uppercase">
                Best:
              </span>
              <span className="font-bold text-on-surface">
                {latest.best.display}
              </span>
              <span className="font-mono tabular-nums text-cyan">
                {latest.best.confidence}%
              </span>
              <span className="text-on-surface-variant/70 font-mono">
                {biasIcon(latest.best.bias1h)}·{biasIcon(latest.best.bias4h)}·{biasIcon(latest.best.bias1d)}
              </span>
            </div>
          )}

          {latest.candidatesScanned !== undefined &&
            latest.rowsTotal !== undefined && (
              <p className="text-[9px] text-on-surface-variant/60 mt-2 tracking-wider">
                Scanned {latest.candidatesScanned}/{latest.rowsTotal} pairs
              </p>
            )}
        </div>
      )}
    </div>
  );
}

function biasIcon(bias: string): string {
  if (bias === "bullish") return "▲";
  if (bias === "bearish") return "▼";
  return "·";
}

const DECISION_STYLES: Record<
  EvalDecision,
  {
    label: string;
    color: string;
    border: string;
    Icon: typeof CheckCircle2;
  }
> = {
  trade_placed: {
    label: "Trade Placed",
    color: "text-emerald-accent",
    border: "border-emerald-accent",
    Icon: CheckCircle2,
  },
  trade_failed: {
    label: "Trade Failed",
    color: "text-crimson",
    border: "border-crimson",
    Icon: XCircle,
  },
  skip_cooldown: {
    label: "Skipped — Cooldown",
    color: "text-on-surface-variant",
    border: "border-on-surface-variant/40",
    Icon: Clock,
  },
  skip_max_open: {
    label: "Skipped — Max Open",
    color: "text-orange",
    border: "border-orange/40",
    Icon: AlertCircle,
  },
  skip_no_candidate: {
    label: "Skipped — No Match",
    color: "text-on-surface-variant",
    border: "border-on-surface-variant/40",
    Icon: AlertCircle,
  },
  skip_disabled: {
    label: "Bot Paused",
    color: "text-on-surface-variant",
    border: "border-on-surface-variant/40",
    Icon: Pause,
  },
};

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
