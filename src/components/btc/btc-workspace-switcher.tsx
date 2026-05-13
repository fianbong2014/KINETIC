"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, Sparkles } from "lucide-react";
import { BtcWorkspaceCompact } from "@/components/btc/btc-workspace-compact";
import { BtcWorkspaceGoogle } from "@/components/btc/btc-workspace-google";

const STORAGE_KEY = "kinetic-btc-workspace";

type Workspace = "compact" | "google";

export function BtcWorkspaceSwitcher() {
  const [active, setActive] = useState<Workspace>("google");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "compact" || saved === "google") setActive(saved);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  function switchTo(ws: Workspace) {
    setActive(ws);
    try {
      window.localStorage.setItem(STORAGE_KEY, ws);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <div className="flex items-center justify-end">
        <div
          role="tablist"
          aria-label="BTC workspace style"
          className="inline-flex bg-surface-container-low border border-outline-variant/10 p-0.5"
        >
          <SwitchTab
            active={active === "google"}
            onClick={() => switchTo("google")}
            icon={<Sparkles size={12} />}
            label="Google"
          />
          <SwitchTab
            active={active === "compact"}
            onClick={() => switchTo("compact")}
            icon={<LayoutGrid size={12} />}
            label="Compact"
          />
        </div>
      </div>

      {hydrated && active === "compact" ? (
        <BtcWorkspaceCompact />
      ) : (
        <BtcWorkspaceGoogle />
      )}
    </div>
  );
}

function SwitchTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
        active
          ? "bg-cyan/15 text-cyan"
          : "text-on-surface-variant hover:text-on-surface"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
