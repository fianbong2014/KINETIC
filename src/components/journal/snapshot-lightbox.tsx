"use client";

import { useEffect, useState } from "react";
import { X, Download, Loader2, ImageOff } from "lucide-react";
import { useJournal, type JournalEntryFull } from "@/hooks/use-journal";
import { formatPrice, formatUsd, formatPct, formatDate } from "@/lib/format";

interface SnapshotLightboxProps {
  /** Journal entry id to load + display. Closes when set to null. */
  entryId: string | null;
  onClose: () => void;
}

/**
 * Fullscreen-ish overlay that shows the auto-captured chart snapshot for a
 * journal entry. The image data URL is fetched lazily (the list endpoint
 * deliberately omits it). Esc and click-outside close.
 */
export function SnapshotLightbox({ entryId, onClose }: SnapshotLightboxProps) {
  const { fetchOne } = useJournal();
  const [entry, setEntry] = useState<JournalEntryFull | null>(null);
  // Initial `true` is correct because callers should mount this with
  // `key={entryId}` so each open is a fresh component instance — see the
  // SnapshotLightbox usage in journal-entries.tsx.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load on open / id change. When entryId is null, the component
  // renders nothing (early return below) so we don't bother resetting
  // state — the next open will overwrite via fetchOne(). Pattern
  // matches the project's other data-loading hooks: setState lives in
  // the promise callbacks, never directly in the effect body.
  useEffect(() => {
    if (!entryId) return;
    let cancelled = false;
    fetchOne(entryId)
      .then((e) => {
        if (cancelled) return;
        setEntry(e);
        setError(null);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setEntry(null);
        setError(err.message || "Failed to load");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entryId, fetchOne]);

  // Esc to close.
  useEffect(() => {
    if (!entryId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entryId, onClose]);

  if (!entryId) return null;

  function handleDownload() {
    if (!entry?.chartSnapshot) return;
    const a = document.createElement("a");
    a.href = entry.chartSnapshot;
    a.download = `${entry.displayId || "trade"}-${entry.pair.replace("/", "-")}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const isProfit = entry ? entry.pnl >= 0 : false;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-low max-w-5xl w-full max-h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-surface-container">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[10px] font-mono text-on-surface-variant shrink-0">
              {entry?.displayId ?? "…"}
            </span>
            <span className="text-xs font-bold text-on-surface truncate">
              {entry?.pair ?? ""}
            </span>
            {entry && (
              <span
                className={`text-[10px] font-bold tracking-wider ${
                  entry.side === "LONG" ? "text-cyan" : "text-orange"
                }`}
              >
                {entry.side}
              </span>
            )}
            {entry && (
              <span className="text-[10px] text-on-surface-variant hidden sm:inline">
                {formatDate(entry.date)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {entry?.chartSnapshot && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cyan hover:opacity-80 transition-opacity px-2 py-1"
                title="Download JPEG"
              >
                <Download size={12} />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface p-1"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-4 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-16 text-on-surface-variant text-xs">
              <Loader2 className="animate-spin mr-2" size={14} />
              Loading snapshot…
            </div>
          )}

          {!loading && error && (
            <p className="text-[11px] text-crimson font-mono py-8 text-center">
              {error}
            </p>
          )}

          {!loading && entry && !entry.chartSnapshot && (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant text-xs gap-2">
              <ImageOff size={20} />
              No chart snapshot for this trade.
            </div>
          )}

          {!loading && entry?.chartSnapshot && (
            <img
              src={entry.chartSnapshot}
              alt={`Chart at close — ${entry.pair} ${entry.side}`}
              className="w-full h-auto"
            />
          )}

          {entry && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-mono tabular-nums pt-2">
              <Stat label="ENTRY" value={`$${formatPrice(entry.entry)}`} />
              <Stat label="EXIT" value={`$${formatPrice(entry.exit)}`} />
              <Stat
                label="PNL"
                value={formatUsd(entry.pnl, { signed: true })}
                color={isProfit ? "text-emerald-accent" : "text-crimson"}
              />
              <Stat
                label="PNL%"
                value={formatPct(entry.pnlPct, { signed: true })}
                color={isProfit ? "text-emerald-accent" : "text-crimson"}
              />
              <Stat label="RRR" value={entry.rrr} color="text-cyan" />
              <Stat label="STRATEGY" value={entry.strategy || "—"} />
              {entry.chartSnapshotMeta?.symbol && (
                <Stat
                  label="CAPTURED"
                  value={
                    entry.chartSnapshotMeta.capturedAt
                      ? new Date(
                          entry.chartSnapshotMeta.capturedAt
                        ).toLocaleString()
                      : "—"
                  }
                />
              )}
            </div>
          )}

          {entry?.notes && (
            <div className="text-[11px] text-on-surface-variant leading-relaxed pt-2 border-t border-outline-variant/10">
              <span className="text-on-surface-variant/60 uppercase text-[9px] tracking-wider mr-1">
                NOTES
              </span>
              {entry.notes}
            </div>
          )}
        </div>
      </div>
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
    <div className="space-y-0.5">
      <p className="text-on-surface-variant text-[9px] uppercase tracking-wider">
        {label}
      </p>
      <p className={color || "text-on-surface"}>{value}</p>
    </div>
  );
}
