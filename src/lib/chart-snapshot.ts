/**
 * Chart snapshot service — module-level singleton registry.
 *
 * The dashboard's `PriceChart` registers a function that captures the
 * current chart canvas + draws entry/exit/SL/TP markers + compresses
 * to a JPEG data URL. Close-flow handlers (open-positions, partial
 * close, position-monitor) call `captureChartSnapshot()` after a
 * successful close to attach the snapshot to the new JournalEntry.
 *
 * Why a module-level singleton rather than React context:
 *   - The chart instance and its `takeScreenshot()` live deep in
 *     `PriceChart`, but capture callers are spread across hooks and
 *     components that aren't necessarily descendants of the chart.
 *   - There is only ever one active price chart in the app shell, so
 *     a single registration slot is sufficient.
 *   - Hooks (like `usePositions`) can call `captureChartSnapshot()`
 *     without prop-drilling a function through every parent.
 *
 * If no chart is registered (e.g. user closes from /journal or via
 * an auto SL/TP trigger when the dashboard isn't mounted), capture
 * returns null and the close still succeeds without a snapshot.
 */

export interface SnapshotMarkers {
  /** Raw exchange symbol of the *position* (e.g. "BTCUSDT") — the
   *  snapshotter checks this against the chart's current symbol and
   *  returns null if they differ. Prevents capturing an unrelated
   *  chart when the user closes a position on a pair they aren't
   *  currently viewing. */
  asset: string;
  /** Trade open price — drawn as a horizontal dashed line + "ENTRY" tag. */
  entry: number;
  /** Trade close price. */
  exit: number;
  side: "LONG" | "SHORT";
  /** Optional SL / TP lines drawn alongside entry/exit. */
  stopLoss?: number | null;
  takeProfit?: number | null;
  /** PnL rendered top-right; positive = emerald, negative = crimson. */
  pnl: number;
  pnlPct: number;
}

export interface SnapshotResult {
  /** JPEG data URL (`data:image/jpeg;base64,...`) — ready to PATCH. */
  dataUrl: string;
  /** Pixel dimensions of the saved image (after downscale). */
  width: number;
  height: number;
  /** Approximate bytes (data URL length × 0.75). */
  approxBytes: number;
}

/**
 * A snapshotter is provided by `PriceChart` once the chart instance
 * is ready. It receives the markers payload and returns a finished
 * data URL (or null if rendering failed for any reason — bad canvas,
 * 0×0 size, etc.).
 */
export type Snapshotter = (
  markers: SnapshotMarkers
) => Promise<SnapshotResult | null>;

let activeSnapshotter: Snapshotter | null = null;

/**
 * Called by `PriceChart` on mount; returns an unregister function for
 * use in the effect cleanup.
 */
export function registerSnapshotter(fn: Snapshotter): () => void {
  activeSnapshotter = fn;
  return () => {
    if (activeSnapshotter === fn) activeSnapshotter = null;
  };
}

/**
 * Capture the current chart with markers. Returns null if no chart is
 * registered or rendering failed — callers should treat the snapshot
 * as best-effort and never block the close on it.
 */
export async function captureChartSnapshot(
  markers: SnapshotMarkers
): Promise<SnapshotResult | null> {
  if (!activeSnapshotter) return null;
  try {
    return await activeSnapshotter(markers);
  } catch {
    return null;
  }
}

// ─── Canvas helpers used by the snapshotter implementation ─────────

/** Maximum width of the saved snapshot, in CSS pixels. Larger images are
 *  downscaled before JPEG encoding to keep DB row size sane. */
export const MAX_SNAPSHOT_WIDTH = 1280;
/** JPEG quality (0–1) — 0.85 gives a good balance for chart screenshots. */
export const SNAPSHOT_JPEG_QUALITY = 0.85;

/**
 * Resize `source` (a chart screenshot canvas) onto a new canvas at most
 * `MAX_SNAPSHOT_WIDTH` wide, preserving aspect ratio. Returns the new
 * canvas + final size. If the source is already small enough, no
 * downscale happens (still copied so we don't mutate the chart's canvas).
 */
export function resizeCanvas(source: HTMLCanvasElement): {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
} {
  const srcW = source.width;
  const srcH = source.height;
  const scale = srcW > MAX_SNAPSHOT_WIDTH ? MAX_SNAPSHOT_WIDTH / srcW : 1;
  const dstW = Math.round(srcW * scale);
  const dstH = Math.round(srcH * scale);

  const out = document.createElement("canvas");
  out.width = dstW;
  out.height = dstH;
  const ctx = out.getContext("2d");
  if (!ctx) {
    // Fall back to source — JPEG encoding will still work even if
    // we couldn't get a 2d context for some reason.
    return { canvas: source, width: srcW, height: srcH };
  }
  // Fill black first so transparent areas (none in lightweight-charts
  // but defensive) come out matching the app's dark theme rather than
  // turning white in JPEG.
  ctx.fillStyle = "#0e0e0f";
  ctx.fillRect(0, 0, dstW, dstH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, dstW, dstH);
  return { canvas: out, width: dstW, height: dstH };
}

/**
 * Overlay the trade summary (symbol/timeframe label top-left, PnL
 * top-right) directly on the snapshot canvas. The 2D drawing here is
 * separate from lightweight-charts so we don't need the chart's
 * coordinate API — we just write into corners.
 */
/**
 * Internal: the symbolLabel rendered on the saved image. Composed by the
 * snapshotter (chart knows pair.display + current timeframe) and passed
 * to `drawSummaryOverlay` separately so callers don't have to know it.
 */
export interface OverlayContext {
  symbolLabel: string;
}

export function drawSummaryOverlay(
  canvas: HTMLCanvasElement,
  markers: SnapshotMarkers,
  ctxInfo: OverlayContext
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const pad = Math.round(canvas.width * 0.012);
  const fontSize = Math.max(12, Math.round(canvas.width * 0.014));

  ctx.save();
  ctx.textBaseline = "top";
  ctx.font = `bold ${fontSize}px "Space Grotesk", system-ui, sans-serif`;

  // Top-left: symbol + side
  const sideLabel = markers.side;
  const sideColor = markers.side === "LONG" ? "#00ffff" : "#ff734c";
  const leftText = `${ctxInfo.symbolLabel}   ${sideLabel}`;

  // Background plate so text remains legible over any chart background.
  const leftMetrics = ctx.measureText(leftText);
  ctx.fillStyle = "rgba(14, 14, 15, 0.78)";
  ctx.fillRect(
    pad,
    pad,
    leftMetrics.width + pad * 1.5,
    fontSize + pad * 0.6
  );
  ctx.fillStyle = "#ffffff";
  ctx.fillText(ctxInfo.symbolLabel, pad * 1.25, pad * 1.3);
  // Side label inline, coloured
  const symW = ctx.measureText(`${ctxInfo.symbolLabel}   `).width;
  ctx.fillStyle = sideColor;
  ctx.fillText(sideLabel, pad * 1.25 + symW, pad * 1.3);

  // Top-right: PnL summary, colour by sign.
  const pnlText = `${markers.pnl >= 0 ? "+" : ""}${markers.pnl.toFixed(2)} USD  (${
    markers.pnlPct >= 0 ? "+" : ""
  }${markers.pnlPct.toFixed(2)}%)`;
  ctx.textAlign = "right";
  const pnlMetrics = ctx.measureText(pnlText);
  ctx.fillStyle = "rgba(14, 14, 15, 0.78)";
  ctx.fillRect(
    canvas.width - pad - pnlMetrics.width - pad * 0.5,
    pad,
    pnlMetrics.width + pad * 1.5,
    fontSize + pad * 0.6
  );
  ctx.fillStyle = markers.pnl >= 0 ? "#50c878" : "#ff716c";
  ctx.fillText(pnlText, canvas.width - pad * 1.25, pad * 1.3);

  // Bottom-left: small "KINETIC" watermark so users can identify the
  // origin if they share the screenshot.
  ctx.textAlign = "left";
  ctx.font = `${Math.max(10, Math.round(fontSize * 0.7))}px "Roboto Mono", monospace`;
  ctx.fillStyle = "rgba(173, 170, 171, 0.55)";
  ctx.fillText(
    `KINETIC • ${new Date().toISOString().slice(0, 19).replace("T", " ")}`,
    pad * 1.25,
    canvas.height - pad - fontSize * 0.7 - pad * 0.4
  );

  ctx.restore();
}

/**
 * Compute an approximate byte size from a base64 data URL.
 * Data URL = `data:image/jpeg;base64,<payload>`; base64 expansion is
 * 4/3, so bytes ≈ payload.length × 3/4. Used purely for UI/metadata
 * (e.g. showing the user the saved size).
 */
export function dataUrlApproxBytes(dataUrl: string): number {
  const i = dataUrl.indexOf(",");
  const payload = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  return Math.round((payload.length * 3) / 4);
}
