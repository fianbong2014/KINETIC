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

  // CoinGecko coin id — used by the /symbol/[symbol] page to fetch
  // market data, supply, ATH/ATL, community + developer stats, links
  // and description. Free endpoint, no key required.
  coingeckoId: string; // e.g. "bitcoin"

  // DeFiLlama chain slug — only set for L1s whose chain TVL is meaningful.
  // Leave empty/undefined for assets that don't own a chain (e.g. XRP,
  // PAXG, XAUT) to hide the TVL widget.
  defillamaChain?: string; // e.g. "Ethereum", "Solana", "BSC"

  // Wikipedia page title — used to fetch the lead-section summary as a
  // human-readable, source-of-truth context box. Optional: omit to hide.
  wikipediaTitle?: string;

  // Plain-English keyword used to filter news RSS feeds. Coin name works
  // better than ticker on most feeds (Reuters / CoinDesk).
  newsKeyword?: string;
}

export const PAIRS: TradingPair[] = [
  {
    symbol: "BTCUSDT", base: "BTC", quote: "USDT", display: "BTC/USD",
    priceDecimals: 2, sizeDecimals: 4,
    okxSwap: "BTC-USDT-SWAP", okxSpot: "BTC-USDT",
    coingeckoId: "bitcoin",
    wikipediaTitle: "Bitcoin",
    newsKeyword: "bitcoin",
  },
  {
    symbol: "ETHUSDT", base: "ETH", quote: "USDT", display: "ETH/USD",
    priceDecimals: 2, sizeDecimals: 3,
    okxSwap: "ETH-USDT-SWAP", okxSpot: "ETH-USDT",
    coingeckoId: "ethereum",
    defillamaChain: "Ethereum",
    wikipediaTitle: "Ethereum",
    newsKeyword: "ethereum",
  },
  {
    symbol: "SOLUSDT", base: "SOL", quote: "USDT", display: "SOL/USD",
    priceDecimals: 2, sizeDecimals: 2,
    okxSwap: "SOL-USDT-SWAP", okxSpot: "SOL-USDT",
    coingeckoId: "solana",
    defillamaChain: "Solana",
    wikipediaTitle: "Solana (blockchain platform)",
    newsKeyword: "solana",
  },
  {
    symbol: "BNBUSDT", base: "BNB", quote: "USDT", display: "BNB/USD",
    priceDecimals: 2, sizeDecimals: 3,
    okxSwap: "BNB-USDT-SWAP", okxSpot: "BNB-USDT",
    coingeckoId: "binancecoin",
    defillamaChain: "BSC",
    wikipediaTitle: "BNB Chain",
    newsKeyword: "binance coin",
  },
  {
    symbol: "XRPUSDT", base: "XRP", quote: "USDT", display: "XRP/USD",
    priceDecimals: 4, sizeDecimals: 1,
    okxSwap: "XRP-USDT-SWAP", okxSpot: "XRP-USDT",
    coingeckoId: "ripple",
    wikipediaTitle: "Ripple (payment protocol)",
    newsKeyword: "xrp",
  },
  // Tokenized gold — 1 token = 1 troy ounce. OKX has PAXG-USDT spot
  // but no SWAP; XAUT not listed on OKX at all → empty okxSwap means
  // "no live trading on this pair" and the UI should hide the Live
  // toggle for it.
  {
    symbol: "PAXGUSDT", base: "PAXG", quote: "USDT", display: "PAXG/USD",
    priceDecimals: 2, sizeDecimals: 4,
    okxSwap: "", okxSpot: "PAXG-USDT",
    coingeckoId: "pax-gold",
    wikipediaTitle: "PAX Gold",
    newsKeyword: "paxg",
  },
  {
    symbol: "XAUTUSDT", base: "XAUT", quote: "USDT", display: "XAUT/USD",
    priceDecimals: 2, sizeDecimals: 4,
    okxSwap: "", okxSpot: "",
    coingeckoId: "tether-gold",
    wikipediaTitle: "Tether (cryptocurrency)",
    newsKeyword: "tether gold",
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
