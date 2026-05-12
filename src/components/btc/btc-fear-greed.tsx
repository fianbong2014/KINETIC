"use client";

import { useFearGreed } from "@/hooks/use-btc-monitor";
import { WidgetCard } from "./btc-funding";

// Map value (0-100) to a hue: red (0) → yellow (50) → green (100).
function valueToColor(v: number): string {
  if (v < 25) return "#ff716c"; // extreme fear
  if (v < 45) return "#ff734c"; // fear
  if (v < 55) return "#f5b700"; // neutral
  if (v < 75) return "#7fcd91"; // greed
  return "#50c878"; // extreme greed
}

export function BtcFearGreed() {
  const { value, classification, yesterday, loading } = useFearGreed();
  const color = valueToColor(value);
  const delta = yesterday !== null ? value - yesterday : null;

  // Arc parameters for half-donut gauge.
  // Path is generated via SVG <path> using simple math.
  const cx = 80;
  const cy = 70;
  const r = 55;
  const startAngle = 180;
  const valueAngle = startAngle + (value / 100) * 180;

  function polar(angle: number) {
    const rad = ((angle - 180) * Math.PI) / 180;
    return {
      x: cx + r * -Math.cos(rad),
      y: cy + r * -Math.sin(rad),
    };
  }
  const start = polar(startAngle);
  const cur = polar(valueAngle);
  const largeArc = value > 50 ? 1 : 0;
  const arcPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${cur.x} ${cur.y}`;
  const bgPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${polar(360).x} ${polar(360).y}`;

  return (
    <WidgetCard title="Fear & Greed" subtitle="Alternative.me · Daily">
      {loading ? (
        <p className="text-xs text-on-surface-variant">Loading…</p>
      ) : (
        <div className="flex flex-col items-center">
          <svg width="160" height="90" viewBox="0 0 160 90" className="-mb-2">
            <path
              d={bgPath}
              fill="none"
              stroke="rgba(72,72,73,0.25)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d={arcPath}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
            />
            <text
              x={cx}
              y={cy + 8}
              textAnchor="middle"
              fill={color}
              fontSize="28"
              fontWeight="900"
              fontFamily="'Space Grotesk', sans-serif"
            >
              {value}
            </text>
          </svg>
          <p
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color }}
          >
            {classification}
          </p>
          {delta !== null && (
            <p className="text-[10px] text-on-surface-variant mt-1">
              vs yesterday:{" "}
              <span
                className={
                  delta > 0
                    ? "text-emerald-accent"
                    : delta < 0
                      ? "text-crimson"
                      : "text-on-surface"
                }
              >
                {delta > 0 ? "+" : ""}
                {delta}
              </span>
            </p>
          )}
        </div>
      )}
    </WidgetCard>
  );
}
