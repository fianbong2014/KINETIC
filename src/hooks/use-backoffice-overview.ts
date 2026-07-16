"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserRole } from "@/hooks/use-backoffice-users";

export interface OverviewTopUser {
  id: string;
  name: string | null;
  email: string;
  paperBalance: number;
  role: UserRole;
}

export interface OverviewData {
  totalUsers: number;
  adminCount: number;
  disabledCount: number;
  totalPaperBalance: number;
  activeTraders: number;
  openPositions: number;
  totalPositions: number;
  totalClosedPnl: number;
  activeBots: number;
  totalBots: number;
  newUsers7d: number;
  newUsers30d: number;
  topByBalance: OverviewTopUser[];
}

export function useBackofficeOverview(): {
  data: OverviewData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/backoffice/overview");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch overview");
      }
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
