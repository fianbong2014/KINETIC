"use client";

import { useCallback, useEffect, useState } from "react";

export interface CustomIndicator {
  id: string;
  name: string;
  expression: string;
  color: string;
  overlay: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewIndicator {
  name: string;
  expression: string;
  color?: string;
  overlay?: boolean;
  enabled?: boolean;
}

export function useCustomIndicators() {
  const [indicators, setIndicators] = useState<CustomIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/indicators");
      if (!res.ok) throw new Error("Failed to fetch indicators");
      setIndicators(await res.json());
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: NewIndicator) => {
      const res = await fetch("/api/indicators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create indicator");
      }
      const created = await res.json();
      await refresh();
      return created as CustomIndicator;
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, patch: Partial<NewIndicator>) => {
      const res = await fetch(`/api/indicators/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update indicator");
      }
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/indicators/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete indicator");
      await refresh();
    },
    [refresh]
  );

  return { indicators, loading, refresh, create, update, remove };
}
