"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  TrendingDown,
  TrendingUp,
  Target,
  Zap,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {
  useNotifications,
  type NotificationRecord,
  type NotificationType,
} from "@/hooks/use-notifications";
import { WidgetCard } from "./btc-funding";

// Heuristic: a notification is BTC-related if either:
//   - meta.symbol exists and starts with "BTC"
//   - title/body text mentions BTC, Bitcoin, or BTCUSDT
function isBtcNotification(n: NotificationRecord): boolean {
  const symbol =
    typeof n.meta?.symbol === "string" ? n.meta.symbol.toUpperCase() : "";
  if (symbol.startsWith("BTC")) return true;
  const haystack = `${n.title} ${n.body || ""}`.toUpperCase();
  return /\bBTC\b|BITCOIN|BTCUSDT/.test(haystack);
}

const TYPE_META: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    label: string;
  }
> = {
  alert: { icon: Bell, color: "text-cyan", label: "Alert" },
  sl_hit: { icon: TrendingDown, color: "text-crimson", label: "SL Hit" },
  tp_hit: { icon: Target, color: "text-emerald-accent", label: "TP Hit" },
  bot_trade: { icon: Zap, color: "text-[#f5b700]", label: "Bot" },
  trade: { icon: TrendingUp, color: "text-cyan", label: "Trade" },
  briefing: { icon: Sparkles, color: "text-[#c678dd]", label: "Briefing" },
  system: { icon: AlertCircle, color: "text-on-surface-variant", label: "System" },
};

export function BtcNotifications() {
  const { items, loading, markRead } = useNotifications("all");

  const btcItems = useMemo(
    () => items.filter(isBtcNotification).slice(0, 8),
    [items]
  );

  const unreadCount = btcItems.filter((n) => !n.read).length;

  return (
    <WidgetCard
      title="BTC Activity"
      subtitle={
        unreadCount > 0
          ? `${unreadCount} unread`
          : "Recent BTC notifications"
      }
    >
      {loading ? (
        <p className="text-xs text-on-surface-variant">Loading…</p>
      ) : btcItems.length === 0 ? (
        <div className="text-center py-8 text-[10px] text-on-surface-variant">
          No BTC notifications yet.
          <br />
          Alerts, SL/TP fires, and bot trades for BTC will show up here.
        </div>
      ) : (
        <>
          <ul className="space-y-0.5 max-h-[260px] overflow-y-auto">
            {btcItems.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onMarkRead={() => markRead(n.id, true)}
              />
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-outline-variant/10">
            <Link
              href="/journal"
              className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant hover:text-cyan transition-colors"
            >
              View all activity
              <ArrowRight size={11} />
            </Link>
          </div>
        </>
      )}
    </WidgetCard>
  );
}

function NotificationRow({
  notification: n,
  onMarkRead,
}: {
  notification: NotificationRecord;
  onMarkRead: () => void;
}) {
  const meta = TYPE_META[n.type] || TYPE_META.system;
  const Icon = meta.icon;

  return (
    <li
      className={`flex items-start gap-2 py-2 px-2 ${
        !n.read
          ? "bg-surface-container/40 hover:bg-surface-container"
          : "hover:bg-surface-container/60"
      } transition-colors cursor-pointer`}
      onClick={onMarkRead}
    >
      <Icon size={14} className={`${meta.color} shrink-0 mt-0.5`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p
            className={`text-xs truncate ${
              n.read ? "text-on-surface-variant" : "text-on-surface font-bold"
            }`}
          >
            {n.title}
          </p>
          {!n.read && (
            <span className="w-1.5 h-1.5 bg-cyan shrink-0 mt-1" />
          )}
        </div>
        {n.body && (
          <p className="text-[10px] text-on-surface-variant truncate mt-0.5">
            {n.body}
          </p>
        )}
      </div>
      <span className="text-[9px] text-on-surface-variant shrink-0 mt-1">
        {timeAgo(new Date(n.createdAt).getTime())}
      </span>
    </li>
  );
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
