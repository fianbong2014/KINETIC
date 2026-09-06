// lightweight-charts is canvas-rendered, so it can't use Tailwind tokens — it
// needs concrete color strings. This reads the live CSS custom properties (set
// by the theme toolbar on <html>) so charts track the active theme / light
// mode. ThemeToolbar dispatches CHART_THEME_EVENT after applying theme vars;
// chart components listen and re-apply via applyOptions (no re-create needed).

export const CHART_THEME_EVENT = "kinetic:themechange";

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

export interface ChartTheme {
  background: string;
  text: string;
  grid: string;
  border: string;
  up: string;
  down: string;
  accent: string;
  profit: string;
  loss: string;
  fontFamily: string;
}

export function getChartTheme(): ChartTheme {
  const up = cssVar("--cyan-accent", "#7ce8c3");
  const down = cssVar("--orange-accent", "#e8a078");
  return {
    background: cssVar("--background", "#101413"),
    text: cssVar("--on-surface-variant", "#9eafa5"),
    grid: cssVar("--outline-dim", "rgba(72,72,73,0.12)"),
    border: cssVar("--outline-dim", "rgba(72,72,73,0.15)"),
    up,
    down,
    accent: up,
    profit: cssVar("--emerald-accent", "#7ce8a1"),
    loss: cssVar("--crimson-accent", "#f08787"),
    fontFamily: cssVar("--font-sans", "'Inter', sans-serif"),
  };
}
