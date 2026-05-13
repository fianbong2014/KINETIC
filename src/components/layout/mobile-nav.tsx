"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Terminal,
  BarChart3,
  Bot,
  Shield,
  Bitcoin,
  CandlestickChart,
  BookOpen,
  Settings,
  MoreHorizontal,
  Home,
  X,
} from "lucide-react";

interface NavItem {
  icon: typeof Terminal;
  label: string;
  href: string;
}

// Six tabs maximum in the persistent bar to keep mobile bottom nav
// readable on 375px-wide phones. The "More" tab opens a bottom sheet
// with the long-tail routes (Journal, Settings, Home).
const PRIMARY_NAV: NavItem[] = [
  { icon: Terminal, label: "TERMINAL", href: "/dashboard" },
  { icon: Bitcoin, label: "BTC", href: "/btc" },
  { icon: CandlestickChart, label: "CHART", href: "/chart" },
  { icon: BarChart3, label: "SIGNALS", href: "/signals" },
  { icon: Bot, label: "BOTS", href: "/bots" },
];

const MORE_NAV: NavItem[] = [
  { icon: Shield, label: "Risk Command", href: "/risk" },
  { icon: BookOpen, label: "Trade Journal", href: "/journal" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: Home, label: "Home", href: "/" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the sheet on route change so it doesn't linger after navigating
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Highlight "More" if the active route is one of the overflow items
  const moreActive = MORE_NAV.some(
    (item) =>
      pathname === item.href ||
      (item.href !== "/" && pathname?.startsWith(item.href))
  );

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-dim">
        <div className="flex items-center justify-around h-14">
          {PRIMARY_NAV.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "#" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative ${
                  isActive ? "text-cyan" : "text-on-surface-variant"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-cyan" />
                )}
                <item.icon className="w-4 h-4" />
                <span className="text-[9px] font-medium tracking-wider">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More — opens overflow sheet */}
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="More menu"
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative ${
              moreActive || moreOpen ? "text-cyan" : "text-on-surface-variant"
            }`}
          >
            {moreActive && (
              <span className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-cyan" />
            )}
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-[9px] font-medium tracking-wider">MORE</span>
          </button>
        </div>
      </nav>

      {/* Overflow sheet */}
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[55] flex items-end"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-black/60 animate-in fade-in-0 duration-150"
          />

          {/* Sheet */}
          <div
            className="relative w-full bg-surface-container-low border-t border-outline-variant/10 pb-[calc(env(safe-area-inset-bottom)+1rem)] animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
                More
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="flex flex-col">
              {MORE_NAV.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                        isActive
                          ? "bg-cyan/10 text-cyan"
                          : "text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-bold tracking-wider uppercase">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
