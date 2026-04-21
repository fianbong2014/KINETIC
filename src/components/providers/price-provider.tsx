"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useMarketData, type MarketData } from "@/hooks/use-market-data";
import { getPair, type TradingPair } from "@/lib/symbols";

export interface PriceState extends MarketData {
  symbol: string;
  pair: TradingPair;
  setSymbol: (symbol: string) => void;
}

const DEFAULT_PRICE_STATE: PriceState = {
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
  symbol: "BTCUSDT",
  pair: getPair("BTCUSDT"),
  setSymbol: () => {},
};

const PriceContext = createContext<PriceState | null>(null);

export function PriceProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbolState] = useState<string>("BTCUSDT");
  const marketData = useMarketData(symbol);
  const pair = getPair(symbol);

  const setSymbol = useCallback((sym: string) => {
    setSymbolState(sym);
  }, []);

  const value: PriceState = {
    ...marketData,
    symbol,
    pair,
    setSymbol,
  };

  return <PriceContext.Provider value={value}>{children}</PriceContext.Provider>;
}

export function usePrice(): PriceState {
  const ctx = useContext(PriceContext);
  return ctx ?? DEFAULT_PRICE_STATE;
}

export type { TradeData, MarketData } from "@/hooks/use-market-data";
