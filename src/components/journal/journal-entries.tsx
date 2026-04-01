"use client";

import { Badge } from "@/components/ui/badge";

interface JournalEntry {
  id: string;
  date: string;
  pair: string;
  side: "LONG" | "SHORT";
  entry: string;
  exit: string;
  pnl: string;
  pnlPct: string;
  isProfit: boolean;
  strategy: string;
  notes: string;
  rrr: string;
}

const entries: JournalEntry[] = [
  {
    id: "K-9201",
    date: "2026-03-30",
    pair: "BTC/USD",
    side: "LONG",
    entry: "$41,200.00",
    exit: "$43,450.00",
    pnl: "+$4,500.00",
    pnlPct: "+5.46%",
    isProfit: true,
    strategy: "Liquidity Grab + EMA Cross",
    notes: "Clean entry at demand zone. RSI divergence confirmed on 4H. Took profit at R1 supply zone. Could have held for R2 but followed plan.",
    rrr: "1:3.2",
  },
  {
    id: "K-9198",
    date: "2026-03-29",
    pair: "ETH/USD",
    side: "SHORT",
    entry: "$2,480.00",
    exit: "$2,520.00",
    pnl: "-$320.00",
    pnlPct: "-1.61%",
    isProfit: false,
    strategy: "Supply Rejection",
    notes: "Entered short at supply zone but market structure shifted bullish. Stop hit. Lesson: wait for BOS confirmation before counter-trend entries.",
    rrr: "1:2.0",
  },
  {
    id: "K-9195",
    date: "2026-03-28",
    pair: "SOL/USD",
    side: "LONG",
    entry: "$92.40",
    exit: "$101.80",
    pnl: "+$1,880.00",
    pnlPct: "+10.17%",
    isProfit: true,
    strategy: "Breakout + Volume Spike",
    notes: "SOL broke above weekly resistance with 3x avg volume. Entered on retest. Strong momentum carried to target. Textbook breakout trade.",
    rrr: "1:4.1",
  },
  {
    id: "K-9190",
    date: "2026-03-27",
    pair: "BTC/USD",
    side: "LONG",
    entry: "$39,800.00",
    exit: "$41,200.00",
    pnl: "+$2,800.00",
    pnlPct: "+3.52%",
    isProfit: true,
    strategy: "Demand Zone Bounce",
    notes: "Price swept below previous low into daily demand zone. Bullish engulfing on 4H confirmed entry. Held overnight and exited at previous structure high.",
    rrr: "1:2.8",
  },
  {
    id: "K-9185",
    date: "2026-03-26",
    pair: "BTC/USD",
    side: "SHORT",
    entry: "$42,100.00",
    exit: "$41,400.00",
    pnl: "+$1,400.00",
    pnlPct: "+1.66%",
    isProfit: true,
    strategy: "Divergence Short",
    notes: "Bearish RSI divergence on 1H at supply zone. Market overextended after 8% rally. Quick scalp to mean reversion target.",
    rrr: "1:1.8",
  },
  {
    id: "K-9180",
    date: "2026-03-25",
    pair: "ETH/USD",
    side: "LONG",
    entry: "$2,320.00",
    exit: "$2,290.00",
    pnl: "-$240.00",
    pnlPct: "-1.29%",
    isProfit: false,
    strategy: "EMA Cross",
    notes: "Premature entry before confirmation. EMA cross happened but no volume follow-through. Need to wait for volume confirmation.",
    rrr: "1:2.5",
  },
];

export function JournalEntries() {
  return (
    <div className="bg-surface-container-low p-3 lg:p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">
          Trade Journal
        </h3>
        <span className="text-[10px] text-on-surface-variant">
          {entries.length} ENTRIES
        </span>
      </div>

      {/* Desktop table header */}
      <div className="hidden lg:grid grid-cols-9 text-[10px] text-on-surface-variant gap-2 px-1">
        <span>ID</span>
        <span>DATE</span>
        <span>PAIR</span>
        <span>SIDE</span>
        <span className="text-right">ENTRY</span>
        <span className="text-right">EXIT</span>
        <span className="text-right">PNL</span>
        <span className="text-right">RRR</span>
        <span>STRATEGY</span>
      </div>

      {/* Entries */}
      <div className="flex flex-col gap-[2px]">
        {entries.map((entry) => (
          <JournalEntryRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function JournalEntryRow({ entry }: { entry: JournalEntry }) {
  return (
    <div className="group">
      {/* Desktop row */}
      <div className="hidden lg:grid grid-cols-9 text-xs font-mono tabular-nums py-2.5 items-center gap-2 px-1 hover:bg-surface-container-high transition-colors cursor-pointer">
        <span className="text-on-surface-variant text-[10px]">{entry.id}</span>
        <span className="text-on-surface-variant text-[10px]">{entry.date}</span>
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
        <span className="text-right text-on-surface">{entry.entry}</span>
        <span className="text-right text-on-surface">{entry.exit}</span>
        <span
          className={`text-right ${
            entry.isProfit ? "text-emerald-accent" : "text-crimson"
          }`}
        >
          {entry.pnl}
        </span>
        <span className="text-right text-cyan">{entry.rrr}</span>
        <span className="text-on-surface-variant font-sans text-[10px] truncate">
          {entry.strategy}
        </span>
      </div>

      {/* Desktop expanded notes on hover */}
      <div className="hidden lg:block max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-300">
        <div className="px-1 pb-2 text-[10px] text-on-surface-variant leading-relaxed bg-surface-container-high/50 p-2">
          <span className="text-on-surface-variant/60">NOTES: </span>
          {entry.notes}
        </div>
      </div>

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
          <span
            className={`font-mono font-semibold tabular-nums text-sm ${
              entry.isProfit ? "text-emerald-accent" : "text-crimson"
            }`}
          >
            {entry.pnl}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
          <span>{entry.date}</span>
          <span className="font-mono tabular-nums">{entry.pnlPct}</span>
          <span className="text-cyan">RRR {entry.rrr}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5">
            {entry.strategy}
          </span>
        </div>
        <p className="text-[10px] text-on-surface-variant leading-relaxed">
          {entry.notes}
        </p>
      </div>
    </div>
  );
}
