"use client";

import { useEffect, useState } from "react";

interface PromptDialogProps {
  open: boolean;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

/**
 * In-app replacement for window.prompt — matches the KINETIC design
 * system. Submits on Enter, cancels on Esc / backdrop click.
 */
export function PromptDialog({
  open,
  title,
  placeholder,
  defaultValue = "",
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  if (!open) return null;

  const submit = () => {
    const v = value.trim();
    if (v) onConfirm(v);
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface-container-high w-full max-w-sm shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-black font-heading tracking-wider uppercase text-on-surface mb-3">
          {title}
        </h3>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onCancel();
          }}
          placeholder={placeholder}
          className="w-full bg-surface-container px-3 py-2 text-sm text-on-surface outline-none focus:bg-surface-container-highest"
        />
        <div className="flex items-stretch mt-4 border-t border-outline-variant/10 -mx-5 -mb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors"
          >
            {cancelLabel}
          </button>
          <span className="w-px bg-outline-variant/10" />
          <button
            onClick={submit}
            className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase text-cyan hover:bg-cyan/15 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
