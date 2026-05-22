"use client";

import { useEffect, useState } from "react";

// Symbol-aware mirror of the existing BTC-only hooks in use-btc-monitor.ts.
// All three endpoints are on Binance USD-M Futures so spot-only pairs
// (PAXG/XAUT) will report unavailable.

const FAPI = "https://fapi.binance.com";

export interface OiPoint {
  time: number;
  oiBase: number; // OI denominated in base units (e.g. BTC)
  oiUsd: number;
}

export interface OpenInterestState {
  latest: OiPoint | null;
  history: OiPoint[];
  changePct24h: number;
  loading: boolean;
  unavailable: boolean;
}

export function useOpenInterestFor(symbol: string): OpenInterestState {
  const [state, setState] = useState<OpenInterestState>({
    latest: null,
    history: [],
    changePct24h: 0,
    loading: true,
    unavailable: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `${FAPI}/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=24`,
        );
        if (res.status === 400) {
          if (cancelled) return;
          setState({
            latest: null,
            history: [],
            changePct24h: 0,
            loading: false,
            unavailable: true,
          });
          return;
        }
        if (!res.ok) throw new Error("OI fetch failed");
        const rows = (await res.json()) as Array<{
          sumOpenInterest: string;
          sumOpenInterestValue: string;
          timestamp: number;
        }>;
        if (cancelled || rows.length === 0) return;

        const history: OiPoint[] = rows.map((r) => ({
          time: r.timestamp,
          oiBase: parseFloat(r.sumOpenInterest),
          oiUsd: parseFloat(r.sumOpenInterestValue),
        }));
        const first = history[0];
        const last = history[history.length - 1];
        const changePct =
          first.oiUsd > 0 ? ((last.oiUsd - first.oiUsd) / first.oiUsd) * 100 : 0;
        setState({
          latest: last,
          history,
          changePct24h: changePct,
          loading: false,
          unavailable: false,
        });
      } catch {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol]);

  return state;
}

// ─── Long / Short ratio ──────────────────────────────────────────────

export interface LongShortState {
  globalLongPct: number;
  globalShortPct: number;
  globalRatio: number;
  topLongPct: number;
  topShortPct: number;
  topRatio: number;
  loading: boolean;
  unavailable: boolean;
}

export function useLongShortFor(symbol: string): LongShortState {
  const [state, setState] = useState<LongShortState>({
    globalLongPct: 0,
    globalShortPct: 0,
    globalRatio: 0,
    topLongPct: 0,
    topShortPct: 0,
    topRatio: 0,
    loading: true,
    unavailable: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [globalRes, topRes] = await Promise.all([
          fetch(
            `${FAPI}/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`,
          ),
          fetch(
            `${FAPI}/futures/data/topLongShortPositionRatio?symbol=${symbol}&period=5m&limit=1`,
          ),
        ]);
        if (globalRes.status === 400 || topRes.status === 400) {
          if (cancelled) return;
          setState((p) => ({ ...p, loading: false, unavailable: true }));
          return;
        }
        if (!globalRes.ok || !topRes.ok) throw new Error("L/S fetch failed");

        const globalRows = await globalRes.json();
        const topRows = await topRes.json();
        if (cancelled || globalRows.length === 0 || topRows.length === 0) return;
        const g = globalRows[0];
        const t = topRows[0];
        setState({
          globalLongPct: parseFloat(g.longAccount) * 100,
          globalShortPct: parseFloat(g.shortAccount) * 100,
          globalRatio: parseFloat(g.longShortRatio),
          topLongPct: parseFloat(t.longAccount) * 100,
          topShortPct: parseFloat(t.shortAccount) * 100,
          topRatio: parseFloat(t.longShortRatio),
          loading: false,
          unavailable: false,
        });
      } catch {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol]);

  return state;
}

// ─── Taker buy/sell volume ratio ─────────────────────────────────────

export interface TakerState {
  buyVol: number;
  sellVol: number;
  ratio: number;
  loading: boolean;
  unavailable: boolean;
}

export function useTakerBuySellFor(symbol: string): TakerState {
  const [state, setState] = useState<TakerState>({
    buyVol: 0,
    sellVol: 0,
    ratio: 0,
    loading: true,
    unavailable: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `${FAPI}/futures/data/takerlongshortRatio?symbol=${symbol}&period=5m&limit=1`,
        );
        if (res.status === 400) {
          if (cancelled) return;
          setState((p) => ({ ...p, loading: false, unavailable: true }));
          return;
        }
        if (!res.ok) throw new Error("Taker fetch failed");
        const rows = await res.json();
        if (cancelled || rows.length === 0) return;
        const row = rows[0];
        setState({
          buyVol: parseFloat(row.buyVol),
          sellVol: parseFloat(row.sellVol),
          ratio: parseFloat(row.buySellRatio),
          loading: false,
          unavailable: false,
        });
      } catch {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol]);

  return state;
}
