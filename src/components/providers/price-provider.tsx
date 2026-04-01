"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useBitcoinPrice, type PriceState } from "@/hooks/use-bitcoin-price";

const PriceContext = createContext<PriceState | null>(null);

export function PriceProvider({ children }: { children: ReactNode }) {
  const priceState = useBitcoinPrice();
  return (
    <PriceContext.Provider value={priceState}>{children}</PriceContext.Provider>
  );
}

export function usePrice(): PriceState {
  const ctx = useContext(PriceContext);
  if (!ctx) {
    // Return defaults if used outside provider
    return {
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
  }
  return ctx;
}
