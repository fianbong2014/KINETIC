"use client";

import { ScrollText } from "lucide-react";
import { useAuditLog, type AuditEntry } from "@/hooks/use-audit-log";

export default function AuditLogPage() {
  const { logs, loading, error } = useAuditLog();

  return (
    <div className="flex flex-col gap-3 lg:gap-5">
      {/* Header */}
      <div className="ig-panel p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <div className="ig-tile w-12 h-12 bg-cyan flex items-center justify-center">
            <ScrollText className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black font-heading uppercase tracking-tighter text-on-surface">
              Audit Log
            </h1>
            <p className="text-xs text-on-surface-variant tracking-wider mt-0.5">
              Admin activity history
            </p>
          </div>
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="ig-panel p-8 text-center text-xs text-on-surface-variant">
          Loading audit log...
        </div>
      ) : error ? (
        <div className="ig-card bg-destructive/10 border border-destructive/20 p-4 text-xs text-crimson">
          {error}
        </div>
      ) : logs.length === 0 ? (
        <div className="ig-panel p-8 lg:p-12 text-center flex flex-col items-center gap-4">
          <div className="ig-card w-16 h-16 bg-surface-container-high flex items-center justify-center">
            <ScrollText className="w-8 h-8 text-on-surface-variant" />
          </div>
          <p className="text-xs text-on-surface-variant">
            No admin activity recorded yet.
          </p>
        </div>
      ) : (
        <div className="ig-panel overflow-hidden">
          {logs.map((entry, i) => (
            <div
              key={entry.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 lg:px-5 py-3.5 hover:bg-white/5 transition-colors ${
                i > 0 ? "border-t border-white/5" : ""
              }`}
            >
              <ActionBadge action={entry.action} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-on-surface truncate">
                  <span className="font-bold">{entry.actorEmail}</span>
                  {entry.targetEmail && (
                    <>
                      <span className="text-on-surface-variant"> → </span>
                      <span className="text-on-surface-variant">
                        {entry.targetEmail}
                      </span>
                    </>
                  )}
                </p>
                {summarize(entry) && (
                  <p className="text-[10px] text-on-surface-variant truncate mt-0.5">
                    {summarize(entry)}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-on-surface-variant tabular-nums shrink-0">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Human-readable summary derived from the entry's meta payload. */
function summarize(entry: AuditEntry): string {
  const meta = entry.meta ?? {};
  switch (entry.action) {
    case "user.role_change":
      return `Role ${String(meta.from ?? "?")} → ${String(meta.to ?? "?")}`;
    case "user.create":
    case "user.delete":
      return meta.role ? `Role ${String(meta.role)}` : "";
    case "user.balance_reset":
      return meta.to !== undefined ? `Balance reset to ${String(meta.to)}` : "";
    case "user.update":
      return Array.isArray(meta.fields) && meta.fields.length > 0
        ? `Fields: ${(meta.fields as unknown[]).join(", ")}`
        : "";
    default:
      return "";
  }
}

function ActionBadge({ action }: { action: string }) {
  const color =
    action === "user.delete" || action === "user.disable"
      ? "bg-crimson/15 text-crimson border-crimson/25"
      : action === "user.create" || action === "user.enable"
        ? "bg-emerald-accent/10 text-emerald-accent border-emerald-accent/20"
        : action === "user.role_change" ||
            action === "user.password_reset" ||
            action === "user.balance_reset"
          ? "bg-cyan/15 text-cyan border-cyan/25"
          : "bg-white/5 text-on-surface-variant border-white/10";

  return (
    <span
      className={`ig-badge inline-flex w-fit shrink-0 px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase border ${color}`}
    >
      {action.replace(/^user\./, "").replace(/_/g, " ")}
    </span>
  );
}
