"use client";

import { useCallback, useEffect, useState } from "react";
import { PriceProvider } from "@/components/providers/price-provider";
import { FullChart, IndicatorLegend } from "@/components/chart/full-chart";
import {
  ChartToolbar,
  TemplateDialog,
} from "@/components/chart/chart-toolbar";
import { OscillatorPane } from "@/components/chart/oscillator-pane";
import { TradingViewChart } from "@/components/chart/tradingview-chart";
import {
  DEFAULT_CHART_CONFIG,
  deleteTemplate,
  loadChartConfig,
  loadTemplates,
  saveChartConfig,
  saveTemplate,
  type ChartConfig,
  type ChartTemplate,
} from "@/lib/chart-config";
import { useToast } from "@/components/providers/toast-provider";

// Public, auth-free showcase of the chart engines. This route lives
// OUTSIDE the (app) group so it does not mount the authenticated shell
// (sidebar / bot engine / position hooks). It only needs PriceProvider,
// which is backed by public Binance market data. Used as the live demo
// URL for the TradingView Advanced Charts access request.
function ChartDemo() {
  const [config, setConfig] = useState<ChartConfig>(DEFAULT_CHART_CONFIG);
  const [templates, setTemplates] = useState<ChartTemplate[]>([]);
  const [templateDialog, setTemplateDialog] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setConfig(loadChartConfig());
    setTemplates(loadTemplates());
  }, []);

  const updateConfig = useCallback((next: ChartConfig) => {
    setConfig(next);
    saveChartConfig(next);
  }, []);

  function handleSaveTemplate() {
    const name = prompt(
      "Name this chart template:",
      `${config.timeframe} · ${config.chartType}`
    );
    if (!name || !name.trim()) return;
    const tpl = saveTemplate(name.trim(), config);
    setTemplates(loadTemplates());
    toast.success("Template Saved", tpl.name);
  }

  function handleLoadTemplate(id: string) {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    updateConfig(tpl.config);
    setTemplateDialog(false);
    toast.info("Template Loaded", tpl.name);
  }

  function handleDeleteTemplate(id: string) {
    deleteTemplate(id);
    setTemplates(loadTemplates());
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Demo banner */}
      <div className="bg-surface-container-low px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-black font-heading tracking-tighter uppercase text-on-surface">
          KINETIC{" "}
          <span className="text-on-surface-variant text-[10px] tracking-widest">
            {"// CHART ENGINE DEMO"}
          </span>
        </span>
        <span className="text-[10px] text-on-surface-variant tracking-widest uppercase">
          Public preview · Binance live data
        </span>
      </div>

      <div className="flex flex-col gap-3 p-3">
        <ChartToolbar
          config={config}
          onConfigChange={updateConfig}
          onSaveTemplate={handleSaveTemplate}
          onLoadTemplate={() => setTemplateDialog(true)}
          templateCount={templates.length}
        />

        {config.engine === "tradingview" ? (
          <div className="bg-surface-container-low">
            <div className="h-[480px] md:h-[620px] xl:h-[720px] 2xl:h-[820px]">
              <TradingViewChart timeframe={config.timeframe} />
            </div>
          </div>
        ) : (
          <>
            {Object.values(config.indicators).some(Boolean) && (
              <div className="px-3 -mt-1">
                <IndicatorLegend indicators={config.indicators} />
              </div>
            )}

            <div className="bg-surface-container-low">
              <div className="h-[480px] md:h-[560px] xl:h-[640px] 2xl:h-[720px]">
                <FullChart config={config} />
              </div>
            </div>

            {config.oscillators.rsi && (
              <div className="bg-surface-container-low">
                <OscillatorPane
                  type="rsi"
                  timeframe={config.timeframe}
                  height={140}
                />
              </div>
            )}
            {config.oscillators.macd && (
              <div className="bg-surface-container-low">
                <OscillatorPane
                  type="macd"
                  timeframe={config.timeframe}
                  height={160}
                />
              </div>
            )}
            {config.oscillators.stoch && (
              <div className="bg-surface-container-low">
                <OscillatorPane
                  type="stoch"
                  timeframe={config.timeframe}
                  height={140}
                />
              </div>
            )}
            {config.oscillators.atr && (
              <div className="bg-surface-container-low">
                <OscillatorPane
                  type="atr"
                  timeframe={config.timeframe}
                  height={140}
                />
              </div>
            )}
          </>
        )}
      </div>

      {templateDialog && (
        <TemplateDialog
          templates={templates}
          onLoad={handleLoadTemplate}
          onDelete={handleDeleteTemplate}
          onClose={() => setTemplateDialog(false)}
        />
      )}
    </div>
  );
}

export default function ChartDemoPage() {
  return (
    <PriceProvider>
      <ChartDemo />
    </PriceProvider>
  );
}
