"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, X } from "lucide-react";
import type { AdminUser, UserPatch } from "@/hooks/use-backoffice-users";
import { useToast } from "@/components/providers/toast-provider";

interface ResetPasswordDialogProps {
  user: AdminUser;
  onClose: () => void;
  update: (id: string, patch: UserPatch) => Promise<void>;
}

export function ResetPasswordDialog({
  user,
  onClose,
  update,
}: ResetPasswordDialogProps) {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await update(user.id, { password });
      toast.success("Password Reset", user.email);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  }

  const inputType = show ? "text" : "password";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="ig-sheet w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="ig-tile w-10 h-10 bg-cyan flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-black font-heading tracking-wider uppercase text-on-surface">
                Reset Password
              </h3>
              <p className="text-[10px] text-on-surface-variant tracking-wider mt-0.5">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          {error && (
            <div className="ig-card bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-crimson">
              {error}
            </div>
          )}

          <Field label="New Password" hint="Minimum 8 characters">
            <div className="relative">
              <input
                type={inputType}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
                placeholder="••••••••"
                className="ig-input w-full text-sm text-on-surface font-mono px-3.5 py-2.5 pr-10 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                title={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>

          <Field label="Confirm Password">
            <input
              type={inputType}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              className="ig-input w-full text-sm text-on-surface font-mono px-3.5 py-2.5 focus:outline-none"
            />
          </Field>

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="ig-btn ig-inset flex-1 text-on-surface-variant text-xs font-bold uppercase tracking-widest py-3 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="ig-btn flex-1 bg-cyan text-primary-foreground font-heading font-bold text-xs uppercase tracking-wider py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-on-surface-variant tracking-wider uppercase font-bold">
        {label}
      </label>
      {children}
      {hint && (
        <span className="text-[10px] text-on-surface-variant/70 leading-tight">
          {hint}
        </span>
      )}
    </div>
  );
}
