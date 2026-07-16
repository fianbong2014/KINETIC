"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { useBackofficeUsers } from "@/hooks/use-backoffice-users";
import { UserTable } from "@/components/backoffice/user-table";
import { UserDialog } from "@/components/backoffice/user-dialog";

type Filter = "all" | "admins" | "users" | "disabled";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "admins", label: "Admins" },
  { value: "users", label: "Users" },
  { value: "disabled", label: "Disabled" },
];

export default function BackofficePage() {
  const { users, loading, error, create, update, remove, bulkUpdate, bulkRemove } =
    useBackofficeUsers();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "admins" && u.role !== "ADMIN") return false;
      if (filter === "users" && u.role !== "USER") return false;
      if (filter === "disabled" && !u.disabled) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, query, filter]);

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const disabledCount = users.filter((u) => u.disabled).length;

  return (
    <div className="flex flex-col gap-3 lg:gap-5">
      {/* Header */}
      <div className="ig-panel p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="ig-tile w-12 h-12 bg-cyan flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black font-heading uppercase tracking-tighter text-on-surface">
                User Management
              </h1>
              <p className="text-xs text-on-surface-variant tracking-wider mt-0.5">
                Accounts, roles and access control
              </p>
            </div>
          </div>

          <button
            onClick={() => setCreating(true)}
            className="ig-pill flex items-center gap-2 bg-cyan text-primary-foreground font-heading font-bold text-xs uppercase tracking-wider px-5 py-2.5 hover:opacity-90 transition-opacity self-start"
          >
            <Plus className="w-4 h-4" />
            New User
          </button>
        </div>

        {/* Aggregate stats */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <Stat label="Total Users" value={String(users.length)} />
          <Stat label="Admins" value={String(adminCount)} color="text-cyan" />
          <Stat
            label="Disabled"
            value={String(disabledCount)}
            color={disabledCount > 0 ? "text-crimson" : "text-on-surface"}
          />
        </div>
      </div>

      {/* Search + segmented filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="ig-pill ig-inset flex items-center gap-2 px-4 flex-1">
          <Search className="w-4 h-4 text-on-surface-variant shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-transparent text-sm text-on-surface py-2.5 focus:outline-none placeholder:text-on-surface-variant/60"
          />
        </div>
        <div className="ig-pill ig-inset flex gap-1 p-1 self-start sm:self-auto">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`ig-pill px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors ${
                filter === f.value
                  ? "bg-cyan text-primary-foreground"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="ig-panel p-8 text-center text-xs text-on-surface-variant">
          Loading users...
        </div>
      ) : error ? (
        <div className="ig-card bg-destructive/10 border border-destructive/20 p-4 text-xs text-crimson">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ig-panel p-8 lg:p-12 text-center flex flex-col items-center gap-4">
          <div className="ig-card w-16 h-16 bg-surface-container-high flex items-center justify-center">
            <Users className="w-8 h-8 text-on-surface-variant" />
          </div>
          <p className="text-xs text-on-surface-variant">
            {users.length === 0
              ? "No users found."
              : "No users match the current search or filter."}
          </p>
        </div>
      ) : (
        <UserTable
          users={filtered}
          update={update}
          remove={remove}
          bulkUpdate={bulkUpdate}
          bulkRemove={bulkRemove}
        />
      )}

      {creating && (
        <UserDialog
          onClose={() => setCreating(false)}
          create={create}
          update={update}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="ig-card ig-inset p-3.5 flex flex-col gap-1">
      <span className="text-[9px] text-on-surface-variant tracking-widest uppercase font-bold">
        {label}
      </span>
      <span
        className={`text-lg font-heading font-bold tabular-nums ${
          color || "text-on-surface"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
