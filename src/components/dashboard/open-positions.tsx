"use client";

import { usePositions, type Position } from "@/hooks/use-positions";
import { usePrice } from "@/components/providers/price-provider";
import { formatPrice, formatUsd, formatPct } from "@/lib/format";

export function OpenPositions() {
  const { positions, loading, close, remove } = usePositions("active");
  const { price: currentPrice } = usePrice();

  async function handleClose(pos: Position) {
    // Use current BTC price as exit price for BTC positions; otherwise use entry (no live price)
    const exitPrice = pos.asset.startsWith("BTC") ? currentPrice : pos.entry;
    const pnl =
      pos.side === "LONG"
        ? (exitPrice - pos.entry) * pos.size
        : (pos.entry - exitPrice) * pos.size;

    if (confirm(`Close ${pos.asset} ${pos.side} @ $${formatPrice(exitPrice)}?\nPNL: ${formatUsd(pnl, { signed: true })}`)) {
      await close(pos.id, exitPrice, pnl);
    }
  }

  async function handleCloseAll() {
    if (!confirm(`Panic close all ${positions.length} positions?`)) return;
    for (const pos of positions) {
      const exitPrice = pos.asset.startsWith("BTC") ? currentPrice : pos.entry;
      const pnl =
        pos.side === "LONG"
          ? (exitPrice - pos.entry) * pos.size
          : (pos.entry - exitPrice) * pos.size;
      await close(pos.id, exitPrice, pnl);
    }
  }

  return (
    <section className="bg-surface-container-low p-5 h-64 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading font-bold text-sm tracking-widest uppercase text-on-surface">
          Open Positions ({positions.length})
        </h2>
        <button
          onClick={handleCloseAll}
          disabled={positions.length === 0}
          className="bg-error text-on-secondary px-4 py-1 text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Panic Close All
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-on-surface-variant">
            Loading positions...
          </div>
        ) : positions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-on-surface-variant">
            No open positions. Place a trade from the execution panel.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest border-b border-outline-variant/10">
                <th className="pb-2 font-bold">Asset</th>
                <th className="pb-2 font-bold">Size</th>
                <th className="pb-2 font-bold">Entry</th>
                <th className="pb-2 font-bold text-right">PnL (ROE%)</th>
                <th className="pb-2 font-bold text-right">SL / TP</th>
                <th className="pb-2 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <PositionRow
                  key={pos.id}
                  pos={pos}
                  currentPrice={currentPrice}
                  onClose={() => handleClose(pos)}
                  onDelete={() => remove(pos.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function PositionRow({
  pos,
  currentPrice,
  onClose,
  onDelete,
}: {
  pos: Position;
  currentPrice: number;
  onClose: () => void;
  onDelete: () => void;
}) {
  // Live unrealized PNL for BTC positions, static for others
  const useLive = pos.asset.startsWith("BTC") && currentPrice > 0;
  const referencePrice = useLive ? currentPrice : pos.entry;
  const unrealizedPnl =
    pos.side === "LONG"
      ? (referencePrice - pos.entry) * pos.size
      : (pos.entry - referencePrice) * pos.size;
  const roe =
    pos.entry > 0 ? (unrealizedPnl / (pos.entry * pos.size)) * 100 : 0;
  const isProfit = unrealizedPnl >= 0;

  return (
    <tr className="text-xs border-b border-outline-variant/5 hover:bg-surface-container-high/50 transition-colors">
      {/* Asset + Side tag */}
      <td className="py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-on-surface font-bold text-xs">{pos.asset}</span>
          <span
            className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border ${
              pos.side === "LONG"
                ? "text-cyan border-cyan/30 bg-cyan/5"
                : "text-orange-400 border-orange-400/30 bg-orange-400/5"
            }`}
          >
            {pos.side}
          </span>
        </div>
      </td>

      {/* Size */}
      <td className="py-2.5 font-mono tabular-nums text-on-surface-variant text-xs">
        {pos.size}
      </td>

      {/* Entry */}
      <td className="py-2.5 font-mono tabular-nums text-on-surface text-xs">
        {formatPrice(pos.entry)}
      </td>

      {/* PnL (ROE%) */}
      <td
        className={`py-2.5 text-right font-mono tabular-nums text-xs font-bold ${
          isProfit ? "text-emerald-accent" : "text-crimson"
        }`}
      >
        {formatUsd(unrealizedPnl, { signed: true })}
        <span className="text-[10px] opacity-70 ml-1">
          ({formatPct(roe, { signed: true })})
        </span>
        {useLive && (
          <span className="ml-1 w-1 h-1 inline-block bg-emerald-accent animate-pulse rounded-full align-middle" />
        )}
      </td>

      {/* SL / TP */}
      <td className="py-2.5 text-right font-mono tabular-nums text-xs text-on-surface-variant">
        {pos.stopLoss ? formatPrice(pos.stopLoss) : "—"}
        {" / "}
        {pos.takeProfit ? formatPrice(pos.takeProfit) : "—"}
      </td>

      {/* Actions */}
      <td className="py-2.5 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="text-[10px] uppercase tracking-widest text-cyan font-bold hover:brightness-125"
          >
            Close
          </button>
          <button
            onClick={onDelete}
            className="text-[10px] uppercase tracking-widest text-crimson font-bold hover:brightness-125"
          >
            Del
          </button>
        </div>
      </td>
    </tr>
  );
}
