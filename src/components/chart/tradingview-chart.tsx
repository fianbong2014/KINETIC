"use client";

import { useEffect, useRef, useState } from "react";
import { usePrice } from "@/components/providers/price-provider";
import { createBinanceDatafeed } from "@/lib/tradingview/datafeed";
import { createSaveLoadAdapter } from "@/lib/tradingview/save-load-adapter";
import type { Timeframe } from "@/lib/chart-config";

// Where the (gated) TradingView Charting Library files must be dropped.
// See setup notes on the chart page / README. The standalone bundle
// exposes `window.TradingView.widget`.
const LIBRARY_PATH = "/charting_library/";
const LIBRARY_SCRIPT = `${LIBRARY_PATH}charting_library.standalone.js`;

// App timeframe → TradingView resolution
const TF_TO_RESOLUTION: Record<Timeframe, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "4h": "240",
  "1d": "1D",
  "1w": "1W",
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TradingView?: any;
  }
}

let scriptPromise: Promise<boolean> | null = null;

// Loads the library script once. Resolves false if the file is missing
// (library not installed yet) so the caller can show setup guidance.
function loadLibraryScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.TradingView?.widget) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector(
      `script[src="${LIBRARY_SCRIPT}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = LIBRARY_SCRIPT;
    s.async = true;
    s.onload = () => resolve(Boolean(window.TradingView?.widget));
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  return scriptPromise;
}

interface TradingViewChartProps {
  timeframe: Timeframe;
}

/**
 * Mounts the TradingView Charting Library widget wired to the Binance
 * datafeed. Symbol stays in sync with the global PriceProvider both
 * ways: switching pairs elsewhere updates the widget, and changing the
 * symbol inside the widget updates the rest of the app.
 *
 * If the library files are not present (`/charting_library/` missing)
 * a setup panel is shown instead of crashing.
 */
export function TradingViewChart({ timeframe }: TradingViewChartProps) {
  const { symbol, pair, setSymbol } = usePrice();
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetRef = useRef<any>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "missing"
  >("loading");

  // Keep a ref to the latest setter so the widget's symbol-change
  // subscription doesn't need re-binding on every render.
  const setSymbolRef = useRef(setSymbol);
  useEffect(() => {
    setSymbolRef.current = setSymbol;
  }, [setSymbol]);

  // ─ Create the widget once the script + container are ready
  useEffect(() => {
    let disposed = false;

    loadLibraryScript().then((ok) => {
      if (disposed) return;
      if (!ok || !containerRef.current || !window.TradingView?.widget) {
        setStatus("missing");
        return;
      }

      const widget = new window.TradingView.widget({
        symbol: `Binance:${symbol}`,
        interval: TF_TO_RESOLUTION[timeframe],
        container: containerRef.current,
        datafeed: createBinanceDatafeed(),
        library_path: LIBRARY_PATH,
        locale: "en",
        autosize: true,
        theme: "Dark",
        timezone: "Etc/UTC",
        save_load_adapter: createSaveLoadAdapter(),
        auto_save_delay: 2,
        disabled_features: [
          "use_localstorage_for_settings",
          "header_symbol_search",
          "popup_hints",
        ],
        enabled_features: [
          "save_chart_properties_to_local_storage",
          "side_toolbar_in_fullscreen_mode",
        ],
        loading_screen: { backgroundColor: "#0e0e0f" },
        overrides: {
          "paneProperties.background": "#0e0e0f",
          "paneProperties.backgroundType": "solid",
          "paneProperties.vertGridProperties.color": "rgba(72,72,73,0.12)",
          "paneProperties.horzGridProperties.color": "rgba(72,72,73,0.12)",
          "scalesProperties.textColor": "#adaaab",
          "scalesProperties.lineColor": "rgba(72,72,73,0.15)",
          "mainSeriesProperties.candleStyle.upColor": "#00ffff",
          "mainSeriesProperties.candleStyle.downColor": "#ff734c",
          "mainSeriesProperties.candleStyle.borderUpColor": "#00ffff",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ff734c",
          "mainSeriesProperties.candleStyle.wickUpColor": "#00ffff",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ff734c",
        },
      });

      widgetRef.current = widget;

      widget.onChartReady(() => {
        if (disposed) return;
        setStatus("ready");
        try {
          widget
            .activeChart()
            .onSymbolChanged()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .subscribe(null, (info: any) => {
              const next = String(info?.ticker || info?.name || "");
              const clean = next.includes(":")
                ? next.split(":")[1]
                : next;
              // setSymbol is a no-op when unchanged, so an equality
              // guard here would only risk a stale-closure compare.
              if (clean) setSymbolRef.current(clean);
            });
        } catch {
          // subscription is best-effort
        }
      });
    });

    return () => {
      disposed = true;
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch {
          // already torn down
        }
        widgetRef.current = null;
      }
    };
    // Recreate only if the engine container remounts — symbol/timeframe
    // changes are pushed imperatively below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─ Push external symbol changes into the widget
  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || status !== "ready") return;
    try {
      widget.activeChart().setSymbol(`Binance:${symbol}`);
    } catch {
      // chart not ready yet
    }
  }, [symbol, status]);

  // ─ Push timeframe changes into the widget
  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || status !== "ready") return;
    try {
      widget.activeChart().setResolution(TF_TO_RESOLUTION[timeframe]);
    } catch {
      // chart not ready yet
    }
  }, [timeframe, status]);

  return (
    <div className="relative w-full h-full bg-[#0e0e0f]">
      {status === "missing" && <SetupPanel />}
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-xs text-on-surface-variant tracking-widest uppercase animate-pulse">
          Loading TradingView…
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ display: status === "missing" ? "none" : "block" }}
      />
      {status === "ready" && (
        <div className="absolute top-3 left-3 z-10 bg-surface-container-low/80 backdrop-blur-sm px-3 py-1.5 pointer-events-none">
          <span className="text-sm font-black font-heading tracking-tighter uppercase text-on-surface">
            {pair.display}
          </span>
        </div>
      )}
    </div>
  );
}

function SetupPanel() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
      <div className="max-w-lg bg-surface-container-low p-6 text-xs leading-relaxed text-on-surface-variant">
        <p className="text-sm font-black font-heading tracking-wider uppercase text-on-surface mb-3">
          TradingView library not installed
        </p>
        <p className="mb-3">
          The Charting Library is gated by TradingView and cannot be
          bundled in this repo. To enable this engine:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 mb-3">
          <li>
            Request access at{" "}
            <span className="text-cyan">
              tradingview.com/charting-library/
            </span>
          </li>
          <li>
            Copy the <span className="text-cyan">charting_library/</span>{" "}
            folder from the granted private repo into{" "}
            <span className="text-cyan">public/charting_library/</span>
          </li>
          <li>Reload this page — the widget mounts automatically.</li>
        </ol>
        <p>
          The Binance datafeed and layout persistence are already wired;
          no further code changes are needed.
        </p>
      </div>
    </div>
  );
}
