"use client";

import { CheckCircle, Layers, BarChart3 } from "lucide-react";

const zones = [
  {
    label: "Accumulation Zone",
    range: "$60,240 - $61,800",
    color: "bg-primary",
  },
  {
    label: "Secondary Mitigation",
    range: "$58,400 - $59,100",
    color: "bg-secondary",
  },
  {
    label: "Profit Taking Zone",
    range: "$67,500 - $69,000",
    color: "bg-emerald-accent",
  },
];

const technicalChecks = [
  "EMA 200 Support",
  "Bullish Engulfing",
  "RSI Bull Div",
];

export function SignalDetails() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
      {/* Zone Analysis */}
      <div className="bg-surface-container-high p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-on-surface-variant" />
          <h4 className="text-xs font-bold tracking-wider uppercase text-on-surface-variant">
            Zone Analysis
          </h4>
        </div>
        <div className="flex flex-col gap-3">
          {zones.map((zone) => (
            <div key={zone.label} className="flex items-stretch gap-3">
              <div className={`w-1 ${zone.color} rounded-full shrink-0`} />
              <div>
                <span className="text-[10px] text-on-surface-variant block tracking-wider uppercase">
                  {zone.label}
                </span>
                <span className="text-sm font-mono tabular-nums text-on-surface font-semibold">
                  {zone.range}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Alpha */}
      <div className="bg-surface-container-high p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-on-surface-variant" />
          <h4 className="text-xs font-bold tracking-wider uppercase text-on-surface-variant">
            Technical Alpha
          </h4>
        </div>
        <div className="flex flex-col gap-3">
          {technicalChecks.map((check) => (
            <div key={check} className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-accent shrink-0" />
              <span className="text-sm text-on-surface">{check}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
