import { SignalHeader } from "@/components/signals/signal-header";
import { SignalDetails } from "@/components/signals/signal-details";
import { TradePlan } from "@/components/signals/trade-plan";
import { SignalNarrative } from "@/components/signals/signal-narrative";
import { TimeframeAlignment } from "@/components/signals/timeframe-alignment";
import { AlertTriangle } from "lucide-react";

export default function SignalsPage() {
  return (
    <div className="flex flex-col gap-1 h-full">
      {/* Header */}
      <div className="bg-surface-container-low p-4 sm:p-6 lg:p-8">
        <SignalHeader />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 flex-1 min-h-0">
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-1">
          {/* Cyan Alert Banner */}
          <div className="bg-primary-container p-3 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <AlertTriangle className="w-5 h-5 text-on-primary-container shrink-0" />
              <span className="text-[10px] sm:text-sm font-bold text-on-primary-container tracking-wider uppercase truncate">
                Multi-Timeframe Scan Active
              </span>
            </div>
            <button className="bg-primary text-on-primary text-[10px] font-bold tracking-wider uppercase px-3 sm:px-4 py-2 hover:opacity-90 transition-opacity shrink-0">
              Risk Calculator
            </button>
          </div>

          {/* Multi-Timeframe Alignment — new panel */}
          <TimeframeAlignment />

          {/* Zone Analysis + Technical Alpha (4H detail) */}
          <SignalDetails />

          {/* Signal Narrative */}
          <SignalNarrative />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-1">
          {/* Trade Plan */}
          <TradePlan />

          {/* Mini Chart Context */}
          <div className="bg-surface-container-high p-4">
            <span className="text-[10px] text-on-surface-variant tracking-wider uppercase block mb-3">
              Chart Context
            </span>
            <div className="bg-surface-container-lowest aspect-video flex items-center justify-center">
              <span className="text-[10px] text-on-surface-variant">
                4H BTC/USD Chart
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Log */}
      <div className="bg-surface-container-lowest p-3 sm:p-4 border border-outline-variant/5">
        <span className="text-[10px] font-mono text-on-surface-variant break-all">
          [SYSTEM] MTF_SIGNAL_SCANNER::1H_4H_1D_CONVERGENCE_DETECTED SUCCESS
          KINETIC_CORE_V2.1.0
        </span>
      </div>
    </div>
  );
}
