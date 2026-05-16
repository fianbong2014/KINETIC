// localStorage-backed save/load adapter for the TradingView Charting
// Library. Implements TradingView's IExternalSaveLoadAdapter so saved
// chart layouts, study templates, drawing templates and drawing-tool
// state survive reloads on the same device — no backend round-trip.
//
// Keyed per user is unnecessary here (paper-trading is single-user per
// browser) so everything lives under one namespace.

const NS = "kinetic:tv:";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(NS + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    // private mode / quota — silent
  }
}

interface SavedChart {
  id: string;
  name: string;
  symbol: string;
  resolution: string;
  content: string;
  timestamp: number;
}

interface NamedContent {
  name: string;
  content: string;
}

/**
 * Returns an object implementing the TradingView save/load adapter
 * contract. Hand it to the widget as `save_load_adapter`.
 */
export function createSaveLoadAdapter() {
  return {
    // ─── Chart layouts ──────────────────────────────────────────────
    getAllCharts(): Promise<SavedChart[]> {
      return Promise.resolve(read<SavedChart[]>("charts", []));
    },

    removeChart(id: string | number): Promise<void> {
      const charts = read<SavedChart[]>("charts", []).filter(
        (c) => c.id !== String(id)
      );
      write("charts", charts);
      return Promise.resolve();
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    saveChart(chartData: any): Promise<string> {
      const charts = read<SavedChart[]>("charts", []);
      const id =
        chartData.id != null
          ? String(chartData.id)
          : `chart_${Date.now().toString(36)}`;
      const entry: SavedChart = {
        id,
        name: chartData.name || "Untitled",
        symbol: chartData.symbol || "",
        resolution: chartData.resolution || "",
        content: chartData.content,
        timestamp: Math.floor(Date.now() / 1000),
      };
      const next = charts.filter((c) => c.id !== id);
      next.push(entry);
      write("charts", next);
      return Promise.resolve(id);
    },

    getChartContent(id: string | number): Promise<string> {
      const chart = read<SavedChart[]>("charts", []).find(
        (c) => c.id === String(id)
      );
      return chart
        ? Promise.resolve(chart.content)
        : Promise.reject(new Error("chart not found"));
    },

    // ─── Study templates ────────────────────────────────────────────
    getAllStudyTemplates(): Promise<NamedContent[]> {
      return Promise.resolve(read<NamedContent[]>("studyTemplates", []));
    },

    removeStudyTemplate(info: { name: string }): Promise<void> {
      const next = read<NamedContent[]>("studyTemplates", []).filter(
        (t) => t.name !== info.name
      );
      write("studyTemplates", next);
      return Promise.resolve();
    },

    saveStudyTemplate(tpl: NamedContent): Promise<void> {
      const all = read<NamedContent[]>("studyTemplates", []).filter(
        (t) => t.name !== tpl.name
      );
      all.push(tpl);
      write("studyTemplates", all);
      return Promise.resolve();
    },

    getStudyTemplateContent(info: { name: string }): Promise<string> {
      const t = read<NamedContent[]>("studyTemplates", []).find(
        (x) => x.name === info.name
      );
      return t
        ? Promise.resolve(t.content)
        : Promise.reject(new Error("study template not found"));
    },

    // ─── Drawing templates ──────────────────────────────────────────
    getDrawingTemplates(): Promise<string[]> {
      return Promise.resolve(
        read<NamedContent[]>("drawingTemplates", []).map((t) => t.name)
      );
    },

    loadDrawingTemplate(
      _tool: string,
      templateName: string
    ): Promise<string> {
      const t = read<NamedContent[]>("drawingTemplates", []).find(
        (x) => x.name === templateName
      );
      return t
        ? Promise.resolve(t.content)
        : Promise.reject(new Error("drawing template not found"));
    },

    saveDrawingTemplate(
      _tool: string,
      templateName: string,
      content: string
    ): Promise<void> {
      const all = read<NamedContent[]>("drawingTemplates", []).filter(
        (t) => t.name !== templateName
      );
      all.push({ name: templateName, content });
      write("drawingTemplates", all);
      return Promise.resolve();
    },

    removeDrawingTemplate(
      _tool: string,
      templateName: string
    ): Promise<void> {
      const next = read<NamedContent[]>("drawingTemplates", []).filter(
        (t) => t.name !== templateName
      );
      write("drawingTemplates", next);
      return Promise.resolve();
    },

    // ─── Chart templates ────────────────────────────────────────────
    getAllChartTemplates(): Promise<string[]> {
      return Promise.resolve(
        read<NamedContent[]>("chartTemplates", []).map((t) => t.name)
      );
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    saveChartTemplate(name: string, content: any): Promise<void> {
      const all = read<NamedContent[]>("chartTemplates", []).filter(
        (t) => t.name !== name
      );
      all.push({ name, content });
      write("chartTemplates", all);
      return Promise.resolve();
    },

    removeChartTemplate(name: string): Promise<void> {
      const next = read<NamedContent[]>("chartTemplates", []).filter(
        (t) => t.name !== name
      );
      write("chartTemplates", next);
      return Promise.resolve();
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getChartTemplateContent(name: string): Promise<{ content: any }> {
      const t = read<NamedContent[]>("chartTemplates", []).find(
        (x) => x.name === name
      );
      return Promise.resolve({ content: t ? t.content : undefined });
    },
  };
}

export type SaveLoadAdapter = ReturnType<typeof createSaveLoadAdapter>;
