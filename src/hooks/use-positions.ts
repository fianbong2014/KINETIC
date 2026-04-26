"use client";

import { useCallback, useEffect, useState } from "react";

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

  const close = useCallback(
    async (id: string, exit: number, pnl: number) => {
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
      await refresh();
      return res.json();
    },
    [refresh]
  );

  const partialClose = useCallback(
    async (id: string, closeSize: number, exit: number) => {
      const res = await fetch(`/api/positions/${id}/partial-close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closeSize, exit }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to partial-close");
      }
      await refresh();
      return res.json();
    },
    [refresh]
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
