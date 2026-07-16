"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@/hooks/use-backoffice-users";

export interface UserDetailPosition {
  id: string;
  asset: string;
  side: string;
  size: number;
  entry: number;
  exit: number | null;
  pnl: number | null;
  status: string;
  mode: string;
  openedAt: string;
  closedAt: string | null;
}

export interface UserDetailBot {
  id: string;
  name: string;
  enabled: boolean;
  symbols: string[];
  createdAt: string;
}

export interface UserDetailJournalEntry {
  id: string;
  pair: string;
  side: string;
  pnl: number;
  pnlPct: number;
  date: string;
}

export interface UserDetail {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    disabled: boolean;
    paperBalance: number;
    startingBalance: number;
    createdAt: string;
  };
  counts: {
    positions: number;
    activePositions: number;
    tradingBots: number;
    journalEntries: number;
    activeAlerts: number;
    exchangeCredentials: number;
  };
  stats: {
    closedPnl: number;
    closedCount: number;
    wins: number;
    winRate: number;
  };
  positions: UserDetailPosition[];
  bots: UserDetailBot[];
  journalEntries: UserDetailJournalEntry[];
}

export function useUserDetail(id: string | null): {
  detail: UserDetail | null;
  loading: boolean;
  error: string | null;
} {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/backoffice/users/${id}/detail`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to fetch user detail");
        }
        const data = (await res.json()) as UserDetail;
        if (!cancelled) setDetail(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to fetch user detail");
          setDetail(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { detail, loading, error };
}
