"use client";

import { useCallback, useEffect, useState } from "react";

export type UserRole = "USER" | "ADMIN";

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  disabled: boolean;
  paperBalance: number;
  startingBalance: number;
  createdAt: string;
  _count: {
    positions: number;
    tradingBots: number;
  };
}

export interface NewUser {
  name?: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UserPatch {
  name?: string | null;
  role?: UserRole;
  disabled?: boolean;
  password?: string;
  resetBalance?: boolean;
}

export function useBackofficeUsers(): {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (user: NewUser) => Promise<AdminUser>;
  update: (id: string, patch: UserPatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkUpdate: (ids: string[], patch: UserPatch) => Promise<{ ok: number; failed: number }>;
  bulkRemove: (ids: string[]) => Promise<{ ok: number; failed: number }>;
} {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/backoffice/users");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch users");
      }
      setUsers(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (user: NewUser) => {
      const res = await fetch("/api/backoffice/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create user");
      }
      const created = await res.json();
      await refresh();
      return created as AdminUser;
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, patch: UserPatch) => {
      const res = await fetch(`/api/backoffice/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update user");
      }
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/backoffice/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete user");
      }
      await refresh();
    },
    [refresh]
  );

  const bulkUpdate = useCallback(
    async (ids: string[], patch: UserPatch) => {
      let ok = 0;
      let failed = 0;
      for (const id of ids) {
        try {
          const res = await fetch(`/api/backoffice/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
          if (res.ok) ok += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
      await refresh();
      return { ok, failed };
    },
    [refresh]
  );

  const bulkRemove = useCallback(
    async (ids: string[]) => {
      let ok = 0;
      let failed = 0;
      for (const id of ids) {
        try {
          const res = await fetch(`/api/backoffice/users/${id}`, { method: "DELETE" });
          if (res.ok) ok += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
      await refresh();
      return { ok, failed };
    },
    [refresh]
  );

  return { users, loading, error, refresh, create, update, remove, bulkUpdate, bulkRemove };
}
