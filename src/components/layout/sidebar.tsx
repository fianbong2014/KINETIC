"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowUpRight, Bitcoin, Bot, CandlestickChart, Coins, FileText, Home, LayoutGrid, LineChart, Settings, Shield, Users, Zap } from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";

const groups = [
  { label: "Workspace", items: [
    { icon: Home, label: "Overview", href: "/" },
    { icon: LayoutGrid, label: "Terminal", href: "/dashboard" },
    { icon: CandlestickChart, label: "Chart", href: "/chart" },
    { icon: Bitcoin, label: "Bitcoin monitor", href: "/btc" },
    { icon: Coins, label: "Coin explorer", href: "/symbol" },
  ] },
  { label: "Strategy", items: [
    { icon: LineChart, label: "Signals", href: "/signals" },
    { icon: Bot, label: "Trading bots", href: "/bots" },
    { icon: Shield, label: "Risk management", href: "/risk" },
    { icon: FileText, label: "Trade journal", href: "/journal" },
  ] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { symbol } = usePrice();
  const { data: session } = useSession();
  const name = session?.user?.name || "Your account";
  return (
    <aside className="kx-sidebar fixed inset-y-0 left-0 z-50 flex w-52 flex-col border-r border-border bg-surface-container-low">
      <Link href="/" className="flex h-20 shrink-0 items-center gap-2.5 px-6" aria-label="Kinetic overview">
        <span className="flex size-8 items-center justify-center rounded-lg bg-cyan text-primary-foreground"><Zap size={19} fill="currentColor" /></span>
        <span className="font-heading text-xl font-bold tracking-[-0.06em]">kinetic<span className="text-cyan">.</span></span>
      </Link>
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-3">
        {groups.map((group) => (
          <div key={group.label} className="mb-7">
            <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-on-surface-variant">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return <Link key={item.href} href={item.href === "/symbol" ? `/symbol/${symbol}` : item.href} aria-current={active ? "page" : undefined} className={`kx-nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium ${active ? "bg-cyan/10 text-cyan" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"}`}>
                  <item.icon size={17} strokeWidth={1.7} />{item.label}
                  {active && <span className="ml-auto size-1 rounded-full bg-cyan" />}
                </Link>;
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-border p-3">
        {session?.user?.role === "ADMIN" && <Link href="/backoffice" className="kx-nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-on-surface-variant"><Users size={17} />Backoffice</Link>}
        <Link href="/settings" aria-current={pathname === "/settings" ? "page" : undefined} className="kx-nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-on-surface-variant hover:text-on-surface"><Settings size={17} />Settings</Link>
        <Link href="/settings" className="mt-3 flex items-center gap-2.5 rounded-lg bg-surface-container px-3 py-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cyan/10 text-xs font-semibold text-cyan">{name.charAt(0).toUpperCase()}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{name}</p><p className="mt-0.5 text-[10px] text-on-surface-variant">Account preferences</p></div>
          <ArrowUpRight size={14} className="text-on-surface-variant" />
        </Link>
      </div>
    </aside>
  );
}
