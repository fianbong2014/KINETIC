import { PortfolioHealth } from "@/components/risk/portfolio-health";
import { RiskCalculator } from "@/components/risk/risk-calculator";
import { ActiveExposure } from "@/components/risk/active-exposure";
import { ExposureHeatmap } from "@/components/risk/exposure-heatmap";

export default function RiskPage() {
  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
      {/* ROW 1: Portfolio Health + Risk Calculator */}
      <PortfolioHealth />
      <RiskCalculator />

      {/* ROW 2: Active Exposure table */}
      <ActiveExposure />

      {/* ROW 3: Trade Journal Preview + Exposure Heatmap */}
      <div className="col-span-12 lg:col-span-7 bg-surface-container-low p-6">
        <div className="mb-6">
          <h3 className="text-sm font-medium text-on-surface tracking-wider uppercase mb-2">
            Trade Journal Preview
          </h3>
          <div className="h-[1px] w-12 bg-primary" />
        </div>

        <div className="flex flex-col gap-4">
          {/* Emotional State */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Emotional State
            </label>
            <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-2.5">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
                />
              </svg>
              <span className="text-sm text-on-surface font-mono">
                Focused &amp; Calm
              </span>
            </div>
          </div>

          {/* Strategy Adherence */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Strategy Adherence
            </span>
            <span className="text-sm font-heading font-bold text-emerald-accent">
              100%
            </span>
          </div>

          {/* Session Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Session Notes
            </label>
            <textarea
              rows={3}
              placeholder="Record your trading thoughts..."
              className="bg-surface-container-lowest text-on-surface font-mono text-sm px-3 py-2.5 border-none outline-none focus:bg-surface-bright transition-colors resize-none placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>
      </div>

      <ExposureHeatmap />
    </div>
  );
}
