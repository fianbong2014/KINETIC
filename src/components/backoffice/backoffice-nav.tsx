"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScrollText, Users } from "lucide-react";

const TABS = [
  { href: "/backoffice", label: "Users", icon: Users },
  { href: "/backoffice/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/backoffice/audit", label: "Audit Log", icon: ScrollText },
];

export function BackofficeNav() {
  const pathname = usePathname();

  return (
    <nav className="ig-pill ig-inset flex gap-1 p-1 self-start">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`ig-pill flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors ${
              active
                ? "bg-cyan text-primary-foreground"
                : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
