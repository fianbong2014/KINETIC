"use client";

import { LogIn, XCircle, Target } from "lucide-react";

const entries = [
  {
    icon: LogIn,
    label: "Trigger Price",
    sublabel: "Entry",
    value: "$61,250.00",
    borderColor: "border-primary",
    dotColor: "bg-primary",
  },
  {
    icon: XCircle,
    label: "Invalidation (SL)",
    sublabel: "Stop Loss",
    value: "$59,800.00",
    borderColor: "border-secondary",
    dotColor: "bg-secondary",
  },
  {
    icon: Target,
    label: "Primary Target (TP)",
    sublabel: "Target",
    value: "$68,400.00",
    borderColor: "border-emerald-accent",
    dotColor: "bg-emerald-accent",
  },
];

export function TradePlan() {
  return (
    <div className="bg-surface-container-high p-8 flex-1 flex flex-col">
      <h4 className="text-xl font-black uppercase tracking-tighter font-heading text-on-surface mb-6">
        Trade Plan
      </h4>

      {/* Vertical Timeline */}
      <div className="flex flex-col gap-6 flex-1">
        {entries.map((entry) => (
          <div
            key={entry.sublabel}
            className={`relative border-l-2 ${entry.borderColor} pl-6 py-2`}
          >
            {/* Timeline dot */}
            <div
              className={`absolute -left-2 top-0 w-4 h-4 rounded-full ${entry.dotColor} border-4 border-surface-container-high`}
            />

            <div className="flex items-center gap-2 mb-1">
              <entry.icon className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="text-[10px] text-on-surface-variant tracking-wider uppercase">
                {entry.label}
              </span>
            </div>
            <span className="text-3xl font-black font-heading tabular-nums text-on-surface tracking-tight">
              {entry.value}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom metrics */}
      <div className="border-t border-outline-variant/10 pt-4 mt-6 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-on-surface-variant block tracking-wider uppercase">
            Risk / Reward
          </span>
          <span className="text-lg font-black font-heading text-primary">
            4.88 : 1
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-on-surface-variant block tracking-wider uppercase">
            Est. Profit
          </span>
          <span className="text-lg font-black font-heading text-emerald-accent">
            +11.67%
          </span>
        </div>
      </div>
    </div>
  );
}
