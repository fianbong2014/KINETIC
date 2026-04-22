"use client";

import { useState } from "react";
import { usePositions, type Position } from "@/hooks/use-positions";
import { notifyAccountChanged } from "@/hooks/use-account";
import { usePrice } from "@/components/providers/price-provider";
import { useToast } from "@/components/providers/toast-provider";
import { PartialCloseDialog } from "@/components/dashboard/partial-close-dialog";
import { formatPrice, formatUsd, formatPct } from "@/lib/format";

type TabView = "active" | "history";

export function OpenPositions() {
  const {
    positions: activePositions,
    loading: activeLoading,
    partialClose,
    remove,
  } = usePositions("active");
  const {
    positions: closedPositions,
    loading: closedLoading,
  } = usePositions("closed");
  const { price: currentPrice, symbol: currentSymbol } = usePrice();
  const toast = useToast();

  const [view, setView] = useState<TabView>("active");
  const [closingPosition, setClosingPosition] = useState<Position | null>(null);

  function getExitPrice(pos: Position): number {
    return pos.asset === currentSymbol && currentPrice > 0
      ? currentPrice
      : pos.entry;
  }

  async function handleConfirmPartialClose(
    closeSize: number,
    exitPrice: number
  ) {
    if (!closingPosition) return;
    try {
      const result = await partialClose(
        closingPosition.id,
        closeSize,
        exitPrice
      );
      notifyAccountChanged();
      const pnl = result.pnl as number;
      const title = result.fullyClosed ? "Position Closed" : "Partial Close";
      if (pnl >= 0) {
        toast.success(
          title,
          `${closingPosition.asset} ${closingPosition.side} · PNL ${formatUsd(pnl, { signed: true })}`
        );
      } else {
        toast.warning(
          title,
          `${closingPosition.asset} ${closingPosition.side} · PNL ${formatUsd(pnl, { signed: true })}`
        );
      }
      setClosingPosition(null);
    } catch (e) {
      toast.error(
        "Close Failed",
        e instanceof Error ? e.message : "Unknown error"
      );
      throw e;
    }
  }

  async function handleCloseAll() {
    if (!confirm(`Panic close all ${activePositions.length} positions?`))
      return;
    let totalPnl = 0;
    for (const pos of activePositions) {
      const exitPrice = getExitPrice(pos);
      try {
        const result = await partialClose(pos.id, pos.size, exitPrice);
        totalPnl += result.pnl as number;
      } catch {
        // continue with next
      }
    }
    notifyAccountChanged();
    toast.info(
      "All Positions Closed",
      `${activePositions.length} positions · Total ${formatUsd(totalPnl, { signed: true })}`
    );
  }

  const positions = view === "active" ? activePositions : closedPositions;
  const loading = view === "active" ? activeLoading : closedLoading;

  return (
    <>
      <section className="bg-surface-container-low p-5 h-64 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <h2 className="font-heading font-bold text-sm tracking-widest uppercase text-on-surface">
              Positions
            </h2>
            <div className="flex gap-1">
              <TabButton
                active={view === "active"}
                onClick={() => setView("active")}
              >
                Active ({activePositions.length})
              </TabButton>
              <TabButton
                active={view === "history"}
                onClick={() => setView("history")}
              >
                History ({closedPositions.length})
              </TabButton>
            </div>
          </div>
          {view === "active" && (
            <button
              onClick={handleCloseAll}
              disabled={activePositions.length === 0}
              className="bg-error text-on-secondary px-4 py-1 text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Panic Close All
            </button>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-xs text-on-surface-variant">
              Loading positions...
            </div>
          ) : positions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-on-surface-variant">
              {view === "active"
                ? "No open positions. Place a trade from the execution panel."
                : "No closed positions yet."}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest border-b border-outline-variant/10">
                  <th className="pb-2 font-bold">Asset</th>
                  <th className="pb-2 font-bold">Size</th>
                  <th className="pb-2 font-bold">Entry</th>
                  {view === "active" ? (
                    <>
                      <th className="pb-2 font-bold text-right">PnL (ROE%)</th>
                      <th className="pb-2 font-bold text-right">SL / TP</th>
                    </>
                  ) : (
                    <>
                      <th className="pb-2 font-bold text-right">Exit</th>
                      <th className="pb-2 font-bold text-right">PnL</th>
                    </>
                  )}
                  <th className="pb-2 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) =>
                  view === "active" ? (
                    <ActivePositionRow
                      key={pos.id}
                      pos={pos}
                      currentPrice={currentPrice}
                      currentSymbol={currentSymbol}
                      onClose={() => setClosingPosition(pos)}
                      onDelete={() => remove(pos.id)}
                    />
                  ) : (
                    <ClosedPositionRow key={pos.id} pos={pos} />
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Partial close dialog */}
      {closingPosition && (
        <PartialCloseDialog
          position={closingPosition}
          markPrice={getExitPrice(closingPosition)}
          onConfirm={handleConfirmPartialClose}
          onClose={() => setClosingPosition(null)}
        />
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase transition-colors ${
        active
          ? "bg-surface-container-highest text-cyan border-b-2 border-cyan"
          : "text-on-surface-variant hover:text-on-surface"
      }`}
    >
      {children}
    </button>
  );
}

function ActivePositionRow({
  pos,
  currentPrice,
  currentSymbol,
  onClose,
  onDelete,
}: {
  pos: Position;
  currentPrice: number;
  currentSymbol: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  const useLive = pos.asset === currentSymbol && currentPrice > 0;
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

      <td className="py-2.5 font-mono tabular-nums text-on-surface-variant text-xs">
        {pos.size}
      </td>

      <td className="py-2.5 font-mono tabular-nums text-on-surface text-xs">
        {formatPrice(pos.entry)}
      </td>

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

      <td className="py-2.5 text-right font-mono tabular-nums text-xs text-on-surface-variant">
        {pos.stopLoss ? formatPrice(pos.stopLoss) : "—"}
        {" / "}
        {pos.takeProfit ? formatPrice(pos.takeProfit) : "—"}
      </td>

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
            title="Delete (without realizing PNL)"
          >
            Del
          </button>
        </div>
      </td>
    </tr>
  );
}

function ClosedPositionRow({ pos }: { pos: Position }) {
  const pnl = pos.pnl ?? 0;
  const isProfit = pnl >= 0;

  return (
    <tr className="text-xs border-b border-outline-variant/5 hover:bg-surface-container-high/50 transition-colors">
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

      <td className="py-2.5 font-mono tabular-nums text-on-surface-variant text-xs">
        {pos.size}
      </td>

      <td className="py-2.5 font-mono tabular-nums text-on-surface text-xs">
        {formatPrice(pos.entry)}
      </td>

      <td className="py-2.5 text-right font-mono tabular-nums text-xs text-on-surface">
        {pos.exit ? formatPrice(pos.exit) : "—"}
      </td>

      <td
        className={`py-2.5 text-right font-mono tabular-nums text-xs font-bold ${
          isProfit ? "text-emerald-accent" : "text-crimson"
        }`}
      >
        {formatUsd(pnl, { signed: true })}
      </td>

      <td className="py-2.5 text-right text-[9px] text-on-surface-variant font-mono">
        {pos.closedAt
          ? new Date(pos.closedAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </td>
    </tr>
  );
}
