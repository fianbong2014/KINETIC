import type { JournalEntry } from "@/hooks/use-journal";

export interface PerformanceStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakEven: number;
  winRate: number;

  totalPnl: number;
  grossProfit: number;
  grossLoss: number; // positive number representing absolute loss
  profitFactor: number;

  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;

  expectancy: number; // per-trade expected value
  maxDrawdown: number; // worst peak-to-trough on equity curve, as % of peak

  avgRrr: number | null; // average parsed "1:X"
  sharpe: number | null; // simplified Sharpe-like ratio
}

export interface EquityPoint {
  date: string; // ISO date
  equity: number;
  trade?: JournalEntry; // the entry that produced this point
}

export interface PairPerformance {
  pair: string;
  trades: number;
  wins: number;
  winRate: number;
  pnl: number;
}

export interface StrategyPerformance {
  strategy: string;
  trades: number;
  wins: number;
  winRate: number;
  avgRrr: number | null;
}

const EMPTY: PerformanceStats = {
  totalTrades: 0,
  wins: 0,
  losses: 0,
  breakEven: 0,
  winRate: 0,
  totalPnl: 0,
  grossProfit: 0,
  grossLoss: 0,
  profitFactor: 0,
  avgWin: 0,
  avgLoss: 0,
  bestTrade: 0,
  worstTrade: 0,
  expectancy: 0,
  maxDrawdown: 0,
  avgRrr: null,
  sharpe: null,
};

export function computeStats(entries: JournalEntry[]): PerformanceStats {
  if (entries.length === 0) return EMPTY;

  const wins = entries.filter((e) => e.pnl > 0);
  const losses = entries.filter((e) => e.pnl < 0);
  const breakEven = entries.filter((e) => e.pnl === 0).length;

  const totalPnl = entries.reduce((s, e) => s + e.pnl, 0);
  const grossProfit = wins.reduce((s, e) => s + e.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, e) => s + e.pnl, 0));

  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

  const bestTrade = entries.reduce((m, e) => Math.max(m, e.pnl), 0);
  const worstTrade = entries.reduce((m, e) => Math.min(m, e.pnl), 0);

  const winRate = (wins.length / entries.length) * 100;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  // Expectancy: (winRate × avgWin) − (lossRate × avgLoss)
  const lossRate = losses.length / entries.length;
  const expectancy = (winRate / 100) * avgWin - lossRate * avgLoss;

  // Parse R:R strings into numbers, skip invalid
  const rrrs = entries
    .map((e) => {
      const m = e.rrr.match(/1[:\s]+([\d.]+)/);
      return m ? parseFloat(m[1]) : null;
    })
    .filter((n): n is number => n !== null && !isNaN(n));
  const avgRrr = rrrs.length > 0 ? rrrs.reduce((a, b) => a + b, 0) / rrrs.length : null;

  // Max drawdown from equity curve
  const curve = buildEquityCurve(entries, 0);
  let peak = 0;
  let maxDd = 0;
  for (const point of curve) {
    if (point.equity > peak) peak = point.equity;
    const dd = peak > 0 ? ((point.equity - peak) / peak) * 100 : 0;
    if (dd < maxDd) maxDd = dd;
  }

  // Simplified Sharpe-like ratio: mean(returns) / stddev(returns)
  const returns = entries.map((e) => e.pnlPct);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
  const stddev = Math.sqrt(variance);
  const sharpe = stddev > 0 ? mean / stddev : null;

  return {
    totalTrades: entries.length,
    wins: wins.length,
    losses: losses.length,
    breakEven,
    winRate,
    totalPnl,
    grossProfit,
    grossLoss,
    profitFactor,
    avgWin,
    avgLoss,
    bestTrade,
    worstTrade,
    expectancy,
    maxDrawdown: maxDd,
    avgRrr,
    sharpe,
  };
}

/**
 * Builds a cumulative equity curve from journal entries. Entries are
 * sorted by date ascending and each point represents equity AFTER that trade.
 */
export function buildEquityCurve(
  entries: JournalEntry[],
  startingBalance: number
): EquityPoint[] {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Always include a starting point so an empty journal still shows a line
  const points: EquityPoint[] = [];
  let equity = startingBalance;

  for (const entry of sorted) {
    equity += entry.pnl;
    points.push({
      date: entry.date,
      equity,
      trade: entry,
    });
  }

  return points;
}

export function groupByPair(entries: JournalEntry[]): PairPerformance[] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const list = map.get(e.pair) || [];
    list.push(e);
    map.set(e.pair, list);
  }
  return Array.from(map.entries())
    .map(([pair, list]) => {
      const wins = list.filter((e) => e.pnl > 0);
      const pnl = list.reduce((s, e) => s + e.pnl, 0);
      return {
        pair,
        trades: list.length,
        wins: wins.length,
        winRate: (wins.length / list.length) * 100,
        pnl,
      };
    })
    .sort((a, b) => b.trades - a.trades);
}

export function groupByStrategy(entries: JournalEntry[]): StrategyPerformance[] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const key = e.strategy || "Unspecified";
    const list = map.get(key) || [];
    list.push(e);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .map(([strategy, list]) => {
      const wins = list.filter((e) => e.pnl > 0);
      const rrrs = list
        .map((e) => {
          const m = e.rrr.match(/1[:\s]+([\d.]+)/);
          return m ? parseFloat(m[1]) : null;
        })
        .filter((n): n is number => n !== null && !isNaN(n));
      const avgRrr =
        rrrs.length > 0 ? rrrs.reduce((a, b) => a + b, 0) / rrrs.length : null;

      return {
        strategy,
        trades: list.length,
        wins: wins.length,
        winRate: (wins.length / list.length) * 100,
        avgRrr,
      };
    })
    .sort((a, b) => b.trades - a.trades);
}
