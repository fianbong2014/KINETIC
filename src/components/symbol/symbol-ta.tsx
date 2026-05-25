"use client";

import { useMemo } from "react";
import { Compass } from "lucide-react";
import { useMultiTFReport } from "@/hooks/use-multi-tf-report";
import { useKlines } from "@/hooks/use-klines";
import {
  rsi,
  macd,
  stochastic,
  atr,
  type Candle,
} from "@/lib/indicators";
import { bollingerBands } from "@/lib/chart-config";
import type { SignalBias } from "@/lib/signal-engine";

const BIAS_TEXT: Record<SignalBias, string> = {
  bullish: "text-emerald-accent",
  bearish: "text-crimson",
  neutral: "text-on-surface-variant",
};
const BIAS_BG: Record<SignalBias, string> = {
  bullish: "bg-emerald-accent",
  bearish: "bg-crimson",
  neutral: "bg-on-surface-variant/40",
};
const ALIGN_LABEL: Record<string, string> = {
  aligned: "Aligned",
  leaning: "Leaning",
  mixed: "Mixed",
  neutral: "Neutral",
};

function last<T>(arr: (T | null)[]): T | null {
  for (let i = arr.length - 1; i >= 0; i--) {
    const v = arr[i];
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

function rsiZone(v: number | null): { label: string; color: string } {
  if (v === null) return { label: "—", color: "text-on-surface-variant" };
  if (v >= 70) return { label: "Overbought", color: "text-crimson" };
  if (v >= 60) return { label: "Bullish", color: "text-emerald-accent" };
  if (v <= 30) return { label: "Oversold", color: "text-emerald-accent" };
  if (v <= 40) return { label: "Bearish", color: "text-crimson" };
  return { label: "Neutral", color: "text-on-surface-variant" };
}

function MetricCell({
  label,
  value,
  detail,
  detailClass,
}: {
  label: string;
  value: string;
  detail?: string;
  detailClass?: string;
}) {
  return (
    <div className="bg-surface-container px-3 py-2.5 flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      <span className="text-sm font-mono tabular-nums text-on-surface">
        {value}
      </span>
      {detail && (
        <span
          className={`text-[10px] font-bold uppercase tracking-widest ${detailClass ?? "text-on-surface-variant"}`}
        >
          {detail}
        </span>
      )}
    </div>
  );
}

function computeReadout(candles: Candle[]) {
  if (candles.length < 50) return null;
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const rsiVals = rsi(closes, 14);
  const macdRes = macd(closes);
  const stochRes = stochastic(highs, lows, closes);
  const atrVals = atr(highs, lows, closes, 14);
  const bb = bollingerBands(closes, 20, 2);

  const close = closes[closes.length - 1];
  const upper = last(bb.upper);
  const lower = last(bb.lower);
  const bbPos =
    upper !== null && lower !== null && upper > lower
      ? ((close - lower) / (upper - lower)) * 100
      : null;
  const atrLatest = last(atrVals);
  const atrPct = atrLatest !== null && close > 0 ? (atrLatest / close) * 100 : null;

  return {
    rsi: last(rsiVals),
    macdLine: last(macdRes.macd),
    macdSignal: last(macdRes.signal),
    macdHist: last(macdRes.histogram),
    stochK: last(stochRes.k),
    stochD: last(stochRes.d),
    bbPos,
    atrPct,
  };
}

export function SymbolTA({ symbol }: { symbol: string }) {
  const { slices, summary, loading: mtfLoading } = useMultiTFReport(symbol);
  const { candles, loading: kLoading } = useKlines(symbol, "1h", 200);
  const readout = useMemo(() => computeReadout(candles), [candles]);

  return (
    <section className="bg-surface-container-low p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            Technical Read
          </h2>
        </div>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
          MTF · 1H Indicators
        </span>
      </div>

      {/* Multi-TF bias strip */}
      <div className="bg-surface-container p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Trend Alignment
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-widest ${BIAS_TEXT[summary.bias]}`}
            >
              {summary.bias}
            </span>
            <span className="text-[10px] text-on-surface-variant">
              · {ALIGN_LABEL[summary.alignment] ?? summary.alignment} · score{" "}
              {summary.confidence}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {slices.map((s) => {
            const bias = s.report?.bias ?? "neutral";
            return (
              <div
                key={s.key}
                className="bg-surface-container-low px-2 py-2 flex flex-col items-center gap-1"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {s.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${BIAS_BG[bias]}`}
                    aria-hidden
                  />
                  <span
                    className={`text-xs font-bold uppercase tracking-widest ${BIAS_TEXT[bias]}`}
                  >
                    {s.loading ? "…" : bias}
                  </span>
                </div>
                <span className="text-[10px] font-mono tabular-nums text-on-surface-variant">
                  conf{" "}
                  {s.report?.confidence !== undefined
                    ? s.report.confidence
                    : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicator readout (1H) */}
      {kLoading && !readout ? (
        <p className="text-xs text-on-surface-variant">Loading indicators…</p>
      ) : !readout ? (
        <p className="text-xs text-on-surface-variant">
          Not enough candles for indicator analysis.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <MetricCell
            label="RSI (14)"
            value={readout.rsi !== null ? readout.rsi.toFixed(1) : "—"}
            detail={rsiZone(readout.rsi).label}
            detailClass={rsiZone(readout.rsi).color}
          />
          <MetricCell
            label="MACD"
            value={
              readout.macdLine !== null
                ? readout.macdLine.toFixed(2)
                : "—"
            }
            detail={
              readout.macdHist !== null
                ? readout.macdHist >= 0
                  ? "Bullish hist"
                  : "Bearish hist"
                : undefined
            }
            detailClass={
              readout.macdHist !== null && readout.macdHist >= 0
                ? "text-emerald-accent"
                : "text-crimson"
            }
          />
          <MetricCell
            label="Stoch %K"
            value={
              readout.stochK !== null ? readout.stochK.toFixed(1) : "—"
            }
            detail={
              readout.stochK !== null
                ? readout.stochK >= 80
                  ? "Overbought"
                  : readout.stochK <= 20
                    ? "Oversold"
                    : "Neutral"
                : undefined
            }
            detailClass={
              readout.stochK !== null && readout.stochK >= 80
                ? "text-crimson"
                : readout.stochK !== null && readout.stochK <= 20
                  ? "text-emerald-accent"
                  : "text-on-surface-variant"
            }
          />
          <MetricCell
            label="BB Position"
            value={
              readout.bbPos !== null
                ? `${readout.bbPos.toFixed(0)}%`
                : "—"
            }
            detail={
              readout.bbPos !== null
                ? readout.bbPos >= 100
                  ? "Above upper"
                  : readout.bbPos <= 0
                    ? "Below lower"
                    : "Inside bands"
                : undefined
            }
          />
          <MetricCell
            label="ATR (14)"
            value={
              readout.atrPct !== null
                ? `${readout.atrPct.toFixed(2)}%`
                : "—"
            }
            detail="of price"
          />
          <MetricCell
            label="Signal Conf."
            value={
              summary.confidence !== null
                ? `${summary.confidence}`
                : "—"
            }
            detail={summary.bias}
            detailClass={BIAS_TEXT[summary.bias]}
          />
        </div>
      )}

      {mtfLoading && (
        <p className="text-[10px] text-on-surface-variant tracking-widest uppercase">
          Loading multi-TF…
        </p>
      )}
    </section>
  );
}
