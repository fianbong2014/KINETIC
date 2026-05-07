"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LayoutGrid, LayoutDashboard } from "lucide-react";
import { Workspace1 } from "@/components/dashboard/workspace-1";

// Workspace2 uses react-grid-layout's WidthProvider which reads window
// dimensions on mount → load it client-only to avoid hydration mismatch.
const Workspace2 = dynamic(
  () =>
    import("@/components/dashboard/workspace-2").then((m) => ({
      default: m.Workspace2,
    })),
  { ssr: false }
);

const STORAGE_KEY = "kinetic-active-workspace";

type Workspace = "1" | "2";

export function WorkspaceSwitcher() {
  const [active, setActive] = useState<Workspace>("1");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "1" || saved === "2") setActive(saved);
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div
          role="tablist"
          aria-label="Dashboard workspace"
          className="inline-flex bg-surface-container-low border border-outline-variant/10 p-0.5"
        >
          <WorkspaceTab
            active={active === "1"}
            onClick={() => switchTo("1")}
            label="Workspace 1"
            sublabel="Default"
            icon={<LayoutDashboard size={13} />}
          />
          <WorkspaceTab
            active={active === "2"}
            onClick={() => switchTo("2")}
            label="Workspace 2"
            sublabel="Freeform"
            icon={<LayoutGrid size={13} />}
          />
        </div>
      </div>

      {/* Render whichever workspace is active. Avoid mounting Workspace2
          before hydration so localStorage choice wins on first paint. */}
      {hydrated && active === "2" ? <Workspace2 /> : <Workspace1 />}
    </div>
  );
}

function WorkspaceTab({
  active,
  onClick,
  label,
  sublabel,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
        active
          ? "bg-cyan/15 text-cyan"
          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
      }`}
    >
      {icon}
      <span className="flex flex-col items-start leading-tight">
        <span>{label}</span>
        <span className="text-[8px] text-on-surface-variant tracking-wider">
          {sublabel}
        </span>
      </span>
    </button>
  );
}
