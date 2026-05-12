"use client";

// Collection of data hooks that power the BTC monitor page. Each
// hook polls a public, no-auth endpoint at a sensible interval and
// returns a typed snapshot. Errors are swallowed — widgets render an
// "—" placeholder rather than crashing the dashboard.

import { useEffect, useState } from "react";

// ─── Open Interest ───────────────────────────────────────────────────

export interface OpenInterestPoint {
  time: number;
  oiUsd: number;
  oiBtc: number;
}

export interface OpenInterestData {
  latest: OpenInterestPoint | null;
  history: OpenInterestPoint[];
  changePct24h: number;
  loading: boolean;
}

export function useOpenInterest(): OpenInterestData {
  const [state, setState] = useState<OpenInterestData>({
    latest: null,
    history: [],
    changePct24h: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // 5m candles for the last 24h (288) — but keep it light: pull 48 (4h
        // sampled). The API supports period=5m,15m,30m,1h,...
        const res = await fetch(
          "https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1h&limit=24"
        );
        if (!res.ok) throw new Error("OI fetch failed");
        const rows = (await res.json()) as Array<{
          sumOpenInterest: string;
          sumOpenInterestValue: string;
          timestamp: number;
        }>;
        if (cancelled || rows.length === 0) return;

        const history: OpenInterestPoint[] = rows.map((r) => ({
          time: r.timestamp,
          oiBtc: parseFloat(r.sumOpenInterest),
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
  }, []);

  return state;
}

// ─── Long / Short ratio ──────────────────────────────────────────────

export interface LongShortData {
  longPct: number;
  shortPct: number;
  ratio: number;
  loading: boolean;
}

export function useLongShortRatio(): LongShortData {
  const [state, setState] = useState<LongShortData>({
    longPct: 0,
    shortPct: 0,
    ratio: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          "https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=5m&limit=1"
        );
        if (!res.ok) throw new Error("L/S fetch failed");
        const rows = (await res.json()) as Array<{
          longAccount: string;
          shortAccount: string;
          longShortRatio: string;
        }>;
        if (cancelled || rows.length === 0) return;

        const row = rows[0];
        setState({
          longPct: parseFloat(row.longAccount) * 100,
          shortPct: parseFloat(row.shortAccount) * 100,
          ratio: parseFloat(row.longShortRatio),
          loading: false,
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
  }, []);

  return state;
}

// ─── Fear & Greed Index (alternative.me) ─────────────────────────────

export interface FearGreedData {
  value: number;         // 0-100
  classification: string;
  yesterday: number | null;
  loading: boolean;
}

export function useFearGreed(): FearGreedData {
  const [state, setState] = useState<FearGreedData>({
    value: 0,
    classification: "—",
    yesterday: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("https://api.alternative.me/fng/?limit=2");
        if (!res.ok) throw new Error("F&G fetch failed");
        const json = (await res.json()) as {
          data: Array<{ value: string; value_classification: string }>;
        };
        if (cancelled || !json.data || json.data.length === 0) return;

        const today = json.data[0];
        const yesterday = json.data[1];
        setState({
          value: parseInt(today.value, 10),
          classification: today.value_classification,
          yesterday: yesterday ? parseInt(yesterday.value, 10) : null,
          loading: false,
        });
      } catch {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    load();
    // F&G only updates once a day — poll every 30 minutes is plenty.
    const id = setInterval(load, 30 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return state;
}

// ─── BTC Dominance (CoinGecko global) ────────────────────────────────

export interface DominanceData {
  btcDominance: number;
  ethDominance: number;
  totalMarketCapUsd: number;
  marketCapChange24h: number;
  loading: boolean;
}

export function useBtcDominance(): DominanceData {
  const [state, setState] = useState<DominanceData>({
    btcDominance: 0,
    ethDominance: 0,
    totalMarketCapUsd: 0,
    marketCapChange24h: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/global");
        if (!res.ok) throw new Error("Dominance fetch failed");
        const json = (await res.json()) as {
          data: {
            market_cap_percentage: { btc: number; eth: number };
            total_market_cap: { usd: number };
            market_cap_change_percentage_24h_usd: number;
          };
        };
        if (cancelled || !json.data) return;

        setState({
          btcDominance: json.data.market_cap_percentage.btc,
          ethDominance: json.data.market_cap_percentage.eth,
          totalMarketCapUsd: json.data.total_market_cap.usd,
          marketCapChange24h: json.data.market_cap_change_percentage_24h_usd,
          loading: false,
        });
      } catch {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    load();
    // CoinGecko rate-limits heavily on the free tier (~30 req/min, ~50/day
    // unauthenticated). Poll once every 5 minutes to stay safe.
    const id = setInterval(load, 5 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return state;
}

// ─── Mempool stats (mempool.space) ───────────────────────────────────

export interface MempoolData {
  pendingCount: number;
  vsizeBytes: number;
  fastestFee: number;     // sat/vB to confirm in next block
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  loading: boolean;
}

export function useMempool(): MempoolData {
  const [state, setState] = useState<MempoolData>({
    pendingCount: 0,
    vsizeBytes: 0,
    fastestFee: 0,
    halfHourFee: 0,
    hourFee: 0,
    economyFee: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [mempoolRes, feesRes] = await Promise.all([
          fetch("https://mempool.space/api/mempool"),
          fetch("https://mempool.space/api/v1/fees/recommended"),
        ]);
        if (!mempoolRes.ok || !feesRes.ok) throw new Error("Mempool failed");
        const mp = (await mempoolRes.json()) as {
          count: number;
          vsize: number;
        };
        const fees = (await feesRes.json()) as {
          fastestFee: number;
          halfHourFee: number;
          hourFee: number;
          economyFee: number;
        };
        if (cancelled) return;

        setState({
          pendingCount: mp.count,
          vsizeBytes: mp.vsize,
          fastestFee: fees.fastestFee,
          halfHourFee: fees.halfHourFee,
          hourFee: fees.hourFee,
          economyFee: fees.economyFee,
          loading: false,
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
  }, []);

  return state;
}

// ─── BTC 24h ticker (price always, regardless of selected pair) ──────

export interface BtcTickerData {
  price: number;
  priceChangePct: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  loading: boolean;
}

export function useBtcTicker(): BtcTickerData {
  const [state, setState] = useState<BtcTickerData>({
    price: 0,
    priceChangePct: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 0,
    quoteVolume24h: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;

    async function bootstrap() {
      try {
        const res = await fetch(
          "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"
        );
        if (!res.ok) throw new Error("Ticker fetch failed");
        const data = await res.json();
        if (cancelled) return;
        setState({
          price: parseFloat(data.lastPrice),
          priceChangePct: parseFloat(data.priceChangePercent),
          high24h: parseFloat(data.highPrice),
          low24h: parseFloat(data.lowPrice),
          volume24h: parseFloat(data.volume),
          quoteVolume24h: parseFloat(data.quoteVolume),
          loading: false,
        });
      } catch {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    bootstrap();

    ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@ticker");
    ws.onmessage = (ev) => {
      try {
        const t = JSON.parse(ev.data);
        if (cancelled) return;
        setState({
          price: parseFloat(t.c),
          priceChangePct: parseFloat(t.P),
          high24h: parseFloat(t.h),
          low24h: parseFloat(t.l),
          volume24h: parseFloat(t.v),
          quoteVolume24h: parseFloat(t.q),
          loading: false,
        });
      } catch {
        // ignore parse failures
      }
    };

    return () => {
      cancelled = true;
      ws?.close();
    };
  }, []);

  return state;
}
