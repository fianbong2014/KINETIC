"use client";

import { CheckCircle, XCircle, Layers, BarChart3 } from "lucide-react";
import { usePrice } from "@/components/providers/price-provider";
import { useSignalReport } from "@/hooks/use-signal-report";
import { formatPrice } from "@/lib/format";

export function SignalDetails() {
  const { symbol } = usePrice();
  const { report, loading } = useSignalReport(symbol, "4h", 250);

  const supportZones = report?.supportZones ?? [];
  const resistanceZones = report?.resistanceZones ?? [];
  const events = report?.events ?? [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
      {/* Zone Analysis */}
      <div className="bg-surface-container-high p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-on-surface-variant" />
          <h4 className="text-xs font-bold tracking-wider uppercase text-on-surface-variant">
            Zone Analysis
          </h4>
        </div>
        <div className="flex flex-col gap-3">
          {loading ? (
            <p className="text-xs text-on-surface-variant">
              Scanning for zones...
            </p>
          ) : supportZones.length === 0 && resistanceZones.length === 0 ? (
            <p className="text-xs text-on-surface-variant">
              No significant swing levels detected.
            </p>
          ) : (
            <>
              {resistanceZones.slice(0, 2).map((level, i) => (
                <ZoneRow
                  key={`r-${i}`}
                  label={`Resistance ${i + 1}`}
                  range={`$${formatPrice(level)}`}
                  color="bg-secondary"
                />
              ))}
              {supportZones.slice(0, 2).map((level, i) => (
                <ZoneRow
                  key={`s-${i}`}
                  label={`Support ${i + 1}`}
                  range={`$${formatPrice(level)}`}
                  color="bg-primary"
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Technical Alpha */}
      <div className="bg-surface-container-high p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-on-surface-variant" />
          <h4 className="text-xs font-bold tracking-wider uppercase text-on-surface-variant">
            Technical Alpha
          </h4>
        </div>
        <div className="flex flex-col gap-3">
          {loading ? (
            <p className="text-xs text-on-surface-variant">Analyzing...</p>
          ) : events.length === 0 ? (
            <p className="text-xs text-on-surface-variant">
              No indicators triggered.
            </p>
          ) : (
            events.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center gap-3">
                {event.bias === "bullish" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-accent shrink-0" />
                ) : event.bias === "bearish" ? (
                  <XCircle className="w-4 h-4 text-crimson shrink-0" />
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full" />
                  </span>
                )}
                <span className="text-sm text-on-surface truncate">
                  {event.label}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ZoneRow({
  label,
  range,
  color,
}: {
  label: string;
  range: string;
  color: string;
}) {
  return (
    <div className="flex items-stretch gap-3">
      <div className={`w-1 ${color} rounded-full shrink-0`} />
      <div>
        <span className="text-[10px] text-on-surface-variant block tracking-wider uppercase">
          {label}
        </span>
        <span className="text-sm font-mono tabular-nums text-on-surface font-semibold">
          {range}
        </span>
      </div>
    </div>
  );
}
