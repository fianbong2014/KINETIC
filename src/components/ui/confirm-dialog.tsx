"use client";

import { useEffect } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * In-app replacement for window.confirm — matches the KINETIC design
 * system (sharp polygons, tonal surface layering, cyan/crimson accent).
 * Closes on Esc or backdrop click.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface-container-high w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <h3 className="text-sm font-black font-heading tracking-wider uppercase text-on-surface">
            {title}
          </h3>
          <p className="mt-2 text-xs text-on-surface-variant leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex items-stretch border-t border-outline-variant/10">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors"
          >
            {cancelLabel}
          </button>
          <span className="w-px bg-outline-variant/10" />
          <button
            onClick={onConfirm}
            autoFocus
            className={`flex-1 py-3 text-[10px] font-bold tracking-widest uppercase transition-colors ${
              destructive
                ? "text-crimson hover:bg-crimson/15"
                : "text-cyan hover:bg-cyan/15"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
