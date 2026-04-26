"use client";

import { useCallback, useEffect, useState } from "react";

export type BotTriggerType = "mtf_aligned" | "single_tf_bias" | "rsi_extreme";
export type BotSide = "LONG" | "SHORT" | "ANY";

export interface TradingBot {
  id: string;
  name: string;
  symbols: string[];           // empty = all pairs
  triggerType: BotTriggerType;
  tfFilter: string;            // "1h" | "4h" | "1d"
  minConfidence: number;       // 0–99
  side: BotSide;
  positionSizePct: number;
  stopLossPct: number | null;
  takeProfitPct: number | null;
  trailingPct: number | null;
  maxOpenPositions: number;
  cooldownMinutes: number;
  enabled: boolean;
  lastRunAt: string | null;
  lastTradeAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Server-derived stats
  activeCount: number;
  totalTrades: number;
  totalPnl: number;
  winRate: number;
}

export interface NewBot {
  name: string;
  symbols?: string[];
  triggerType?: BotTriggerType;
  tfFilter?: string;
  minConfidence?: number;
  side?: BotSide;
  positionSizePct?: number;
  stopLossPct?: number | null;
  takeProfitPct?: number | null;
  trailingPct?: number | null;
  maxOpenPositions?: number;
  cooldownMinutes?: number;
  enabled?: boolean;
}

export type BotPatch = Partial<
  Omit<TradingBot, "id" | "createdAt" | "updatedAt" | "activeCount" | "totalTrades" | "totalPnl" | "winRate">
>;

// Lightweight pub/sub so the bot engine can refresh after a trade is
// placed without prop-drilling refresh callbacks everywhere.
const listeners = new Set<() => void>();
export function notifyBotsChanged() {
  for (const cb of listeners) cb();
}

export function useBots(): {
  bots: TradingBot[];
  loading: boolean;
  refresh: () => Promise<void>;
  create: (bot: NewBot) => Promise<TradingBot>;
  update: (id: string, patch: BotPatch) => Promise<void>;
  toggle: (id: string, enabled: boolean) => Promise<void>;
  remove: (id: string) => Promise<void>;
} {
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/bots");
      if (!res.ok) throw new Error("Failed to fetch bots");
      setBots(await res.json());
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, [refresh]);

  const create = useCallback(
    async (bot: NewBot) => {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bot),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create bot");
      }
      const created = await res.json();
      await refresh();
      return created as TradingBot;
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, patch: BotPatch) => {
      const res = await fetch(`/api/bots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to update bot");
      await refresh();
    },
    [refresh]
  );

  const toggle = useCallback(
    async (id: string, enabled: boolean) => {
      await update(id, { enabled });
    },
    [update]
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/bots/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete bot");
      await refresh();
    },
    [refresh]
  );

  return { bots, loading, refresh, create, update, toggle, remove };
}
