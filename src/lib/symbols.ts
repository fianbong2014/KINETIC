export interface TradingPair {
  symbol: string;   // Binance symbol e.g. "BTCUSDT"
  base: string;     // e.g. "BTC"
  quote: string;    // e.g. "USDT"
  display: string;  // e.g. "BTC/USD"
  priceDecimals: number;
  sizeDecimals: number;
}

export const PAIRS: TradingPair[] = [
  { symbol: "BTCUSDT", base: "BTC", quote: "USDT", display: "BTC/USD", priceDecimals: 2, sizeDecimals: 4 },
  { symbol: "ETHUSDT", base: "ETH", quote: "USDT", display: "ETH/USD", priceDecimals: 2, sizeDecimals: 3 },
  { symbol: "SOLUSDT", base: "SOL", quote: "USDT", display: "SOL/USD", priceDecimals: 2, sizeDecimals: 2 },
  { symbol: "BNBUSDT", base: "BNB", quote: "USDT", display: "BNB/USD", priceDecimals: 2, sizeDecimals: 3 },
  { symbol: "XRPUSDT", base: "XRP", quote: "USDT", display: "XRP/USD", priceDecimals: 4, sizeDecimals: 1 },
  // Tokenized gold — 1 token = 1 troy ounce
  { symbol: "PAXGUSDT", base: "PAXG", quote: "USDT", display: "PAXG/USD", priceDecimals: 2, sizeDecimals: 4 },
  { symbol: "XAUTUSDT", base: "XAUT", quote: "USDT", display: "XAUT/USD", priceDecimals: 2, sizeDecimals: 4 },
];

export function getPair(symbol: string): TradingPair {
  return PAIRS.find((p) => p.symbol === symbol) || PAIRS[0];
}
