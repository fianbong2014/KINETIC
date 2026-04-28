// Per-bot diagnostic log persisted in localStorage. The bot engine
// writes a record after every evaluation cycle so the UI can answer
// "why didn't it trade?" without waiting for a real trade to happen.
//
// We keep only the last N evaluations per bot to bound storage.

import type { WatchlistRow } from "@/hooks/use-watchlist";

export type EvalDecision =
  | "trade_placed"
  | "trade_failed"
  | "skip_cooldown"
  | "skip_max_open"
  | "skip_no_candidate"
  | "skip_disabled";

export interface BestCandidate {
  symbol: string;
  display: string;
  confidence: number;
  bias1h: string;
  bias4h: string;
  bias1d: string;
  reason?: string; // why this candidate didn't trigger
}

export interface BotEvaluation {
  at: number; // epoch ms
  decision: EvalDecision;
  detail?: string;
  // Highest-confidence eligible row at evaluation time, even if it
  // didn't pass the trigger — gives the user something to watch.
  best?: BestCandidate;
  // How many rows in the watchlist had MTF data (i.e. were ready)
  candidatesScanned?: number;
  // The whole watchlist at the time, useful for debugging
  rowsTotal?: number;
}

const STORAGE_PREFIX = "kinetic:bot-diagnostics:";
const MAX_HISTORY = 20;

function key(botId: string): string {
  return STORAGE_PREFIX + botId;
}

export function recordEvaluation(botId: string, evaluation: BotEvaluation): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(key(botId));
    const history: BotEvaluation[] = raw ? JSON.parse(raw) : [];
    history.unshift(evaluation);
    while (history.length > MAX_HISTORY) history.pop();
    window.localStorage.setItem(key(botId), JSON.stringify(history));
    // Notify subscribers
    window.dispatchEvent(
      new CustomEvent("kinetic:bot-diagnostics", { detail: { botId } })
    );
  } catch {
    // localStorage may be disabled — silent
  }
}

export function getEvaluations(botId: string): BotEvaluation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(botId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearEvaluations(botId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(botId));
  } catch {
    // ignore
  }
}

/**
 * Helper for the engine — given the candidate set after eligibility
 * filtering, pick the one with the highest confidence to surface as
 * "what's closest to triggering".
 */
export function pickBestCandidate(
  rows: WatchlistRow[]
): BestCandidate | undefined {
  const ready = rows.filter((r) => r.ready && r.confidence !== null);
  if (ready.length === 0) return undefined;
  const best = ready.reduce((a, b) =>
    (b.confidence ?? 0) > (a.confidence ?? 0) ? b : a
  );
  return {
    symbol: best.pair.symbol,
    display: best.pair.display,
    confidence: best.confidence ?? 0,
    bias1h: best.mtf["1h"] ?? "neutral",
    bias4h: best.mtf["4h"] ?? "neutral",
    bias1d: best.mtf["1d"] ?? "neutral",
  };
}
