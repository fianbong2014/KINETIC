"use client";

import { useCallback, useEffect, useState } from "react";

export type NotificationType =
  | "alert"
  | "sl_hit"
  | "tp_hit"
  | "bot_trade"
  | "trade"
  | "briefing"
  | "system";

export type NotificationFilter = "all" | "unread" | "archived";

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  meta: Record<string, unknown>;
  read: boolean;
  archived: boolean;
  createdAt: string;
}

// Lightweight pub/sub so monitor hooks can call `writeNotification()`
// and any mounted useNotifications() subscribers refresh immediately.
const subscribers = new Set<() => void>();
function notify() {
  for (const cb of subscribers) cb();
}

/**
 * Records a notification in the DB. Safe to call from any client-side
 * monitor — failures are swallowed so a logging hiccup never breaks
 * the underlying alert/trade flow.
 */
export async function writeNotification(input: {
  type: NotificationType;
  title: string;
  body?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    notify();
  } catch {
    // best-effort
  }
}

export function useNotifications(filter: NotificationFilter = "all"): {
  items: NotificationRecord[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string, read?: boolean) => Promise<void>;
  archive: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
} {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?filter=${filter}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    refresh();
    subscribers.add(refresh);

    // Poll every 30s as a fallback — primary refresh path is the
    // pub/sub above, fired whenever writeNotification() lands.
    const id = setInterval(refresh, 30_000);

    return () => {
      subscribers.delete(refresh);
      clearInterval(id);
    };
  }, [refresh]);

  const markRead = useCallback(
    async (id: string, read = true) => {
      // Optimistic — fold into local state so the UI is responsive
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read } : n))
      );
      setUnreadCount((c) =>
        read ? Math.max(0, c - 1) : c + 1
      );
      try {
        await fetch(`/api/notifications/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ read }),
        });
        notify();
      } catch {
        refresh();
      }
    },
    [refresh]
  );

  const archive = useCallback(
    async (id: string) => {
      setItems((prev) => prev.filter((n) => n.id !== id));
      try {
        await fetch(`/api/notifications/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived: true }),
        });
        notify();
      } catch {
        refresh();
      }
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      setItems((prev) => prev.filter((n) => n.id !== id));
      try {
        await fetch(`/api/notifications/${id}`, { method: "DELETE" });
        notify();
      } catch {
        refresh();
      }
    },
    [refresh]
  );

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    });
    notify();
  }, []);

  const clearAll = useCallback(async () => {
    setItems([]);
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clearAll" }),
    });
    notify();
  }, []);

  return {
    items,
    unreadCount,
    loading,
    refresh,
    markRead,
    archive,
    remove,
    markAllRead,
    clearAll,
  };
}
