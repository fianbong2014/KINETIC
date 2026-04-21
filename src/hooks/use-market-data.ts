"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface TradeData {
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
}

export interface MarketData {
  price: number;
  prevPrice: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  lastUpdate: number;
  isConnected: boolean;
  trades: TradeData[];
}

const BINANCE_WS_URL = "wss://stream.binance.com:9443/ws";
const BINANCE_REST_URL = "https://api.binance.com/api/v3";

const DEFAULT_STATE: MarketData = {
  price: 0,
  prevPrice: 0,
  high24h: 0,
  low24h: 0,
  volume24h: 0,
  priceChange24h: 0,
  priceChangePercent24h: 0,
  lastUpdate: Date.now(),
  isConnected: false,
  trades: [],
};

/**
 * Subscribes to Binance trade + ticker streams for a given symbol.
 * Automatically reconnects after 3 seconds on connection loss and
 * resets state when the symbol changes.
 */
export function useMarketData(symbol: string): MarketData {
  const [state, setState] = useState<MarketData>(DEFAULT_STATE);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tradesRef = useRef<TradeData[]>([]);
  const symbolRef = useRef(symbol);

  const fetch24hTicker = useCallback(async (sym: string) => {
    try {
      const res = await fetch(`${BINANCE_REST_URL}/ticker/24hr?symbol=${sym}`);
      const data = await res.json();
      // Only update if symbol hasn't changed during fetch
      if (symbolRef.current !== sym) return;
      setState((prev) => ({
        ...prev,
        price: parseFloat(data.lastPrice),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume24h: parseFloat(data.quoteVolume),
        priceChange24h: parseFloat(data.priceChange),
        priceChangePercent24h: parseFloat(data.priceChangePercent),
      }));
    } catch {
      // ignore
    }
  }, []);

  const connect = useCallback((sym: string) => {
    const lower = sym.toLowerCase();
    const ws = new WebSocket(
      `${BINANCE_WS_URL}/${lower}@trade/${lower}@ticker`
    );

    ws.onopen = () => {
      if (symbolRef.current === sym) {
        setState((prev) => ({ ...prev, isConnected: true }));
      }
    };

    ws.onmessage = (event) => {
      if (symbolRef.current !== sym) return;
      try {
        const data = JSON.parse(event.data);

        if (data.e === "trade") {
          const trade: TradeData = {
            price: parseFloat(data.p),
            quantity: parseFloat(data.q),
            time: data.T,
            isBuyerMaker: data.m,
          };

          tradesRef.current = [trade, ...tradesRef.current.slice(0, 49)];

          setState((prev) => ({
            ...prev,
            prevPrice: prev.price,
            price: trade.price,
            lastUpdate: trade.time,
            trades: tradesRef.current,
          }));
        }

        if (data.e === "24hrTicker") {
          setState((prev) => ({
            ...prev,
            high24h: parseFloat(data.h),
            low24h: parseFloat(data.l),
            volume24h: parseFloat(data.q),
            priceChange24h: parseFloat(data.p),
            priceChangePercent24h: parseFloat(data.P),
          }));
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      if (symbolRef.current !== sym) return;
      setState((prev) => ({ ...prev, isConnected: false }));
      reconnectTimeoutRef.current = setTimeout(() => {
        if (symbolRef.current === sym) connect(sym);
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    symbolRef.current = symbol;
    tradesRef.current = [];
    setState(DEFAULT_STATE);

    fetch24hTicker(symbol);
    connect(symbol);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbol, connect, fetch24hTicker]);

  return state;
}
