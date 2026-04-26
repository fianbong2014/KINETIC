"use client";

import {
  X,
  Sunrise,
  TrendingUp,
  TrendingDown,
  Bell,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { BriefingData, MoverEntry } from "@/hooks/use-daily-briefing";
import { usePrice } from "@/components/providers/price-provider";
import { formatPrice, formatUsd } from "@/lib/format";

interface DailyBriefingModalProps {
  data: BriefingData | null;
  loading: boolean;
  onClose: () => void;
}

export function DailyBriefingModal({
  data,
  loading,
  onClose,
}: DailyBriefingModalProps) {
  const { setSymbol } = usePrice();

  function jumpToPair(symbol: string) {
    setSymbol(symbol);
    onClose();
  }

  const hasOvernightActivity =
    data &&
    (data.triggeredAlerts.length > 0 || data.closedPositions.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-low w-full max-w-2xl border border-outline-variant/10 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-surface-container-high to-surface-container-low p-5 border-b border-outline-variant/10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
              <Sunrise className="w-5 h-5 text-[#004343]" />
            </div>
            <div>
              <h2 className="text-lg font-black font-heading tracking-tighter uppercase text-on-surface">
                Daily Briefing
              </h2>
              <p className="text-[10px] text-on-surface-variant tracking-widest uppercase mt-0.5">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}{" "}
                · Welcome back, trader
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close briefing"
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto flex flex-col gap-5">
          {loading || !data ? (
            <div className="text-center py-12 text-sm text-on-surface-variant">
              <span className="animate-pulse tracking-widest uppercase">
                Pulling overnight data...
              </span>
            </div>
          ) : (
            <>
              {/* Overnight activity */}
              {hasOvernightActivity ? (
                <div className="flex flex-col gap-3">
                  <SectionTitle>Since You Were Last Here</SectionTitle>

                  {data.closedPositions.length > 0 && (
                    <div className="bg-surface-container p-3 flex flex-col gap-2">
                      {data.closedPositions.map((pos) => {
                        const profit = (pos.pnl ?? 0) >= 0;
                        return (
                          <div
                            key={pos.id}
                            className="flex items-center gap-3 text-xs"
                          >
                            {profit ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-accent shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-crimson shrink-0" />
                            )}
                            <span className="font-bold text-on-surface">
                              {pos.asset} {pos.side}
                            </span>
                            <span className="text-on-surface-variant">
                              closed
                            </span>
                            <span
                              className={`ml-auto font-mono tabular-nums font-bold ${
                                profit
                                  ? "text-emerald-accent"
                                  : "text-crimson"
                              }`}
                            >
                              {formatUsd(pos.pnl ?? 0, { signed: true })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {data.triggeredAlerts.length > 0 && (
                    <div className="bg-surface-container p-3 flex flex-col gap-2">
                      {data.triggeredAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-center gap-3 text-xs"
                        >
                          <Bell className="w-3.5 h-3.5 text-cyan shrink-0" />
                          <span className="font-bold text-on-surface">
                            {alert.symbol}
                          </span>
                          <span className="text-on-surface-variant">
                            crossed
                          </span>
                          <span
                            className={`font-mono tabular-nums ${
                              alert.direction === "above"
                                ? "text-emerald-accent"
                                : "text-crimson"
                            }`}
                          >
                            {alert.direction === "above" ? "↑" : "↓"} $
                            {formatPrice(alert.price)}
                          </span>
                          {alert.message && (
                            <span className="text-[10px] text-on-surface-variant/80 truncate ml-auto">
                              {alert.message}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-surface-container p-4 text-center">
                  <p className="text-xs text-on-surface-variant tracking-wider uppercase">
                    Quiet night — no alerts fired or positions closed
                  </p>
                </div>
              )}

              {/* Movers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MoverColumn
                  title="Top Gainers (24H)"
                  movers={data.topGainers}
                  positive
                  onJump={jumpToPair}
                />
                <MoverColumn
                  title="Top Losers (24H)"
                  movers={data.topLosers}
                  positive={false}
                  onJump={jumpToPair}
                />
              </div>

              {/* Footer summary */}
              <div className="bg-surface-container-lowest p-3 flex items-center justify-between text-[10px] tracking-widest uppercase">
                <span className="text-on-surface-variant">
                  {data.topGainers.length + data.topLosers.length} pairs ·{" "}
                  {data.triggeredAlerts.length} alerts ·{" "}
                  {data.closedPositions.length} closes
                </span>
                <button
                  onClick={onClose}
                  className="bg-primary text-[#004343] font-heading font-bold px-4 py-2 hover:opacity-90 transition-opacity"
                >
                  Start Trading
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] text-on-surface-variant tracking-widest uppercase font-bold">
      {children}
    </h3>
  );
}

function MoverColumn({
  title,
  movers,
  positive,
  onJump,
}: {
  title: string;
  movers: MoverEntry[];
  positive: boolean;
  onJump: (symbol: string) => void;
}) {
  const Icon = positive ? TrendingUp : TrendingDown;
  const accent = positive ? "text-emerald-accent" : "text-crimson";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${accent}`} />
        <SectionTitle>{title}</SectionTitle>
      </div>
      <div className="bg-surface-container flex flex-col gap-0.5">
        {movers.length === 0 ? (
          <span className="text-xs text-on-surface-variant text-center py-3">
            No movers
          </span>
        ) : (
          movers.map((m) => (
            <button
              key={m.pair.symbol}
              onClick={() => onJump(m.pair.symbol)}
              className="flex items-center justify-between gap-2 p-2 hover:bg-surface-container-high transition-colors text-left"
            >
              <span className="text-xs font-bold text-on-surface">
                {m.pair.display}
              </span>
              <span className="font-mono tabular-nums text-[10px] text-on-surface-variant">
                ${formatPrice(m.price)}
              </span>
              <span
                className={`font-mono tabular-nums text-xs font-bold ${accent} ml-auto`}
              >
                {m.changePct >= 0 ? "+" : ""}
                {m.changePct.toFixed(2)}%
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
