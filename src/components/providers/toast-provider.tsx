"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (toast: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const duration = t.duration ?? 4000;
      const newToast: Toast = { ...t, id };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, description?: string) =>
      toast({ type: "success", title, description }),
    [toast]
  );
  const error = useCallback(
    (title: string, description?: string) =>
      toast({ type: "error", title, description }),
    [toast]
  );
  const warning = useCallback(
    (title: string, description?: string) =>
      toast({ type: "warning", title, description }),
    [toast]
  );
  const info = useCallback(
    (title: string, description?: string) =>
      toast({ type: "info", title, description }),
    [toast]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{ toast, success, error, warning, info, dismiss }}
    >
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback — no-op toast if provider isn't mounted.
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}

// ─── Visual ──────────────────────────────────────────────────────────

const TYPE_STYLES: Record<ToastType, { bar: string; icon: typeof Info; iconColor: string }> = {
  success: { bar: "bg-emerald-accent", icon: CheckCircle, iconColor: "text-emerald-accent" },
  error: { bar: "bg-crimson", icon: XCircle, iconColor: "text-crimson" },
  warning: { bar: "bg-orange", icon: AlertTriangle, iconColor: "text-orange" },
  info: { bar: "bg-cyan", icon: Info, iconColor: "text-cyan" },
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed z-[100] top-4 right-4 left-4 sm:left-auto sm:w-[360px] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const style = TYPE_STYLES[toast.type];
  const Icon = style.icon;

  return (
    <div className="pointer-events-auto bg-surface-container-high border border-outline-variant/10 flex items-stretch gap-0 animate-in slide-in-from-right-4 fade-in-0 duration-200">
      <div className={`w-1 ${style.bar} shrink-0`} />
      <div className="flex-1 flex items-start gap-3 p-3">
        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${style.iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-on-surface tracking-wider uppercase">
            {toast.title}
          </p>
          {toast.description && (
            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug break-words">
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss"
          className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
