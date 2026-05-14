"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationPanel } from "@/components/layout/notification-panel";

/**
 * Topbar bell button with unread count badge. Opens the
 * NotificationPanel on click; the panel handles its own
 * dismissal (escape, backdrop, close button).
 */
export function NotificationBell() {
  const { unreadCount } = useNotifications("all");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className="relative text-[#adaaab] hover:text-[#ffffff] transition-colors shrink-0"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 bg-cyan text-[#004343] text-[9px] font-black tabular-nums flex items-center justify-center leading-none"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
