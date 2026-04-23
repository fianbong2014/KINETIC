"use client";

import { LogIn, XCircle, Target } from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import { useMultiTFReport } from "@/hooks/use-multi-tf-report";
import { formatPrice } from "@/lib/format";

export function TradePlan() {
  const { symbol, price: livePrice } = usePrice();
  const { slices, summary } = useMultiTFReport(symbol);

  // Pick the plan from whichever timeframe has one that matches the
  // composite bias. Prefer 4H (balance between noise and lag), then 1D,
  // then 1H as fallback. Returns null if no matching plan exists.
  const pickedSlice = (() => {
    if (summary.bias === "neutral") return null;
    const preferredOrder = ["4h", "1d", "1h"] as const;
    for (const key of preferredOrder) {
      const slice = slices.find((s) => s.key === key);
      if (
        slice?.report?.plan &&
        slice.report.bias === summary.bias
      ) {
        return slice;
      }
    }
    return null;
  })();

  const plan = pickedSlice?.report?.plan ?? null;
  const sourceLabel = pickedSlice?.label ?? "—";

  const entry = plan?.entry ?? livePrice;
  const stopLoss = plan?.stopLoss ?? null;
  const takeProfit = plan?.takeProfit ?? null;
  const rrr = plan?.rrr ?? null;

  const estProfitPct =
    plan && entry > 0
      ? summary.bias === "bullish"
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

  const loading = slices.every((s) => s.loading);

  return (
    <div className="bg-surface-container-high p-8 flex-1 flex flex-col">
      <div className="flex items-start justify-between mb-6 gap-3">
        <h4 className="text-xl font-black uppercase tracking-tighter font-heading text-on-surface">
          Trade Plan
        </h4>
        {pickedSlice && (
          <span className="text-[9px] font-mono tracking-widest uppercase text-on-surface-variant bg-surface-container-highest px-2 py-1">
            {sourceLabel} zones
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-on-surface-variant">
          Building plan from multi-timeframe zones...
        </p>
      ) : !plan ? (
        <p className="text-sm text-on-surface-variant flex-1">
          No actionable plan — composite bias is neutral or no timeframe
          produced a zone pair aligned with the consensus. Wait for clearer
          confluence.
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
