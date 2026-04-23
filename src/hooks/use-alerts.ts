"use client";

import { useCallback, useEffect, useState } from "react";

export interface PriceAlert {
  id: string;
  symbol: string;
  price: number;
  direction: "above" | "below";
  message: string | null;
  active: boolean;
  triggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewAlert {
  symbol: string;
  price: number;
  direction: "above" | "below";
  message?: string;
}

export function useAlerts(
  options: { includeTriggered?: boolean } = {}
): {
  alerts: PriceAlert[];
  loading: boolean;
  refresh: () => Promise<void>;
  create: (alert: NewAlert) => Promise<PriceAlert>;
  toggle: (id: string, active: boolean) => Promise<void>;
  remove: (id: string) => Promise<void>;
} {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { includeTriggered } = options;

  const refresh = useCallback(async () => {
    try {
      const url = includeTriggered
        ? "/api/alerts?includeTriggered=true"
        : "/api/alerts";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      setAlerts(await res.json());
    } catch {
      // swallow — keep previous state
    } finally {
      setLoading(false);
    }
  }, [includeTriggered]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (alert: NewAlert) => {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alert),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create alert");
      }
      const created = await res.json();
      await refresh();
      return created as PriceAlert;
    },
    [refresh]
  );

  const toggle = useCallback(
    async (id: string, active: boolean) => {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to toggle alert");
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete alert");
      await refresh();
    },
    [refresh]
  );

  return { alerts, loading, refresh, create, toggle, remove };
}
