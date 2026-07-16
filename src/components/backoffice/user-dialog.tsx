"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import type {
  AdminUser,
  NewUser,
  UserPatch,
  UserRole,
} from "@/hooks/use-backoffice-users";
import { useToast } from "@/components/providers/toast-provider";

interface UserDialogProps {
  /** Pass an existing user to edit, omit to create. */
  initial?: AdminUser;
  /** Editing your own account — role/status controls are locked. */
  isSelf?: boolean;
  onClose: () => void;
  create?: (user: NewUser) => Promise<AdminUser>;
  update?: (id: string, patch: UserPatch) => Promise<void>;
}

const ROLE_OPTIONS: { value: UserRole; label: string; hint: string }[] = [
  { value: "USER", label: "User", hint: "Standard trading access" },
  { value: "ADMIN", label: "Admin", hint: "Full backoffice access" },
];

export function UserDialog({
  initial,
  isSelf = false,
  onClose,
  create,
  update,
}: UserDialogProps) {
  const toast = useToast();
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(initial?.role ?? "USER");
  const [disabled, setDisabled] = useState(initial?.disabled ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isEdit) {
      if (!email.trim() || !email.includes("@")) {
        setError("A valid email is required");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isEdit && initial && update) {
        const patch: UserPatch = { name: name.trim() || null };
        if (!isSelf) {
          patch.role = role;
          patch.disabled = disabled;
        }
        await update(initial.id, patch);
        toast.success("User Updated", initial.email);
      } else if (create) {
        await create({
          name: name.trim() || undefined,
          email: email.trim(),
          password,
          role,
        });
        toast.success("User Created", email.trim());
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ig-sheet w-full max-w-md my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="ig-tile w-10 h-10 bg-cyan flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-black font-heading tracking-wider uppercase text-on-surface">
                {isEdit ? "Edit User" : "Create User"}
              </h3>
              <p className="text-[10px] text-on-surface-variant tracking-wider mt-0.5">
                {isEdit ? initial?.email : "New account with immediate access"}
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

          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name (optional)"
              className="ig-input w-full text-sm text-on-surface px-3.5 py-2.5 focus:outline-none"
            />
          </Field>

          {!isEdit && (
            <>
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="trader@example.com"
                  className="ig-input w-full text-sm text-on-surface px-3.5 py-2.5 focus:outline-none"
                />
              </Field>
              <Field label="Password" hint="Minimum 8 characters">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="ig-input w-full text-sm text-on-surface font-mono px-3.5 py-2.5 focus:outline-none"
                />
              </Field>
            </>
          )}

          <Field
            label="Role"
            hint={isSelf ? "You cannot change your own role" : undefined}
          >
            <div className="grid grid-cols-2 gap-1">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isSelf}
                  onClick={() => setRole(opt.value)}
                  className={`ig-btn p-2.5 flex flex-col items-center gap-0.5 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    role === opt.value
                      ? "bg-cyan/20 text-cyan border-cyan/30"
                      : "ig-inset text-on-surface-variant hover:bg-white/5 border-transparent"
                  }`}
                >
                  <span className="text-[10px] font-bold tracking-wider uppercase">
                    {opt.label}
                  </span>
                  <span className="text-[9px] opacity-80">{opt.hint}</span>
                </button>
              ))}
            </div>
          </Field>

          {isEdit && (
            <Field
              label="Account Status"
              hint={
                isSelf
                  ? "You cannot disable your own account"
                  : "Disabled accounts cannot sign in; existing sessions are cut off immediately"
              }
            >
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  disabled={isSelf}
                  onClick={() => setDisabled(false)}
                  className={`ig-btn p-2.5 text-[10px] font-bold tracking-widest uppercase border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    !disabled
                      ? "bg-emerald-accent/15 text-emerald-accent border-emerald-accent/25"
                      : "ig-inset text-on-surface-variant hover:bg-white/5 border-transparent"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  disabled={isSelf}
                  onClick={() => setDisabled(true)}
                  className={`ig-btn p-2.5 text-[10px] font-bold tracking-widest uppercase border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    disabled
                      ? "bg-crimson/15 text-crimson border-crimson/25"
                      : "ig-inset text-on-surface-variant hover:bg-white/5 border-transparent"
                  }`}
                >
                  Disabled
                </button>
              </div>
            </Field>
          )}

          {/* Action row */}
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
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create User"}
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
