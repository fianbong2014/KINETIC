# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Dev server on port 3300 (Turbopack)
npm run build        # prisma generate + next build
npm run start        # Production server on port 3301
npm run lint         # ESLint (flat config: Next.js + TypeScript rules)
npx prisma migrate dev    # Run new migrations against DATABASE_URL
npx prisma generate       # Regenerate Prisma client (also runs on postinstall)
```

No test runner is configured. Required env vars: `DATABASE_URL` (Postgres), `AUTH_SECRET`, `AUTH_URL`.

## Architecture

KINETIC is a Bloomberg-inspired crypto trading terminal with paper trading, multi-pair signal analysis, and an in-browser bot engine. Stack: Next.js 16 App Router (Turbopack), React 19, Tailwind CSS v4, shadcn/ui (base-nova / @base-ui/react), Prisma + PostgreSQL, NextAuth.js v5, lightweight-charts.

### Routing & Auth

Two route groups under `src/app/`:

- `(app)/` — authenticated shell. `(app)/layout.tsx` mounts `TooltipProvider → PriceProvider → BotEngineProvider`, plus `Sidebar / Topbar / StatusBar / MobileNav`. Pages: `/` (block menu home), `/dashboard`, `/signals`, `/risk`, `/journal`, `/settings`, `/bots`.
- `(auth)/` — public. `/login`, `/register`.

`src/proxy.ts` is a Next.js middleware (note: the project calls it `proxy`, not `middleware`) that gates everything except `/login`, `/register`, `/api/*`, and static assets by checking the `authjs.session-token` cookie. Unauthenticated requests get redirected to `/login?callbackUrl=...`.

NextAuth.js v5 in JWT mode lives in `src/lib/auth.ts` with credentials provider; `src/lib/auth-helpers.ts` exposes `getAuthenticatedUser()` for API routes. New users get default settings seeded from `src/lib/default-settings.ts`.

### Database (Prisma + Postgres)

`prisma/schema.prisma` defines:

- **Auth.js tables** — `User` (with `passwordHash`, `settings JSON`, `paperBalance`, `startingBalance`), `Account`, `Session`, `VerificationToken`.
- **Domain tables** — `Position` (active/closed, optional `botId`, trailing stop fields), `TradingBot`, `PriceAlert`, `CustomIndicator`, `JournalEntry`.

`src/lib/db.ts` is the Prisma client singleton.

### State, Real-time Data & Multi-pair

`PriceProvider` (`src/components/providers/price-provider.tsx`) holds a *single* live symbol (default `BTCUSDT`) and exposes `setSymbol` + the merged `MarketData`. Switching pairs anywhere in the app updates the global subscription. Supported pairs are defined in `src/lib/symbols.ts` (BTC, ETH, SOL, BNB, XRP, plus tokenized gold PAXG and XAUT).

`src/hooks/use-market-data.ts` connects to `wss://stream.binance.com:9443/ws/<symbol>@trade/<symbol>@ticker` for live ticker + trades, with REST fallback on mount and 3-second auto-reconnect. Other hooks (`use-order-book`, `use-klines`, `use-funding-rate`) open additional streams as needed.

The full hook surface lives in `src/hooks/` and covers: account/positions, watchlist (multi-pair scoring), signal & multi-TF reports, alerts + monitoring, custom indicators, bots + diagnostics + engine, journal, settings, daily briefing.

### Bot Engine

The bot engine is **client-side only** — there is no server worker. `BotEngineProvider` mounts `useBotEngine()` once for the entire `(app)` tree (so bots keep evaluating while the user is on any authenticated page, not just `/dashboard`). It watches the multi-pair watchlist + each enabled bot's rules + open positions, and POSTs trades to `/api/positions` tagged with `botId`. Triggers: `mtf_aligned`, `single_tf_bias`, `rsi_extreme`. Cooldown + `maxOpenPositions` prevent runaway behavior. The `/bots` page can manually trigger one-off evaluations via the engine's `forceRun(botId, { ignoreCooldown })`. Diagnostics flow through `src/lib/bot-diagnostics.ts`.

### Signal Engine

Pure-JS indicators live in `src/lib/indicators.ts`, `src/lib/signal-engine.ts`, `src/lib/multi-tf.ts`, `src/lib/custom-indicators.ts`. They run on live klines fetched via `use-klines`. Custom user indicators are persisted in DB and evaluated against the candle stream.

### Internal API Routes (`src/app/api/`)

`auth/[...nextauth]`, `auth/register`, `account` (paper balance/equity/exposure/PnL/drawdown), `positions` + `positions/[id]`, `journal` + `journal/[id]`, `settings` (GET/PATCH shallow-merge), `alerts` + `alerts/[id]`, `bots` + `bots/[id]`, `indicators` + `indicators/[id]`. All authenticated routes call `getAuthenticatedUser()`.

### Component Organization

- `src/components/layout/` — Sidebar, Topbar, MobileNav, StatusBar.
- `src/components/dashboard/` — PriceChart (lightweight-charts), OrderBook, MarketStats, TradeExecution, OpenPositions, RecentTrades, RiskControl, Watchlist, AlertCenter/Monitor, BotMonitor, PositionMonitor (SL/TP auto-trigger client-side), DailyBriefing, SignalLogic/SignalIndicator, PartialCloseDialog.
- `src/components/signals/`, `risk/`, `journal/`, `settings/` — page-specific.
- `src/components/bots/` — BotCard, CreateBotDialog.
- `src/components/providers/` — Session, Toast, Price, BotEngine.
- `src/components/ui/` — shadcn primitives + `animated-price.tsx`.

Path alias: `@/*` → `src/*`.

## Design System

All design tokens are CSS custom properties in `src/app/globals.css`.

- **Zero border-radius everywhere** — enforced with `!important` in the base layer. Every element is a sharp polygon.
- **No-Line Rule** — never use borders to delineate sections; use tonal layering instead.
- **Surface hierarchy**: `surface-container-lowest (#000) → background (#0e0e0f) → surface-container-low (#131314) → surface-container (#1a191b) → surface-container-high (#201f21) → surface-container-highest (#262627)`.
- **Accent colors**: cyan (`#00ffff`) = buy/primary, orange (`#ff734c`) = sell/secondary, emerald (`#50c878`) = profit, crimson (`#ff716c`) = loss.
- **Fonts**: Space Grotesk (headings, `--font-heading`), Inter (body, `--font-sans`), Roboto Mono (numbers, `--font-mono`).
- Custom utilities in globals.css: `.glass-panel`, `.glow-cyan`, `.btn-gradient-cyan`, `.flash-up`/`.flash-down`, `.pulse-glow`, `.tabular-nums`.

## Key Conventions

- All numeric/price displays use `tabular-nums` + Roboto Mono. Use `AnimatedPrice` (`src/components/ui/animated-price.tsx`) for any live price to get flash animations.
- Dashboard uses a 12-column CSS grid with responsive col-span breakpoints. Mobile (<768) = single column + bottom nav; tablet (768–1279) = 2-col; desktop (1280+) = 3-col with sidebar.
- Trade execution and SL/TP triggers are **client-side only** while the dashboard/bot engine is open — there is no background worker. Closing a position auto-creates a `JournalEntry` with derived R:R.
- Settings live in `User.settings` JSON; `/api/settings` does a shallow merge so partial PATCHes are safe.
