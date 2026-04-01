"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface TradeData {
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
}

export interface PriceState {
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

export function useBitcoinPrice() {
  const [state, setState] = useState<PriceState>({
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
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tradesRef = useRef<TradeData[]>([]);

  // Fetch 24h ticker data on mount
  const fetch24hTicker = useCallback(async () => {
    try {
      const res = await fetch(`${BINANCE_REST_URL}/ticker/24hr?symbol=BTCUSDT`);
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        price: parseFloat(data.lastPrice),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume24h: parseFloat(data.quoteVolume),
        priceChange24h: parseFloat(data.priceChange),
        priceChangePercent24h: parseFloat(data.priceChangePercent),
      }));
    } catch (err) {
      console.error("Failed to fetch 24h ticker:", err);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(
      `${BINANCE_WS_URL}/btcusdt@trade/btcusdt@ticker`
    );

    ws.onopen = () => {
      setState((prev) => ({ ...prev, isConnected: true }));
    };

    ws.onmessage = (event) => {
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
      } catch (err) {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setState((prev) => ({ ...prev, isConnected: false }));
      // Auto reconnect after 3s
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    fetch24hTicker();
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, fetch24hTicker]);

  return state;
}
