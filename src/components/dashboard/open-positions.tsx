"use client";

const positions = [
  {
    asset: "BTCUSDT",
    side: "LONG" as const,
    size: "0.45 BTC",
    entry: "42,850.00",
    pnl: "+$123.40",
    roe: "+1.2%",
    rrRatio: "1:3.4",
    isProfit: true,
    status: "active" as const,
  },
  {
    asset: "ETHUSDT",
    side: "SHORT" as const,
    size: "2.00 ETH",
    entry: "2,410.50",
    pnl: "-$12.10",
    roe: "-0.4%",
    rrRatio: "1:2.1",
    isProfit: false,
    status: "warning" as const,
  },
];

export function OpenPositions() {
  return (
    <section className="bg-surface-container-low p-5 h-64 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading font-bold text-sm tracking-widest uppercase text-on-surface">
          Open Positions ({positions.length})
        </h2>
        <button className="bg-error text-on-secondary px-4 py-1 text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">
          Panic Close All
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest border-b border-outline-variant/10">
              <th className="pb-2 font-bold">Asset</th>
              <th className="pb-2 font-bold">Size</th>
              <th className="pb-2 font-bold">Entry</th>
              <th className="pb-2 font-bold text-right">PnL (ROE%)</th>
              <th className="pb-2 font-bold text-right">R/R Ratio</th>
              <th className="pb-2 font-bold text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, i) => (
              <tr
                key={i}
                className="text-xs border-b border-outline-variant/5 hover:bg-surface-container-high/50 transition-colors"
              >
                {/* Asset + Side tag */}
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-on-surface font-bold text-xs">
                      {pos.asset}
                    </span>
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
                  {pos.entry}
                </td>

                {/* PnL (ROE%) */}
                <td
                  className={`py-2.5 text-right font-mono tabular-nums text-xs font-bold ${
                    pos.isProfit ? "text-emerald-accent" : "text-crimson"
                  }`}
                >
                  {pos.pnl}{" "}
                  <span className="text-[10px] opacity-70">({pos.roe})</span>
                </td>

                {/* R/R Ratio */}
                <td className="py-2.5 text-right font-mono tabular-nums text-xs text-on-surface-variant">
                  {pos.rrRatio}
                </td>

                {/* Status */}
                <td className="py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        pos.status === "active"
                          ? "bg-emerald-accent animate-pulse"
                          : "bg-orange-400 animate-pulse"
                      }`}
                    />
                    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                      {pos.status === "active" ? "Active" : "At Risk"}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
