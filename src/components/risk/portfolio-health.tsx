"use client";

import { useAccount } from "@/hooks/use-account";
import { useSettings } from "@/hooks/use-settings";
import { usePositions } from "@/hooks/use-positions";
import { formatUsd } from "@/lib/format";

export function PortfolioHealth() {
  const { balance, equity, totalExposure, drawdown } = useAccount();
  const { settings } = useSettings();
  const { positions } = usePositions("active");

  const maxHeat = settings.risk?.maxPositionSizePercent ?? 25;
  const maxDrawdown = settings.risk?.maxDrawdownPercent ?? 15;

  // "Health" is a composite: how far below max heat + drawdown thresholds.
  // 100 = perfectly safe, 0 = at / past the limits.
  const heatUsed = equity > 0 ? (totalExposure / equity) * 100 : 0;
  const heatHealth = Math.max(0, 100 - (heatUsed / maxHeat) * 100);
  const drawdownHealth = Math.max(
    0,
    100 - (Math.abs(drawdown) / maxDrawdown) * 100
  );
  const health = Math.round((heatHealth + drawdownHealth) / 2);

  const circumference = 2 * Math.PI * 110;
  const dashOffset = circumference * (1 - health / 100);

  const healthColor =
    health >= 70
      ? "text-emerald-accent"
      : health >= 40
        ? "text-orange"
        : "text-crimson";

  const healthLabel =
    health >= 70 ? "Optimal Risk" : health >= 40 ? "Elevated" : "Critical";

  return (
    <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 min-h-[400px] flex flex-col">
      {/* Title */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-on-surface tracking-wider uppercase mb-2">
          Portfolio Health
        </h3>
        <div className="h-[1px] w-12 bg-primary" />
      </div>

      {/* SVG Circular Gauge */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 256 256">
            <circle
              cx="128"
              cy="128"
              r="110"
              fill="none"
              strokeWidth="8"
              className="text-surface-container-high"
              stroke="currentColor"
            />
            <circle
              cx="128"
              cy="128"
              r="110"
              fill="none"
              strokeWidth="12"
              className={healthColor}
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.5s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-heading font-bold ${healthColor}`}>
              {health}%
            </span>
            <span className="text-xs text-on-surface-variant mt-1">
              {healthLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <span className="text-[10px] text-on-surface-variant block mb-1 uppercase tracking-wider">
            Balance
          </span>
          <span className="text-sm font-heading font-bold text-on-surface tabular-nums">
            {formatUsd(balance)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-on-surface-variant block mb-1 uppercase tracking-wider">
            Total Exposure
          </span>
          <span className="text-sm font-heading font-bold text-on-surface tabular-nums">
            {formatUsd(totalExposure)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-on-surface-variant block mb-1 uppercase tracking-wider">
            Equity
          </span>
          <span className="text-sm font-heading font-bold text-on-surface tabular-nums">
            {formatUsd(equity)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-on-surface-variant block mb-1 uppercase tracking-wider">
            Open Positions
          </span>
          <span className="text-sm font-heading font-bold text-cyan tabular-nums">
            {positions.length}
          </span>
        </div>
      </div>
    </div>
  );
}
