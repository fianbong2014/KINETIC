"use client";

import { useMempool } from "@/hooks/use-btc-monitor";
import { WidgetCard } from "./btc-funding";
import { Zap, Hourglass, Snail, Coffee } from "lucide-react";

export function BtcMempool() {
  const {
    pendingCount,
    vsizeBytes,
    fastestFee,
    halfHourFee,
    hourFee,
    economyFee,
    loading,
  } = useMempool();

  const vsizeMb = vsizeBytes / 1024 / 1024;
  // Mempool fills at ~1MB/10min in stress; congestion ratio is rough.
  const congestion = Math.min(100, (vsizeMb / 300) * 100);
  const congestionColor =
    congestion > 60
      ? "#ff716c"
      : congestion > 30
        ? "#f5b700"
        : "#50c878";

  return (
    <WidgetCard title="Bitcoin Mempool" subtitle="mempool.space">
      {loading ? (
        <p className="text-xs text-on-surface-variant">Loading…</p>
      ) : (
        <>
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <p className="font-heading text-2xl font-black tabular-nums text-on-surface">
                {pendingCount.toLocaleString("en-US")}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                pending transactions
              </p>
            </div>
            <div className="text-right">
              <p
                className="text-xs font-bold tabular-nums"
                style={{ color: congestionColor }}
              >
                {vsizeMb.toFixed(1)} MB
              </p>
              <p className="text-[9px] text-on-surface-variant uppercase tracking-wider">
                Backlog
              </p>
            </div>
          </div>

          {/* Congestion meter */}
          <div className="h-1 bg-surface-container mt-3">
            <div
              className="h-full transition-all"
              style={{
                width: `${congestion}%`,
                backgroundColor: congestionColor,
              }}
            />
          </div>

          {/* Fee tiers */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <FeeRow
              icon={<Zap size={11} />}
              label="Fastest"
              sat={fastestFee}
            />
            <FeeRow
              icon={<Hourglass size={11} />}
              label="30 min"
              sat={halfHourFee}
            />
            <FeeRow
              icon={<Snail size={11} />}
              label="1 hour"
              sat={hourFee}
            />
            <FeeRow
              icon={<Coffee size={11} />}
              label="Economy"
              sat={economyFee}
            />
          </div>
        </>
      )}
    </WidgetCard>
  );
}

function FeeRow({
  icon,
  label,
  sat,
}: {
  icon: React.ReactNode;
  label: string;
  sat: number;
}) {
  return (
    <div className="bg-surface-container p-2 flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-on-surface-variant">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-xs font-bold font-mono tabular-nums text-on-surface">
        {sat} <span className="text-[9px] text-on-surface-variant">s/vB</span>
      </span>
    </div>
  );
}
