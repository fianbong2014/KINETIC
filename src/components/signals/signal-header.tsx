"use client";

export function SignalHeader() {
  return (
    <div className="border-b border-outline-variant/10 pb-4 sm:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left side */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="bg-primary-container text-on-primary-container text-[10px] font-bold tracking-wider uppercase px-3 py-1">
              Active Signal
            </span>
            <span className="text-[10px] text-on-surface-variant font-mono">
              ID: K-8829-SIG
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tighter uppercase text-on-surface">
            Bitcoin / USD
          </h1>
          <p className="text-sm text-on-surface-variant">
            Institutional Liquidity Sweep Context
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-6">
          <div className="sm:text-right">
            <span className="text-3xl sm:text-4xl font-black font-heading text-primary tabular-nums">
              84%
            </span>
            <span className="block text-[10px] text-on-surface-variant tracking-wider uppercase mt-1">
              Confidence Score
            </span>
          </div>
          <div className="sm:text-right">
            <span className="text-xl sm:text-2xl font-black font-heading text-on-surface tracking-tighter">
              4H / DAILY
            </span>
            <span className="block text-[10px] text-on-surface-variant tracking-wider uppercase mt-1">
              Timeframe
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
