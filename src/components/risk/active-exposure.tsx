"use client";

import { usePositions, type Position } from "@/hooks/use-positions";
import { notifyAccountChanged } from "@/hooks/use-account";
import { usePrice } from "@/components/providers/price-provider";
import { formatPrice, formatUsd, formatPct } from "@/lib/format";

function StatusDot({ status }: { status: "low" | "elevated" | "warning" }) {
  const colors = {
    low: "bg-emerald-accent",
    elevated: "bg-orange",
    warning: "bg-crimson",
  };
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === "warning" && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson opacity-75" />
      )}
      <span
        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`}
      />
    </span>
  );
}

function formatPair(asset: string): string {
  return asset.endsWith("USDT") ? `${asset.slice(0, -4)}/USD` : asset;
}

export function ActiveExposure() {
  const { positions, close } = usePositions("active");
  const { price: currentPrice, symbol: currentSymbol } = usePrice();

  async function handleClose(pos: Position) {
    const usesLive = pos.asset === currentSymbol && currentPrice > 0;
    const exitPrice = usesLive ? currentPrice : pos.entry;
    const pnl =
      pos.side === "LONG"
        ? (exitPrice - pos.entry) * pos.size
        : (pos.entry - exitPrice) * pos.size;

    if (
      confirm(
        `Close ${pos.asset} ${pos.side} @ $${formatPrice(exitPrice)}?\nPNL: ${formatUsd(pnl, { signed: true })}`
      )
    ) {
      await close(pos.id, exitPrice, pnl);
      notifyAccountChanged();
    }
  }

  return (
    <div className="col-span-12 bg-surface-container-low p-6">
      {/* Header with legend */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-on-surface tracking-wider uppercase mb-2">
            Active Exposure ({positions.length})
          </h3>
          <div className="h-[1px] w-12 bg-primary" />
        </div>
        <div className="flex items-center gap-4 text-[10px] text-on-surface-variant uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-accent" />
            Profit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-orange" />
            Small Loss
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-crimson" />
            Large Loss
          </span>
        </div>
      </div>

      {/* Table */}
      {positions.length === 0 ? (
        <div className="text-center text-on-surface-variant text-sm py-10">
          No open positions.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-on-surface-variant uppercase tracking-wider border-b border-outline-dim">
                <th className="text-left py-3 font-medium">Symbol</th>
                <th className="text-left py-3 font-medium">Type</th>
                <th className="text-right py-3 font-medium">Size</th>
                <th className="text-right py-3 font-medium">Entry</th>
                <th className="text-right py-3 font-medium">Mark</th>
                <th className="text-right py-3 font-medium">Unrealized PnL</th>
                <th className="text-right py-3 font-medium">PnL (%)</th>
                <th className="text-center py-3 font-medium">Risk</th>
                <th className="text-right py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                const usesLive =
                  pos.asset === currentSymbol && currentPrice > 0;
                const mark = usesLive ? currentPrice : pos.entry;
                const pnl =
                  pos.side === "LONG"
                    ? (mark - pos.entry) * pos.size
                    : (pos.entry - mark) * pos.size;
                const pnlPct =
                  pos.entry > 0
                    ? (pnl / (pos.entry * pos.size)) * 100
                    : 0;
                const isProfit = pnl >= 0;

                const riskStatus: "low" | "elevated" | "warning" =
                  pnlPct >= 0 ? "low" : pnlPct > -2 ? "elevated" : "warning";

                return (
                  <tr
                    key={pos.id}
                    className="text-xs font-mono tabular-nums border-b border-outline-dim/30 hover:bg-surface-container-high transition-colors"
                  >
                    <td className="py-3 text-on-surface font-sans font-medium">
                      {formatPair(pos.asset)}
                      {usesLive && (
                        <span className="inline-block w-1 h-1 bg-emerald-accent animate-pulse rounded-full ml-2 align-middle" />
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-sans font-bold tracking-wider ${
                          pos.side === "LONG" ? "text-cyan" : "text-orange"
                        }`}
                      >
                        {pos.side}
                      </span>
                    </td>
                    <td className="py-3 text-right text-on-surface-variant">
                      {pos.size}
                    </td>
                    <td className="py-3 text-right text-on-surface">
                      ${formatPrice(pos.entry)}
                    </td>
                    <td className="py-3 text-right text-on-surface">
                      ${formatPrice(mark)}
                    </td>
                    <td
                      className={`py-3 text-right ${
                        isProfit ? "text-emerald-accent" : "text-crimson"
                      }`}
                    >
                      {formatUsd(pnl, { signed: true })}
                    </td>
                    <td
                      className={`py-3 text-right ${
                        isProfit ? "text-emerald-accent" : "text-crimson"
                      }`}
                    >
                      {formatPct(pnlPct, { signed: true })}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-center">
                        <StatusDot status={riskStatus} />
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleClose(pos)}
                        className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-crimson border border-crimson/50 bg-crimson/5 hover:bg-crimson/10 transition-colors"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
