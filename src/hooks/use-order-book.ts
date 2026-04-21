"use client";

import { useEffect, useRef, useState } from "react";

export interface DepthLevel {
  price: number;
  quantity: number;
}

export interface OrderBookState {
  bids: DepthLevel[]; // sorted desc by price (best bid first)
  asks: DepthLevel[]; // sorted asc by price (best ask first)
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPct: number;
  isConnected: boolean;
}

const DEFAULT_STATE: OrderBookState = {
  bids: [],
  asks: [],
  bestBid: 0,
  bestAsk: 0,
  spread: 0,
  spreadPct: 0,
  isConnected: false,
};

/**
 * Subscribes to Binance partial book depth stream (20 levels @ 100ms).
 * Docs: https://binance-docs.github.io/apidocs/spot/en/#partial-book-depth-streams
 *
 * The partial stream delivers the full top-N snapshot on every tick,
 * so there's no need to build an incremental book from diffs.
 */
export function useOrderBook(symbol: string, levels: 5 | 10 | 20 = 20): OrderBookState {
  const [state, setState] = useState<OrderBookState>(DEFAULT_STATE);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const symbolRef = useRef(symbol);

  useEffect(() => {
    symbolRef.current = symbol;
    setState(DEFAULT_STATE);

    const lower = symbol.toLowerCase();
    // partial depth stream: <symbol>@depth<levels>@100ms
    const url = `wss://stream.binance.com:9443/ws/${lower}@depth${levels}@100ms`;

    function connect() {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        if (symbolRef.current === symbol) {
          setState((prev) => ({ ...prev, isConnected: true }));
        }
      };

      ws.onmessage = (event) => {
        if (symbolRef.current !== symbol) return;
        try {
          const data = JSON.parse(event.data);

          // Binance depth message: { lastUpdateId, bids: [[price, qty], ...], asks: [[price, qty], ...] }
          const rawBids: [string, string][] = data.bids || [];
          const rawAsks: [string, string][] = data.asks || [];

          const bids: DepthLevel[] = rawBids
            .map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q) }))
            .filter((l) => l.quantity > 0);

          const asks: DepthLevel[] = rawAsks
            .map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q) }))
            .filter((l) => l.quantity > 0);

          const bestBid = bids[0]?.price ?? 0;
          const bestAsk = asks[0]?.price ?? 0;
          const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;
          const spreadPct = bestAsk ? (spread / bestAsk) * 100 : 0;

          setState({
            bids,
            asks,
            bestBid,
            bestAsk,
            spread,
            spreadPct,
            isConnected: true,
          });
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        if (symbolRef.current !== symbol) return;
        setState((prev) => ({ ...prev, isConnected: false }));
        reconnectTimeoutRef.current = setTimeout(() => {
          if (symbolRef.current === symbol) connect();
        }, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbol, levels]);

  return state;
}
