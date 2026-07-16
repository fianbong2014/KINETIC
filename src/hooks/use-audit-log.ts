"use client";

import { useCallback, useEffect, useState } from "react";

export interface AuditEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetId: string | null;
  targetEmail: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
}

export function useAuditLog(): {
  logs: AuditEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/backoffice/audit");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch audit log");
      }
      setLogs(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch audit log");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { logs, loading, error, refresh };
}
