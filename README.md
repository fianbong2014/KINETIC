# KINETIC // Trading Terminal

> Bloomberg-inspired cryptocurrency trading terminal built with Next.js 16, Tailwind CSS v4, and shadcn/ui.

![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![React](https://img.shields.io/badge/React-19.2-61DAFB)

---

## Overview

KINETIC เป็น trading terminal ที่ออกแบบมาในสไตล์ "The Kinetic Monolith" - ใช้ dark theme แบบ obsidian slab ที่ข้อมูลถูก "สลักด้วยแสง" บนพื้นผิวมืด ตัวดีไซน์เน้นความเรียบหรูระดับ Bloomberg terminal แต่ลดความรกของ typical retail trading app

### Design Philosophy
- **Zero border-radius** — ทุก element เป็นรูปทรง sharp polygon
- **No-Line Rule** — ไม่ใช้เส้น border แบ่ง section ใช้ tonal layering แทน
- **Data is the protagonist** — typography hierarchy ที่ทำให้ตัวเลขสำคัญโดดเด่น
- **Glassmorphism + Tonal Layering** — ความลึกสร้างจากสีพื้นหลัง ไม่ใช่ drop shadow

---

## Features (สถานะปัจจุบัน)

### Live (เชื่อมต่อ API จริง)
| Feature | รายละเอียด | Data Source |
|---------|-----------|-------------|
| **Real-time BTC Price** | ราคา Bitcoin อัปเดตแบบ real-time ผ่าน WebSocket | Binance WebSocket API |
| **Price Chart** | กราฟราคาสดที่อัปเดตทุก trade | Binance `btcusdt@trade` stream |
| **24H Market Stats** | High/Low/Volume/Change% | Binance REST + `btcusdt@ticker` stream |
| **Recent Trades Feed** | แสดง 10 trades ล่าสุดแบบ live พร้อม animation | Binance `btcusdt@trade` stream |
| **Connection Status** | แสดงสถานะ WebSocket + auto reconnect 3 วินาที | Internal state |

### UI Complete (ข้อมูล Mock)
| Feature | รายละเอียด |
|---------|-----------|
| **Order Book** | แสดง depth visualization พร้อม bid/ask spread |
| **Quick Trade Panel** | Market/Limit order form พร้อม Buy/Sell toggle |
| **Signal Analysis** | Zone Analysis, Technical Analysis, Energy Detection (3 tabs) |
| **Trade Plan** | Entry/Stop Loss/Take Profit พร้อม Risk:Reward ratio |
| **Risk Command Center** | Portfolio Health donut (72%), Risk Calculator, Active Exposure |
| **Trade Journal** | Stats, Equity Curve, Performance by Pair/Strategy, Trade entries |
| **Open Positions** | ตาราง positions พร้อมปุ่ม Trim/Close |

### Responsive Design
- **Desktop** (1280px+) — 3-column layout, sidebar + topbar navigation
- **Tablet** (768px-1279px) — 2-column hybrid
- **Mobile** (< 768px) — Single column stack, bottom tab bar navigation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 (App Router + Turbopack) |
| Language | TypeScript 5 |
| UI Library | React 19.2 |
| Styling | Tailwind CSS v4 (PostCSS plugin) |
| Components | shadcn/ui (base-ui) |
| Charts | Recharts 3.8 |
| Icons | Lucide React |
| Fonts | Space Grotesk (headings), Inter (body), Roboto Mono (numbers) |
| Real-time | Binance WebSocket API (free, no auth) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build

# Start production server
npm start
```

เปิด [http://localhost:3000](http://localhost:3000) ใน browser

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (providers, sidebar, topbar, mobile nav)
│   ├── globals.css             # Design system tokens + custom utilities
│   ├── page.tsx                # Redirect → /dashboard
│   ├── dashboard/page.tsx      # BTC Main Dashboard
│   ├── signals/page.tsx        # Signal Analysis Detail
│   ├── risk/page.tsx           # Risk Command Center
│   └── journal/page.tsx        # Trade Journal & Analytics
│
├── components/
│   ├── layout/                 # Sidebar, Topbar, MobileNav, StatusBar
│   ├── dashboard/              # PriceChart, OrderBook, MarketStats, TradeExecution, etc.
│   ├── signals/                # SignalHeader, SignalDetails, TradePlan, SignalNarrative
│   ├── risk/                   # PortfolioHealth, RiskCalculator, ActiveExposure, etc.
│   ├── journal/                # JournalStats, EquityCurve, JournalEntries, etc.
│   ├── providers/              # PriceProvider (React Context)
│   └── ui/                     # shadcn components + AnimatedPrice
│
├── hooks/
│   └── use-bitcoin-price.ts    # Binance WebSocket + REST hook
│
└── lib/
    └── utils.ts                # cn() utility
```

---

## Design System

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#00ffff` | Cyan — Buy/Long, primary actions, highlights |
| `--secondary` | `#ff734c` | Orange — Sell/Short, warnings |
| `--emerald-accent` | `#50c878` | Profit, bullish signals |
| `--crimson-accent` | `#ff716c` | Loss, bearish signals |
| `--background` | `#0e0e0f` | Base void |
| `--surface-container` | `#1a191b` | Widget layer |
| `--on-surface` | `#ffffff` | Data values |
| `--on-surface-variant` | `#adaaab` | Labels, secondary text |

### Surface Hierarchy
```
#000000  ← surface-container-lowest (inputs, deepest level)
#0e0e0f  ← background (infinite void)
#131314  ← surface-container-low (workspace zones)
#1a191b  ← surface-container (widget cards)
#201f21  ← surface-container-high (hover states)
#262627  ← surface-container-highest (active selections)
```

---

## API Integration

### Binance (Free, No Auth Required)

**WebSocket** — `wss://stream.binance.com:9443/ws/btcusdt@trade/btcusdt@ticker`
- `btcusdt@trade` — Real-time individual trades (price, quantity, side)
- `btcusdt@ticker` — 24h rolling stats (high, low, volume, change%)
- Auto-reconnect หลัง 3 วินาทีเมื่อ connection หลุด

**REST** — `https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT`
- ดึงข้อมูล 24h ticker ครั้งแรกตอน mount

---

## Roadmap

### Phase 1: Core Infrastructure
- [ ] **Backend API** — สร้าง API routes (`/api/`) สำหรับ trade execution, portfolio management
- [ ] **Database** — เพิ่ม PostgreSQL + Prisma ORM สำหรับเก็บ positions, journal entries, user settings
- [ ] **Authentication** — ระบบ login/register (NextAuth.js หรือ Clerk)
- [ ] **Environment Config** — `.env` สำหรับ API keys, database URL, WebSocket endpoints

### Phase 2: Live Trading Data
- [ ] **Live Order Book** — เชื่อม Binance `btcusdt@depth` WebSocket stream แทน mock data
- [ ] **Multi-pair Support** — รองรับ ETH/USD, SOL/USD และ pairs อื่น ๆ (ปัจจุบัน BTC only)
- [ ] **Candlestick Chart** — เปลี่ยนจาก area chart เป็น OHLC/Candlestick พร้อม volume bars
- [ ] **Historical Data** — ดึง klines จาก Binance REST API สำหรับ chart timeframes ต่าง ๆ
- [ ] **Funding Rate** — แสดง perpetual futures funding rate แบบ real-time

### Phase 3: Trading Engine
- [ ] **Order Execution** — เชื่อมกับ exchange API (Binance/Bybit) สำหรับ place orders จริง
- [ ] **Position Tracking** — Track open positions แบบ real-time พร้อม PNL calculation
- [ ] **Stop Loss / Take Profit** — ระบบจัดการ SL/TP อัตโนมัติ
- [ ] **Paper Trading Mode** — โหมดซ้อมเทรดด้วยเงินจำลอง
- [ ] **Risk Calculator (Live)** — คำนวณ position size จาก account balance จริง

### Phase 4: Signal & Analytics
- [ ] **Signal Engine** — ระบบสร้าง signal อัตโนมัติจาก technical indicators (RSI, MACD, EMA crossover)
- [ ] **Backtesting** — ทดสอบ strategy กับ historical data
- [ ] **Journal Persistence** — บันทึก trade journal ลง database พร้อม CRUD operations
- [ ] **Equity Curve (Live)** — คำนวณจาก trade history จริง
- [ ] **Performance Analytics** — Win rate, Sharpe ratio, max drawdown คำนวณแบบ real-time
- [ ] **Alert System** — Push notifications เมื่อราคาถึง target หรือ signal trigger

### Phase 5: Production Ready
- [ ] **Error Boundaries** — จัดการ error state ทุกหน้า (network failure, API errors)
- [ ] **Loading States** — Skeleton loaders สำหรับทุก data component
- [ ] **PWA Support** — Offline capability + installable app
- [ ] **Mobile Optimization** — Touch gestures สำหรับ chart interaction
- [ ] **Dark/Light Mode** — Toggle theme (ปัจจุบัน dark only)
- [ ] **i18n** — รองรับภาษาไทยและภาษาอื่น
- [ ] **Rate Limiting** — จัดการ API rate limits ของ Binance
- [ ] **Testing** — Unit tests (Vitest) + E2E tests (Playwright)
- [ ] **CI/CD** — GitHub Actions pipeline + Vercel deployment
- [ ] **Monitoring** — Error tracking (Sentry) + analytics

### Phase 6: Advanced Features
- [ ] **Multi-exchange** — รองรับ Bybit, OKX, Coinbase นอกจาก Binance
- [ ] **Portfolio Dashboard** — สรุป portfolio ข้าม exchanges
- [ ] **Social Trading** — แชร์ signals และ trade ideas
- [ ] **AI Signal Analysis** — ใช้ LLM วิเคราะห์ market sentiment จาก news/social media
- [ ] **Custom Indicators** — ให้ user สร้าง indicator ของตัวเอง (Pine Script style)
- [ ] **Webhook Integration** — รับ signals จาก TradingView webhooks

---

## License

Private project. All rights reserved.
