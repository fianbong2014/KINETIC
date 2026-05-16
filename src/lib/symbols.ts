export interface TradingPair {
  symbol: string;   // Binance symbol e.g. "BTCUSDT" — used for market data WS
  base: string;     // e.g. "BTC"
  quote: string;    // e.g. "USDT"
  display: string;  // e.g. "BTC/USD"
  priceDecimals: number;
  sizeDecimals: number;

  // OKX instrument ids — perpetual swap is the live-trading default
  // because the bot engine's SL/TP/trailing semantics map cleanly to
  // OKX algo orders for SWAP. Spot instId is kept for reference but
  // is unused until/if we add spot live trading later.
  okxSwap: string;  // e.g. "BTC-USDT-SWAP"
  okxSpot: string;  // e.g. "BTC-USDT"
}

export const PAIRS: TradingPair[] = [
  {
    symbol: "BTCUSDT", base: "BTC", quote: "USDT", display: "BTC/USD",
    priceDecimals: 2, sizeDecimals: 4,
    okxSwap: "BTC-USDT-SWAP", okxSpot: "BTC-USDT",
  },
  {
    symbol: "ETHUSDT", base: "ETH", quote: "USDT", display: "ETH/USD",
    priceDecimals: 2, sizeDecimals: 3,
    okxSwap: "ETH-USDT-SWAP", okxSpot: "ETH-USDT",
  },
  {
    symbol: "SOLUSDT", base: "SOL", quote: "USDT", display: "SOL/USD",
    priceDecimals: 2, sizeDecimals: 2,
    okxSwap: "SOL-USDT-SWAP", okxSpot: "SOL-USDT",
  },
  {
    symbol: "BNBUSDT", base: "BNB", quote: "USDT", display: "BNB/USD",
    priceDecimals: 2, sizeDecimals: 3,
    okxSwap: "BNB-USDT-SWAP", okxSpot: "BNB-USDT",
  },
  {
    symbol: "XRPUSDT", base: "XRP", quote: "USDT", display: "XRP/USD",
    priceDecimals: 4, sizeDecimals: 1,
    okxSwap: "XRP-USDT-SWAP", okxSpot: "XRP-USDT",
  },
  // Tokenized gold — 1 token = 1 troy ounce. OKX has PAXG-USDT spot
  // but no SWAP; XAUT not listed on OKX at all → empty okxSwap means
  // "no live trading on this pair" and the UI should hide the Live
  // toggle for it.
  {
    symbol: "PAXGUSDT", base: "PAXG", quote: "USDT", display: "PAXG/USD",
    priceDecimals: 2, sizeDecimals: 4,
    okxSwap: "", okxSpot: "PAXG-USDT",
  },
  {
    symbol: "XAUTUSDT", base: "XAUT", quote: "USDT", display: "XAUT/USD",
    priceDecimals: 2, sizeDecimals: 4,
    okxSwap: "", okxSpot: "",
  },
];

export function getPair(symbol: string): TradingPair {
  return PAIRS.find((p) => p.symbol === symbol) || PAIRS[0];
}

/**
 * True if the pair can be traded live on OKX as a perpetual.
 * Used by the UI to gate the "Live" toggle on bots / trade form.
 */
export function isLiveTradable(symbol: string): boolean {
  const pair = getPair(symbol);
  return pair.okxSwap.length > 0;
}
