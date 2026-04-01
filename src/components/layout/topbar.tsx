"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatedPrice } from "@/components/ui/animated-price";
import { usePrice } from "@/components/providers/price-provider";
import { Bell, Wallet } from "lucide-react";

const navLinks = [
  { label: "DASHBOARD", href: "/dashboard" },
  { label: "SIGNALS", href: "/signals" },
  { label: "RISK", href: "/risk" },
  { label: "JOURNAL", href: "/journal" },
];

export function Topbar() {
  const pathname = usePathname();
  const { price, priceChangePercent24h, isConnected } = usePrice();

  const changePercent = priceChangePercent24h
    ? `${priceChangePercent24h >= 0 ? "+" : ""}${priceChangePercent24h.toFixed(2)}%`
    : "+0.00%";

  return (
    <>
      <header className="px-6 py-4 bg-[#0e0e0f] flex items-center justify-between">
        {/* Left: Branding + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard">
            <span className="text-2xl font-black tracking-tighter text-[#00ffff] font-heading">
              KINETIC
            </span>
          </Link>

          {/* Nav links */}
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
        <div className="flex items-center gap-4">
          {/* Price display */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <AnimatedPrice
                value={price}
                size="sm"
                className="text-xs font-bold text-on-surface-variant"
              />
              <span className="text-xs font-bold text-on-surface-variant">
                BTC/USD
              </span>
              {isConnected && (
                <span className="w-1.5 h-1.5 bg-emerald-accent animate-pulse" />
              )}
            </div>
            <span className="text-[10px] text-[#00ffff] uppercase font-bold">
              {changePercent} Volatility: High
            </span>
          </div>

          {/* Execute Trade button */}
          <button className="bg-cyan text-[#004343] font-heading font-bold text-xs uppercase px-4 py-2 hover:opacity-90 transition-opacity">
            Execute Trade
          </button>

          {/* Notification bell */}
          <button className="text-[#adaaab] hover:text-[#ffffff] transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* Wallet */}
          <button className="text-[#adaaab] hover:text-[#ffffff] transition-colors">
            <Wallet className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Separation line */}
      <div className="bg-[#131314] h-[1px] w-full" />
    </>
  );
}
