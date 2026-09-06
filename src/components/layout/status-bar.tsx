"use client";
import { usePrice } from "@/components/providers/price-provider";

export function StatusBar() {
  const { isConnected, pair } = usePrice();
  return <footer className="flex h-9 items-center justify-between border-t border-border px-7 text-[10px] text-on-surface-variant">
    <span className="flex items-center gap-2"><span className={`size-1.5 rounded-full ${isConnected ? "bg-emerald-accent" : "bg-orange"}`} />{isConnected ? "Market feed connected" : "Market feed reconnecting"}<span className="mx-2 text-outline-variant">/</span>{pair.display}</span>
    <span>KINETIC <span className="ml-2 opacity-60">v0.1.1</span></span>
  </footer>;
}
