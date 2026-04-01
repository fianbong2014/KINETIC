import { SignalHeader } from "@/components/signals/signal-header";
import { SignalDetails } from "@/components/signals/signal-details";
import { TradePlan } from "@/components/signals/trade-plan";
import { SignalNarrative } from "@/components/signals/signal-narrative";
import { AlertTriangle } from "lucide-react";

export default function SignalsPage() {
  return (
    <div className="flex flex-col gap-1 h-full">
      {/* Header */}
      <div className="bg-surface-container-low p-6 lg:p-8">
        <SignalHeader />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-1 flex-1 min-h-0">
        {/* Left Column */}
        <div className="col-span-8 flex flex-col gap-1">
          {/* Cyan Alert Banner */}
          <div className="bg-primary-container p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-on-primary-container" />
              <span className="text-sm font-bold text-on-primary-container tracking-wider uppercase">
                Potential Entry Detected
              </span>
            </div>
            <button className="bg-primary text-on-primary text-[10px] font-bold tracking-wider uppercase px-4 py-2 hover:opacity-90 transition-opacity">
              Risk Calculator
            </button>
          </div>

          {/* Zone Analysis + Technical Alpha */}
          <SignalDetails />

          {/* Signal Narrative */}
          <SignalNarrative />
        </div>

        {/* Right Column */}
        <div className="col-span-4 flex flex-col gap-1">
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
      <div className="bg-surface-container-lowest p-4 border border-outline-variant/5">
        <span className="text-[10px] font-mono text-on-surface-variant">
          [SYSTEM] SIGNAL_SCANNER::NEW_CONFLUENCE_DETECTED_AT_08:42:01_UTC SUCCESS
          KINETIC_CORE_V2.0.4
        </span>
      </div>
    </div>
  );
}
