"use client";

import { LogIn, XCircle, Target } from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import { useSignalReport } from "@/hooks/use-signal-report";
import { formatPrice } from "@/lib/format";

export function TradePlan() {
  const { symbol, price: livePrice } = usePrice();
  const { report, loading } = useSignalReport(symbol, "4h", 250);
  const plan = report?.plan ?? null;

  // Use suggested plan or fall back to live price with null levels
  const entry = plan?.entry ?? livePrice;
  const stopLoss = plan?.stopLoss ?? null;
  const takeProfit = plan?.takeProfit ?? null;
  const rrr = plan?.rrr ?? null;

  const estProfitPct =
    plan && entry > 0
      ? report?.bias === "bullish"
        ? ((plan.takeProfit - entry) / entry) * 100
        : ((entry - plan.takeProfit) / entry) * 100
      : null;

  const entries = [
    {
      icon: LogIn,
      label: "Entry",
      sublabel: "Entry",
      value: entry > 0 ? `$${formatPrice(entry)}` : "—",
      borderColor: "border-primary",
      dotColor: "bg-primary",
    },
    {
      icon: XCircle,
      label: "Invalidation (SL)",
      sublabel: "Stop Loss",
      value: stopLoss ? `$${formatPrice(stopLoss)}` : "—",
      borderColor: "border-secondary",
      dotColor: "bg-secondary",
    },
    {
      icon: Target,
      label: "Target (TP)",
      sublabel: "Target",
      value: takeProfit ? `$${formatPrice(takeProfit)}` : "—",
      borderColor: "border-emerald-accent",
      dotColor: "bg-emerald-accent",
    },
  ];

  return (
    <div className="bg-surface-container-high p-8 flex-1 flex flex-col">
      <h4 className="text-xl font-black uppercase tracking-tighter font-heading text-on-surface mb-6">
        Trade Plan
      </h4>

      {loading ? (
        <p className="text-sm text-on-surface-variant">
          Building plan from current zones...
        </p>
      ) : !plan ? (
        <p className="text-sm text-on-surface-variant flex-1">
          No actionable plan — signals are neutral or zones insufficient. Wait
          for clearer confluence.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-6 flex-1">
            {entries.map((entry) => (
              <div
                key={entry.sublabel}
                className={`relative border-l-2 ${entry.borderColor} pl-6 py-2`}
              >
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

          <div className="border-t border-outline-variant/10 pt-4 mt-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-on-surface-variant block tracking-wider uppercase">
                Risk / Reward
              </span>
              <span
                className={`text-lg font-black font-heading ${
                  rrr && rrr >= 2 ? "text-emerald-accent" : "text-primary"
                }`}
              >
                {rrr ? `${rrr.toFixed(2)} : 1` : "—"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-on-surface-variant block tracking-wider uppercase">
                Est. Profit
              </span>
              <span
                className={`text-lg font-black font-heading ${
                  estProfitPct && estProfitPct >= 0
                    ? "text-emerald-accent"
                    : "text-crimson"
                }`}
              >
                {estProfitPct !== null
                  ? `${estProfitPct >= 0 ? "+" : ""}${estProfitPct.toFixed(2)}%`
                  : "—"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
