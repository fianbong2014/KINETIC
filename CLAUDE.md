# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Dev server on port 3300 (Turbopack)
npm run build        # Production build
npm run start        # Production server on port 3301
npm run lint         # ESLint (flat config, Next.js + TypeScript rules)
```

No test runner is configured yet. No environment variables are required — all external APIs (Binance) are public and unauthenticated.

## Architecture

KINETIC is a Bloomberg-inspired crypto trading terminal. Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui (base-nova style with @base-ui/react).

### Routing

All pages are under `src/app/`. Root (`/`) redirects to `/dashboard`. Pages: `/dashboard`, `/signals`, `/risk`, `/journal`, `/settings`.

### State Management

Global price state uses React Context (`src/components/providers/price-provider.tsx`). The `PriceProvider` wraps the app in `layout.tsx` and is consumed via `usePrice()`. It holds live BTC price, 24h stats, connection status, and last 50 trades.

### Real-time Data

`src/hooks/use-bitcoin-price.ts` connects to Binance WebSocket (`wss://stream.binance.com:9443/ws/btcusdt@trade/btcusdt@ticker`) for live trade and ticker data. REST fallback on mount for initial 24h stats. Auto-reconnects after 3 seconds.

### Component Organization

- `src/components/layout/` — Sidebar, Topbar, MobileNav, StatusBar (shell/navigation)
- `src/components/dashboard/` — Price chart (lightweight-charts), order book, trade execution, positions, market stats
- `src/components/signals/`, `risk/`, `journal/`, `settings/` — Page-specific feature components
- `src/components/providers/` — React Context providers
- `src/components/ui/` — shadcn/ui primitives + `animated-price.tsx`
- `src/hooks/` — Custom hooks (currently just Binance WebSocket)
- `src/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)

### Path Aliases

`@/*` maps to `src/*` (configured in tsconfig.json and components.json).

## Design System

All design tokens are CSS custom properties defined in `src/app/globals.css`.

- **Zero border-radius everywhere** — enforced with `!important` in base layer
- **Surface hierarchy**: `--background` (#0e0e0f) → `--surface-container` (#1a191b) → `--surface-container-high` (#201f21) — use tonal layering, not borders
- **Accent colors**: cyan (#00ffff) = buy/primary, orange (#ff734c) = sell/secondary, emerald (#50c878) = profit, crimson (#ff716c) = loss
- **Fonts**: Space Grotesk (headings via `--font-heading`), Inter (body via `--font-sans`), Roboto Mono (numbers via `--font-mono`)
- Custom utility classes in globals.css: `.glass-panel`, `.glow-cyan`, `.btn-gradient-cyan`, `.flash-up`/`.flash-down`, `.pulse-glow`, `.tabular-nums`

## Key Conventions

- All numeric/price displays use `font-variant-numeric: tabular-nums` and Roboto Mono for alignment
- The `AnimatedPrice` component (`src/components/ui/animated-price.tsx`) handles price flash animations — use it for all live price displays
- Dashboard uses a 12-column CSS grid (`grid-cols-12`) with responsive col-span breakpoints
- Responsive breakpoints: mobile (<768px, single column + bottom nav), tablet (768-1279px, 2-col), desktop (1280px+, 3-col with sidebar)
- Most data outside of BTC price/trades is currently mock data hardcoded in components
