"use client";

export function PortfolioHealth() {
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
            {/* Background track */}
            <circle
              cx="128"
              cy="128"
              r="110"
              fill="none"
              strokeWidth="8"
              className="text-surface-container-high"
              stroke="currentColor"
            />
            {/* Progress arc */}
            <circle
              cx="128"
              cy="128"
              r="110"
              fill="none"
              strokeWidth="12"
              className="text-primary-container"
              stroke="currentColor"
              strokeDasharray="691"
              strokeDashoffset="200"
              strokeLinecap="round"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-heading font-bold text-on-surface">
              72%
            </span>
            <span className="text-xs text-on-surface-variant mt-1">
              Optimal Risk
            </span>
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <span className="text-[10px] text-on-surface-variant block mb-1 uppercase tracking-wider">
            Total Exposure
          </span>
          <span className="text-sm font-heading font-bold text-on-surface tabular-nums">
            $124,500.00
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-on-surface-variant block mb-1 uppercase tracking-wider">
            Daily Var
          </span>
          <span className="text-sm font-heading font-bold text-secondary tabular-nums">
            -$1,240.21
          </span>
        </div>
      </div>
    </div>
  );
}
