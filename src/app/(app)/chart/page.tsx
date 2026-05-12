"use client";

import { useCallback, useEffect, useState } from "react";
import { FullChart, IndicatorLegend } from "@/components/chart/full-chart";
import {
  ChartToolbar,
  TemplateDialog,
} from "@/components/chart/chart-toolbar";
import { OscillatorPane } from "@/components/chart/oscillator-pane";
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
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <ChartToolbar
        config={config}
        onConfigChange={updateConfig}
        onSaveTemplate={handleSaveTemplate}
        onLoadTemplate={() => setTemplateDialog(true)}
        templateCount={templates.length}
      />

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
          <OscillatorPane type="rsi" timeframe={config.timeframe} height={140} />
        </div>
      )}
      {config.oscillators.macd && (
        <div className="bg-surface-container-low">
          <OscillatorPane type="macd" timeframe={config.timeframe} height={160} />
        </div>
      )}

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
