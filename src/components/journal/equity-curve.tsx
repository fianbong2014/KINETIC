"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const equityData = [
  { date: "Mar 1", equity: 250000 },
  { date: "Mar 5", equity: 252400 },
  { date: "Mar 8", equity: 251800 },
  { date: "Mar 10", equity: 255600 },
  { date: "Mar 12", equity: 258200 },
  { date: "Mar 15", equity: 256800 },
  { date: "Mar 17", equity: 261400 },
  { date: "Mar 19", equity: 264200 },
  { date: "Mar 21", equity: 268900 },
  { date: "Mar 23", equity: 267400 },
  { date: "Mar 25", equity: 271200 },
  { date: "Mar 27", equity: 278600 },
  { date: "Mar 29", equity: 282400 },
  { date: "Mar 30", equity: 284820 },
];

export function EquityCurve() {
  return (
    <div className="bg-surface-container-low p-3 lg:p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">
          Equity Curve
        </h3>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-on-surface-variant">STARTING:</span>
          <span className="font-mono tabular-nums text-on-surface">$250,000</span>
          <span className="text-on-surface-variant mx-1">→</span>
          <span className="font-mono tabular-nums text-emerald-accent">$284,820</span>
          <span className="text-emerald-accent">(+13.9%)</span>
        </div>
      </div>

      <div className="h-[200px] lg:h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={equityData}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#50c878" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#50c878" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(72,72,73,0.15)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#adaaab", fontSize: 9 }}
            />
            <YAxis
              domain={["dataMin - 5000", "dataMax + 5000"]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#adaaab", fontSize: 9 }}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              orientation="right"
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#262627",
                border: "none",
                borderRadius: 0,
                fontSize: 11,
                color: "#fff",
              }}
              formatter={(value) => [
                `$${Number(value).toLocaleString()}`,
                "Equity",
              ]}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="#50c878"
              strokeWidth={2}
              fill="url(#equityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
