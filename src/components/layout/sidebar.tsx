"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  LineChart,
  Shield,
  FileText,
  Settings,
  Zap,
  HelpCircle,
  Code,
  Bot,
} from "lucide-react";

const navItems = [
  { icon: LayoutGrid, label: "Terminal", href: "/dashboard" },
  { icon: LineChart, label: "Analytics", href: "/signals" },
  { icon: Bot, label: "Bots", href: "/bots" },
  { icon: Shield, label: "Command", href: "/risk" },
  { icon: FileText, label: "History", href: "/journal" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-20 bg-[#131314] flex flex-col items-center py-4 z-50">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="w-10 h-10 bg-cyan flex items-center justify-center mb-6"
      >
        <Zap className="w-5 h-5 text-[#004343]" />
      </Link>

      {/* Nav items */}
      <nav className="flex flex-col items-center flex-1 w-full">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "#" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`py-4 w-full flex flex-col items-center justify-center transition-colors relative ${
                isActive
                  ? "border-l-2 border-[#00ffff] bg-[#201f21] text-[#00ffff]"
                  : "text-[#adaaab] hover:bg-[#1a191b] hover:text-[#ffffff]"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-widest uppercase mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col items-center gap-4 mt-auto pt-4 w-full">
        <button className="text-[#adaaab] hover:text-[#ffffff] transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button className="text-[#adaaab] hover:text-[#ffffff] transition-colors">
          <Code className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 bg-[#201f21] rounded-full flex items-center justify-center mt-2">
          <span className="text-xs text-[#adaaab] font-medium">K</span>
        </div>
      </div>
    </aside>
  );
}
