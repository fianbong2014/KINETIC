"use client";

import { useEffect, useRef, useState } from "react";
import { WidgetCard } from "./btc-funding";
import { formatPrice } from "@/lib/format";
import { Flame } from "lucide-react";

interface Liquidation {
  id: string;
  // Side of the LIQUIDATED position (opposite of the order side that
  // Binance reports). A SELL forceOrder closed a LONG; a BUY closed
  // a SHORT.
  side: "LONG" | "SHORT";
  size: number;     // USD value
  price: number;
  ts: number;
}

// Binance forceOrder payload:
//   { e: "forceOrder", E, o: { s, S, o, f, q, p, ap, X, l, z, T } }
//   S: "BUY"  → SHORT liquidated (forced to buy back)
//   S: "SELL" → LONG  liquidated (forced to sell)
//
// Docs: https://binance-docs.github.io/apidocs/futures/en/#liquidation-order-streams
const BINANCE_WS = "wss://fstream.binance.com/ws/btcusdt@forceOrder";

export function BtcLiquidations() {
  const [items, setItems] = useState<Liquidation[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (cancelled) return;
      const ws = new WebSocket(BINANCE_WS);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
      };

      ws.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(ev.data);
          if (data.e !== "forceOrder" || !data.o) return;
          const o = data.o as {
            s: string;
            S: "BUY" | "SELL";
            q: string;
            ap: string;
            p: string;
            T: number;
          };
          const qty = parseFloat(o.q);
          const price = parseFloat(o.ap || o.p);
          if (!Number.isFinite(qty) || !Number.isFinite(price)) return;

          const liq: Liquidation = {
            id: `${o.T}-${Math.random().toString(36).slice(2, 7)}`,
            side: o.S === "SELL" ? "LONG" : "SHORT",
            size: qty * price,
            price,
            ts: o.T,
          };
          setItems((prev) => [liq, ...prev].slice(0, 25));
        } catch {
          // ignore parse failures
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        // Reconnect after 3 seconds, mirroring the BTC price WS pattern.
        retryTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        // onclose will fire next and trigger reconnect; no extra work here.
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      wsRef.current?.close();
    };
  }, []);

  const longLiqTotal = items
    .filter((i) => i.side === "LONG")
    .reduce((s, i) => s + i.size, 0);
  const shortLiqTotal = items
    .filter((i) => i.side === "SHORT")
    .reduce((s, i) => s + i.size, 0);

  return (
    <WidgetCard
      title="Recent Liquidations"
      subtitle={
        connected ? "Binance Futures · Live" : "Connecting…"
      }
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[10px]">
          <Flame
            size={12}
            className={connected ? "text-crimson" : "text-on-surface-variant"}
          />
          <span className="text-on-surface-variant uppercase tracking-wider font-bold">
            {items.length === 0
              ? connected
                ? "Waiting for next liquidation…"
                : "Connecting…"
              : `Last ${items.length} events`}
          </span>
        </div>
        <div className="text-[10px] font-bold font-mono tabular-nums">
          <span className="text-crimson" title="Longs liquidated">
            L ${fmtUsdK(longLiqTotal)}
          </span>
          <span className="text-on-surface-variant mx-1">/</span>
          <span className="text-emerald-accent" title="Shorts liquidated">
            S ${fmtUsdK(shortLiqTotal)}
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-[10px] text-on-surface-variant">
          {connected
            ? "Liquidations are sporadic — the next one will appear here automatically."
            : "Establishing connection to Binance Futures…"}
        </div>
      ) : (
        <div className="space-y-0.5 max-h-[260px] overflow-y-auto">
          {items.map((item) => {
            const isLong = item.side === "LONG";
            const sideColor = isLong ? "text-crimson" : "text-emerald-accent";
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 text-[10px] font-mono py-1 px-2 hover:bg-surface-container"
              >
                <span className={`font-bold w-12 shrink-0 ${sideColor}`}>
                  {item.side}
                </span>
                <span className={`tabular-nums shrink-0 font-bold ${sideColor}`}>
                  $
                  {item.size.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="text-on-surface tabular-nums shrink-0">
                  ${formatPrice(item.price)}
                </span>
                <span className="text-on-surface-variant text-right flex-1 truncate">
                  Binance
                </span>
                <span className="text-on-surface-variant text-[9px]">
                  {timeAgo(item.ts)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
}

function fmtUsdK(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toFixed(0);
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}
