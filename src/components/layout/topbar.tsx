"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatedPrice } from "@/components/ui/animated-price";
import { usePrice } from "@/components/providers/price-provider";
import { useAccount } from "@/hooks/use-account";
import { PairSelector } from "@/components/layout/pair-selector";
import { formatUsd } from "@/lib/format";
import { Bell } from "lucide-react";

const navLinks = [
  { label: "DASHBOARD", href: "/dashboard" },
  { label: "SIGNALS", href: "/signals" },
  { label: "RISK", href: "/risk" },
  { label: "JOURNAL", href: "/journal" },
];

export function Topbar() {
  const pathname = usePathname();
  const { price, priceChangePercent24h, isConnected, pair } = usePrice();
  const { balance, todayPnl, loading: accountLoading } = useAccount();

  const changePercent = priceChangePercent24h
    ? `${priceChangePercent24h >= 0 ? "+" : ""}${priceChangePercent24h.toFixed(2)}%`
    : "+0.00%";

  return (
    <>
      <header className="px-4 lg:px-6 py-3 lg:py-4 bg-[#0e0e0f] flex items-center justify-between gap-3">
        {/* Left: Branding + Nav */}
        <div className="flex items-center gap-4 lg:gap-8 min-w-0">
          <Link href="/dashboard" className="shrink-0">
            <span className="text-xl lg:text-2xl font-black tracking-tighter text-[#00ffff] font-heading">
              KINETIC
            </span>
          </Link>

          {/* Nav links — desktop only */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "#" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm uppercase font-bold font-heading pb-4 transition-colors ${
                    isActive
                      ? "text-[#ffffff] border-b-2 border-[#00ffff]"
                      : "text-[#adaaab] hover:text-[#ffffff]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Price + Execute + Icons */}
        <div className="flex items-center gap-2 lg:gap-4 min-w-0">
          {/* Paper balance — md+ */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-on-surface tabular-nums">
              {accountLoading ? "—" : formatUsd(balance)}
            </span>
            <span
              className={`text-[9px] tracking-widest uppercase font-bold ${
                todayPnl > 0
                  ? "text-emerald-accent"
                  : todayPnl < 0
                    ? "text-crimson"
                    : "text-on-surface-variant"
              }`}
            >
              TODAY {todayPnl >= 0 ? "+" : ""}
              {todayPnl.toFixed(2)}
            </span>
          </div>

          {/* Pair selector */}
          <PairSelector />

          {/* Price display — sm+ */}
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <AnimatedPrice
                value={price}
                size="sm"
                className="text-xs font-bold text-on-surface-variant"
              />
              <span className="text-xs font-bold text-on-surface-variant hidden lg:inline">
                {pair.display}
              </span>
              {isConnected && (
                <span className="w-1.5 h-1.5 bg-emerald-accent animate-pulse" />
              )}
            </div>
            <span
              className={`text-[10px] uppercase font-bold tabular-nums ${
                priceChangePercent24h >= 0
                  ? "text-emerald-accent"
                  : "text-crimson"
              }`}
            >
              {changePercent}
            </span>
          </div>

          {/* Notification bell */}
          <button
            aria-label="Notifications"
            className="text-[#adaaab] hover:text-[#ffffff] transition-colors shrink-0"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Separation line */}
      <div className="bg-[#131314] h-[1px] w-full" />
    </>
  );
}
