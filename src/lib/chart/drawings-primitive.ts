// Custom lightweight-charts v5 series-primitive that renders all
// editable drawings (horizontal level, trend line / ray, rectangle
// zone, Fibonacci retracement) plus their drag handles on a single
// canvas overlay.
//
// This file is framework-agnostic — the React side (full-chart.tsx)
// owns the drawing data + interaction and just feeds this primitive a
// snapshot via the getState callback. Keeping all geometry math here
// lets the interaction controller reuse the exact same coordinate
// conversion for hit-testing, so handles line up with what's drawn.
//
// lightweight-charts types are intentionally loose (`any`) to match
// the rest of the chart code in this project.

import {
  FIB_LEVELS,
  type Drawing,
  type FibRetracement,
  type HorizontalLevel,
  type Point,
  type RectZone,
  type TrendLine,
} from "@/lib/drawings";

export const HANDLE_SIZE = 9; // px, square handle hit box
const HIT_TOL = 6; // px tolerance for line/body hit-tests

export interface DrawingHandle {
  drawingId: string;
  // which control point: 0 = p1, 1 = p2 (levels only have point 0)
  pointIndex: 0 | 1;
  x: number;
  y: number;
}

export interface PrimitiveState {
  drawings: Drawing[];
  symbol: string;
  selectedId: string | null;
}

interface ScreenPoint {
  x: number;
  y: number;
}

export class DrawingsPrimitive {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private chart: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private series: any = null;
  private requestUpdate: (() => void) | null = null;
  private getState: () => PrimitiveState;
  private paneWidth = 0;
  private paneHeight = 0;

  constructor(getState: () => PrimitiveState) {
    this.getState = getState;
  }

  // ─── lightweight-charts ISeriesPrimitive lifecycle ────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attached(param: any) {
    this.chart = param.chart;
    this.series = param.series;
    this.requestUpdate = param.requestUpdate;
  }

  detached() {
    this.chart = null;
    this.series = null;
    this.requestUpdate = null;
  }

  updateAllViews() {
    // geometry is recomputed every draw() from live scales
  }

  paneViews() {
    return [
      {
        zOrder: () => "top" as const,
        renderer: () => ({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          draw: (target: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            target.useMediaCoordinateSpace((scope: any) => {
              this.paneWidth = scope.mediaSize.width;
              this.paneHeight = scope.mediaSize.height;
              this.render(scope.context);
            });
          },
        }),
      },
    ];
  }

  /** Ask the chart to repaint (used after a drag mutates a drawing). */
  redraw() {
    this.requestUpdate?.();
  }

  // ─── Coordinate conversion ────────────────────────────────────────

  private xOf(time: number): number | null {
    const c = this.chart?.timeScale()?.timeToCoordinate(time);
    return c == null ? null : (c as number);
  }

  private yOf(price: number): number | null {
    const c = this.series?.priceToCoordinate(price);
    return c == null ? null : (c as number);
  }

  /** Screen point for a drawing point, or null if off-scale in time. */
  private screen(p: Point): ScreenPoint | null {
    const x = this.xOf(p.time);
    const y = this.yOf(p.price);
    if (x == null || y == null) return null;
    return { x, y };
  }

  /** Inverse: screen pixel → {time, price}. Used by the controller. */
  pointFromScreen(x: number, y: number): Point | null {
    const time = this.chart?.timeScale()?.coordinateToTime(x);
    const price = this.series?.coordinateToPrice(y);
    if (time == null || price == null) return null;
    return { time: Number(time), price: Number(price) };
  }

  // ─── Hit-testing (consumed by the interaction controller) ─────────

  /** Returns the visible drag handles for the active symbol. */
  handles(): DrawingHandle[] {
    const { drawings, symbol, selectedId } = this.getState();
    const out: DrawingHandle[] = [];
    for (const d of drawings) {
      if (d.symbol !== symbol || d.id !== selectedId) continue;
      if (d.type === "level") {
        const y = this.yOf(d.price);
        if (y != null) {
          out.push({
            drawingId: d.id,
            pointIndex: 0,
            x: this.paneWidth / 2,
            y,
          });
        }
        continue;
      }
      const s1 = this.screen(d.p1);
      const s2 = this.screen(d.p2);
      if (s1)
        out.push({ drawingId: d.id, pointIndex: 0, x: s1.x, y: s1.y });
      if (s2)
        out.push({ drawingId: d.id, pointIndex: 1, x: s2.x, y: s2.y });
    }
    return out;
  }

  handleAt(x: number, y: number): DrawingHandle | null {
    const h = HANDLE_SIZE;
    for (const handle of this.handles()) {
      if (
        Math.abs(handle.x - x) <= h &&
        Math.abs(handle.y - y) <= h
      ) {
        return handle;
      }
    }
    return null;
  }

  /** Topmost drawing whose body is under the cursor (for select/move). */
  drawingAt(x: number, y: number): string | null {
    const { drawings, symbol } = this.getState();
    // iterate back-to-front so newest (drawn last) wins
    for (let i = drawings.length - 1; i >= 0; i--) {
      const d = drawings[i];
      if (d.symbol !== symbol) continue;
      if (this.bodyHit(d, x, y)) return d.id;
    }
    return null;
  }

  private bodyHit(d: Drawing, x: number, y: number): boolean {
    if (d.type === "level") {
      const ly = this.yOf(d.price);
      return ly != null && Math.abs(ly - y) <= HIT_TOL;
    }
    const s1 = this.screen(d.p1);
    const s2 = this.screen(d.p2);
    if (!s1 || !s2) return false;

    if (d.type === "rect") {
      const minX = Math.min(s1.x, s2.x);
      const maxX = Math.max(s1.x, s2.x);
      const minY = Math.min(s1.y, s2.y);
      const maxY = Math.max(s1.y, s2.y);
      const onEdge =
        (Math.abs(x - minX) <= HIT_TOL || Math.abs(x - maxX) <= HIT_TOL) &&
        y >= minY - HIT_TOL &&
        y <= maxY + HIT_TOL;
      const onTopBot =
        (Math.abs(y - minY) <= HIT_TOL || Math.abs(y - maxY) <= HIT_TOL) &&
        x >= minX - HIT_TOL &&
        x <= maxX + HIT_TOL;
      const inside =
        x >= minX && x <= maxX && y >= minY && y <= maxY;
      return onEdge || onTopBot || inside;
    }

    if (d.type === "fib") {
      const minX = Math.min(s1.x, s2.x);
      const maxX = Math.max(s1.x, s2.x);
      if (x < minX - HIT_TOL || x > maxX + HIT_TOL) return false;
      for (const lvl of FIB_LEVELS) {
        const py = s1.y + (s2.y - s1.y) * lvl;
        if (Math.abs(py - y) <= HIT_TOL) return true;
      }
      return false;
    }

    // trendline / ray
    const end = d.type === "trendline" && d.ray ? this.rayEnd(s1, s2) : s2;
    return this.pointNearSegment(x, y, s1, end) <= HIT_TOL;
  }

  private pointNearSegment(
    px: number,
    py: number,
    a: ScreenPoint,
    b: ScreenPoint
  ): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - a.x, py - a.y);
    let t = ((px - a.x) * dx + (py - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
  }

  private rayEnd(a: ScreenPoint, b: ScreenPoint): ScreenPoint {
    if (b.x === a.x) {
      return { x: b.x, y: b.y < a.y ? -9999 : 9999 };
    }
    const slope = (b.y - a.y) / (b.x - a.x);
    const endX = b.x >= a.x ? this.paneWidth : 0;
    return { x: endX, y: a.y + slope * (endX - a.x) };
  }

  // ─── Rendering ────────────────────────────────────────────────────

  private render(ctx: CanvasRenderingContext2D) {
    const { drawings, symbol, selectedId } = this.getState();
    ctx.save();
    for (const d of drawings) {
      if (d.symbol !== symbol) continue;
      const selected = d.id === selectedId;
      switch (d.type) {
        case "level":
          this.drawLevel(ctx, d, selected);
          break;
        case "trendline":
          this.drawTrend(ctx, d, selected);
          break;
        case "rect":
          this.drawRect(ctx, d, selected);
          break;
        case "fib":
          this.drawFib(ctx, d, selected);
          break;
      }
    }
    ctx.restore();
  }

  private drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const s = HANDLE_SIZE;
    ctx.fillStyle = "#0e0e0f";
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
    ctx.strokeRect(x - s / 2, y - s / 2, s, s);
  }

  private drawLevel(
    ctx: CanvasRenderingContext2D,
    d: HorizontalLevel,
    selected: boolean
  ) {
    const y = this.yOf(d.price);
    if (y == null) return;
    ctx.strokeStyle = d.color;
    ctx.lineWidth = selected ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(this.paneWidth, y);
    ctx.stroke();
    ctx.fillStyle = d.color;
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText(`${d.label}  ${d.price.toFixed(2)}`, 6, y - 4);
    if (selected) this.drawHandle(ctx, this.paneWidth / 2, y);
  }

  private drawTrend(
    ctx: CanvasRenderingContext2D,
    d: TrendLine,
    selected: boolean
  ) {
    const s1 = this.screen(d.p1);
    const s2 = this.screen(d.p2);
    if (!s1 || !s2) return;
    const end = d.ray ? this.rayEnd(s1, s2) : s2;
    ctx.strokeStyle = d.color;
    ctx.lineWidth = selected ? 2.5 : 2;
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    if (selected) {
      this.drawHandle(ctx, s1.x, s1.y);
      this.drawHandle(ctx, s2.x, s2.y);
    }
  }

  private drawRect(
    ctx: CanvasRenderingContext2D,
    d: RectZone,
    selected: boolean
  ) {
    const s1 = this.screen(d.p1);
    const s2 = this.screen(d.p2);
    if (!s1 || !s2) return;
    const x = Math.min(s1.x, s2.x);
    const y = Math.min(s1.y, s2.y);
    const w = Math.abs(s2.x - s1.x);
    const h = Math.abs(s2.y - s1.y);
    ctx.fillStyle = this.alpha(d.color, 0.12);
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = d.color;
    ctx.lineWidth = selected ? 2 : 1.5;
    ctx.strokeRect(x, y, w, h);
    if (selected) {
      this.drawHandle(ctx, s1.x, s1.y);
      this.drawHandle(ctx, s2.x, s2.y);
    }
  }

  private drawFib(
    ctx: CanvasRenderingContext2D,
    d: FibRetracement,
    selected: boolean
  ) {
    const s1 = this.screen(d.p1);
    const s2 = this.screen(d.p2);
    if (!s1 || !s2) return;
    const minX = Math.min(s1.x, s2.x);
    const maxX = Math.max(s1.x, s2.x);
    ctx.font = "10px Inter, sans-serif";
    for (const lvl of FIB_LEVELS) {
      const y = s1.y + (s2.y - s1.y) * lvl;
      const price = d.p1.price + (d.p2.price - d.p1.price) * lvl;
      ctx.strokeStyle = this.alpha(d.color, lvl === 0 || lvl === 1 ? 0.9 : 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
      ctx.stroke();
      ctx.fillStyle = d.color;
      ctx.fillText(
        `${(lvl * 100).toFixed(1)}%  ${price.toFixed(2)}`,
        maxX + 4,
        y + 3
      );
    }
    // connecting trend leg
    ctx.strokeStyle = this.alpha(d.color, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.stroke();
    if (selected) {
      this.drawHandle(ctx, s1.x, s1.y);
      this.drawHandle(ctx, s2.x, s2.y);
    }
  }

  private alpha(hex: string, a: number): string {
    const m = hex.replace("#", "");
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
}
