"use client";

import { useCallback, useEffect, useState } from "react";

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
  createdAt: string;
  updatedAt: string;
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

  return { entries, total, loading, error, refresh, create, update, remove };
}
