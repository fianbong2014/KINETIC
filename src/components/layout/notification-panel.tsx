"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Archive,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Bot,
  Sunrise,
  Info,
  Inbox,
} from "lucide-react";
import {
  useNotifications,
  type NotificationRecord,
  type NotificationType,
} from "@/hooks/use-notifications";

type Tab = "all" | "trades" | "alerts" | "unread";

const TYPE_META: Record<
  NotificationType,
  { icon: typeof Bell; color: string; bg: string }
> = {
  alert: {
    icon: AlertCircle,
    color: "text-cyan",
    bg: "bg-cyan/10",
  },
  sl_hit: {
    icon: TrendingDown,
    color: "text-crimson",
    bg: "bg-crimson/10",
  },
  tp_hit: {
    icon: TrendingUp,
    color: "text-emerald-accent",
    bg: "bg-emerald-accent/10",
  },
  bot_trade: {
    icon: Bot,
    color: "text-cyan",
    bg: "bg-cyan/10",
  },
  trade: {
    icon: TrendingUp,
    color: "text-on-surface",
    bg: "bg-surface-container-high",
  },
  briefing: {
    icon: Sunrise,
    color: "text-[#ffd166]",
    bg: "bg-[#ffd166]/10",
  },
  system: {
    icon: Info,
    color: "text-on-surface-variant",
    bg: "bg-surface-container-high",
  },
};

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const {
    items,
    loading,
    markRead,
    archive,
    remove,
    markAllRead,
    clearAll,
  } = useNotifications("all");

  const [tab, setTab] = useState<Tab>("all");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const filtered = items.filter((n) => {
    if (tab === "unread") return !n.read;
    if (tab === "alerts") return n.type === "alert";
    if (tab === "trades")
      return (
        n.type === "trade" ||
        n.type === "bot_trade" ||
        n.type === "sl_hit" ||
        n.type === "tp_hit"
      );
    return true;
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close notifications"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 animate-in fade-in-0 duration-150"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className="relative w-full sm:w-[420px] h-full bg-surface-container-low border-l border-outline-variant/10 flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-outline-variant/10 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan" />
            <h2 className="text-sm font-black font-heading tracking-wider uppercase text-on-surface">
              Notifications
            </h2>
            <span className="text-[10px] text-on-surface-variant tracking-widest uppercase">
              {items.length}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs + bulk actions */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-outline-variant/10 shrink-0">
          <div
            role="tablist"
            className="flex bg-surface-container border border-outline-variant/10 p-0.5"
          >
            {(["all", "trades", "alerts", "unread"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  tab === t
                    ? "bg-cyan/15 text-cyan"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={markAllRead}
              title="Mark all as read"
              aria-label="Mark all as read"
              className="p-1.5 text-on-surface-variant hover:text-cyan transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    "Clear ALL notifications? This permanently deletes everything."
                  )
                )
                  clearAll();
              }}
              title="Clear all"
              aria-label="Clear all notifications"
              className="p-1.5 text-on-surface-variant hover:text-crimson transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-xs text-on-surface-variant tracking-widest uppercase">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6 gap-2">
              <Inbox className="w-8 h-8 text-on-surface-variant/40" />
              <p className="text-xs text-on-surface-variant tracking-wider">
                {tab === "unread"
                  ? "No unread notifications"
                  : tab === "trades"
                    ? "No trade events yet"
                    : tab === "alerts"
                      ? "No alert events yet"
                      : "No notifications yet"}
              </p>
              <p className="text-[10px] text-on-surface-variant/60 max-w-[260px]">
                {tab === "all"
                  ? "Alerts, SL/TP hits, and bot trades will land here while you're away."
                  : ""}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {filtered.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onRead={() => markRead(n.id, true)}
                  onArchive={() => archive(n.id)}
                  onDelete={() => remove(n.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationRow({
  notification,
  onRead,
  onArchive,
  onDelete,
}: {
  notification: NotificationRecord;
  onRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[notification.type] || TYPE_META.system;
  const Icon = meta.icon;
  const isRead = notification.read;

  function handleClick() {
    if (!isRead) onRead();
  }

  return (
    <li
      className={`group relative flex gap-3 px-4 py-3 border-b border-outline-variant/5 transition-colors cursor-pointer ${
        isRead
          ? "hover:bg-surface-container/50"
          : "bg-surface-container hover:bg-surface-container-high"
      }`}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!isRead && (
        <span
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan"
          aria-hidden
        />
      )}

      {/* Icon */}
      <div
        className={`shrink-0 w-7 h-7 flex items-center justify-center ${meta.bg}`}
      >
        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={`text-xs font-bold truncate ${
              isRead ? "text-on-surface-variant" : "text-on-surface"
            }`}
          >
            {notification.title}
          </p>
          <span className="text-[10px] text-on-surface-variant/70 font-mono shrink-0">
            {timeAgo(notification.createdAt)}
          </span>
        </div>
        {notification.body && (
          <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed break-words">
            {notification.body}
          </p>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-surface-container-high">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          aria-label="Archive"
          title="Archive"
          className="p-1.5 text-on-surface-variant hover:text-cyan transition-colors"
        >
          <Archive className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete"
          title="Delete"
          className="p-1.5 text-on-surface-variant hover:text-crimson transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </li>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  if (ms < 7 * 86_400_000) return `${Math.floor(ms / 86_400_000)}d`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
