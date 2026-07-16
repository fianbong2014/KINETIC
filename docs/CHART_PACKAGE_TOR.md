# TOR — Reusable Charting Component (`@kinetic/chart`)

> เอกสารข้อกำหนดขอบเขตงาน (Terms of Reference) สำหรับสร้าง **Full Chart** ขึ้นใหม่ใน
> repo แยก ให้เป็น component ที่ decouple จากแอป KINETIC และนำไปใช้ซ้ำในโปรเจกต์อื่นได้
> อ้างอิงพฤติกรรมจากของเดิมที่ `kinetic/src/components/chart/*` และ `kinetic/src/lib/*`

---

## 1. วัตถุประสงค์ (Objective)

แยก Full Chart ที่ปัจจุบันฝังอยู่ในแอป KINETIC ออกมาเป็น **แพ็กเกจ React component อิสระ**
ที่:

1. ไม่ผูกกับ provider / hook / API / DB ของแอปต้นทาง
2. รับข้อมูลและ config ผ่าน **props + adapter** ทั้งหมด
3. ติดตั้งและเรียกใช้ในโปรเจกต์ React/Next.js อื่นได้ด้วย import เดียว
4. คงฟีเจอร์เทียบเท่าของเดิม (drawing tools, indicators, oscillators, templates, live tick)

---

## 2. ขอบเขตงาน (Scope)

### In scope
- Chart component หลัก (lightweight-charts engine)
- Drawing engine + เครื่องมือวาดครบชุด
- Indicator overlays + oscillator panes
- Toolbar / floating drawing toolbar
- Storage / datafeed / theme adapters (interface ให้ inject)
- TradingView engine adapter (optional, behind flag)
- TypeScript types + เอกสารการใช้งาน + ตัวอย่าง (example app)

### Out of scope
- Backend / DB / auth (alerts ที่เคยดึงจาก DB → ย้ายเป็น adapter ที่ consumer ป้อน)
- ระบบ paper trading / bot engine ของ KINETIC
- การ publish charting_library ของ TradingView (consumer จัดหาเองตามลิขสิทธิ์)

---

## 3. Tech Stack (เป้าหมาย)

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | React 19+ (รองรับ Next.js App Router, `"use client"`) |
| Chart engine | `lightweight-charts` ^5.1 |
| Icons | `lucide-react` (peer dep) |
| ภาษา | TypeScript (strict) |
| Build | tsup / vite-lib (ESM + CJS + d.ts) |
| Styling | ดูข้อ 6 |
| Peer deps | `react`, `react-dom`, `lightweight-charts`, `lucide-react` |

> หลีกเลี่ยงการ bundle React/lightweight-charts ลงในแพ็กเกจ — ตั้งเป็น peerDependencies

---

## 4. สถาปัตยกรรม & การ Decouple

ของเดิมผูกกับแอป 6 จุด — ต้องเปลี่ยนเป็น interface ที่ inject ได้:

| จุดผูกเดิม | เปลี่ยนเป็น |
|---|---|
| `usePrice()` (PriceProvider — live tick) | **prop `livePrice`** หรือ **DataFeed adapter** (ดูข้อ 5) |
| `useAlerts()` (DB ผ่าน `/api/alerts`) | **prop `alerts` + callbacks** (`onAlertCreate/Delete`) — optional |
| `useToast()` | **prop `onNotify?(level, title, msg)`** — ไม่มีก็เงียบ |
| `ConfirmDialog` / `PromptDialog` / `PairSelector` | bundle เวอร์ชัน headless มาในแพ็กเกจ หรือรับผ่าน `slots` prop |
| localStorage (drawings/config/templates) | **StorageAdapter interface** (default = localStorage, inject ได้) |
| Binance REST/WS hardcoded | **DataFeed adapter** (default Binance, override ได้) |
| Tailwind class + CSS tokens | ดูข้อ 6 (theme) |

### โครงสร้าง repo ที่เสนอ
```
packages/chart/
  src/
    FullChart.tsx           # component หลัก
    OscillatorPane.tsx
    ChartToolbar.tsx
    DrawingToolbar.tsx
    engines/
      lightweight/          # default engine
      tradingview/          # optional adapter
    core/
      drawings.ts           # model + (de)serialize (ไม่มี localStorage ตรงๆ)
      drawings-primitive.ts # ISeriesPrimitive: render + hit-test + drag
      indicators.ts         # pure JS (sma, ema, rsi, macd, ... )
      chart-config.ts       # types + HA/BBands/VWAP helpers
    adapters/
      datafeed.ts           # interface + BinanceDataFeed default
      storage.ts            # interface + LocalStorageAdapter default
      theme.ts              # token map + default dark theme
    index.ts                # public exports
  examples/
    next-app/               # ตัวอย่างการเรียกใช้
```

---

## 5. Public API (Component Contract)

### `<FullChart />` props (ร่าง)
```ts
interface FullChartProps {
  symbol: string;                    // "BTCUSDT"
  config?: Partial<ChartConfig>;     // timeframe, chartType, indicators, oscillators
  onConfigChange?: (c: ChartConfig) => void;

  // Data — เลือกอย่างใดอย่างหนึ่ง
  datafeed?: DataFeed;               // adapter ดึง klines + subscribe live
  livePrice?: number;               // หรือป้อน live price ตรงๆ (controlled)

  // Persistence (optional)
  storage?: StorageAdapter;          // default = localStorage

  // Integrations (optional)
  alerts?: ChartAlert[];
  onAlertCreate?: (price: number) => void;
  onAlertDelete?: (id: string) => void;
  onNotify?: (level: "info"|"success"|"error", title: string, msg?: string) => void;

  // UI
  theme?: ChartTheme;                // ดูข้อ 6
  height?: number | string;
  slots?: { ConfirmDialog?: ..., PromptDialog?: ... };
}
```

### `DataFeed` interface
```ts
interface DataFeed {
  getKlines(symbol: string, tf: Timeframe, limit: number): Promise<Candle[]>;
  subscribe(symbol: string, tf: Timeframe, onTick: (c: Candle) => void): () => void;
}
```
- มี `BinanceDataFeed` เป็น default implementation (REST `api/v3/klines` + `wss://stream.binance.com`)

### `StorageAdapter` interface
```ts
interface StorageAdapter {
  loadDrawings(symbol: string): Drawing[] | Promise<Drawing[]>;
  saveDrawings(symbol: string, d: Drawing[]): void | Promise<void>;
  loadConfig(): ChartConfig | null;
  saveConfig(c: ChartConfig): void;
  loadTemplates(): ChartTemplate[];
  saveTemplates(t: ChartTemplate[]): void;
}
```

---

## 6. Styling / Theme

**แนวทางที่แนะนำ: self-contained + theme prop**
- bundle CSS ของ component มาในตัว (CSS Modules หรือ scoped CSS) — consumer ไม่ต้องมี Tailwind
- expose `ChartTheme` (สีพื้นหลัง surface tiers, accent buy/sell/profit/loss, fonts) ผ่าน prop / CSS variables
- ค่า default = ธีมเข้มของ KINETIC (cyan buy / orange sell / emerald profit / crimson loss, zero border-radius)
- consumer override สีได้ทั้งหมดผ่าน `theme` prop หรือ CSS custom properties

> ทางเลือก: โหมด headless (export logic/primitive เปล่า) — เก็บไว้พิจารณาภายหลังถ้ามี requirement

---

## 7. Functional Requirements (ฟีเจอร์ที่ต้องมี — เทียบของเดิม)

### 7.1 Engine
- [ ] Lightweight engine (default)
- [ ] TradingView engine (optional, รับ `LIBRARY_PATH`, datafeed + save/load adapter)
- [ ] สลับ engine ได้จาก toolbar

### 7.2 ประเภทกราฟ & Timeframe
- [ ] Candles, **Heikin-Ashi** (มี transform), Line, Area
- [ ] Timeframe: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w
- [ ] โหลด history ~700 แท่ง + live tick อัปเดตแท่งล่าสุด realtime

### 7.3 Indicator overlays (13)
EMA 20/50/200, SMA 50, Bollinger Bands (20,2), VWAP, Supertrend (10,3),
Donchian (20), Keltner (EMA20/ATR10/2), Parabolic SAR (0.02,0.2),
Pivot Points (classic), Ichimoku (9/26/52), Volume histogram
- [ ] เปิด/ปิดแต่ละตัว + IndicatorLegend แสดงตัวที่ active (สี + label)

### 7.4 Oscillator panes (4) — แผงแยกด้านล่าง
RSI 14, MACD (12,26,9), Stochastic (14,3,3), ATR 14

### 7.5 Drawing tools (ครบชุดสไตล์ TradingView)
- **Lines:** Trend line, Ray, Extended line, Arrow, Horizontal level, Horizontal ray, Vertical line
- **Shapes:** Rectangle, Ellipse, Parallel channel, Pitchfork
- **Fib & Measure:** Fib retracement, Fib extension, Fib fan, Measure (Δprice/Δ%/bars)
- **Annotate:** Text note
- **Trade:** Long/Short position (RR box), Price alert (วางบนกราฟ)

ความสามารถของ drawing engine:
- [ ] สร้าง 1-point / 2-point / 3-point tools
- [ ] เลือก / ลาก handles / ลากทั้ง object
- [ ] **Magnet snap** ไปยัง OHLC
- [ ] **Undo / Redo**
- [ ] ลบด้วย Delete, ยกเลิกด้วย Esc
- [ ] ปรับสี / lineWidth / lineStyle (solid/dashed/dotted) / lock
- [ ] persist ต่อ symbol ผ่าน StorageAdapter
- [ ] hit-testing + render ผ่าน `ISeriesPrimitive` ของ lightweight-charts
- [ ] handles แบบ mobile-friendly

### 7.6 Toolbar
- [ ] Pair selector (slot/รับ list symbol ผ่าน prop)
- [ ] เลือก timeframe / engine / chart type
- [ ] Dropdown indicators + oscillators (พร้อม badge นับจำนวน active)
- [ ] Floating drawing toolbar — group flyout, ลากย้ายตำแหน่งได้, persist ตำแหน่ง

### 7.7 Templates & Persistence
- [ ] Save / Load / Delete chart template (cap 20)
- [ ] config + drawings + templates ผ่าน StorageAdapter

### 7.8 อื่นๆ
- [ ] Fullscreen mode (lock body scroll)
- [ ] Alerts ที่ active แสดงเป็น price line บนกราฟ
- [ ] Snapshot กราฟ (export PNG)

---

## 8. Non-Functional Requirements
- TypeScript strict, export `.d.ts` ครบ
- SSR-safe (guard `window`, `"use client"`); render ครั้งแรกต้องไม่ flicker
- Tree-shakeable (ESM), peer deps ไม่ bundle React/lightweight-charts
- ไม่มี side-effect ระดับ module ที่แตะ `window`/`localStorage` ตอน import
- รองรับหลาย instance บนหน้าเดียว (ไม่มี global singleton state)
- Cleanup listener/WebSocket/observer ครบเมื่อ unmount
- Reconnect WS อัตโนมัติ (3s) + REST fallback ตอน mount

---

## 9. Distribution (ตัดสินใจภายหลัง — ตัวเลือก)
| ตัวเลือก | เหมาะเมื่อ |
|---|---|
| npm private (`@org/kinetic-chart`) | ใช้หลายโปรเจกต์ แยกขาด เวอร์ชันชัด *(แนะนำ)* |
| Monorepo workspace (pnpm/turbo) | โปรเจกต์อยู่ใน repo เดียวกัน |
| Git submodule / subtree | ไม่อยากตั้ง registry |
| Copy-paste (shadcn-style) | อยากให้แก้ไขในแต่ละโปรเจกต์ได้อิสระ |

---

## 10. Deliverables
1. repo/แพ็กเกจ `@kinetic/chart` พร้อม build (ESM+CJS+d.ts)
2. Adapters: `BinanceDataFeed`, `LocalStorageAdapter`, default `ChartTheme`
3. Example Next.js app สาธิตการใช้งาน + override adapter/theme
4. `README.md` (ติดตั้ง, props API, ตัวอย่าง, การ override)
5. CHANGELOG / semver

---

## 11. Acceptance Criteria
- [ ] `npm install` + import `<FullChart symbol="BTCUSDT" />` แล้วใช้งานได้ทันทีด้วย default adapter
- [ ] รันได้โดยโปรเจกต์ปลายทาง **ไม่ต้องมี** Tailwind/token/provider ของ KINETIC
- [ ] ฟีเจอร์ครบตามข้อ 7 (checklist ผ่านทั้งหมด)
- [ ] override datafeed / storage / theme ได้จริง (มีตัวอย่าง)
- [ ] ไม่มี import ที่อ้างถึงแอป KINETIC หลงเหลือ (auth, prisma, providers, hooks เฉพาะแอป)

---

## 12. อ้างอิงโค้ดเดิม (ใช้เป็น source ในการพอร์ต)
| ไฟล์เดิม | ใช้ทำ |
|---|---|
| `src/components/chart/full-chart.tsx` | logic หลัก + drawing interaction |
| `src/components/chart/chart-toolbar.tsx` | toolbar |
| `src/components/chart/oscillator-pane.tsx` | oscillator panes |
| `src/components/chart/tradingview-chart.tsx` | TradingView engine adapter |
| `src/lib/chart/drawings-primitive.ts` | ISeriesPrimitive render/hit-test/drag |
| `src/lib/drawings.ts` | drawing model + persistence (แยก localStorage ออก) |
| `src/lib/chart-config.ts` | config types + HA/BBands/VWAP |
| `src/lib/indicators.ts` | indicator math ทั้งหมด |
| `src/lib/tradingview/datafeed.ts`, `save-load-adapter.ts` | TV adapters |
