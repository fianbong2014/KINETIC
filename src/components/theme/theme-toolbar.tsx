"use client";

import { useEffect, useRef, useState } from "react";
import { Palette, X, RotateCcw, Moon, Sun } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import {
  FONT_OPTIONS,
  THEME_PRESETS,
  resolveTheme,
  type ThemeGroups,
  type ThemeMode,
  type ThemeSettings,
} from "@/lib/theme-tokens";
import { CHART_THEME_EVENT } from "@/lib/chart-theme";

type Draft = ThemeGroups & { mode: ThemeMode };
type GroupKey = keyof ThemeGroups;

function merge(theme: ThemeSettings | undefined): Draft {
  const mode: ThemeMode = theme?.mode === "light" ? "light" : "dark";
  const base = THEME_PRESETS[mode];
  return {
    mode,
    accents: { ...base.accents, ...theme?.accents },
    surfaces: { ...base.surfaces, ...theme?.surfaces },
    border: { ...base.border, ...theme?.border },
    fonts: { ...base.fonts, ...theme?.fonts },
    text: { ...base.text, ...theme?.text },
  };
}

function applyTheme(draft: ThemeSettings) {
  const { vars, radius } = resolveTheme(draft);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);

  let styleEl = document.getElementById(
    "kinetic-theme-radius",
  ) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "kinetic-theme-radius";
    document.head.appendChild(styleEl);
  }
  // Same layer + specificity as globals.css's `* { border-radius:0 !important }`,
  // but later in source order, so this wins the cascade tiebreak.
  styleEl.textContent = `@layer base { *, *::before, *::after { border-radius: ${radius}px !important; } }`;

  // Canvas charts can't read CSS vars reactively — notify them to re-apply.
  window.dispatchEvent(new Event(CHART_THEME_EVENT));
}

export function ThemeToolbar() {
  const { settings, loading, saving, update } = useSettings();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => merge(undefined));
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync the draft from server settings once, during render (the React-
  // sanctioned "adjust state while rendering" pattern — no effect needed).
  if (!loading && !hydrated) {
    setHydrated(true);
    setDraft(merge(settings.theme));
  }

  // Apply to the DOM whenever the draft changes — runs on mount (defaults),
  // after hydration, and on every live edit. Pure external sync, no setState.
  useEffect(() => {
    applyTheme(draft);
  }, [draft]);

  function persist(next: Draft) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => update({ theme: next }), 500);
  }

  function setGroup<K extends GroupKey>(group: K, value: Partial<Draft[K]>) {
    setDraft((prev) => {
      const next = { ...prev, [group]: { ...prev[group], ...value } };
      persist(next);
      return next;
    });
  }

  function setMode(mode: ThemeMode) {
    setDraft((prev) => {
      // Flip to the preset for the chosen mode but keep the user's fonts.
      const next: Draft = {
        ...THEME_PRESETS[mode],
        mode,
        fonts: prev.fonts,
      };
      persist(next);
      return next;
    });
  }

  function reset() {
    const next = merge(undefined);
    setDraft(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    update({ theme: next });
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Customize theme"
        className="fixed right-4 bottom-24 lg:bottom-12 z-[55] w-11 h-11 flex items-center justify-center bg-surface-container-highest text-cyan border border-cyan/30 hover:bg-cyan/10 transition-colors glow-cyan"
      >
        <Palette className="w-5 h-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-[340px] max-w-[88vw] bg-surface-container-low overflow-y-auto border-l border-outline-variant/15"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-surface-container-low z-10 flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan" />
                <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
                  Appearance
                </h2>
                {saving && (
                  <span className="text-[10px] text-cyan tracking-wider">
                    SAVING…
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-8 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Mode
                </span>
                <div className="grid grid-cols-2 gap-1 bg-surface-container p-1">
                  {(["dark", "light"] as const).map((m) => {
                    const active = draft.mode === m;
                    const Icon = m === "dark" ? Moon : Sun;
                    return (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex items-center justify-center gap-2 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                          active
                            ? "bg-cyan/15 text-cyan"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Group title="Accent Colors">
                <ColorRow
                  label="Buy / Primary"
                  value={draft.accents.cyan}
                  onChange={(v) => setGroup("accents", { cyan: v })}
                />
                <ColorRow
                  label="Sell / Secondary"
                  value={draft.accents.orange}
                  onChange={(v) => setGroup("accents", { orange: v })}
                />
                <ColorRow
                  label="Profit"
                  value={draft.accents.emerald}
                  onChange={(v) => setGroup("accents", { emerald: v })}
                />
                <ColorRow
                  label="Loss"
                  value={draft.accents.crimson}
                  onChange={(v) => setGroup("accents", { crimson: v })}
                />
              </Group>

              <Group title="Surface Hierarchy">
                <ColorRow
                  label="Background"
                  value={draft.surfaces.background}
                  onChange={(v) => setGroup("surfaces", { background: v })}
                />
                <ColorRow
                  label="Lowest"
                  value={draft.surfaces.lowest}
                  onChange={(v) => setGroup("surfaces", { lowest: v })}
                />
                <ColorRow
                  label="Low"
                  value={draft.surfaces.low}
                  onChange={(v) => setGroup("surfaces", { low: v })}
                />
                <ColorRow
                  label="Container"
                  value={draft.surfaces.container}
                  onChange={(v) => setGroup("surfaces", { container: v })}
                />
                <ColorRow
                  label="High"
                  value={draft.surfaces.high}
                  onChange={(v) => setGroup("surfaces", { high: v })}
                />
                <ColorRow
                  label="Highest"
                  value={draft.surfaces.highest}
                  onChange={(v) => setGroup("surfaces", { highest: v })}
                />
              </Group>

              <Group title="Border">
                <ColorRow
                  label="Line Color"
                  value={draft.border.color}
                  onChange={(v) => setGroup("border", { color: v })}
                />
                <RangeRow
                  label="Line Opacity"
                  min={0}
                  max={1}
                  step={0.05}
                  value={draft.border.opacity}
                  display={`${Math.round(draft.border.opacity * 100)}%`}
                  onChange={(v) => setGroup("border", { opacity: v })}
                />
                <RangeRow
                  label="Corner Radius"
                  min={0}
                  max={24}
                  step={1}
                  value={draft.border.radius}
                  display={`${draft.border.radius}px`}
                  onChange={(v) => setGroup("border", { radius: v })}
                />
              </Group>

              <Group title="Fonts">
                <SelectRow
                  label="Headings"
                  value={draft.fonts.heading}
                  onChange={(v) => setGroup("fonts", { heading: v })}
                />
                <SelectRow
                  label="Body"
                  value={draft.fonts.body}
                  onChange={(v) => setGroup("fonts", { body: v })}
                />
                <SelectRow
                  label="Numbers / Mono"
                  value={draft.fonts.mono}
                  onChange={(v) => setGroup("fonts", { mono: v })}
                />
              </Group>

              <Group title="Text">
                <ColorRow
                  label="Primary"
                  value={draft.text.primary}
                  onChange={(v) => setGroup("text", { primary: v })}
                />
                <ColorRow
                  label="Muted"
                  value={draft.text.muted}
                  onChange={(v) => setGroup("text", { muted: v })}
                />
              </Group>

              <button
                onClick={reset}
                className="w-full flex items-center justify-center gap-2 bg-surface-container-high text-on-surface-variant hover:text-on-surface text-[11px] font-bold uppercase tracking-widest py-3 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {title}
      </span>
      <div className="bg-surface-container divide-y divide-outline-variant/10">
        {children}
      </div>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="text-xs text-on-surface">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-on-surface-variant tabular-nums uppercase">
          {value}
        </span>
        <label
          className="w-7 h-7 cursor-pointer border border-outline-variant/30"
          style={{ background: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="opacity-0 w-0 h-0"
          />
        </label>
      </div>
    </div>
  );
}

function RangeRow({
  label,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-on-surface">{label}</span>
        <span className="text-[10px] text-on-surface-variant tabular-nums">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-cyan"
      />
    </div>
  );
}

function SelectRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="text-xs text-on-surface shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 bg-surface-container-high text-on-surface text-[11px] px-2 py-1.5 border border-outline-variant/20 focus:border-cyan focus:outline-none"
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
    </div>
  );
}
