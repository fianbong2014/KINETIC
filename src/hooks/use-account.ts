"use client";

import { useCallback, useEffect, useState } from "react";

export interface AccountData {
  balance: number;
  startingBalance: number;
  equity: number;
  totalExposure: number;
  realizedPnl: number;
  todayPnl: number;
  drawdown: number;
  openPositions: number;
  totalClosedTrades: number;
}

const DEFAULT: AccountData = {
  balance: 0,
  startingBalance: 0,
  equity: 0,
  totalExposure: 0,
  realizedPnl: 0,
  todayPnl: 0,
  drawdown: 0,
  openPositions: 0,
  totalClosedTrades: 0,
};

// In-memory event bus so any component can trigger a refresh after placing or
// closing a trade, without prop-drilling or a full state library.
type Listener = () => void;
const listeners = new Set<Listener>();

export function notifyAccountChanged() {
  for (const l of listeners) l();
}

export function useAccount() {
  const [data, setData] = useState<AccountData>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/account");
      if (!res.ok) return;
      setData(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, [refresh]);

  return { ...data, loading, refresh };
}
