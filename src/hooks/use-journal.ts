"use client";

import { useCallback, useEffect, useState } from "react";

export interface JournalSnapshotMeta {
  symbol?: string;
  capturedAt?: string;
  entry?: number;
  exit?: number;
  side?: "LONG" | "SHORT";
  stopLoss?: number | null;
  takeProfit?: number | null;
  pnl?: number;
  pnlPct?: number;
  w?: number;
  h?: number;
  bytes?: number;
}

/** Row shape returned by the list endpoint — `chartSnapshot` is replaced
 *  with a boolean flag to keep the payload small. The full image is
 *  fetched lazily via `fetchOne(id)`. */
export interface JournalEntry {
  id: string;
  displayId: string;
  date: string;
  pair: string;
  side: "LONG" | "SHORT";
  entry: number;
  exit: number;
  pnl: number;
  pnlPct: number;
  rrr: string;
  strategy: string;
  notes: string;
  hasChartSnapshot: boolean;
  chartSnapshotMeta: JournalSnapshotMeta | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by `GET /api/journal/[id]` — same as `JournalEntry`
 *  but includes the actual snapshot data URL. */
export interface JournalEntryFull extends Omit<JournalEntry, "hasChartSnapshot"> {
  chartSnapshot: string | null;
}

export interface NewJournalEntry {
  date?: string;
  pair: string;
  side: "LONG" | "SHORT";
  entry: number;
  exit: number;
  pnl?: number;
  pnlPct?: number;
  rrr?: string;
  strategy?: string;
  notes?: string;
}

interface JournalResponse {
  entries: JournalEntry[];
  total: number;
  page: number;
  limit: number;
}

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/journal?limit=100");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: JournalResponse = await res.json();
      setEntries(data.entries);
      setTotal(data.total);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (entry: NewJournalEntry) => {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create entry");
      }
      await refresh();
      return res.json();
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, patch: Partial<NewJournalEntry>) => {
      const res = await fetch(`/api/journal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to update");
      await refresh();
      return res.json();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/journal/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await refresh();
    },
    [refresh]
  );

  /**
   * Fetch a single entry WITH its full chart snapshot data URL.
   * Used by the lightbox / detail view — the list endpoint omits the
   * snapshot to keep page loads cheap.
   */
  const fetchOne = useCallback(
    async (id: string): Promise<JournalEntryFull> => {
      const res = await fetch(`/api/journal/${id}`);
      if (!res.ok) throw new Error("Failed to fetch journal entry");
      return (await res.json()) as JournalEntryFull;
    },
    []
  );

  return {
    entries,
    total,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
    fetchOne,
  };
}
