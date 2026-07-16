"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Terminal,
  BarChart3,
  Bot,
  Shield,
  Bitcoin,
  CandlestickChart,
  BookOpen,
  Settings,
  Home,
  Coins,
  LayoutGrid,
  Users,
  X,
} from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import { useAlerts } from "@/hooks/use-alerts";

interface NavItem {
  icon: typeof Terminal;
  label: string;
  href: string;
  // When true the icon carries the small attention dot (e.g. triggered alerts)
  badge?: boolean;
}

// Icon-only capsule keeps each tap target wide enough on a 375px phone
// while still surfacing the most-used routes. The trailing grid button
// opens a bottom sheet with the long-tail routes.
const PRIMARY_NAV: NavItem[] = [
  { icon: Terminal, label: "Terminal", href: "/dashboard" },
  { icon: Bitcoin, label: "BTC", href: "/btc" },
  // Coin info page — href resolved to the active pair at render time.
  { icon: Coins, label: "Coin", href: "/symbol" },
  { icon: CandlestickChart, label: "Chart", href: "/chart" },
  { icon: BarChart3, label: "Signals", href: "/signals", badge: true },
  { icon: Bot, label: "Bots", href: "/bots" },
];

const MORE_NAV: NavItem[] = [
  { icon: Shield, label: "Risk Command", href: "/risk" },
  { icon: BookOpen, label: "Trade Journal", href: "/journal" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: Home, label: "Home", href: "/" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { symbol } = usePrice();
  const { data: session } = useSession();
  const [moreOpen, setMoreOpen] = useState(false);

  // UI hint from the JWT only — /backoffice enforces the role server-side.
  const isAdmin = session?.user?.role === "ADMIN";
  const moreItems = useMemo(
    () =>
      isAdmin
        ? [...MORE_NAV, { icon: Users, label: "Backoffice", href: "/backoffice" }]
        : MORE_NAV,
    [isAdmin]
  );

  // Real attention dot: any alert that has already fired but not been cleared.
  const { alerts } = useAlerts({ includeTriggered: true });
  const hasTriggered = useMemo(
    () => alerts.some((a) => a.triggeredAt !== null),
    [alerts]
  );

  // Resolve the Coin item to /symbol/<active pair>, mirroring the sidebar.
  const primaryItems = useMemo(
    () =>
      PRIMARY_NAV.map((item) =>
        item.href === "/symbol"
          ? { ...item, href: `/symbol/${symbol}` }
          : item
      ),
    [symbol]
  );

  // Close the sheet on route change so it doesn't linger after navigating.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const isItemActive = (item: NavItem) => {
    if (item.label === "Coin") return pathname?.startsWith("/symbol") ?? false;
    return (
      pathname === item.href ||
      (item.href !== "/" && item.href !== "#" && (pathname?.startsWith(item.href) ?? false))
    );
  };

  const moreActive = moreItems.some(isItemActive);

  return (
    <>
      {/* Floating capsule bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-[calc(env(safe-area-inset-bottom)+0.5rem)] px-3">
        <div className="kx-float-nav pointer-events-auto flex items-center gap-1 px-2 py-1.5 glass-panel shadow-[0_8px_32px_rgba(0,0,0,0.55)] glow-cyan">
          {primaryItems.map((item) => {
            const isActive = isItemActive(item);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`kx-pill relative flex items-center justify-center h-11 w-11 transition-colors ${
                  isActive
                    ? "bg-surface-container-highest text-cyan"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <item.icon className="w-[22px] h-[22px]" />
                {item.badge && hasTriggered && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-crimson ring-2 ring-[#0e0e0f]" />
                )}
              </Link>
            );
          })}

          {/* More — opens overflow sheet */}
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="More menu"
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={`kx-pill relative flex items-center justify-center h-11 w-11 transition-colors ${
              moreActive || moreOpen
                ? "bg-surface-container-highest text-cyan"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <LayoutGrid className="w-[22px] h-[22px]" />
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
          <div className="kx-float-sheet relative w-full bg-surface-container-low pb-[calc(env(safe-area-inset-bottom)+1rem)] animate-in slide-in-from-bottom duration-200">
            {/* Grab handle */}
            <div className="flex justify-center pt-3">
              <span className="h-1 w-10 rounded-full bg-on-surface-variant/30" />
            </div>
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
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
            <ul className="flex flex-col gap-1 px-3 pb-2">
              {moreItems.map((item) => {
                const isActive = isItemActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`kx-sheet-item flex items-center gap-4 px-4 py-3 transition-colors ${
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
