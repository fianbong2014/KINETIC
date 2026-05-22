"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Columns3 } from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import { getPair, PAIRS } from "@/lib/symbols";
import { useCoinInfo } from "@/hooks/use-coin-info";
import { SymbolHeader } from "./symbol-header";
import { SymbolMacro } from "./symbol-macro";
import { SymbolWorkspaceDefault } from "./symbol-workspace-default";
import { SymbolWorkspaceThreePanel } from "./symbol-workspace-three-panel";
import { BtcMempool } from "@/components/btc/btc-mempool";

const WORKSPACE_STORAGE_KEY = "kinetic-symbol-workspace";
type Workspace = "default" | "three";

function SymbolSwitcher({ active }: { active: string }) {
  return (
    <nav
      aria-label="Switch coin"
      className="bg-surface-container-low p-2 flex gap-1 overflow-x-auto"
    >
      {PAIRS.map((p) => {
        const isActive = p.symbol === active;
        return (
          <Link
            key={p.symbol}
            href={`/symbol/${p.symbol}`}
            scroll={false}
            className={`shrink-0 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
              isActive
                ? "bg-cyan/15 text-cyan"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            {p.base}
          </Link>
        );
      })}
    </nav>
  );
}

function WorkspaceTab({
  active,
  onClick,
  label,
  sublabel,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
        active
          ? "bg-cyan/15 text-cyan"
          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
      }`}
    >
      {icon}
      <span className="flex flex-col items-start leading-tight">
        <span>{label}</span>
        <span className="text-[8px] text-on-surface-variant tracking-wider">
          {sublabel}
        </span>
      </span>
    </button>
  );
}

function WorkspaceSwitcher({
  active,
  onChange,
}: {
  active: Workspace;
  onChange: (w: Workspace) => void;
}) {
  return (
    <div className="flex items-center justify-end">
      <div
        role="tablist"
        aria-label="Symbol workspace style"
        className="inline-flex bg-surface-container-low border border-outline-variant/10 p-0.5"
      >
        <WorkspaceTab
          active={active === "default"}
          onClick={() => onChange("default")}
          label="Workspace 1"
          sublabel="Default"
          icon={<LayoutDashboard size={13} />}
        />
        <WorkspaceTab
          active={active === "three"}
          onClick={() => onChange("three")}
          label="Workspace 2"
          sublabel="Three-panel"
          icon={<Columns3 size={13} />}
        />
      </div>
    </div>
  );
}

export function SymbolPage({ symbol }: { symbol: string }) {
  const pair = getPair(symbol);
  const { symbol: activeSymbol, setSymbol } = usePrice();
  const { data: coin, loading, error } = useCoinInfo(pair.coingeckoId);

  const [workspace, setWorkspace] = useState<Workspace>("default");
  const [hydrated, setHydrated] = useState(false);

  // Drive the global PriceProvider symbol from the URL so the live hooks
  // (orderbook, ticker, trades) all stream the page's coin.
  useEffect(() => {
    if (activeSymbol !== symbol) setSymbol(symbol);
  }, [symbol, activeSymbol, setSymbol]);

  // Restore the user's last-picked workspace from localStorage. Done during
  // render (the React-sanctioned "adjust state while rendering" pattern)
  // instead of an effect, so the React Compiler lint stays happy.
  if (!hydrated) {
    setHydrated(true);
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
        if (saved === "default" || saved === "three") setWorkspace(saved);
      } catch {
        // ignore
      }
    }
  }

  function switchWorkspace(ws: Workspace) {
    setWorkspace(ws);
    try {
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, ws);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-3 lg:gap-6">
      <SymbolSwitcher active={symbol} />
      <SymbolHeader pair={pair} coin={coin} loading={loading} />

      {error && (
        <div className="bg-crimson/10 text-crimson text-xs px-4 py-3 tracking-wider uppercase">
          Failed to load coin info: {error}. Live trading data still works.
        </div>
      )}

      {/* Global market context — same on every coin and every workspace */}
      <SymbolMacro />

      <WorkspaceSwitcher active={workspace} onChange={switchWorkspace} />

      {/* Render the chosen workspace. Default to "default" until hydrated to
          avoid flashing a layout shift on first paint. */}
      {hydrated && workspace === "three" ? (
        <SymbolWorkspaceThreePanel
          symbol={symbol}
          pair={pair}
          coin={coin}
          loading={loading}
        />
      ) : (
        <SymbolWorkspaceDefault
          symbol={symbol}
          pair={pair}
          coin={coin}
          loading={loading}
        />
      )}

      {/* BTC-only network section (mempool / fees) — shared across both
          workspaces so it always sits at the bottom of the BTC page. */}
      {symbol === "BTCUSDT" && (
        <div className="grid grid-cols-12 gap-3 lg:gap-6">
          <div className="col-span-12 lg:col-span-6">
            <BtcMempool />
          </div>
        </div>
      )}
    </div>
  );
}
