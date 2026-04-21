"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import { PAIRS } from "@/lib/symbols";

export function PairSelector() {
  const { symbol, pair, setSymbol } = usePrice();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high hover:bg-surface-container-highest transition-colors text-on-surface text-xs font-bold tracking-wider"
      >
        <span>{pair.display}</span>
        <ChevronDown
          className={`w-3 h-3 text-on-surface-variant transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[140px] bg-surface-container-high border border-outline-variant/20 z-50 shadow-xl">
          {PAIRS.map((p) => (
            <button
              key={p.symbol}
              onClick={() => {
                setSymbol(p.symbol);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                p.symbol === symbol
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface hover:bg-surface-container-highest"
              }`}
            >
              <span className="font-bold tracking-wider">{p.display}</span>
              <span className="text-[9px] text-on-surface-variant font-mono">
                {p.base}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
