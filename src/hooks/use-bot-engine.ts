"use client";

import { useEffect, useRef } from "react";
import { useBots, notifyBotsChanged, type TradingBot } from "@/hooks/use-bots";
import { useWatchlist, type WatchlistRow } from "@/hooks/use-watchlist";
import { usePositions, type Position } from "@/hooks/use-positions";
import { useAccount, notifyAccountChanged } from "@/hooks/use-account";
import { useToast } from "@/components/providers/toast-provider";
import { notify } from "@/lib/notifications";
import { formatPrice, formatUsd } from "@/lib/format";

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
 */
export function useBotEngine() {
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

  useEffect(() => {
    if (bots.length === 0 || rows.length === 0) return;

    const enabledBots = bots.filter((b) => b.enabled);
    if (enabledBots.length === 0) return;

    // Snapshot signature — combine row state and active positions count
    // so we re-run when either changes.
    const sig = makeSignature(rows, positions);

    for (const bot of enabledBots) {
      if (inFlightRef.current.has(bot.id)) continue;
      if (lastEvalRef.current.get(bot.id) === sig) continue;

      // Mark this evaluation snapshot so we don't loop on every render
      lastEvalRef.current.set(bot.id, sig);

      const action = evaluateBot(bot, rows, positions);
      if (action.kind !== "trade") continue;

      const { row, side } = action;
      const sizeUsd = (balance * bot.positionSizePct) / 100;
      if (sizeUsd <= 0 || row.price <= 0) continue;

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

      // Fire & forget — the engine doesn't block on this
      placeBotTrade({
        botId: bot.id,
        asset: row.pair.symbol,
        side,
        size: sizeBase,
        entry: row.price,
        stopLoss: sl,
        takeProfit: tp,
        trailingDistance,
      })
        .then(async () => {
          // Update bot lastTradeAt + lastRunAt
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

          const title = `🤖 ${bot.name} placed ${side}`;
          const body = `${row.pair.display} @ $${formatPrice(row.price)} · Size ${formatUsd(sizeUsd)}`;
          toast.info(title, body);
          notify({ title, body, tag: `bot-${bot.id}-${row.pair.symbol}` });
        })
        .catch((err) => {
          toast.error(
            `Bot "${bot.name}" failed`,
            err instanceof Error ? err.message : "Trade not placed"
          );
        })
        .finally(() => {
          inFlightRef.current.delete(bot.id);
          // Force re-evaluation on next snapshot
          lastEvalRef.current.delete(bot.id);
        });
    }
  }, [bots, rows, positions, balance, toast, refreshPositions]);
}

// ─── Pure logic ──────────────────────────────────────────────────────

interface SkipAction {
  kind: "skip";
  reason: string;
}
interface TradeAction {
  kind: "trade";
  row: WatchlistRow;
  side: "LONG" | "SHORT";
}
type EvaluationResult = SkipAction | TradeAction;

/**
 * Pure evaluator: given a bot and the current world state, returns
 * either a trade action or a reason it skipped. Picks the highest-
 * confidence eligible candidate symbol when more than one matches.
 */
export function evaluateBot(
  bot: TradingBot,
  rows: WatchlistRow[],
  positions: Position[]
): EvaluationResult {
  // ─ Cooldown check
  if (bot.lastTradeAt) {
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
    .filter((x): x is { row: WatchlistRow; side: "LONG" | "SHORT"; score: number } => x !== null)
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
      // All three TFs must agree
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
      // Use the watchlist confidence as a proxy — if a TF triggered RSI
      // overbought/oversold the row's events would have surfaced. For
      // an MVP we accept any directional bias on the filtered TF.
      const bias = row.mtf[bot.tfFilter as "1h" | "4h" | "1d"];
      if (bias === null || bias === "neutral") return null;
      if (row.confidence < bot.minConfidence) return null;

      // RSI strategy: fade extremes — go OPPOSITE to bias when extreme
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

