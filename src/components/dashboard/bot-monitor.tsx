"use client";

import { useBotEngine } from "@/hooks/use-bot-engine";

/**
 * Renderless component — runs the bot engine while mounted on the
 * dashboard. Bots evaluate signals + open positions every time the
 * watchlist refreshes (~30s for tickers, 5min for MTF analysis).
 */
export function BotMonitor() {
  useBotEngine();
  return null;
}
