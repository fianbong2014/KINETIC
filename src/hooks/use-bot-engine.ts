"use client";

import { useCallback, useEffect, useRef } from "react";
import { useBots, notifyBotsChanged, type TradingBot } from "@/hooks/use-bots";
import { useWatchlist, type WatchlistRow } from "@/hooks/use-watchlist";
import { usePositions, type Position } from "@/hooks/use-positions";
import { useAccount, notifyAccountChanged } from "@/hooks/use-account";
import { useToast } from "@/components/providers/toast-provider";
import { notify } from "@/lib/notifications";
import { formatPrice, formatUsd } from "@/lib/format";
import {
  pickBestCandidate,
  recordEvaluation,
  type BestCandidate,
  type EvalDecision,
} from "@/lib/bot-diagnostics";

/**
 * Client-side bot trade engine.
 *
 * Watches the multi-pair watchlist data, every active bot's rules, and
 * the user's positions/balance. Whenever the watchlist refreshes, each
 * enabled bot is evaluated against every candidate symbol. If all
 * conditions match, the engine places a market-style position via the
 * existing /api/positions endpoint and tags it with the bot's id.
 *
 * Trades only execute while the dashboard is open — there is no server
 * worker. Cooldown + max-position checks prevent runaway behavior.
 *
 * Returns a `forceRun(botId)` callback so a "Test Run" button can
 * trigger a one-off evaluation that bypasses cooldown.
 */
export function useBotEngine(): {
  forceRun: (botId: string, options?: { ignoreCooldown?: boolean }) => Promise<void>;
} {
  const { bots } = useBots();
  const { rows } = useWatchlist();
  const { positions, refresh: refreshPositions } = usePositions("active");
  const { balance } = useAccount();
  const toast = useToast();

  // Per-bot in-flight guard so we don't fire the same bot twice while
  // a trade POST is still pending.
  const inFlightRef = useRef<Set<string>>(new Set());
  // Per-bot last evaluation snapshot so we don't re-evaluate the same
  // (watchlist version, positions version) tuple.
  const lastEvalRef = useRef<Map<string, string>>(new Map());

  // Stash the latest world state in refs so forceRun() can access it
  // without triggering re-evaluation when the user clicks the button.
  const stateRef = useRef({ bots, rows, positions, balance });
  stateRef.current = { bots, rows, positions, balance };

  // Core evaluation routine — extracted so both the auto-effect and
  // forceRun can reuse it.
  const runForBot = useCallback(
    async (
      bot: TradingBot,
      options: { ignoreCooldown?: boolean } = {}
    ): Promise<void> => {
      const { rows, positions, balance } = stateRef.current;
      if (rows.length === 0) {
        recordEvaluation(bot.id, {
          at: Date.now(),
          decision: "skip_no_candidate",
          detail: "Watchlist empty",
          rowsTotal: 0,
        });
        return;
      }

      if (inFlightRef.current.has(bot.id)) return;

      const action = evaluateBot(bot, rows, positions, options);
      const best = pickBestCandidate(rows);

      if (action.kind === "skip") {
        const decision: EvalDecision =
          action.reason === "cooldown"
            ? "skip_cooldown"
            : action.reason === "max_open"
              ? "skip_max_open"
              : "skip_no_candidate";

        const candidatesScanned = rows.filter(
          (r) => r.ready && r.confidence !== null
        ).length;

        const detail = explainSkip(bot, action, best);

        recordEvaluation(bot.id, {
          at: Date.now(),
          decision,
          detail,
          best: explainBest(bot, best),
          candidatesScanned,
          rowsTotal: rows.length,
        });

        // Also bump lastRunAt so user can see the bot is actively scanning.
        await fetch(`/api/bots/${bot.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lastRunAt: new Date().toISOString() }),
        }).catch(() => {});
        return;
      }

      // Trade path
      const { row, side } = action;
      const sizeUsd = (balance * bot.positionSizePct) / 100;
      if (sizeUsd <= 0 || row.price <= 0) {
        recordEvaluation(bot.id, {
          at: Date.now(),
          decision: "trade_failed",
          detail:
            balance <= 0
              ? "Paper balance is zero — reset account or close losing positions"
              : "Invalid size or price",
          rowsTotal: rows.length,
        });
        return;
      }

      const sizeBase = sizeUsd / row.price;
      const sl = bot.stopLossPct
        ? side === "LONG"
          ? row.price * (1 - bot.stopLossPct / 100)
          : row.price * (1 + bot.stopLossPct / 100)
        : undefined;
      const tp = bot.takeProfitPct
        ? side === "LONG"
          ? row.price * (1 + bot.takeProfitPct / 100)
          : row.price * (1 - bot.takeProfitPct / 100)
        : undefined;
      const trailingDistance = bot.trailingPct
        ? row.price * (bot.trailingPct / 100)
        : undefined;

      inFlightRef.current.add(bot.id);

      try {
        await placeBotTrade({
          botId: bot.id,
          asset: row.pair.symbol,
          side,
          size: sizeBase,
          entry: row.price,
          stopLoss: sl,
          takeProfit: tp,
          trailingDistance,
        });

        await fetch(`/api/bots/${bot.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lastTradeAt: new Date().toISOString(),
            lastRunAt: new Date().toISOString(),
          }),
        });

        notifyAccountChanged();
        notifyBotsChanged();
        refreshPositions();

        recordEvaluation(bot.id, {
          at: Date.now(),
          decision: "trade_placed",
          detail: `${side} ${row.pair.display} @ $${formatPrice(row.price)} · ${formatUsd(sizeUsd)}`,
          best: explainBest(bot, best),
          rowsTotal: rows.length,
        });

        const title = `🤖 ${bot.name} placed ${side}`;
        const body = `${row.pair.display} @ $${formatPrice(row.price)} · Size ${formatUsd(sizeUsd)}`;
        toast.info(title, body);
        notify({ title, body, tag: `bot-${bot.id}-${row.pair.symbol}` });
      } catch (err) {
        recordEvaluation(bot.id, {
          at: Date.now(),
          decision: "trade_failed",
          detail: err instanceof Error ? err.message : "Trade failed",
          rowsTotal: rows.length,
        });
        toast.error(
          `Bot "${bot.name}" failed`,
          err instanceof Error ? err.message : "Trade not placed"
        );
      } finally {
        inFlightRef.current.delete(bot.id);
        // Force re-evaluation on next snapshot
        lastEvalRef.current.delete(bot.id);
      }
    },
    [refreshPositions, toast]
  );

  const forceRun = useCallback(
    async (botId: string, options: { ignoreCooldown?: boolean } = {}) => {
      const { bots } = stateRef.current;
      const bot = bots.find((b) => b.id === botId);
      if (!bot) return;
      // Reset dedup so the auto-effect doesn't skip this snapshot
      lastEvalRef.current.delete(botId);
      await runForBot(bot, options);
    },
    [runForBot]
  );

  // Auto evaluation loop — runs whenever world state changes
  useEffect(() => {
    if (bots.length === 0 || rows.length === 0) return;

    const enabledBots = bots.filter((b) => b.enabled);
    if (enabledBots.length === 0) return;

    const sig = makeSignature(rows, positions);

    for (const bot of enabledBots) {
      if (lastEvalRef.current.get(bot.id) === sig) continue;
      lastEvalRef.current.set(bot.id, sig);
      // Fire and forget — runForBot manages its own concurrency
      runForBot(bot).catch(() => {});
    }
    // Engine is reactive to bots, rows, positions, balance via refs;
    // the deps that should trigger re-evaluation are the world state
    // identity changes.
  }, [bots, rows, positions, balance, runForBot]);

  return { forceRun };
}

// ─── Pure logic ──────────────────────────────────────────────────────

interface SkipAction {
  kind: "skip";
  reason: "cooldown" | "max_open" | "no_candidate";
}
interface TradeAction {
  kind: "trade";
  row: WatchlistRow;
  side: "LONG" | "SHORT";
}
type EvaluationResult = SkipAction | TradeAction;

/**
 * Pure evaluator. `options.ignoreCooldown` lets a manual "Test Run"
 * bypass the cooldown gate while still respecting all other rules.
 */
export function evaluateBot(
  bot: TradingBot,
  rows: WatchlistRow[],
  positions: Position[],
  options: { ignoreCooldown?: boolean } = {}
): EvaluationResult {
  // ─ Cooldown check
  if (!options.ignoreCooldown && bot.lastTradeAt) {
    const since = Date.now() - new Date(bot.lastTradeAt).getTime();
    if (since < bot.cooldownMinutes * 60 * 1000) {
      return { kind: "skip", reason: "cooldown" };
    }
  }

  // ─ Concurrency check (this bot's own active positions)
  const botActive = positions.filter(
    (p) => p.status === "active" && p.botId === bot.id
  );
  if (botActive.length >= bot.maxOpenPositions) {
    return { kind: "skip", reason: "max_open" };
  }

  // ─ Symbol filter
  const candidates =
    bot.symbols.length > 0
      ? rows.filter((r) => bot.symbols.includes(r.pair.symbol))
      : rows;

  // ─ Score each candidate by trigger type, pick best
  const scored = candidates
    .map((row) => {
      const result = scoreCandidate(bot, row);
      return result ? { ...result, row } : null;
    })
    .filter(
      (x): x is { row: WatchlistRow; side: "LONG" | "SHORT"; score: number } =>
        x !== null
    )
    // Don't open a duplicate position from this bot on the same symbol
    .filter(
      (c) =>
        !positions.some(
          (p) =>
            p.status === "active" &&
            p.asset === c.row.pair.symbol &&
            p.botId === bot.id
        )
    )
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { kind: "skip", reason: "no_candidate" };

  const best = scored[0];
  return { kind: "trade", row: best.row, side: best.side };
}

function scoreCandidate(
  bot: TradingBot,
  row: WatchlistRow
): { side: "LONG" | "SHORT"; score: number } | null {
  if (!row.ready || row.confidence === null) return null;

  switch (bot.triggerType) {
    case "mtf_aligned": {
      const biases = [row.mtf["1h"], row.mtf["4h"], row.mtf["1d"]];
      const allBull = biases.every((b) => b === "bullish");
      const allBear = biases.every((b) => b === "bearish");
      if (!allBull && !allBear) return null;
      if (row.confidence < bot.minConfidence) return null;

      const detectedSide: "LONG" | "SHORT" = allBull ? "LONG" : "SHORT";
      if (bot.side !== "ANY" && bot.side !== detectedSide) return null;

      return { side: detectedSide, score: row.confidence };
    }

    case "single_tf_bias": {
      const bias = row.mtf[bot.tfFilter as "1h" | "4h" | "1d"];
      if (bias === null || bias === "neutral") return null;
      if (row.confidence < bot.minConfidence) return null;

      const detectedSide: "LONG" | "SHORT" =
        bias === "bullish" ? "LONG" : "SHORT";
      if (bot.side !== "ANY" && bot.side !== detectedSide) return null;

      return { side: detectedSide, score: row.confidence };
    }

    case "rsi_extreme": {
      const bias = row.mtf[bot.tfFilter as "1h" | "4h" | "1d"];
      if (bias === null || bias === "neutral") return null;
      if (row.confidence < bot.minConfidence) return null;

      const detectedSide: "LONG" | "SHORT" =
        bias === "bullish" ? "SHORT" : "LONG";
      if (bot.side !== "ANY" && bot.side !== detectedSide) return null;

      return { side: detectedSide, score: row.confidence };
    }

    default:
      return null;
  }
}

function makeSignature(rows: WatchlistRow[], positions: Position[]): string {
  const rowSig = rows
    .map(
      (r) =>
        `${r.pair.symbol}:${r.confidence ?? "_"}:${r.mtf["1h"] ?? "_"}:${r.mtf["4h"] ?? "_"}:${r.mtf["1d"] ?? "_"}`
    )
    .join("|");
  const posSig = positions.length;
  return `${rowSig}#${posSig}`;
}

async function placeBotTrade(payload: {
  botId: string;
  asset: string;
  side: "LONG" | "SHORT";
  size: number;
  entry: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingDistance?: number;
}): Promise<void> {
  const res = await fetch("/api/positions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to place bot trade");
  }
}

// ─── Diagnostic helpers ──────────────────────────────────────────────

function explainBest(
  bot: TradingBot,
  best: BestCandidate | undefined
): BestCandidate | undefined {
  if (!best) return undefined;

  // Add a reason if the best candidate doesn't pass the bot's gate
  let reason: string | undefined;
  if (best.confidence < bot.minConfidence) {
    reason = `Confidence ${best.confidence}% < ${bot.minConfidence}% threshold`;
  } else if (bot.triggerType === "mtf_aligned") {
    const biases = [best.bias1h, best.bias4h, best.bias1d];
    const allBull = biases.every((b) => b === "bullish");
    const allBear = biases.every((b) => b === "bearish");
    if (!allBull && !allBear) {
      reason = `Timeframes not aligned (${biases.map((b) => b[0].toUpperCase()).join("·")})`;
    }
  }

  return { ...best, reason };
}

function explainSkip(
  bot: TradingBot,
  action: SkipAction,
  best: BestCandidate | undefined
): string {
  if (action.reason === "cooldown") {
    if (!bot.lastTradeAt) return "Cooldown active";
    const since = Date.now() - new Date(bot.lastTradeAt).getTime();
    const remainingMs = bot.cooldownMinutes * 60 * 1000 - since;
    const remainingMin = Math.ceil(remainingMs / 60_000);
    return `Cooldown — ${remainingMin}m remaining`;
  }
  if (action.reason === "max_open") {
    return `Max ${bot.maxOpenPositions} concurrent position(s) reached`;
  }
  if (best) {
    if (best.confidence < bot.minConfidence) {
      return `Best candidate ${best.display} only ${best.confidence}% (need ${bot.minConfidence}%)`;
    }
    if (bot.triggerType === "mtf_aligned") {
      return `Best candidate ${best.display} — timeframes don't align`;
    }
    return `Best candidate ${best.display} — bias doesn't match strategy`;
  }
  return "No matching candidate";
}
