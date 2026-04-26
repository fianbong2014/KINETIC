"use client";

import Link from "next/link";
import {
  LayoutGrid,
  LineChart,
  Shield,
  FileText,
  Settings,
  Zap,
  ArrowRight,
  Bot,
} from "lucide-react";

const menuItems = [
  {
    icon: LayoutGrid,
    label: "Terminal",
    description: "Live trading dashboard with real-time BTC price, order book, and trade execution",
    href: "/dashboard",
    accent: "bg-primary/10 group-hover:bg-primary/20",
    iconColor: "text-primary",
    borderColor: "border-primary/20 group-hover:border-primary/40",
  },
  {
    icon: LineChart,
    label: "Signals",
    description: "Signal analysis with zone detection, technical alpha, and trade plan generation",
    href: "/signals",
    accent: "bg-emerald-accent/10 group-hover:bg-emerald-accent/20",
    iconColor: "text-emerald-accent",
    borderColor: "border-emerald-accent/20 group-hover:border-emerald-accent/40",
  },
  {
    icon: Bot,
    label: "Bots",
    description: "Auto-execute trades when multi-timeframe signals align with your strategy",
    href: "/bots",
    accent: "bg-cyan/10 group-hover:bg-cyan/20",
    iconColor: "text-cyan",
    borderColor: "border-cyan/20 group-hover:border-cyan/40",
  },
  {
    icon: Shield,
    label: "Risk",
    description: "Risk command center — portfolio health, exposure heatmap, and position sizing",
    href: "/risk",
    accent: "bg-secondary/10 group-hover:bg-secondary/20",
    iconColor: "text-secondary",
    borderColor: "border-secondary/20 group-hover:border-secondary/40",
  },
  {
    icon: FileText,
    label: "Journal",
    description: "Trade journal with equity curve, performance analytics, and history tracking",
    href: "/journal",
    accent: "bg-[#a78bfa]/10 group-hover:bg-[#a78bfa]/20",
    iconColor: "text-[#a78bfa]",
    borderColor: "border-[#a78bfa]/20 group-hover:border-[#a78bfa]/40",
  },
  {
    icon: Settings,
    label: "Settings",
    description: "Configure API connections, trading preferences, risk limits, and notifications",
    href: "/settings",
    accent: "bg-on-surface-variant/10 group-hover:bg-on-surface-variant/20",
    iconColor: "text-on-surface-variant",
    borderColor: "border-on-surface-variant/20 group-hover:border-on-surface-variant/40",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 bg-primary flex items-center justify-center mb-4">
          <Zap className="w-7 h-7 text-[#004343]" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tighter uppercase text-on-surface">
          Kinetic
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1 tracking-widest uppercase">
          Trading Terminal
        </p>
      </div>

      {/* Block Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 w-full max-w-4xl">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`group relative flex flex-col gap-4 p-6 bg-surface-container border ${item.borderColor} transition-all duration-200 hover:translate-y-[-2px]`}
          >
            {/* Icon */}
            <div className={`w-10 h-10 ${item.accent} flex items-center justify-center transition-colors`}>
              <item.icon className={`w-5 h-5 ${item.iconColor}`} />
            </div>

            {/* Text */}
            <div className="flex-1">
              <h2 className="text-base font-bold font-heading tracking-tight uppercase text-on-surface mb-1">
                {item.label}
              </h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:text-on-surface transition-colors absolute top-6 right-6 opacity-0 group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      {/* Version */}
      <span className="text-[10px] text-on-surface-variant/50 font-mono mt-8 tracking-wider">
        KINETIC v0.1.1 // BTC/USDT
      </span>
    </div>
  );
}
