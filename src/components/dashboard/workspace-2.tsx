"use client";

import { useEffect, useMemo, useState } from "react";
import { Responsive as ResponsiveTyped } from "react-grid-layout";

// The @types for react-grid-layout lag behind v2 (e.g. draggableHandle prop
// missing). Cast to a permissive component prop type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Responsive: React.ComponentType<any> = ResponsiveTyped as any;
// react-grid-layout v2 dropped WidthProvider in favor of a hook;
// the hook isn't in @types yet, so import via an untyped require.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useContainerWidth } = require("react-grid-layout") as {
  useContainerWidth: (opts?: { initialWidth?: number }) => {
    width: number;
    mounted: boolean;
    containerRef: React.RefObject<HTMLDivElement | null>;
  };
};

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}
type Layouts = { [breakpoint: string]: LayoutItem[] };
import { GripVertical, RotateCcw, Lock, Unlock } from "lucide-react";

import { PriceChart } from "@/components/dashboard/price-chart";
import { OrderBook } from "@/components/dashboard/order-book";
import { OpenPositions } from "@/components/dashboard/open-positions";
import { TradeExecution } from "@/components/dashboard/trade-execution";
import { RiskControl } from "@/components/dashboard/risk-control";
import { SignalLogic } from "@/components/dashboard/signal-logic";
import { AlertCenter } from "@/components/dashboard/alert-center";
import { Watchlist } from "@/components/dashboard/watchlist";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const STORAGE_KEY = "kinetic-workspace2-layouts";

interface Widget {
  id: string;
  title: string;
  Component: React.ComponentType;
}

const WIDGETS: Widget[] = [
  { id: "chart", title: "Price Chart", Component: PriceChart },
  { id: "orderbook", title: "Order Book", Component: OrderBook },
  { id: "trade", title: "Trade Execution", Component: TradeExecution },
  { id: "positions", title: "Open Positions", Component: OpenPositions },
  { id: "watchlist", title: "Watchlist", Component: Watchlist },
  { id: "risk", title: "Risk Control", Component: RiskControl },
  { id: "signal", title: "Signal Logic", Component: SignalLogic },
  { id: "alerts", title: "Alert Center", Component: AlertCenter },
];

// Default layouts per breakpoint. 12 cols, ~50px row height.
const DEFAULT_LAYOUTS: Layouts = {
  lg: [
    { i: "chart", x: 3, y: 0, w: 6, h: 10, minW: 4, minH: 6 },
    { i: "orderbook", x: 9, y: 0, w: 3, h: 10, minW: 2, minH: 4 },
    { i: "watchlist", x: 0, y: 0, w: 3, h: 5, minW: 2, minH: 3 },
    { i: "risk", x: 0, y: 5, w: 3, h: 5, minW: 2, minH: 3 },
    { i: "trade", x: 9, y: 10, w: 3, h: 8, minW: 2, minH: 5 },
    { i: "positions", x: 3, y: 10, w: 6, h: 6, minW: 3, minH: 4 },
    { i: "signal", x: 0, y: 10, w: 3, h: 6, minW: 2, minH: 4 },
    { i: "alerts", x: 0, y: 16, w: 3, h: 5, minW: 2, minH: 3 },
  ],
  md: [
    { i: "chart", x: 0, y: 0, w: 8, h: 10 },
    { i: "orderbook", x: 8, y: 0, w: 4, h: 10 },
    { i: "trade", x: 0, y: 10, w: 6, h: 8 },
    { i: "positions", x: 6, y: 10, w: 6, h: 8 },
    { i: "watchlist", x: 0, y: 18, w: 4, h: 5 },
    { i: "risk", x: 4, y: 18, w: 4, h: 5 },
    { i: "signal", x: 8, y: 18, w: 4, h: 5 },
    { i: "alerts", x: 0, y: 23, w: 12, h: 5 },
  ],
  sm: [
    { i: "chart", x: 0, y: 0, w: 12, h: 9 },
    { i: "trade", x: 0, y: 9, w: 12, h: 8 },
    { i: "orderbook", x: 0, y: 17, w: 12, h: 8 },
    { i: "positions", x: 0, y: 25, w: 12, h: 6 },
    { i: "watchlist", x: 0, y: 31, w: 12, h: 5 },
    { i: "risk", x: 0, y: 36, w: 12, h: 5 },
    { i: "signal", x: 0, y: 41, w: 12, h: 5 },
    { i: "alerts", x: 0, y: 46, w: 12, h: 5 },
  ],
};

export function Workspace2() {
  const [layouts, setLayouts] = useState<Layouts>(DEFAULT_LAYOUTS);
  const [locked, setLocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { width, containerRef } = useContainerWidth({ initialWidth: 1200 });

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setLayouts(parsed);
        }
      }
    } catch {
      // ignore corrupt state
    }
    setHydrated(true);
  }, []);

  // Persist on layout change. The library's TS types lag behind v2, so
  // accept the loose object shape and coerce.
  function handleLayoutChange(_current: unknown, allLayouts: unknown) {
    if (!hydrated) return;
    const next = allLayouts as Layouts;
    setLayouts(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // quota / serialization failure — non-fatal
    }
  }

  function resetLayout() {
    if (!confirm("Reset workspace layout to default?")) return;
    setLayouts(DEFAULT_LAYOUTS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  const memoLayouts = useMemo(() => layouts, [layouts]);

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant/10 px-3 py-2">
        <p className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">
          {locked
            ? "LAYOUT LOCKED"
            : "DRAG HEADER TO MOVE · DRAG CORNER TO RESIZE"}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLocked((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface px-2 py-1 transition-colors"
            title={locked ? "Unlock layout" : "Lock layout"}
          >
            {locked ? <Lock size={12} /> : <Unlock size={12} />}
            {locked ? "Locked" : "Unlocked"}
          </button>
          <button
            onClick={resetLayout}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant hover:text-cyan px-2 py-1 transition-colors"
            title="Reset to default"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      </div>

      <div ref={containerRef}>
        <Responsive
          className="layout"
          layouts={memoLayouts}
          breakpoints={{ lg: 1280, md: 768, sm: 0 }}
          cols={{ lg: 12, md: 12, sm: 12 }}
          rowHeight={50}
          margin={[12, 12]}
          containerPadding={[0, 0]}
          draggableHandle=".widget-handle"
          isDraggable={!locked}
          isResizable={!locked}
          onLayoutChange={handleLayoutChange}
          compactType="vertical"
          width={width}
        >
          {WIDGETS.map(({ id, title, Component }) => (
            <div key={id} className="overflow-hidden">
              <WidgetFrame title={title} locked={locked}>
                <Component />
              </WidgetFrame>
            </div>
          ))}
        </Responsive>
      </div>
    </div>
  );
}

function WidgetFrame({
  title,
  locked,
  children,
}: {
  title: string;
  locked: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex flex-col bg-surface-container-low border border-outline-variant/10 overflow-hidden">
      <div
        className={`widget-handle flex items-center justify-between px-3 py-1.5 bg-surface-container-high/50 backdrop-blur-sm shrink-0 select-none ${
          locked ? "cursor-default" : "cursor-grab active:cursor-grabbing"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {!locked && (
            <GripVertical
              size={12}
              className="text-on-surface-variant shrink-0"
            />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface truncate">
            {title}
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">{children}</div>
    </div>
  );
}
