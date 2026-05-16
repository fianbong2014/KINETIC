"use client";

import { useCallback, useEffect, useState } from "react";
import { FullChart, IndicatorLegend } from "@/components/chart/full-chart";
import {
  ChartToolbar,
  TemplateDialog,
} from "@/components/chart/chart-toolbar";
import { OscillatorPane } from "@/components/chart/oscillator-pane";
import { TradingViewChart } from "@/components/chart/tradingview-chart";
import { PromptDialog } from "@/components/ui/prompt-dialog";
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

export default function ChartPage() {
  // Hydrate config from localStorage on mount. SSR returns defaults so
  // the first server render matches the client baseline; the effect
  // below swaps in the persisted config without flicker.
  const [config, setConfig] = useState<ChartConfig>(DEFAULT_CHART_CONFIG);
  const [templates, setTemplates] = useState<ChartTemplate[]>([]);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [savePrompt, setSavePrompt] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setConfig(loadChartConfig());
    setTemplates(loadTemplates());
  }, []);

  // Persist every config change
  const updateConfig = useCallback((next: ChartConfig) => {
    setConfig(next);
    saveChartConfig(next);
  }, []);

  function handleSaveTemplate() {
    setSavePrompt(true);
  }

  function commitSaveTemplate(name: string) {
    const tpl = saveTemplate(name.trim(), config);
    setTemplates(loadTemplates());
    setSavePrompt(false);
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
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
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
          {/* Active indicator legend */}
          {Object.values(config.indicators).some(Boolean) && (
            <div className="px-3 -mt-1">
              <IndicatorLegend indicators={config.indicators} />
            </div>
          )}

          {/* Main chart — sized large for a focused experience */}
          <div className="bg-surface-container-low">
            <div className="h-[480px] md:h-[560px] xl:h-[640px] 2xl:h-[720px]">
              <FullChart config={config} />
            </div>
          </div>

          {/* Oscillator panes — show only when toggled on */}
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

      {templateDialog && (
        <TemplateDialog
          templates={templates}
          onLoad={handleLoadTemplate}
          onDelete={handleDeleteTemplate}
          onClose={() => setTemplateDialog(false)}
        />
      )}

      <PromptDialog
        open={savePrompt}
        title="Name this chart template"
        placeholder="e.g. 1h scalp setup"
        defaultValue={`${config.timeframe} · ${config.chartType}`}
        confirmLabel="Save template"
        onConfirm={commitSaveTemplate}
        onCancel={() => setSavePrompt(false)}
      />
    </div>
  );
}
