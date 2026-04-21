"use client";

import { Trash2 } from "lucide-react";
import { useJournal, type JournalEntry } from "@/hooks/use-journal";
import { formatPrice, formatUsd, formatPct, formatDate } from "@/lib/format";
import { NewEntryDialog } from "./new-entry-dialog";

export function JournalEntries() {
  const { entries, loading, create, remove } = useJournal();

  return (
    <div className="bg-surface-container-low p-3 lg:p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">
          Trade Journal
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-on-surface-variant">
            {entries.length} ENTRIES
          </span>
          <NewEntryDialog onSubmit={create} />
        </div>
      </div>

      {/* Desktop table header */}
      <div className="hidden lg:grid grid-cols-[60px_90px_80px_60px_1fr_1fr_1fr_70px_1.2fr_30px] text-[10px] text-on-surface-variant gap-2 px-1">
        <span>ID</span>
        <span>DATE</span>
        <span>PAIR</span>
        <span>SIDE</span>
        <span className="text-right">ENTRY</span>
        <span className="text-right">EXIT</span>
        <span className="text-right">PNL</span>
        <span className="text-right">RRR</span>
        <span>STRATEGY</span>
        <span></span>
      </div>

      {loading ? (
        <div className="text-center text-xs text-on-surface-variant py-8">
          Loading journal entries...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center text-xs text-on-surface-variant py-8">
          No entries yet. Click <span className="text-primary">New Entry</span>{" "}
          to log your first trade.
        </div>
      ) : (
        <div className="flex flex-col gap-[2px]">
          {entries.map((entry) => (
            <JournalEntryRow
              key={entry.id}
              entry={entry}
              onDelete={() => remove(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JournalEntryRow({
  entry,
  onDelete,
}: {
  entry: JournalEntry;
  onDelete: () => void;
}) {
  const isProfit = entry.pnl >= 0;

  async function handleDelete() {
    if (confirm(`Delete entry ${entry.displayId}?`)) {
      await onDelete();
    }
  }

  return (
    <div className="group">
      {/* Desktop row */}
      <div className="hidden lg:grid grid-cols-[60px_90px_80px_60px_1fr_1fr_1fr_70px_1.2fr_30px] text-xs font-mono tabular-nums py-2.5 items-center gap-2 px-1 hover:bg-surface-container-high transition-colors">
        <span className="text-on-surface-variant text-[10px]">
          {entry.displayId}
        </span>
        <span className="text-on-surface-variant text-[10px]">
          {formatDate(entry.date)}
        </span>
        <span className="text-on-surface font-sans font-medium">
          {entry.pair}
        </span>
        <span
          className={`text-[10px] font-sans font-bold tracking-wider ${
            entry.side === "LONG" ? "text-cyan" : "text-orange"
          }`}
        >
          {entry.side}
        </span>
        <span className="text-right text-on-surface">
          ${formatPrice(entry.entry)}
        </span>
        <span className="text-right text-on-surface">
          ${formatPrice(entry.exit)}
        </span>
        <span
          className={`text-right ${
            isProfit ? "text-emerald-accent" : "text-crimson"
          }`}
        >
          {formatUsd(entry.pnl, { signed: true })}
        </span>
        <span className="text-right text-cyan">{entry.rrr}</span>
        <span className="text-on-surface-variant font-sans text-[10px] truncate">
          {entry.strategy}
        </span>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-crimson transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Desktop expanded notes on hover */}
      {entry.notes && (
        <div className="hidden lg:block max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-300">
          <div className="px-1 pb-2 text-[10px] text-on-surface-variant leading-relaxed bg-surface-container-high/50 p-2">
            <span className="text-on-surface-variant/60">NOTES: </span>
            {entry.notes}
          </div>
        </div>
      )}

      {/* Mobile card */}
      <div className="lg:hidden bg-surface-container p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-sans font-medium text-sm text-on-surface">
              {entry.pair}
            </span>
            <span
              className={`text-[10px] font-bold tracking-wider ${
                entry.side === "LONG" ? "text-cyan" : "text-orange"
              }`}
            >
              {entry.side}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`font-mono font-semibold tabular-nums text-sm ${
                isProfit ? "text-emerald-accent" : "text-crimson"
              }`}
            >
              {formatUsd(entry.pnl, { signed: true })}
            </span>
            <button
              onClick={handleDelete}
              className="text-on-surface-variant hover:text-crimson"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
          <span>{formatDate(entry.date)}</span>
          <span className="font-mono tabular-nums">
            {formatPct(entry.pnlPct, { signed: true })}
          </span>
          <span className="text-cyan">RRR {entry.rrr}</span>
        </div>
        {entry.strategy && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5">
              {entry.strategy}
            </span>
          </div>
        )}
        {entry.notes && (
          <p className="text-[10px] text-on-surface-variant leading-relaxed">
            {entry.notes}
          </p>
        )}
      </div>
    </div>
  );
}
