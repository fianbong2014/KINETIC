// Custom lightweight-charts v5 series-primitive that renders the full
// drawing suite (levels, rays, vertical lines, trend / extended /
// arrow lines, rectangles, Fibonacci, text notes, measure, long/short
// position tool) plus drag handles on a single canvas overlay.
//
// All geometry math lives here so the React interaction controller can
// reuse the exact same coordinate conversion for hit-testing. The
// `applyDrag` pure function is also exported so dragging stays in sync
// with rendering.
//
// lightweight-charts types are intentionally loose (`any`) to match
// the rest of the chart code in this project.

import {
  FIB_EXT_LEVELS,
  FIB_FAN_LEVELS,
  FIB_LEVELS,
  type ChannelTool,
  type Drawing,
  type Ellipse,
  type FibExtension,
  type FibFan,
  type FibRetracement,
  type HorizontalLevel,
  type HorizontalRay,
  type MeasureTool,
  type Pitchfork,
  type Point,
  type PositionTool,
  type RectZone,
  type TextNote,
  type TrendLine,
  type VerticalLine,
} from "@/lib/drawings";

export const HANDLE_SIZE = 9;
const HIT_TOL = 6;

export interface DrawingHandle {
  drawingId: string;
  pointIndex: number;
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

// ─── Drag application (pure, shared with the controller) ────────────

/**
 * Returns a new drawing with the given control point (or the whole
 * shape when pointIndex is "move") shifted to follow the cursor.
 * `orig` is the drawing snapshot taken at drag start.
 */
export function applyDrag(
  d: Drawing,
  pointIndex: number | "move",
  cur: Point,
  start: Point,
  orig: Drawing
): Drawing {
  const dt = cur.time - start.time;
  const dp = cur.price - start.price;

  switch (d.type) {
    case "level": {
      const o = orig as HorizontalLevel;
      return { ...d, price: pointIndex === "move" ? o.price + dp : cur.price };
    }
    case "vline": {
      const o = orig as VerticalLine;
      return { ...d, time: pointIndex === "move" ? o.time + dt : cur.time };
    }
    case "hray": {
      const o = orig as HorizontalRay;
      return pointIndex === "move"
        ? { ...d, p1: { time: o.p1.time + dt, price: o.p1.price + dp } }
        : { ...d, p1: cur };
    }
    case "text": {
      const o = orig as TextNote;
      return pointIndex === "move"
        ? { ...d, p1: { time: o.p1.time + dt, price: o.p1.price + dp } }
        : { ...d, p1: cur };
    }
    case "trendline":
    case "rect":
    case "fib":
    case "measure":
    case "ellipse":
    case "fibfan": {
      const o = orig as { p1: Point; p2: Point };
      if (pointIndex === "move") {
        return {
          ...d,
          p1: { time: o.p1.time + dt, price: o.p1.price + dp },
          p2: { time: o.p2.time + dt, price: o.p2.price + dp },
        };
      }
      return pointIndex === 0 ? { ...d, p1: cur } : { ...d, p2: cur };
    }
    case "channel":
    case "pitchfork":
    case "fibext": {
      const o = orig as { p1: Point; p2: Point; p3: Point };
      if (pointIndex === "move") {
        return {
          ...d,
          p1: { time: o.p1.time + dt, price: o.p1.price + dp },
          p2: { time: o.p2.time + dt, price: o.p2.price + dp },
          p3: { time: o.p3.time + dt, price: o.p3.price + dp },
        };
      }
      if (pointIndex === 0) return { ...d, p1: cur };
      if (pointIndex === 1) return { ...d, p2: cur };
      return { ...d, p3: cur };
    }
    case "position": {
      const o = orig as PositionTool;
      if (pointIndex === "move") {
        return {
          ...d,
          time: o.time + dt,
          entry: o.entry + dp,
          target: o.target + dp,
          stop: o.stop + dp,
        };
      }
      if (pointIndex === 0) return { ...d, entry: cur.price };
      if (pointIndex === 1) return { ...d, target: cur.price };
      if (pointIndex === 2) return { ...d, stop: cur.price };
      return { ...d, time: cur.time }; // 3 = time anchor
    }
  }
}

// ─── Primitive ──────────────────────────────────────────────────────

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

  updateAllViews() {}

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

  private screen(p: Point): ScreenPoint | null {
    const x = this.xOf(p.time);
    const y = this.yOf(p.price);
    if (x == null || y == null) return null;
    return { x, y };
  }

  pointFromScreen(x: number, y: number): Point | null {
    const time = this.chart?.timeScale()?.coordinateToTime(x);
    const price = this.series?.coordinateToPrice(y);
    if (time == null || price == null) return null;
    return { time: Number(time), price: Number(price) };
  }

  // ─── Handles & hit-testing ────────────────────────────────────────

  handles(): DrawingHandle[] {
    const { drawings, symbol, selectedId } = this.getState();
    const out: DrawingHandle[] = [];
    for (const d of drawings) {
      if (d.symbol !== symbol || d.id !== selectedId || d.locked) continue;
      const push = (i: number, x: number | null, y: number | null) => {
        if (x != null && y != null)
          out.push({ drawingId: d.id, pointIndex: i, x, y });
      };
      switch (d.type) {
        case "level":
          push(0, this.paneWidth / 2, this.yOf(d.price));
          break;
        case "hray": {
          const s = this.screen(d.p1);
          if (s) push(0, s.x, s.y);
          break;
        }
        case "vline":
          push(0, this.xOf(d.time), this.paneHeight / 2);
          break;
        case "text": {
          const s = this.screen(d.p1);
          if (s) push(0, s.x, s.y);
          break;
        }
        case "trendline":
        case "rect":
        case "fib":
        case "measure":
        case "ellipse":
        case "fibfan": {
          const s1 = this.screen(d.p1);
          const s2 = this.screen(d.p2);
          if (s1) push(0, s1.x, s1.y);
          if (s2) push(1, s2.x, s2.y);
          break;
        }
        case "channel":
        case "pitchfork":
        case "fibext": {
          const s1 = this.screen(d.p1);
          const s2 = this.screen(d.p2);
          const s3 = this.screen(d.p3);
          if (s1) push(0, s1.x, s1.y);
          if (s2) push(1, s2.x, s2.y);
          if (s3) push(2, s3.x, s3.y);
          break;
        }
        case "position": {
          const ax = this.xOf(d.time);
          if (ax == null) break;
          const midX = (ax + this.paneWidth) / 2;
          push(0, midX, this.yOf(d.entry));
          push(1, midX, this.yOf(d.target));
          push(2, midX, this.yOf(d.stop));
          push(3, ax, this.yOf(d.entry));
          break;
        }
      }
    }
    return out;
  }

  handleAt(x: number, y: number): DrawingHandle | null {
    for (const h of this.handles()) {
      if (Math.abs(h.x - x) <= HANDLE_SIZE && Math.abs(h.y - y) <= HANDLE_SIZE)
        return h;
    }
    return null;
  }

  drawingAt(x: number, y: number): string | null {
    const { drawings, symbol } = this.getState();
    for (let i = drawings.length - 1; i >= 0; i--) {
      const d = drawings[i];
      if (d.symbol !== symbol) continue;
      if (this.bodyHit(d, x, y)) return d.id;
    }
    return null;
  }

  private bodyHit(d: Drawing, x: number, y: number): boolean {
    switch (d.type) {
      case "level": {
        const ly = this.yOf(d.price);
        return ly != null && Math.abs(ly - y) <= HIT_TOL;
      }
      case "hray": {
        const s = this.screen(d.p1);
        return !!s && x >= s.x - HIT_TOL && Math.abs(s.y - y) <= HIT_TOL;
      }
      case "vline": {
        const vx = this.xOf(d.time);
        return vx != null && Math.abs(vx - x) <= HIT_TOL;
      }
      case "text": {
        const s = this.screen(d.p1);
        if (!s) return false;
        return (
          x >= s.x - HIT_TOL &&
          x <= s.x + 140 &&
          y >= s.y - 16 &&
          y <= s.y + 6
        );
      }
      case "trendline": {
        const s1 = this.screen(d.p1);
        const s2 = this.screen(d.p2);
        if (!s1 || !s2) return false;
        const [a, b] = this.trendEnds(d, s1, s2);
        return this.pointNearSegment(x, y, a, b) <= HIT_TOL;
      }
      case "rect": {
        const s1 = this.screen(d.p1);
        const s2 = this.screen(d.p2);
        if (!s1 || !s2) return false;
        const minX = Math.min(s1.x, s2.x);
        const maxX = Math.max(s1.x, s2.x);
        const minY = Math.min(s1.y, s2.y);
        const maxY = Math.max(s1.y, s2.y);
        return (
          x >= minX - HIT_TOL &&
          x <= maxX + HIT_TOL &&
          y >= minY - HIT_TOL &&
          y <= maxY + HIT_TOL
        );
      }
      case "fib":
      case "measure": {
        const s1 = this.screen(d.p1);
        const s2 = this.screen(d.p2);
        if (!s1 || !s2) return false;
        const minX = Math.min(s1.x, s2.x);
        const maxX = Math.max(s1.x, s2.x);
        if (x < minX - HIT_TOL || x > maxX + HIT_TOL) return false;
        const minY = Math.min(s1.y, s2.y);
        const maxY = Math.max(s1.y, s2.y);
        return y >= minY - HIT_TOL && y <= maxY + HIT_TOL;
      }
      case "position": {
        const ax = this.xOf(d.time);
        if (ax == null) return false;
        if (x < ax - HIT_TOL) return false;
        const ys = [d.entry, d.target, d.stop]
          .map((p) => this.yOf(p))
          .filter((v): v is number => v != null);
        if (ys.length === 0) return false;
        return y >= Math.min(...ys) - HIT_TOL && y <= Math.max(...ys) + HIT_TOL;
      }
      case "ellipse": {
        const s1 = this.screen(d.p1);
        const s2 = this.screen(d.p2);
        if (!s1 || !s2) return false;
        const cx = (s1.x + s2.x) / 2;
        const cy = (s1.y + s2.y) / 2;
        const rx = Math.abs(s2.x - s1.x) / 2 || 1;
        const ry = Math.abs(s2.y - s1.y) / 2 || 1;
        const v = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        return v <= 1.15; // inside-ish
      }
      case "fibfan": {
        const s1 = this.screen(d.p1);
        const s2 = this.screen(d.p2);
        if (!s1 || !s2) return false;
        for (const r of FIB_FAN_LEVELS) {
          const end = { x: s2.x, y: s1.y + (s2.y - s1.y) * r };
          if (this.pointNearSegment(x, y, s1, end) <= HIT_TOL) return true;
        }
        return false;
      }
      case "channel": {
        const g = this.channelGeom(d);
        if (!g) return false;
        return (
          this.pointNearSegment(x, y, g.a1, g.a2) <= HIT_TOL ||
          this.pointNearSegment(x, y, g.b1, g.b2) <= HIT_TOL
        );
      }
      case "pitchfork": {
        const g = this.forkGeom(d);
        if (!g) return false;
        return (
          this.pointNearSegment(x, y, g.med0, g.med1) <= HIT_TOL ||
          this.pointNearSegment(x, y, g.up0, g.up1) <= HIT_TOL ||
          this.pointNearSegment(x, y, g.lo0, g.lo1) <= HIT_TOL
        );
      }
      case "fibext": {
        const s3 = this.screen(d.p3);
        if (!s3) return false;
        if (x < s3.x - HIT_TOL) return false;
        for (const r of FIB_EXT_LEVELS) {
          const price = d.p3.price + (d.p2.price - d.p1.price) * r;
          const ly = this.yOf(price);
          if (ly != null && Math.abs(ly - y) <= HIT_TOL) return true;
        }
        return false;
      }
    }
  }

  // Channel geometry: main line a1→a2 (p1→p2) and the parallel edge
  // b1→b2 shifted vertically so it passes through p3.
  private channelGeom(d: ChannelTool) {
    const s1 = this.screen(d.p1);
    const s2 = this.screen(d.p2);
    const s3 = this.screen(d.p3);
    if (!s1 || !s2 || !s3) return null;
    // vertical offset so the parallel passes through p3
    const slope = s2.x === s1.x ? 0 : (s2.y - s1.y) / (s2.x - s1.x);
    const lineYAt = (xx: number) => s1.y + slope * (xx - s1.x);
    const off = s3.y - lineYAt(s3.x);
    return {
      a1: s1,
      a2: s2,
      b1: { x: s1.x, y: s1.y + off },
      b2: { x: s2.x, y: s2.y + off },
    };
  }

  // Pitchfork: median from p1 through midpoint of (p2,p3); the two
  // prongs are parallels through p2 and p3, all extended right.
  private forkGeom(d: Pitchfork) {
    const s1 = this.screen(d.p1);
    const s2 = this.screen(d.p2);
    const s3 = this.screen(d.p3);
    if (!s1 || !s2 || !s3) return null;
    const mid = { x: (s2.x + s3.x) / 2, y: (s2.y + s3.y) / 2 };
    const dx = mid.x - s1.x;
    const dy = mid.y - s1.y;
    const ext = (from: ScreenPoint) => ({
      x: this.paneWidth,
      y: from.y + (dx === 0 ? 0 : (dy / dx) * (this.paneWidth - from.x)),
    });
    return {
      med0: s1,
      med1: ext(s1),
      up0: s2,
      up1: ext(s2),
      lo0: s3,
      lo1: ext(s3),
      mid,
    };
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

  // Resolve the visible endpoints of a trend line honoring `extend`.
  private trendEnds(
    d: TrendLine,
    s1: ScreenPoint,
    s2: ScreenPoint
  ): [ScreenPoint, ScreenPoint] {
    const mode = d.extend ?? (d.ray ? "right" : "none");
    if (mode === "none") return [s1, s2];
    const proj = (fromX: number): ScreenPoint => {
      if (s2.x === s1.x) return { x: s1.x, y: fromX < s1.x ? -1e5 : 1e5 };
      const slope = (s2.y - s1.y) / (s2.x - s1.x);
      return { x: fromX, y: s1.y + slope * (fromX - s1.x) };
    };
    const right = proj(this.paneWidth);
    const left = proj(0);
    if (mode === "right") return [s1, right];
    return [left, right]; // both
  }

  // ─── Rendering ────────────────────────────────────────────────────

  private render(ctx: CanvasRenderingContext2D) {
    const { drawings, symbol, selectedId } = this.getState();
    ctx.save();
    for (const d of drawings) {
      if (d.symbol !== symbol) continue;
      const sel = d.id === selectedId;
      switch (d.type) {
        case "level":
          this.drawLevel(ctx, d, sel);
          break;
        case "hray":
          this.drawHRay(ctx, d, sel);
          break;
        case "vline":
          this.drawVLine(ctx, d, sel);
          break;
        case "trendline":
          this.drawTrend(ctx, d, sel);
          break;
        case "rect":
          this.drawRect(ctx, d, sel);
          break;
        case "fib":
          this.drawFib(ctx, d, sel);
          break;
        case "text":
          this.drawText(ctx, d, sel);
          break;
        case "measure":
          this.drawMeasure(ctx, d, sel);
          break;
        case "position":
          this.drawPosition(ctx, d, sel);
          break;
        case "ellipse":
          this.drawEllipse(ctx, d, sel);
          break;
        case "fibfan":
          this.drawFibFan(ctx, d, sel);
          break;
        case "channel":
          this.drawChannel(ctx, d, sel);
          break;
        case "pitchfork":
          this.drawPitchfork(ctx, d, sel);
          break;
        case "fibext":
          this.drawFibExt(ctx, d, sel);
          break;
      }
    }
    ctx.restore();
  }

  private applyStroke(ctx: CanvasRenderingContext2D, d: Drawing) {
    ctx.strokeStyle = d.color;
    ctx.lineWidth = d.lineWidth ?? 2;
    const style = d.lineStyle ?? "solid";
    ctx.setLineDash(
      style === "dashed" ? [6, 4] : style === "dotted" ? [2, 3] : []
    );
  }

  private drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const s = HANDLE_SIZE;
    ctx.save();
    ctx.setLineDash([]);
    ctx.fillStyle = "#0e0e0f";
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
    ctx.strokeRect(x - s / 2, y - s / 2, s, s);
    ctx.restore();
  }

  private label(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string
  ) {
    ctx.save();
    ctx.setLineDash([]);
    ctx.font = "10px Inter, sans-serif";
    const w = ctx.measureText(text).width + 8;
    ctx.fillStyle = "rgba(14,14,15,0.85)";
    ctx.fillRect(x, y - 12, w, 15);
    ctx.fillStyle = color;
    ctx.fillText(text, x + 4, y);
    ctx.restore();
  }

  private drawLevel(
    ctx: CanvasRenderingContext2D,
    d: HorizontalLevel,
    sel: boolean
  ) {
    const y = this.yOf(d.price);
    if (y == null) return;
    this.applyStroke(ctx, d);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(this.paneWidth, y);
    ctx.stroke();
    this.label(ctx, `${d.label}  ${d.price.toFixed(2)}`, 4, y - 4, d.color);
    if (sel && !d.locked) this.drawHandle(ctx, this.paneWidth / 2, y);
  }

  private drawHRay(
    ctx: CanvasRenderingContext2D,
    d: HorizontalRay,
    sel: boolean
  ) {
    const s = this.screen(d.p1);
    if (!s) return;
    this.applyStroke(ctx, d);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(this.paneWidth, s.y);
    ctx.stroke();
    this.label(ctx, d.p1.price.toFixed(2), s.x + 4, s.y - 4, d.color);
    if (sel && !d.locked) this.drawHandle(ctx, s.x, s.y);
  }

  private drawVLine(
    ctx: CanvasRenderingContext2D,
    d: VerticalLine,
    sel: boolean
  ) {
    const x = this.xOf(d.time);
    if (x == null) return;
    this.applyStroke(ctx, d);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, this.paneHeight);
    ctx.stroke();
    if (sel && !d.locked) this.drawHandle(ctx, x, this.paneHeight / 2);
  }

  private drawTrend(
    ctx: CanvasRenderingContext2D,
    d: TrendLine,
    sel: boolean
  ) {
    const s1 = this.screen(d.p1);
    const s2 = this.screen(d.p2);
    if (!s1 || !s2) return;
    const [a, b] = this.trendEnds(d, s1, s2);
    this.applyStroke(ctx, d);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    if (d.arrow) {
      const ang = Math.atan2(s2.y - s1.y, s2.x - s1.x);
      const h = 10;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(s2.x, s2.y);
      ctx.lineTo(
        s2.x - h * Math.cos(ang - Math.PI / 6),
        s2.y - h * Math.sin(ang - Math.PI / 6)
      );
      ctx.moveTo(s2.x, s2.y);
      ctx.lineTo(
        s2.x - h * Math.cos(ang + Math.PI / 6),
        s2.y - h * Math.sin(ang + Math.PI / 6)
      );
      ctx.stroke();
    }
    if (sel && !d.locked) {
      this.drawHandle(ctx, s1.x, s1.y);
      this.drawHandle(ctx, s2.x, s2.y);
    }
  }

  private drawRect(
    ctx: CanvasRenderingContext2D,
    d: RectZone,
    sel: boolean
  ) {
    const s1 = this.screen(d.p1);
    const s2 = this.screen(d.p2);
    if (!s1 || !s2) return;
    const x = Math.min(s1.x, s2.x);
    const y = Math.min(s1.y, s2.y);
    const w = Math.abs(s2.x - s1.x);
    const h = Math.abs(s2.y - s1.y);
    ctx.save();
    ctx.fillStyle = this.alpha(d.color, 0.12);
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    this.applyStroke(ctx, d);
    ctx.strokeRect(x, y, w, h);
    if (sel && !d.locked) {
      this.drawHandle(ctx, s1.x, s1.y);
      this.drawHandle(ctx, s2.x, s2.y);
    }
  }

  private drawFib(
    ctx: CanvasRenderingContext2D,
    d: FibRetracement,
    sel: boolean
  ) {
    const s1 = this.screen(d.p1);
    const s2 = this.screen(d.p2);
    if (!s1 || !s2) return;
    const minX = Math.min(s1.x, s2.x);
    const maxX = Math.max(s1.x, s2.x);
    for (const lvl of FIB_LEVELS) {
      const y = s1.y + (s2.y - s1.y) * lvl;
      const price = d.p1.price + (d.p2.price - d.p1.price) * lvl;
      ctx.save();
      ctx.setLineDash([]);
      ctx.strokeStyle = this.alpha(
        d.color,
        lvl === 0 || lvl === 1 ? 0.9 : 0.5
      );
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
      ctx.stroke();
      ctx.restore();
      this.label(
        ctx,
        `${(lvl * 100).toFixed(1)}%  ${price.toFixed(2)}`,
        maxX + 2,
        y + 3,
        d.color
      );
    }
    ctx.save();
    ctx.setLineDash([]);
    ctx.strokeStyle = this.alpha(d.color, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.stroke();
    ctx.restore();
    if (sel && !d.locked) {
      this.drawHandle(ctx, s1.x, s1.y);
      this.drawHandle(ctx, s2.x, s2.y);
    }
  }

  private drawText(
    ctx: CanvasRenderingContext2D,
    d: TextNote,
    sel: boolean
  ) {
    const s = this.screen(d.p1);
    if (!s) return;
    ctx.save();
    ctx.setLineDash([]);
    ctx.font = "12px Inter, sans-serif";
    const text = d.text || "Text";
    const w = ctx.measureText(text).width + 10;
    ctx.fillStyle = "rgba(14,14,15,0.8)";
    ctx.fillRect(s.x, s.y - 16, w, 20);
    ctx.fillStyle = d.color;
    ctx.fillText(text, s.x + 5, s.y - 2);
    ctx.restore();
    if (sel && !d.locked) this.drawHandle(ctx, s.x, s.y);
  }

  private drawMeasure(
    ctx: CanvasRenderingContext2D,
    d: MeasureTool,
    sel: boolean
  ) {
    const s1 = this.screen(d.p1);
    const s2 = this.screen(d.p2);
    if (!s1 || !s2) return;
    const x = Math.min(s1.x, s2.x);
    const y = Math.min(s1.y, s2.y);
    const w = Math.abs(s2.x - s1.x);
    const h = Math.abs(s2.y - s1.y);
    const up = d.p2.price >= d.p1.price;
    const fill = up ? "#50c878" : "#ff716c";
    ctx.save();
    ctx.fillStyle = this.alpha(fill, 0.12);
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = fill;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
    const dPrice = d.p2.price - d.p1.price;
    const pct =
      d.p1.price !== 0 ? (dPrice / d.p1.price) * 100 : 0;
    const bars = `Δ ${dPrice >= 0 ? "+" : ""}${dPrice.toFixed(2)}  ${
      pct >= 0 ? "+" : ""
    }${pct.toFixed(2)}%`;
    this.label(ctx, bars, x + w / 2 - 40, y - 4, fill);
    if (sel && !d.locked) {
      this.drawHandle(ctx, s1.x, s1.y);
      this.drawHandle(ctx, s2.x, s2.y);
    }
  }

  private drawPosition(
    ctx: CanvasRenderingContext2D,
    d: PositionTool,
    sel: boolean
  ) {
    const ax = this.xOf(d.time);
    const yE = this.yOf(d.entry);
    const yT = this.yOf(d.target);
    const yS = this.yOf(d.stop);
    if (ax == null || yE == null || yT == null || yS == null) return;
    const right = this.paneWidth;
    // profit zone (entry → target), risk zone (entry → stop)
    ctx.save();
    ctx.fillStyle = this.alpha("#50c878", 0.13);
    ctx.fillRect(ax, Math.min(yE, yT), right - ax, Math.abs(yT - yE));
    ctx.fillStyle = this.alpha("#ff716c", 0.13);
    ctx.fillRect(ax, Math.min(yE, yS), right - ax, Math.abs(yS - yE));
    ctx.setLineDash([]);
    ctx.lineWidth = 1.5;
    const line = (yy: number, c: string) => {
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.moveTo(ax, yy);
      ctx.lineTo(right, yy);
      ctx.stroke();
    };
    line(yE, "#adaaab");
    line(yT, "#50c878");
    line(yS, "#ff716c");
    ctx.restore();
    const risk = Math.abs(d.entry - d.stop);
    const reward = Math.abs(d.target - d.entry);
    const rr = risk > 0 ? (reward / risk).toFixed(2) : "—";
    this.label(
      ctx,
      `${d.side.toUpperCase()}  R:R ${rr}`,
      ax + 4,
      yE - 4,
      "#adaaab"
    );
    this.label(ctx, `TP ${d.target.toFixed(2)}`, ax + 4, yT + 12, "#50c878");
    this.label(ctx, `SL ${d.stop.toFixed(2)}`, ax + 4, yS + 12, "#ff716c");
    if (sel && !d.locked) {
      const midX = (ax + right) / 2;
      this.drawHandle(ctx, midX, yE);
      this.drawHandle(ctx, midX, yT);
      this.drawHandle(ctx, midX, yS);
      this.drawHandle(ctx, ax, yE);
    }
  }

  private drawEllipse(
    ctx: CanvasRenderingContext2D,
    d: Ellipse,
    sel: boolean
  ) {
    const s1 = this.screen(d.p1);
    const s2 = this.screen(d.p2);
    if (!s1 || !s2) return;
    const cx = (s1.x + s2.x) / 2;
    const cy = (s1.y + s2.y) / 2;
    const rx = Math.abs(s2.x - s1.x) / 2;
    const ry = Math.abs(s2.y - s1.y) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.alpha(d.color, 0.1);
    ctx.fill();
    ctx.restore();
    this.applyStroke(ctx, d);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (sel && !d.locked) {
      this.drawHandle(ctx, s1.x, s1.y);
      this.drawHandle(ctx, s2.x, s2.y);
    }
  }

  private drawFibFan(
    ctx: CanvasRenderingContext2D,
    d: FibFan,
    sel: boolean
  ) {
    const s1 = this.screen(d.p1);
    const s2 = this.screen(d.p2);
    if (!s1 || !s2) return;
    this.applyStroke(ctx, d);
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.stroke();
    for (const r of FIB_FAN_LEVELS) {
      const ey = s1.y + (s2.y - s1.y) * r;
      ctx.save();
      ctx.setLineDash([]);
      ctx.strokeStyle = this.alpha(d.color, 0.6);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, ey);
      ctx.stroke();
      ctx.restore();
      this.label(ctx, `${(r * 100).toFixed(1)}%`, s2.x + 3, ey + 3, d.color);
    }
    if (sel && !d.locked) {
      this.drawHandle(ctx, s1.x, s1.y);
      this.drawHandle(ctx, s2.x, s2.y);
    }
  }

  private drawChannel(
    ctx: CanvasRenderingContext2D,
    d: ChannelTool,
    sel: boolean
  ) {
    const g = this.channelGeom(d);
    if (!g) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(g.a1.x, g.a1.y);
    ctx.lineTo(g.a2.x, g.a2.y);
    ctx.lineTo(g.b2.x, g.b2.y);
    ctx.lineTo(g.b1.x, g.b1.y);
    ctx.closePath();
    ctx.fillStyle = this.alpha(d.color, 0.08);
    ctx.fill();
    ctx.restore();
    this.applyStroke(ctx, d);
    ctx.beginPath();
    ctx.moveTo(g.a1.x, g.a1.y);
    ctx.lineTo(g.a2.x, g.a2.y);
    ctx.moveTo(g.b1.x, g.b1.y);
    ctx.lineTo(g.b2.x, g.b2.y);
    ctx.stroke();
    if (sel && !d.locked) {
      const s3 = this.screen(d.p3);
      this.drawHandle(ctx, g.a1.x, g.a1.y);
      this.drawHandle(ctx, g.a2.x, g.a2.y);
      if (s3) this.drawHandle(ctx, s3.x, s3.y);
    }
  }

  private drawPitchfork(
    ctx: CanvasRenderingContext2D,
    d: Pitchfork,
    sel: boolean
  ) {
    const g = this.forkGeom(d);
    if (!g) return;
    this.applyStroke(ctx, d);
    const seg = (a: ScreenPoint, b: ScreenPoint) => {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };
    seg(g.med0, g.med1);
    ctx.save();
    ctx.setLineDash([]);
    ctx.strokeStyle = this.alpha(d.color, 0.7);
    ctx.lineWidth = d.lineWidth ?? 2;
    seg(g.up0, g.up1);
    seg(g.lo0, g.lo1);
    ctx.beginPath();
    ctx.moveTo(g.up0.x, g.up0.y);
    ctx.lineTo(g.lo0.x, g.lo0.y);
    ctx.stroke();
    ctx.restore();
    if (sel && !d.locked) {
      this.drawHandle(ctx, g.med0.x, g.med0.y);
      this.drawHandle(ctx, g.up0.x, g.up0.y);
      this.drawHandle(ctx, g.lo0.x, g.lo0.y);
    }
  }

  private drawFibExt(
    ctx: CanvasRenderingContext2D,
    d: FibExtension,
    sel: boolean
  ) {
    const s1 = this.screen(d.p1);
    const s2 = this.screen(d.p2);
    const s3 = this.screen(d.p3);
    if (!s1 || !s2 || !s3) return;
    // connector p1→p2→p3
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = this.alpha(d.color, 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.lineTo(s3.x, s3.y);
    ctx.stroke();
    ctx.restore();
    for (const r of FIB_EXT_LEVELS) {
      const price = d.p3.price + (d.p2.price - d.p1.price) * r;
      const ly = this.yOf(price);
      if (ly == null) continue;
      ctx.save();
      ctx.setLineDash([]);
      ctx.strokeStyle = this.alpha(d.color, r === 1 ? 0.9 : 0.55);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s3.x, ly);
      ctx.lineTo(this.paneWidth, ly);
      ctx.stroke();
      ctx.restore();
      this.label(
        ctx,
        `${(r * 100).toFixed(1)}%  ${price.toFixed(2)}`,
        s3.x + 3,
        ly - 3,
        d.color
      );
    }
    if (sel && !d.locked) {
      this.drawHandle(ctx, s1.x, s1.y);
      this.drawHandle(ctx, s2.x, s2.y);
      this.drawHandle(ctx, s3.x, s3.y);
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
