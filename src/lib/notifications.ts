// Small wrapper around the Web Notifications API. Gracefully degrades on
// unsupported browsers / permission denials.

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export interface NotifyOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  silent?: boolean;
}

export function notify({ title, body, icon, tag, silent }: NotifyOptions) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      tag,
      silent,
    });
  } catch {
    // Some browsers require a ServiceWorker for notifications on mobile —
    // silently ignore for now.
  }
}
