"use client";

import { useEffect } from "react";
import { User, X } from "lucide-react";
import { useUserDetail } from "@/hooks/use-user-detail";
import type {
  UserDetailBot,
  UserDetailJournalEntry,
  UserDetailPosition,
} from "@/hooks/use-user-detail";
import { formatUsd, formatPct } from "@/lib/format";

interface UserDetailDrawerProps {
  userId: string;
  onClose: () => void;
}

export function UserDetailDrawer({ userId, onClose }: UserDetailDrawerProps) {
  const { detail, loading, error } = useUserDetail(userId);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="ig-sheet absolute right-0 top-0 bottom-0 w-full max-w-md overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="ig-tile w-10 h-10 bg-cyan flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black font-heading tracking-wider uppercase text-on-surface truncate">
                {detail?.user.name || detail?.user.email || "User Detail"}
              </h3>
              {detail && (
                <p className="text-[10px] text-on-surface-variant tracking-wider mt-0.5 truncate">
                  {detail.user.email}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && (
          <div className="p-8 text-center text-xs text-on-surface-variant tracking-wider uppercase">
            Loading…
          </div>
        )}

        {!loading && error && (
          <div className="p-5">
            <div className="ig-card bg-destructive/10 border border-destructive/20 p-3 text-xs text-crimson">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && detail && (
          <div className="p-5 flex flex-col gap-6">
            {/* Badges */}
            <div className="flex items-center gap-1.5">
              <RoleBadge role={detail.user.role} />
              <StatusBadge disabled={detail.user.disabled} />
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-2">
              <StatTile label="Paper Balance" value={formatUsd(detail.user.paperBalance)} />
              <StatTile
                label="Closed PnL"
                value={formatUsd(detail.stats.closedPnl, { signed: true })}
                tone={detail.stats.closedPnl >= 0 ? "profit" : "loss"}
              />
              <StatTile label="Win Rate" value={formatPct(detail.stats.winRate)} />
              <StatTile label="Open Positions" value={String(detail.counts.activePositions)} />
              <StatTile label="Total Bots" value={String(detail.counts.tradingBots)} />
              <StatTile label="Journal Entries" value={String(detail.counts.journalEntries)} />
            </div>

            {/* Recent Positions */}
            <Section title="Recent Positions" count={detail.counts.positions}>
              {detail.positions.length === 0 ? (
                <Empty>No positions</Empty>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {detail.positions.map((p) => (
                    <PositionRow key={p.id} p={p} />
                  ))}
                </div>
              )}
            </Section>

            {/* Bots */}
            <Section title="Bots" count={detail.counts.tradingBots}>
              {detail.bots.length === 0 ? (
                <Empty>No bots</Empty>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {detail.bots.map((b) => (
                    <BotRow key={b.id} b={b} />
                  ))}
                </div>
              )}
            </Section>

            {/* Recent Journal */}
            <Section title="Recent Journal" count={detail.counts.journalEntries}>
              {detail.journalEntries.length === 0 ? (
                <Empty>No journal entries</Empty>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {detail.journalEntries.map((j) => (
                    <JournalRow key={j.id} j={j} />
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "profit" | "loss";
}) {
  const toneClass =
    tone === "profit"
      ? "text-emerald-accent"
      : tone === "loss"
        ? "text-crimson"
        : "text-on-surface";
  return (
    <div className="ig-card ig-inset p-3 flex flex-col gap-1">
      <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">
        {label}
      </span>
      <span className={`text-sm font-mono tabular-nums font-bold ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h4 className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
          {title}
        </h4>
        {count !== undefined && (
          <span className="ig-badge px-1.5 py-0.5 text-[9px] font-bold tabular-nums bg-white/5 text-on-surface-variant">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="ig-card ig-inset p-3 text-[10px] text-on-surface-variant tracking-wider">
      {children}
    </div>
  );
}

function PositionRow({ p }: { p: UserDetailPosition }) {
  const long = p.side === "LONG";
  const pnl = p.pnl ?? 0;
  return (
    <div className="ig-card ig-inset p-2.5 flex items-center justify-between gap-2">
      <div className="min-w-0 flex items-center gap-2">
        <span className="text-[11px] font-bold font-mono text-on-surface">{p.asset}</span>
        <span
          className={`text-[9px] font-bold tracking-widest uppercase ${
            long ? "text-cyan" : "text-crimson"
          }`}
        >
          {p.side}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] font-mono tabular-nums text-on-surface-variant">
          {p.entry.toLocaleString()}
          {p.exit != null ? ` → ${p.exit.toLocaleString()}` : ""}
        </span>
        {p.pnl != null && (
          <span
            className={`text-[10px] font-mono tabular-nums font-bold ${
              pnl >= 0 ? "text-emerald-accent" : "text-crimson"
            }`}
          >
            {formatUsd(pnl, { signed: true })}
          </span>
        )}
        <span
          className={`text-[9px] font-bold tracking-widest uppercase ${
            p.status === "active" ? "text-cyan" : "text-on-surface-variant"
          }`}
        >
          {p.status}
        </span>
      </div>
    </div>
  );
}

function BotRow({ b }: { b: UserDetailBot }) {
  return (
    <div className="ig-card ig-inset p-2.5 flex items-center justify-between gap-2">
      <span className="text-[11px] font-bold text-on-surface truncate">{b.name}</span>
      <div className="flex items-center gap-2 shrink-0">
        {b.symbols.length > 0 && (
          <span className="text-[9px] font-mono text-on-surface-variant truncate max-w-[140px]">
            {b.symbols.join(", ")}
          </span>
        )}
        <span
          className={`inline-block w-2 h-2 ${
            b.enabled ? "bg-emerald-accent" : "bg-white/20"
          }`}
          title={b.enabled ? "Enabled" : "Disabled"}
        />
      </div>
    </div>
  );
}

function JournalRow({ j }: { j: UserDetailJournalEntry }) {
  const long = j.side === "LONG";
  return (
    <div className="ig-card ig-inset p-2.5 flex items-center justify-between gap-2">
      <div className="min-w-0 flex items-center gap-2">
        <span className="text-[11px] font-bold font-mono text-on-surface">{j.pair}</span>
        <span
          className={`text-[9px] font-bold tracking-widest uppercase ${
            long ? "text-cyan" : "text-crimson"
          }`}
        >
          {j.side}
        </span>
      </div>
      <span
        className={`text-[10px] font-mono tabular-nums font-bold shrink-0 ${
          j.pnlPct >= 0 ? "text-emerald-accent" : "text-crimson"
        }`}
      >
        {formatPct(j.pnlPct, { signed: true })}
      </span>
    </div>
  );
}

function RoleBadge({ role }: { role: "USER" | "ADMIN" }) {
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
