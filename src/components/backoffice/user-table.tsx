"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { KeyRound, Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { AdminUser, UserPatch } from "@/hooks/use-backoffice-users";
import { UserDialog } from "@/components/backoffice/user-dialog";
import { UserDetailDrawer } from "@/components/backoffice/user-detail-drawer";
import { ResetPasswordDialog } from "@/components/backoffice/reset-password-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/providers/toast-provider";
import { formatUsd } from "@/lib/format";

interface UserTableProps {
  users: AdminUser[];
  update: (id: string, patch: UserPatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkUpdate?: (ids: string[], patch: UserPatch) => Promise<{ ok: number; failed: number }>;
  bulkRemove?: (ids: string[]) => Promise<{ ok: number; failed: number }>;
}

export function UserTable({ users, update, remove, bulkUpdate, bulkRemove }: UserTableProps) {
  const { data: session } = useSession();
  const toast = useToast();
  const selfId = session?.user?.id;

  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [resettingPassword, setResettingPassword] = useState<AdminUser | null>(null);
  const [resettingBalance, setResettingBalance] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Every user except the current admin's own row is selectable.
  const selectableIds = users.filter((u) => u.id !== selfId).map((u) => u.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(() => (allSelected ? new Set() : new Set(selectableIds)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function handleBulkUpdate(patch: UserPatch, verb: string) {
    if (!bulkUpdate || selected.size === 0) return;
    const ids = [...selected];
    const { ok, failed } = await bulkUpdate(ids, patch);
    const desc = `${ok} ${verb}${failed > 0 ? `, ${failed} skipped` : ""}`;
    if (failed > 0) toast.warning("Bulk Update", desc);
    else toast.success("Bulk Update", desc);
    clearSelection();
  }

  async function handleBulkDelete() {
    setBulkDeleting(false);
    if (!bulkRemove || selected.size === 0) return;
    const ids = [...selected];
    const { ok, failed } = await bulkRemove(ids);
    const desc = `${ok} deleted${failed > 0 ? `, ${failed} skipped` : ""}`;
    if (failed > 0) toast.warning("Bulk Delete", desc);
    else toast.success("Bulk Delete", desc);
    clearSelection();
  }

  const showBulk = !!(bulkUpdate || bulkRemove) && selected.size > 0;

  async function handleResetBalance() {
    if (!resettingBalance) return;
    const target = resettingBalance;
    setResettingBalance(null);
    try {
      await update(target.id, { resetBalance: true });
      toast.success(
        "Balance Reset",
        `${target.email} back to ${formatUsd(target.startingBalance)}`
      );
    } catch (e) {
      toast.error("Reset Failed", e instanceof Error ? e.message : undefined);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    try {
      await remove(target.id);
      toast.success("User Deleted", `${target.email} and all their data removed`);
    } catch (e) {
      toast.error("Delete Failed", e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <>
      {/* Bulk action bar */}
      {showBulk && (
        <div className="ig-panel sticky top-2 z-20 flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="text-xs font-bold text-on-surface tabular-nums">
            {selected.size} selected
          </span>
          <div className="flex-1" />
          {bulkUpdate && (
            <>
              <button
                type="button"
                onClick={() => handleBulkUpdate({ disabled: false }, "enabled")}
                className="ig-pill px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase text-emerald-accent hover:bg-emerald-accent/10 transition-colors"
              >
                Enable
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdate({ disabled: true }, "disabled")}
                className="ig-pill px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase text-orange hover:bg-orange/10 transition-colors"
              >
                Disable
              </button>
            </>
          )}
          {bulkRemove && (
            <button
              type="button"
              onClick={() => setBulkDeleting(true)}
              className="ig-pill px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase text-crimson hover:bg-crimson/10 transition-colors"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={clearSelection}
            className="ig-pill px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Desktop table — grouped glass list with hairline separators */}
      <div className="ig-panel hidden lg:block overflow-hidden">
        <div className="grid grid-cols-[32px_minmax(220px,2fr)_100px_100px_140px_120px_110px_150px] gap-2 px-5 py-3 text-[9px] font-bold tracking-widest uppercase text-on-surface-variant border-b border-white/5">
          <span className="flex items-center">
            <input
              type="checkbox"
              aria-label="Select all users"
              checked={allSelected}
              onChange={toggleAll}
              disabled={selectableIds.length === 0}
              className="w-3.5 h-3.5 accent-cyan cursor-pointer disabled:cursor-not-allowed"
            />
          </span>
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span className="text-right">Paper Balance</span>
          <span className="text-right">Pos / Bots</span>
          <span>Joined</span>
          <span className="text-right">Actions</span>
        </div>
        {users.map((u, i) => {
          const isSelf = u.id === selfId;
          return (
            <div
              key={u.id}
              className={`grid grid-cols-[32px_minmax(220px,2fr)_100px_100px_140px_120px_110px_150px] gap-2 px-5 py-3.5 items-center hover:bg-white/5 transition-colors ${
                i > 0 ? "border-t border-white/5" : ""
              }`}
            >
              <span className="flex items-center">
                <input
                  type="checkbox"
                  aria-label={`Select ${u.email}`}
                  checked={selected.has(u.id)}
                  onChange={() => toggleOne(u.id)}
                  disabled={isSelf}
                  className="w-3.5 h-3.5 accent-cyan cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </span>
              <button
                type="button"
                onClick={() => setDetailUserId(u.id)}
                className="min-w-0 text-left hover:opacity-80 transition-opacity"
              >
                <p className="text-xs font-bold text-on-surface truncate">
                  {u.name || "—"}
                  {isSelf && (
                    <span className="ml-2 text-[9px] text-cyan tracking-widest uppercase">
                      You
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-on-surface-variant truncate">{u.email}</p>
              </button>
              <RoleBadge role={u.role} />
              <StatusBadge disabled={u.disabled} />
              <span className="text-xs font-mono tabular-nums text-on-surface text-right">
                {formatUsd(u.paperBalance)}
              </span>
              <span className="text-xs font-mono tabular-nums text-on-surface-variant text-right">
                {u._count.positions} / {u._count.tradingBots}
              </span>
              <span className="text-[10px] text-on-surface-variant tabular-nums">
                {new Date(u.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <RowActions
                user={u}
                isSelf={isSelf}
                onEdit={() => setEditing(u)}
                onResetPassword={() => setResettingPassword(u)}
                onResetBalance={() => setResettingBalance(u)}
                onDelete={() => setDeleting(u)}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden flex flex-col gap-2">
        {users.map((u) => {
          const isSelf = u.id === selfId;
          return (
            <div key={u.id} className="ig-card ig-inset p-3.5 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <input
                  type="checkbox"
                  aria-label={`Select ${u.email}`}
                  checked={selected.has(u.id)}
                  onChange={() => toggleOne(u.id)}
                  disabled={isSelf}
                  className="w-3.5 h-3.5 mt-0.5 shrink-0 accent-cyan cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setDetailUserId(u.id)}
                  className="min-w-0 text-left hover:opacity-80 transition-opacity"
                >
                  <p className="text-xs font-bold text-on-surface truncate">
                    {u.name || "—"}
                    {isSelf && (
                      <span className="ml-2 text-[9px] text-cyan tracking-widest uppercase">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-on-surface-variant truncate">{u.email}</p>
                </button>
                <div className="flex gap-1.5 shrink-0">
                  <RoleBadge role={u.role} />
                  <StatusBadge disabled={u.disabled} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] text-on-surface-variant">
                <span className="font-mono tabular-nums">
                  {formatUsd(u.paperBalance)} · {u._count.positions} pos ·{" "}
                  {u._count.tradingBots} bots
                </span>
                <RowActions
                  user={u}
                  isSelf={isSelf}
                  onEdit={() => setEditing(u)}
                  onResetPassword={() => setResettingPassword(u)}
                  onResetBalance={() => setResettingBalance(u)}
                  onDelete={() => setDeleting(u)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <UserDialog
          initial={editing}
          isSelf={editing.id === selfId}
          onClose={() => setEditing(null)}
          update={update}
        />
      )}

      {resettingPassword && (
        <ResetPasswordDialog
          user={resettingPassword}
          onClose={() => setResettingPassword(null)}
          update={update}
        />
      )}

      <ConfirmDialog
        open={!!resettingBalance}
        title="Reset Paper Balance"
        message={`Reset ${resettingBalance?.email}'s paper balance to ${
          resettingBalance ? formatUsd(resettingBalance.startingBalance) : ""
        }? Open positions are not affected.`}
        confirmLabel="Reset"
        onConfirm={handleResetBalance}
        onCancel={() => setResettingBalance(null)}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete User"
        message={`Permanently delete ${deleting?.email}? This also deletes ALL their positions, bots, journal entries, alerts and settings. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />

      <ConfirmDialog
        open={bulkDeleting}
        title="Delete Users"
        message={`Permanently delete ${selected.size} selected user${
          selected.size === 1 ? "" : "s"
        }? This also deletes ALL their positions, bots, journal entries, alerts and settings. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleting(false)}
      />

      {detailUserId && (
        <UserDetailDrawer
          userId={detailUserId}
          onClose={() => setDetailUserId(null)}
        />
      )}
    </>
  );
}

function RoleBadge({ role }: { role: AdminUser["role"] }) {
  return (
    <span
      className={`ig-badge inline-flex w-fit px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase border ${
        role === "ADMIN"
          ? "bg-cyan/15 text-cyan border-cyan/25"
          : "bg-white/5 text-on-surface-variant border-white/10"
      }`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ disabled }: { disabled: boolean }) {
  return (
    <span
      className={`ig-badge inline-flex w-fit px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase border ${
        disabled
          ? "bg-crimson/15 text-crimson border-crimson/25"
          : "bg-emerald-accent/10 text-emerald-accent border-emerald-accent/20"
      }`}
    >
      {disabled ? "Disabled" : "Active"}
    </span>
  );
}

function RowActions({
  user,
  isSelf,
  onEdit,
  onResetPassword,
  onResetBalance,
  onDelete,
}: {
  user: AdminUser;
  isSelf: boolean;
  onEdit: () => void;
  onResetPassword: () => void;
  onResetBalance: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <ActionButton title="Edit user" onClick={onEdit}>
        <Pencil className="w-3.5 h-3.5" />
      </ActionButton>
      <ActionButton title="Reset password" onClick={onResetPassword}>
        <KeyRound className="w-3.5 h-3.5" />
      </ActionButton>
      <ActionButton
        title={`Reset balance to ${formatUsd(user.startingBalance)}`}
        onClick={onResetBalance}
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </ActionButton>
      <ActionButton
        title={isSelf ? "You cannot delete your own account" : "Delete user"}
        onClick={onDelete}
        disabled={isSelf}
        destructive
      >
        <Trash2 className="w-3.5 h-3.5" />
      </ActionButton>
    </div>
  );
}

function ActionButton({
  title,
  onClick,
  disabled,
  destructive,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`ig-pill w-8 h-8 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        destructive
          ? "text-on-surface-variant hover:text-crimson hover:bg-crimson/10"
          : "text-on-surface-variant hover:text-on-surface hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
