"use client";

import { useEffect, useState } from "react";

export interface FundingRateData {
  fundingRate: number;       // Decimal, e.g. 0.0001 = 0.01%
  nextFundingTime: number;   // ms timestamp
  markPrice: number;
  loading: boolean;
  // True if the symbol has no Futures market (spot-only pairs like
  // PAXG/XAUT) — lets consumers render "—" instead of a misleading 0%.
  unavailable: boolean;
}

const BINANCE_FAPI = "https://fapi.binance.com/fapi/v1";

/**
 * Fetches Binance USD-M Futures premium index for a symbol. This exposes
 * the current funding rate (paid every 8 hours on perpetuals), next
 * funding time, and mark price. Refreshes every 30 seconds.
 *
 * Docs: https://binance-docs.github.io/apidocs/futures/en/#mark-price
 */
export function useFundingRate(symbol: string): FundingRateData {
  const [state, setState] = useState<FundingRateData>({
    fundingRate: 0,
    nextFundingTime: 0,
    markPrice: 0,
    loading: true,
    unavailable: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchOnce() {
      try {
        const res = await fetch(
          `${BINANCE_FAPI}/premiumIndex?symbol=${symbol}`
        );
        // 400 from fapi = symbol doesn't exist on Futures (spot-only pair)
        if (res.status === 400) {
          if (cancelled) return;
          setState({
            fundingRate: 0,
            nextFundingTime: 0,
            markPrice: 0,
            loading: false,
            unavailable: true,
          });
          return;
        }
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (cancelled) return;
        setState({
          fundingRate: parseFloat(data.lastFundingRate),
          nextFundingTime: parseInt(data.nextFundingTime),
          markPrice: parseFloat(data.markPrice),
          loading: false,
          unavailable: false,
        });
      } catch {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    setState((prev) => ({ ...prev, loading: true, unavailable: false }));
    fetchOnce();
    const id = setInterval(fetchOnce, 30000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol]);

  return state;
}
