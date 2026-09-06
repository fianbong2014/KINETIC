"use client";

import { useState, useSyncExternalStore } from "react";
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

function readWorkspace(): Workspace {
  try { return window.localStorage.getItem(STORAGE_KEY) === "2" ? "2" : "1"; }
  catch { return "1"; }
}

function subscribeWorkspace(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function serverWorkspace(): Workspace { return "1"; }

export function WorkspaceSwitcher() {
  const saved = useSyncExternalStore(subscribeWorkspace, readWorkspace, serverWorkspace);
  const [selected, setActive] = useState<Workspace | null>(null);
  const active = selected ?? saved;

  function switchTo(ws: Workspace) {
    setActive(ws);
    try {
      window.localStorage.setItem(STORAGE_KEY, ws);
    } catch {
      // ignore
    }
  }

  return (
    <div className="kx-enter mx-auto flex max-w-[1800px] flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div><p className="kx-eyebrow mb-2">TRADING WORKSPACE</p><h1 className="text-3xl font-medium tracking-[-0.045em]">Terminal<span className="text-cyan">.</span></h1></div>
        <div
          role="group"
          aria-label="Dashboard workspace"
          className="inline-flex rounded-lg bg-surface-container-low border border-border p-1"
        >
          <WorkspaceTab
            active={active === "1"}
            onClick={() => switchTo("1")}
            label="Focus"
            sublabel="Standard layout"
            icon={<LayoutDashboard size={13} />}
          />
          <WorkspaceTab
            active={active === "2"}
            onClick={() => switchTo("2")}
            label="Custom"
            sublabel="Arrange your panels"
            icon={<LayoutGrid size={13} />}
          />
        </div>
      </div>

      {active === "2" ? <Workspace2 /> : <Workspace1 />}
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
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
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
