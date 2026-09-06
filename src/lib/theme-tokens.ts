// Theme customization tokens.
//
// The defaults here MUST mirror the `:root` values in src/app/globals.css so
// the floating theme toolbar starts from the real design-system baseline. The
// toolbar writes overrides into User.settings.theme; ThemeApplier turns those
// into inline CSS custom properties on <html>.

export type ThemeMode = "dark" | "light";

export interface ThemeSettings {
  mode?: ThemeMode;
  accents?: {
    cyan?: string; // buy / primary
    orange?: string; // sell / secondary
    emerald?: string; // profit
    crimson?: string; // loss
  };
  surfaces?: {
    background?: string;
    lowest?: string;
    low?: string;
    container?: string;
    high?: string;
    highest?: string;
  };
  border?: {
    color?: string; // solid hex
    opacity?: number; // 0..1, applied to the tonal border lines
    radius?: number; // px — shared control and surface radius
  };
  fonts?: {
    heading?: string;
    body?: string;
    mono?: string;
  };
  text?: {
    primary?: string; // body / heading text
    muted?: string; // secondary / labels
  };
}

export type ThemeGroups = {
  accents: { cyan: string; orange: string; emerald: string; crimson: string };
  surfaces: {
    background: string;
    lowest: string;
    low: string;
    container: string;
    high: string;
    highest: string;
  };
  border: { color: string; opacity: number; radius: number };
  fonts: { heading: string; body: string; mono: string };
  text: { primary: string; muted: string };
};

export const DEFAULT_THEME: ThemeGroups = {
  accents: {
    cyan: "#7ce8c3",
    orange: "#e8a078",
    emerald: "#7ce8a1",
    crimson: "#f08787",
  },
  surfaces: {
    background: "#101413",
    lowest: "#0c100f",
    low: "#141a18",
    container: "#1a211e",
    high: "#202925",
    highest: "#28332d",
  },
  border: {
    color: "#53665a",
    opacity: 0.25,
    radius: 8,
  },
  fonts: {
    heading: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    body: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    mono: "var(--font-roboto-mono), ui-monospace, monospace",
  },
  text: {
    primary: "#edf3ef",
    muted: "#9eafa5",
  },
};

// Dark is the design-system baseline; DEFAULT_THEME stays the dark preset so
// existing imports keep working.
export const DARK_THEME: ThemeGroups = DEFAULT_THEME;

// Light preset — inverted surface ramp + accessible accent variants (the neon
// dark-mode accents are unreadable on light surfaces).
export const LIGHT_THEME: ThemeGroups = {
  accents: {
    cyan: "#0e7490",
    orange: "#ea580c",
    emerald: "#15803d",
    crimson: "#dc2626",
  },
  surfaces: {
    background: "#f4f4f5",
    lowest: "#ffffff",
    low: "#fafafa",
    container: "#f0f0f1",
    high: "#e9e9eb",
    highest: "#e0e0e2",
  },
  border: {
    color: "#8a8a8d",
    opacity: 0.45,
    radius: 8,
  },
  fonts: { ...DEFAULT_THEME.fonts },
  text: {
    primary: "#18181b",
    muted: "#5b5b5e",
  },
};

export const THEME_PRESETS: Record<ThemeMode, ThemeGroups> = {
  dark: DARK_THEME,
  light: LIGHT_THEME,
};

export const FONT_OPTIONS = [
  { label: "Space Grotesk", value: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
  { label: "Inter", value: DEFAULT_THEME.fonts.body },
  { label: "Roboto Mono", value: DEFAULT_THEME.fonts.mono },
  { label: "System UI", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Monospace", value: "ui-monospace, 'Cascadia Code', monospace" },
] as const;

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Resolve a partial ThemeSettings into the concrete CSS custom properties that
// need to be set on document.documentElement, including the selected preset.
// Radius is returned separately for the shared --radius property.
export function resolveTheme(theme: ThemeSettings | undefined) {
  const t = theme ?? {};
  // The preset for the active mode is the base; explicit token overrides from
  // the toolbar layer on top.
  const base = t.mode === "light" ? LIGHT_THEME : DARK_THEME;
  const a = { ...base.accents, ...t.accents };
  const s = { ...base.surfaces, ...t.surfaces };
  const b = { ...base.border, ...t.border };
  const f = { ...base.fonts, ...t.fonts };
  const x = { ...base.text, ...t.text };

  const vars: Record<string, string> = {
    // Accents — each colour fans out to every alias that should track it.
    "--cyan-accent": a.cyan,
    "--cyan-dim": a.cyan,
    "--primary-foreground": t.mode === "light" ? "#ffffff" : "#102a22",
    "--primary": a.cyan,
    "--ring": a.cyan,
    "--sidebar-primary": a.cyan,
    "--sidebar-ring": a.cyan,
    "--chart-1": a.cyan,
    "--primary-container": a.cyan,
    "--secondary": a.orange,
    "--orange-accent": a.orange,
    "--chart-2": a.orange,
    "--emerald-accent": a.emerald,
    "--chart-3": a.emerald,
    "--crimson-accent": a.crimson,
    "--destructive": a.crimson,
    "--error": a.crimson,

    // Surface hierarchy.
    "--background": s.background,
    "--surface": s.background,
    "--surface-dim": s.background,
    "--sidebar": s.background,
    "--surface-container-lowest": s.lowest,
    "--input": s.lowest,
    "--surface-container-low": s.low,
    "--sidebar-accent": s.low,
    "--surface-container": s.container,
    "--card": s.container,
    "--popover": s.container,
    "--muted": s.container,
    "--surface-container-high": s.high,
    "--surface-container-highest": s.highest,
    "--accent": s.highest,

    // Border tonal lines + solid outline.
    "--border": hexToRgba(b.color, b.opacity),
    "--outline-dim": hexToRgba(b.color, b.opacity),
    "--sidebar-border": hexToRgba(b.color, b.opacity),
    "--outline-variant": b.color,

    // Fonts.
    "--font-heading": f.heading,
    "--font-sans": f.body,
    "--font-mono": f.mono,

    // Text — primary body/heading vs. muted secondary labels.
    "--foreground": x.primary,
    "--card-foreground": x.primary,
    "--popover-foreground": x.primary,
    "--accent-foreground": x.primary,
    "--on-surface": x.primary,
    "--sidebar-accent-foreground": x.primary,
    "--muted-foreground": x.muted,
    "--on-surface-variant": x.muted,
    "--sidebar-foreground": x.muted,
  };

  const fontAliases: Record<string, string> = {
    "'Inter'": "var(--font-inter)",
    "'Roboto Mono'": "var(--font-roboto-mono)",
    "'Space Grotesk'": "var(--font-space-grotesk)",
  };
  for (const key of ["--font-heading", "--font-sans", "--font-mono"]) {
    for (const [name, variable] of Object.entries(fontAliases)) {
      vars[key] = vars[key].replace(name, variable);
    }
  }
  return { vars, radius: b.radius };
}
