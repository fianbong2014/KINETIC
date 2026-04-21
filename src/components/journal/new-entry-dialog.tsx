"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import type { NewJournalEntry } from "@/hooks/use-journal";

interface NewEntryDialogProps {
  onSubmit: (entry: NewJournalEntry) => Promise<void>;
}

export function NewEntryDialog({ onSubmit }: NewEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [pair, setPair] = useState("BTC/USD");
  const [side, setSide] = useState<"LONG" | "SHORT">("LONG");
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [strategy, setStrategy] = useState("");
  const [notes, setNotes] = useState("");
  const [rrr, setRrr] = useState("1:2");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const entryNum = parseFloat(entry);
    const exitNum = parseFloat(exit);

    if (isNaN(entryNum) || isNaN(exitNum)) {
      setError("Entry and exit prices must be valid numbers");
      return;
    }

    const pnl =
      side === "LONG" ? exitNum - entryNum : entryNum - exitNum;
    const pnlPct = (pnl / entryNum) * 100;

    setSaving(true);
    try {
      await onSubmit({
        pair,
        side,
        entry: entryNum,
        exit: exitNum,
        pnl,
        pnlPct,
        rrr,
        strategy,
        notes,
        date: new Date().toISOString(),
      });
      // Reset + close
      setPair("BTC/USD");
      setSide("LONG");
      setEntry("");
      setExit("");
      setStrategy("");
      setNotes("");
      setRrr("1:2");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-primary text-[#004343] text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 hover:opacity-90 transition-opacity"
      >
        <Plus className="w-3 h-3" />
        New Entry
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-surface-container-low w-full max-w-lg max-h-[90vh] overflow-auto border border-outline-variant/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/10">
              <h3 className="text-sm font-black font-heading tracking-wider uppercase text-on-surface">
                New Journal Entry
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 p-2 text-xs text-crimson-accent">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Field label="Pair">
                  <input
                    type="text"
                    value={pair}
                    onChange={(e) => setPair(e.target.value)}
                    required
                    className="w-full bg-surface-container-lowest border border-outline-variant/10 text-sm text-on-surface font-mono px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Side">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setSide("LONG")}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        side === "LONG"
                          ? "bg-primary text-[#004343]"
                          : "bg-surface-container-lowest text-on-surface-variant"
                      }`}
                    >
                      Long
                    </button>
                    <button
                      type="button"
                      onClick={() => setSide("SHORT")}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        side === "SHORT"
                          ? "bg-secondary text-white"
                          : "bg-surface-container-lowest text-on-surface-variant"
                      }`}
                    >
                      Short
                    </button>
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Entry Price">
                  <input
                    type="number"
                    step="any"
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    required
                    placeholder="41200.00"
                    className="w-full bg-surface-container-lowest border border-outline-variant/10 text-sm text-on-surface font-mono px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Exit Price">
                  <input
                    type="number"
                    step="any"
                    value={exit}
                    onChange={(e) => setExit(e.target.value)}
                    required
                    placeholder="43450.00"
                    className="w-full bg-surface-container-lowest border border-outline-variant/10 text-sm text-on-surface font-mono px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Strategy">
                  <input
                    type="text"
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    placeholder="Liquidity Grab + EMA"
                    className="w-full bg-surface-container-lowest border border-outline-variant/10 text-sm text-on-surface px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </Field>
                <Field label="R:R Ratio">
                  <input
                    type="text"
                    value={rrr}
                    onChange={(e) => setRrr(e.target.value)}
                    placeholder="1:3"
                    className="w-full bg-surface-container-lowest border border-outline-variant/10 text-sm text-on-surface font-mono px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Trade analysis, what went well, what to improve..."
                  rows={4}
                  className="w-full bg-surface-container-lowest border border-outline-variant/10 text-xs text-on-surface px-3 py-2 focus:outline-none focus:border-primary resize-none"
                />
              </Field>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-surface-container text-on-surface-variant text-xs font-bold uppercase tracking-wider py-3 hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary text-[#004343] font-heading font-bold text-xs uppercase tracking-wider py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-on-surface-variant tracking-wider uppercase font-bold">
        {label}
      </label>
      {children}
    </div>
  );
}
