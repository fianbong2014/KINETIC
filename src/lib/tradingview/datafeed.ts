// Binance-backed datafeed for the TradingView Charting Library.
//
// The Charting Library itself is NOT bundled in this repo (it is gated
// behind TradingView approval — see the chart page setup notes). This
// module only implements the JS datafeed contract the library calls
// into, reusing the same Binance REST + WebSocket endpoints the rest
// of the app already uses. It has zero dependency on the library, so
// it type-checks and ships even before the library files are dropped
// in.
//
// Contract reference: TradingView "JS API" (onReady / resolveSymbol /
// getBars / subscribeBars / unsubscribeBars / searchSymbols).

import { PAIRS, getPair } from "@/lib/symbols";

const BINANCE_REST = "https://api.binance.com/api/v3";
const BINANCE_WS = "wss://stream.binance.com:9443/ws";

// TV resolution → Binance kline interval
const RESOLUTION_TO_INTERVAL: Record<string, string> = {
  "1": "1m",
  "3": "3m",
  "5": "5m",
  "15": "15m",
  "30": "30m",
  "60": "1h",
  "120": "2h",
  "240": "4h",
  "360": "6h",
  "720": "12h",
  "1D": "1d",
  "1W": "1w",
  "1M": "1M",
};

const SUPPORTED_RESOLUTIONS = [
  "1",
  "5",
  "15",
  "30",
  "60",
  "240",
  "1D",
  "1W",
] as const;

function intervalFor(resolution: string): string {
  return RESOLUTION_TO_INTERVAL[resolution] ?? "1h";
}

interface Bar {
  time: number; // ms, bar open time
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BinanceKline {
  0: number; // open time
  1: string; // open
  2: string; // high
  3: string; // low
  4: string; // close
  5: string; // volume
}

async function fetchKlineBars(
  symbol: string,
  interval: string,
  toMs: number,
  countBack: number
): Promise<Bar[]> {
  const limit = Math.min(Math.max(countBack || 300, 1), 1000);
  const url =
    `${BINANCE_REST}/klines?symbol=${symbol}&interval=${interval}` +
    `&endTime=${toMs}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as BinanceKline[];
  return data.map((k) => ({
    time: Number(k[0]),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

// One WebSocket per active subscription guid
interface Sub {
  ws: WebSocket;
  symbol: string;
  interval: string;
  lastBar: Bar | null;
}

/**
 * Creates a datafeed object to hand to the TradingView widget as its
 * `datafeed` option. Symbols come from {@link PAIRS}; resolveSymbol
 * derives price precision from each pair's `priceDecimals`.
 */
export function createBinanceDatafeed() {
  const subs = new Map<string, Sub>();

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onReady(callback: (config: any) => void) {
      setTimeout(
        () =>
          callback({
            supported_resolutions: SUPPORTED_RESOLUTIONS,
            supports_group_request: false,
            supports_marks: false,
            supports_search: true,
            supports_timescale_marks: false,
            exchanges: [
              { value: "Binance", name: "Binance", desc: "Binance" },
            ],
            symbols_types: [{ name: "crypto", value: "crypto" }],
          }),
        0
      );
    },

    searchSymbols(
      userInput: string,
      _exchange: string,
      _symbolType: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onResult: (results: any[]) => void
    ) {
      const q = userInput.trim().toUpperCase();
      const matches = PAIRS.filter(
        (p) =>
          p.symbol.includes(q) ||
          p.base.includes(q) ||
          p.display.toUpperCase().includes(q)
      ).map((p) => ({
        symbol: p.symbol,
        full_name: `Binance:${p.symbol}`,
        description: `${p.display} · Binance`,
        exchange: "Binance",
        ticker: p.symbol,
        type: "crypto",
      }));
      onResult(matches);
    },

    resolveSymbol(
      symbolName: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onResolve: (info: any) => void,
      onError: (reason: string) => void
    ) {
      // symbolName may arrive as "Binance:BTCUSDT" or "BTCUSDT"
      const raw = symbolName.includes(":")
        ? symbolName.split(":")[1]
        : symbolName;
      const pair = getPair(raw);
      if (!pair) {
        onError(`unknown symbol: ${symbolName}`);
        return;
      }
      const pricescale = Math.pow(10, pair.priceDecimals);
      setTimeout(
        () =>
          onResolve({
            name: pair.symbol,
            ticker: pair.symbol,
            description: pair.display,
            type: "crypto",
            session: "24x7",
            timezone: "Etc/UTC",
            exchange: "Binance",
            listed_exchange: "Binance",
            format: "price",
            minmov: 1,
            pricescale,
            has_intraday: true,
            has_daily: true,
            has_weekly_and_monthly: true,
            supported_resolutions: SUPPORTED_RESOLUTIONS,
            volume_precision: 2,
            data_status: "streaming",
          }),
        0
      );
    },

    async getBars(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      symbolInfo: any,
      resolution: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      periodParams: any,
      onResult: (bars: Bar[], meta: { noData: boolean }) => void,
      onError: (reason: string) => void
    ) {
      try {
        const { from, to, countBack } = periodParams;
        const interval = intervalFor(resolution);
        const bars = await fetchKlineBars(
          symbolInfo.ticker || symbolInfo.name,
          interval,
          to * 1000,
          countBack
        );
        const inRange = bars.filter(
          (b) => b.time >= from * 1000 && b.time <= to * 1000
        );
        const out = inRange.length > 0 ? inRange : bars;
        onResult(out, { noData: out.length === 0 });
      } catch (e) {
        onError(e instanceof Error ? e.message : "getBars failed");
      }
    },

    subscribeBars(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      symbolInfo: any,
      resolution: string,
      onTick: (bar: Bar) => void,
      listenerGuid: string
    ) {
      const symbol = (symbolInfo.ticker || symbolInfo.name) as string;
      const interval = intervalFor(resolution);
      const stream = `${symbol.toLowerCase()}@kline_${interval}`;
      const ws = new WebSocket(`${BINANCE_WS}/${stream}`);

      const sub: Sub = { ws, symbol, interval, lastBar: null };
      subs.set(listenerGuid, sub);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const k = msg.k;
          if (!k) return;
          const bar: Bar = {
            time: Number(k.t),
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
          };
          sub.lastBar = bar;
          onTick(bar);
        } catch {
          // ignore malformed frames
        }
      };
      ws.onerror = () => ws.close();
    },

    unsubscribeBars(listenerGuid: string) {
      const sub = subs.get(listenerGuid);
      if (sub) {
        try {
          sub.ws.close();
        } catch {
          // already closed
        }
        subs.delete(listenerGuid);
      }
    },
  };
}

export type BinanceDatafeed = ReturnType<typeof createBinanceDatafeed>;
