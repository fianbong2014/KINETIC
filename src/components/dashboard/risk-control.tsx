"use client";

import { Shield } from "lucide-react";
import { useAccount } from "@/hooks/use-account";
import { useSettings } from "@/hooks/use-settings";
import { usePositions } from "@/hooks/use-positions";
import { usePrice } from "@/components/providers/price-provider";
import { formatUsd } from "@/lib/format";

export function RiskControl() {
  const {
    balance,
    startingBalance,
    equity,
    todayPnl,
    drawdown,
    openPositions,
  } = useAccount();
  const { settings } = useSettings();
  const { positions } = usePositions("active");
  const { price: currentPrice, symbol } = usePrice();

  const maxLossDollars =
    (startingBalance * (settings.risk?.maxDailyLossPercent ?? 5)) / 100;
  const todayLoss = Math.min(0, todayPnl); // negative number
  const lossProgress =
    maxLossDollars > 0
      ? Math.min(100, (Math.abs(todayLoss) / maxLossDollars) * 100)
      : 0;

  // Account heat = total exposure / balance
  const totalExposure = positions.reduce(
    (sum, p) => sum + p.size * p.entry,
    0
  );
  const heat = equity > 0 ? (totalExposure / equity) * 100 : 0;
  const maxHeat = settings.risk?.maxPositionSizePercent ?? 25;
  const heatProgress = Math.min(100, (heat / maxHeat) * 100);

  // Current drawdown (negative value from account data)
  const drawdownDollars = startingBalance + (drawdown / 100) * startingBalance - startingBalance;
  const maxDrawdown = settings.risk?.maxDrawdownPercent ?? 15;
  const drawdownProgress = Math.min(100, (Math.abs(drawdown) / maxDrawdown) * 100);

  // Unrealized PNL from positions matching current symbol
  const unrealizedPnl = positions.reduce((sum, p) => {
    if (p.asset !== symbol || currentPrice <= 0) return sum;
    const pnl =
      p.side === "LONG"
        ? (currentPrice - p.entry) * p.size
        : (p.entry - currentPrice) * p.size;
    return sum + pnl;
  }, 0);

  return (
    <section className="bg-surface-container-low p-5 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
          Risk Control
        </h2>
        <Shield className="w-4 h-4 text-cyan" />
      </div>

      <div className="space-y-4">
        {/* Max Loss Per Day */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
            <span className="text-on-surface-variant">Daily Loss Limit</span>
            <span className="text-on-surface">
              {formatUsd(maxLossDollars)}
            </span>
          </div>
          <div className="h-1 bg-surface-container w-full">
            <div
              className="h-full bg-cyan transition-all"
              style={{ width: `${lossProgress}%` }}
            />
          </div>
        </div>

        {/* Account Heat */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
            <span className="text-on-surface-variant">Account Heat</span>
            <span className="text-on-surface">{heat.toFixed(1)}%</span>
          </div>
          <div className="h-1 bg-surface-container w-full">
            <div
              className={`h-full transition-all ${
                heatProgress > 80 ? "bg-crimson" : "bg-orange"
              }`}
              style={{ width: `${heatProgress}%` }}
            />
          </div>
        </div>

        {/* Current Drawdown */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
            <span className="text-on-surface-variant">Drawdown</span>
            <span
              className={drawdown < 0 ? "text-crimson" : "text-on-surface"}
            >
              {formatUsd(drawdownDollars, { signed: true })}
            </span>
          </div>
          <div className="h-1 bg-surface-container w-full">
            <div
              className="h-full bg-crimson transition-all"
              style={{ width: `${drawdownProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <div className="bg-surface-container p-3">
          <span className="block text-[10px] text-on-surface-variant uppercase font-bold">
            Balance
          </span>
          <span className="text-lg font-heading font-black text-on-surface tabular-nums">
            {formatUsd(balance)}
          </span>
        </div>
        <div className="bg-surface-container p-3">
          <span className="block text-[10px] text-on-surface-variant uppercase font-bold">
            Open / Unrealized
          </span>
          <span
            className={`text-lg font-heading font-black tabular-nums ${
              unrealizedPnl >= 0 ? "text-emerald-accent" : "text-crimson"
            }`}
          >
            {openPositions} · {formatUsd(unrealizedPnl, { signed: true })}
          </span>
        </div>
      </div>
    </section>
  );
}
