"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, BarChart3, Bot, Shield, BookOpen } from "lucide-react";

const navItems = [
  { icon: Terminal, label: "TERMINAL", href: "/dashboard" },
  { icon: BarChart3, label: "SIGNALS", href: "/signals" },
  { icon: Bot, label: "BOTS", href: "/bots" },
  { icon: Shield, label: "RISK", href: "/risk" },
  { icon: BookOpen, label: "JOURNAL", href: "/journal" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-dim">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "#" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative ${
                isActive
                  ? "text-cyan"
                  : "text-on-surface-variant"
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
      </div>
    </nav>
  );
}
