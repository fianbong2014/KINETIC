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

### Core Infrastructure
| Feature | รายละเอียด | Status |
|---------|-----------|--------|
| **Authentication** | Email/password login + registration ผ่าน NextAuth.js v5 (JWT) | ✅ Live |
| **Database** | PostgreSQL (Neon) + Prisma ORM — User, Position, JournalEntry tables | ✅ Live |
| **API Routes** | REST API สำหรับ positions, journal entries, user settings (CRUD) | ✅ Live |
| **Route Protection** | Proxy redirect ไป /login เมื่อไม่มี session | ✅ Live |
| **User Settings** | Default settings seed ตอน register, GET/PATCH API | ✅ Live |
| **Home Block Menu** | หน้า landing พร้อม block menu สำหรับ navigate ไปแต่ละ section | ✅ Live |

### Live Data (เชื่อมต่อ API จริง)
| Feature | รายละเอียด | Data Source |
|---------|-----------|-------------|
| **Real-time BTC Price** | ราคา Bitcoin อัปเดตแบบ real-time ผ่าน WebSocket | Binance WebSocket API |
| **Price Chart** | กราฟราคาสดที่อัปเดตทุก trade (Candlestick) | Binance `btcusdt@trade` stream |
| **24H Market Stats** | High/Low/Volume/Change% | Binance REST + `btcusdt@ticker` stream |
| **Recent Trades Feed** | แสดง 10 trades ล่าสุดแบบ live พร้อม animation | Binance `btcusdt@trade` stream |
| **Connection Status** | แสดงสถานะ WebSocket + auto reconnect 3 วินาที | Internal state |

### UI Complete (ข้อมูล Mock)
| Feature | รายละเอียด |
|---------|-----------|
| **Order Book** | แสดง depth visualization พร้อม bid/ask spread |
| **Quick Trade Panel** | Market/Limit order form พร้อม Buy/Sell toggle |
| **Signal Analysis** | Zone Analysis, Technical Analysis, Energy Detection (responsive) |
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
| Charts | Lightweight Charts 5.1 + Recharts 3.8 |
| Icons | Lucide React |
| Fonts | Space Grotesk (headings), Inter (body), Roboto Mono (numbers) |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Authentication | NextAuth.js v5 (credentials + JWT) |
| Real-time | Binance WebSocket API (free, no auth) |
| Deployment | Vercel |

---

## Getting Started

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# แก้ไข DATABASE_URL ใน .env ให้ชี้ไปยัง PostgreSQL instance

# Run database migration
npx prisma migrate dev

# Start development server (port 3300)
npm run dev

# Production build
npm run build

# Start production server (port 3301)
npm start
```

เปิด [http://localhost:3300](http://localhost:3300) ใน browser

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. Neon) |
| `AUTH_SECRET` | NextAuth.js secret key (`openssl rand -base64 32`) |
| `AUTH_URL` | Application URL (`http://localhost:3300` for dev) |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts + SessionProvider)
│   ├── globals.css             # Design system tokens + custom utilities
│   ├── (app)/                  # Authenticated route group (with sidebar, topbar)
│   │   ├── layout.tsx          # App shell (Sidebar, Topbar, PriceProvider, StatusBar)
│   │   ├── page.tsx            # Home — block menu navigation
│   │   ├── dashboard/          # BTC Main Dashboard
│   │   ├── signals/            # Signal Analysis Detail
│   │   ├── risk/               # Risk Command Center
│   │   ├── journal/            # Trade Journal & Analytics
│   │   └── settings/           # Settings Dashboard
│   ├── (auth)/                 # Public route group (minimal layout)
│   │   ├── layout.tsx          # Centered auth layout
│   │   ├── login/              # Login page
│   │   └── register/           # Registration page
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth.js catch-all
│       ├── auth/register/      # User registration endpoint
│       ├── positions/          # Positions CRUD
│       ├── journal/            # Journal entries CRUD
│       └── settings/           # User settings GET/PATCH
│
├── components/
│   ├── layout/                 # Sidebar, Topbar, MobileNav, StatusBar
│   ├── dashboard/              # PriceChart, OrderBook, MarketStats, TradeExecution, etc.
│   ├── signals/                # SignalHeader, SignalDetails, TradePlan, SignalNarrative
│   ├── risk/                   # PortfolioHealth, RiskCalculator, ActiveExposure, etc.
│   ├── journal/                # JournalStats, EquityCurve, JournalEntries, etc.
│   ├── settings/               # Account, API, Trading, Risk, Notification, Display panels
│   ├── providers/              # PriceProvider, SessionProvider
│   └── ui/                     # shadcn components + AnimatedPrice
│
├── hooks/
│   └── use-bitcoin-price.ts    # Binance WebSocket + REST hook
│
├── lib/
│   ├── utils.ts                # cn() utility
│   ├── db.ts                   # Prisma client singleton
│   ├── auth.ts                 # NextAuth.js v5 configuration
│   ├── auth-helpers.ts         # getAuthenticatedUser() helper
│   └── default-settings.ts     # Default user settings seed
│
├── types/
│   └── next-auth.d.ts          # Session type extension
│
└── proxy.ts                    # Route protection (redirect to /login)

prisma/
└── schema.prisma               # Database schema (User, Position, JournalEntry)
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

### Internal API Routes

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth.js authentication |
| `/api/auth/register` | POST | User registration (bcrypt hash + default settings) |
| `/api/positions` | GET, POST | List/create trading positions |
| `/api/positions/[id]` | PATCH, DELETE | Update/delete position |
| `/api/journal` | GET, POST | List/create journal entries (paginated) |
| `/api/journal/[id]` | PATCH, DELETE | Update/delete journal entry |
| `/api/settings` | GET, PATCH | Get/merge user settings (shallow merge) |
| `/api/account` | GET | Paper balance, equity, exposure, realized PNL, drawdown |

### Binance (Free, No Auth Required)

**WebSocket** — `wss://stream.binance.com:9443/ws/btcusdt@trade/btcusdt@ticker`
- `btcusdt@trade` — Real-time individual trades (price, quantity, side)
- `btcusdt@ticker` — 24h rolling stats (high, low, volume, change%)
- Auto-reconnect หลัง 3 วินาทีเมื่อ connection หลุด

**REST** — `https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT`
- ดึงข้อมูล 24h ticker ครั้งแรกตอน mount

---

## Roadmap

### Phase 1: Core Infrastructure ✅
- [x] **Backend API** — API routes สำหรับ positions CRUD, journal CRUD, user settings
- [x] **Database** — PostgreSQL (Neon, Singapore) + Prisma ORM (User, Position, JournalEntry)
- [x] **Authentication** — NextAuth.js v5 credentials (email/password + JWT sessions)
- [x] **Environment Config** — `.env` สำหรับ DATABASE_URL, AUTH_SECRET, AUTH_URL
- [x] **Route Protection** — `proxy.ts` redirect unauthenticated users to /login
- [x] **Login/Register Pages** — Terminal-styled auth pages with auto sign-in after register

### Phase 2: Live Trading Data ✅
- [x] **Live Order Book** — Binance partial depth stream (`@depth20@100ms`) with cumulative depth bars
- [x] **Multi-pair Support** — BTC / ETH / SOL / BNB / XRP with dynamic WebSocket subscribe/unsubscribe
- [x] **Candlestick Chart** — OHLC candles + volume histogram (lightweight-charts), reacts to pair + timeframe
- [x] **Historical Data** — klines from Binance REST API for all timeframes (1M / 15M / 1H / 4H / 1D)
- [x] **Funding Rate** — perpetual futures funding rate + next funding countdown

### Phase 3: Paper Trading Engine ✅
- [x] **Paper Trading Mode** — virtual $10,000 balance per user, tracked in DB
- [x] **Position Tracking** — open positions with live unrealized PNL from WebSocket price
- [x] **Stop Loss / Take Profit** — auto-trigger SL/TP via client-side monitor (fires while dashboard is open)
- [x] **Auto-journal on Close** — closing a position creates a JournalEntry with derived R:R ratio
- [x] **Risk Calculator (Live)** — position size from real paper balance × risk %
- [x] **Balance-aware Trade Form** — blocks orders exceeding balance, validates SL/TP direction
- [ ] **Real Exchange Order Execution** — connect to Binance/Bybit for live trading (deferred — skip for MVP safety)

### Phase 4: Signal & Analytics ✅
- [x] **Signal Engine** — Pure-JS indicators (RSI, MACD, EMA/SMA, divergence, volume spike, zones) running on live klines
- [x] **Journal Persistence** — บันทึก trade journal ลง database พร้อม CRUD operations
- [x] **Equity Curve (Live)** — real journal entries cumulative from starting balance
- [x] **Performance Analytics** — Win rate, profit factor, expectancy, max drawdown, Sharpe-like, avg R:R
- [x] **Alert System** — Browser notifications on SL/TP trigger, gated by user alert preferences
- [ ] **Backtesting** — deferred to Phase 6 (requires historical kline replay + strategy harness)

### Phase 5: Production Ready
- [ ] **Error Boundaries** — จัดการ error state ทุกหน้า (network failure, API errors)
- [ ] **Loading States** — Skeleton loaders สำหรับทุก data component
- [ ] **PWA Support** — Offline capability + installable app
- [ ] **Mobile Optimization** — Touch gestures สำหรับ chart interaction
- [ ] **Dark/Light Mode** — Toggle theme (ปัจจุบัน dark only)
- [ ] **i18n** — รองรับภาษาไทยและภาษาอื่น
- [ ] **Rate Limiting** — จัดการ API rate limits ของ Binance
- [ ] **Testing** — Unit tests (Vitest) + E2E tests (Playwright)
- [x] **Vercel Deployment** — Auto-deploy on push via GitHub integration
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
