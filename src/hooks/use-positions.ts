"use client";

import { useCallback, useEffect, useState } from "react";
import { captureChartSnapshot } from "@/lib/chart-snapshot";

export interface Position {
  id: string;
  asset: string;
  side: "LONG" | "SHORT";
  size: number;
  entry: number;
  exit: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  trailingDistance: number | null;
  trailingHighWater: number | null;
  pnl: number | null;
  status: "active" | "closed";
  botId: string | null;
  mode: "paper" | "live";
  exchange: string | null;
  exchangeOrderId: string | null;
  openedAt: string;
  closedAt: string | null;
}

export interface NewPosition {
  asset: string;
  side: "LONG" | "SHORT";
  size: number;
  entry: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingDistance?: number;
  // "paper" (default) or "live" — live places a real OKX perp order
  mode?: "paper" | "live";
  leverage?: number;
  marginMode?: "isolated" | "cross";
}

export function usePositions(status: "active" | "closed" | "all" = "active") {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        status === "all" ? "/api/positions" : `/api/positions?status=${status}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch positions");
      setPositions(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (position: NewPosition) => {
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(position),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create position");
      }
      await refresh();
      return res.json();
    },
    [refresh]
  );

  // Best-effort: capture the price chart and attach it to the journal
  // entry that was just created server-side. Never throws / blocks the
  // close flow — if the user is on /journal or a different pair than
  // the position, the snapshotter returns null and we silently skip.
  const attachSnapshot = useCallback(
    async (
      journalEntryId: string | null | undefined,
      pos: Pick<
        Position,
        "asset" | "entry" | "side" | "stopLoss" | "takeProfit"
      >,
      exit: number,
      pnl: number
    ) => {
      if (!journalEntryId) return;
      const pnlPct =
        pos.entry > 0 ? (pnl / pos.entry) * 100 : 0;

      const snap = await captureChartSnapshot({
        asset: pos.asset,
        entry: pos.entry,
        exit,
        side: pos.side,
        stopLoss: pos.stopLoss,
        takeProfit: pos.takeProfit,
        pnl,
        pnlPct,
      });
      if (!snap) return;

      try {
        await fetch(`/api/journal/${journalEntryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chartSnapshot: snap.dataUrl,
            chartSnapshotMeta: {
              symbol: pos.asset,
              capturedAt: new Date().toISOString(),
              entry: pos.entry,
              exit,
              side: pos.side,
              stopLoss: pos.stopLoss,
              takeProfit: pos.takeProfit,
              pnl,
              pnlPct,
              w: snap.width,
              h: snap.height,
              bytes: snap.approxBytes,
            },
          }),
        });
      } catch {
        // Snapshot attach is best-effort — swallow.
      }
    },
    []
  );

  const close = useCallback(
    async (id: string, exit: number, pnl: number) => {
      // Capture the position state BEFORE the server close so we still
      // have entry/side/SL/TP after `refresh()` rebuilds the list.
      const closing = positions.find((p) => p.id === id) ?? null;

      const res = await fetch(`/api/positions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "closed",
          exit,
          pnl,
          closedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to close position");
      const data = await res.json();
      await refresh();
      if (closing) {
        // Fire-and-forget — don't await before returning so the UI
        // updates immediately. The snapshot lands a beat later.
        void attachSnapshot(data.journalEntryId, closing, exit, pnl);
      }
      return data;
    },
    [refresh, positions, attachSnapshot]
  );

  const partialClose = useCallback(
    async (id: string, closeSize: number, exit: number) => {
      const closing = positions.find((p) => p.id === id) ?? null;

      const res = await fetch(`/api/positions/${id}/partial-close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closeSize, exit }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to partial-close");
      }
      const data = await res.json();
      await refresh();
      if (closing) {
        const pnl = typeof data.pnl === "number" ? data.pnl : 0;
        void attachSnapshot(data.journalEntryId, closing, exit, pnl);
      }
      return data;
    },
    [refresh, positions, attachSnapshot]
  );

  const modifySLTP = useCallback(
    async (
      id: string,
      patch: {
        stopLoss?: number | null;
        takeProfit?: number | null;
        trailingDistance?: number | null;
        trailingHighWater?: number | null;
      }
    ) => {
      const res = await fetch(`/api/positions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to update SL/TP");
      await refresh();
      return res.json();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/positions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await refresh();
    },
    [refresh]
  );

  return {
    positions,
    loading,
    error,
    refresh,
    create,
    close,
    partialClose,
    modifySLTP,
    remove,
  };
}
