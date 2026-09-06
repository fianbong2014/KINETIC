"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Zap } from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import { useAccount } from "@/hooks/use-account";
import { PairSelector } from "@/components/layout/pair-selector";
import { formatUsd } from "@/lib/format";
import { NotificationBell } from "@/components/layout/notification-bell";

const titles: Record<string, string> = { dashboard: "Trading terminal", btc: "Bitcoin monitor", chart: "Chart", signals: "Signal analysis", risk: "Risk management", journal: "Trade journal", bots: "Trading bots", settings: "Settings", symbol: "Coin explorer" };

export function Topbar() {
  const pathname = usePathname();
  const { isConnected } = usePrice();
  const { balance, todayPnl, loading } = useAccount();
  const title = titles[pathname.split("/")[1]] || "Overview";
  return (
    <header className="kx-topbar sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-xl lg:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/" aria-label="Kinetic overview" className="text-cyan lg:hidden"><Zap size={23} /></Link>
        <span className="hidden text-xs text-on-surface-variant xl:inline">Workspace</span>
        <ChevronRight size={13} className="hidden text-on-surface-variant xl:block" />
        <span className="truncate text-xs font-medium sm:text-sm">{title}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <span className="hidden items-center gap-2 text-[10px] text-on-surface-variant xl:flex"><span className={`size-1.5 rounded-full ${isConnected ? "bg-emerald-accent" : "bg-orange"}`} />{isConnected ? "Market connected" : "Connecting market"}</span>
        <div className="hidden border-l border-border pl-4 text-right md:block">
          <p className="text-[9px] text-on-surface-variant">Paper balance</p>
          <p className="text-xs font-medium tabular-nums">{loading ? "—" : formatUsd(balance)} <span className={`ml-2 text-[10px] ${todayPnl >= 0 ? "text-emerald-accent" : "text-crimson"}`}>{loading ? "" : `${todayPnl >= 0 ? "+" : ""}${todayPnl.toFixed(2)}`}</span></p>
        </div>
        <PairSelector />
        <NotificationBell />
      </div>
    </header>
  );
}
