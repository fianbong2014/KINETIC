"use client";

const exposures = [
  {
    symbol: "BTC/USD",
    type: "LONG",
    entry: "$40,210.00",
    mark: "$42,069.20",
    unrealizedPnl: "+$3,540.21",
    pnlPct: "+4.61%",
    riskStatus: "low" as const,
    isProfit: true,
    action: "TRIM" as const,
  },
  {
    symbol: "ETH/USD",
    type: "SHORT",
    entry: "$2,400.00",
    mark: "$2,462.15",
    unrealizedPnl: "-$521.40",
    pnlPct: "-1.93%",
    riskStatus: "elevated" as const,
    isProfit: false,
    action: "TRIM" as const,
  },
  {
    symbol: "SOL/USD",
    type: "LONG",
    entry: "$96.40",
    mark: "$102.15",
    unrealizedPnl: "+$1,402.00",
    pnlPct: "+3.8%",
    riskStatus: "warning" as const,
    isProfit: true,
    action: "CLOSE" as const,
  },
];

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
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`} />
    </span>
  );
}

export function ActiveExposure() {
  return (
    <div className="col-span-12 bg-surface-container-low p-6">
      {/* Header with legend */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-on-surface tracking-wider uppercase mb-2">
            Active Exposure
          </h3>
          <div className="h-[1px] w-12 bg-primary" />
        </div>
        <div className="flex items-center gap-4 text-[10px] text-on-surface-variant uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-accent" />
            Low Risk
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-orange" />
            Elevated
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-crimson" />
            Warning
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-on-surface-variant uppercase tracking-wider border-b border-outline-dim">
              <th className="text-left py-3 font-medium">Symbol</th>
              <th className="text-left py-3 font-medium">Type</th>
              <th className="text-right py-3 font-medium">Entry Price</th>
              <th className="text-right py-3 font-medium">Mark Price</th>
              <th className="text-right py-3 font-medium">Unrealized PnL</th>
              <th className="text-right py-3 font-medium">PnL (%)</th>
              <th className="text-center py-3 font-medium">Risk Status</th>
              <th className="text-right py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {exposures.map((exp, i) => (
              <tr
                key={i}
                className="text-xs font-mono tabular-nums border-b border-outline-dim/30 hover:bg-surface-container-high transition-colors"
              >
                <td className="py-3 text-on-surface font-sans font-medium">
                  {exp.symbol}
                </td>
                <td className="py-3">
                  <span
                    className={`text-[10px] font-sans font-bold tracking-wider ${
                      exp.type === "LONG" ? "text-cyan" : "text-orange"
                    }`}
                  >
                    {exp.type}
                  </span>
                </td>
                <td className="py-3 text-right text-on-surface">{exp.entry}</td>
                <td className="py-3 text-right text-on-surface">{exp.mark}</td>
                <td
                  className={`py-3 text-right ${
                    exp.isProfit ? "text-emerald-accent" : "text-crimson"
                  }`}
                >
                  {exp.unrealizedPnl}
                </td>
                <td
                  className={`py-3 text-right ${
                    exp.isProfit ? "text-emerald-accent" : "text-crimson"
                  }`}
                >
                  {exp.pnlPct}
                </td>
                <td className="py-3">
                  <div className="flex justify-center">
                    <StatusDot status={exp.riskStatus} />
                  </div>
                </td>
                <td className="py-3 text-right">
                  {exp.action === "CLOSE" ? (
                    <button className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-crimson border border-crimson/50 bg-crimson/5 hover:bg-crimson/10 transition-colors">
                      Close
                    </button>
                  ) : (
                    <button className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-on-surface-variant border border-outline-dim hover:bg-surface-container-high transition-colors">
                      Trim
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
