# OKX Live Trading — Implementation Plan & Status

> **Status: PAUSED** (2026-05-16) — blocked on creating a valid OKX API key
> (account passkey/face-verification wall on user's side, not a code issue).
> Live trading is locked off by default; nothing dangerous is active.

Branch: `feature/okx-live-trading`

---

## Decisions locked in

| Decision | Choice |
|---|---|
| Paper vs Live model | **Per-bot** (`TradingBot.mode`) + global trade-lock gate (`ExchangeCredential.tradeEnabled`) |
| Market type | **Perpetual SWAP** first (not spot) |
| Exchange | OKX only |
| Secret storage | AES-256-GCM, key derived from `AUTH_SECRET` via PBKDF2 (rotating AUTH_SECRET invalidates stored keys) |
| OKX host | env `OKX_BASE_URL`, default `https://www.okx.ac` (`www.okx.com` is DNS-blocked in TH; mirrors: `.ac`, `.cab`) |

---

## ✅ Phase 1 — Credentials & connection (DONE)

- `prisma/schema.prisma`: `ExchangeCredential` model; `mode/exchange/leverage/marginMode` on `TradingBot`; `mode/exchange/exchangeOrderId/exchangeAlgoId` on `Position`
- Migration `20260516070607_add_exchange_credentials_and_modes` (additive only, applied)
- `src/lib/crypto.ts` — AES-256-GCM encrypt/decrypt + `makeApiKeyHint`
- `src/lib/exchange/okx.ts` — signing, `getAccountBalance`, `getAccountConfig`, `getInstruments`, `testConnection`
- `src/lib/symbols.ts` — `okxSwap`/`okxSpot` per pair + `isLiveTradable()` (PAXG/XAUT → false)
- `POST/GET/DELETE /api/exchange/credentials` (encrypt → upsert; DELETE downgrades live bots → paper)
- `POST /api/exchange/test` (pre-save test or stored-cred test; writes lastTested*)
- `src/hooks/use-exchange-credentials.ts`, `src/components/settings/okx-connection.tsx` (form + Test/Save/Remove)

## ✅ Phase 2 — Live order entry (DONE)

- `src/lib/exchange/okx.ts` — `getSwapInstrument`, `baseSizeToContracts`, `setLeverage`, `placeMarketSwapOrder`
- `src/lib/exchange/credentials.ts` — server-side resolver (decrypt + enforce `tradeEnabled`)
- `POST /api/positions` — `mode:"live"` branch: validate live-tradable → resolve creds → posMode → sizing → setLeverage → place order → **persist Position only if OKX accepted** (no ghost rows)
- `PATCH /api/exchange/credentials` — `tradeEnabled` toggle
- `TradeExecution` — Paper/Live toggle + leverage input; live always confirms ("REAL FUNDS"); skips paper-balance check; MARKET only
- `okx-connection.tsx` — real Enable/Disable trade-lock button

Verification: TypeScript 0 errors. Lint: only pre-existing project-wide
`set-state-in-effect` pattern (every data hook does this).

---

## ⏳ Phase 3 — Reconciliation (NOT STARTED — resume here)

Phase 2 can OPEN live positions but cannot correctly CLOSE / manage them.
Do NOT use live mode with real SL/TP until this is done.

1. **Live close path** — closing a `mode:"live"` Position must place an
   opposite-side reduce-only market order on OKX, not just patch the DB.
   (`PATCH /api/positions/[id]` + `partial-close` route need a live branch.)
2. **Exchange-native SL/TP** — attach OKX algo orders on entry (store
   `Position.exchangeAlgoId`) instead of relying on the client-side
   `PositionMonitor`. Use OKX `attachAlgoOrds` or `/trade/order-algo`.
3. **PositionMonitor / bot-engine live-awareness** — currently they treat
   live positions like paper (would only update DB on SL/TP/trailing).
   Guard: skip client-side auto-close for `mode:"live"`, defer to exchange.
4. **Position sync job** — periodic `GET /api/v5/account/positions` to
   reconcile DB vs OKX (detect exchange-side fills/liquidations).
5. **Bot engine** — pass `bot.mode` into the `/api/positions` POST so
   live bots actually place live orders (currently always paper).
6. **Account/PnL** — live positions should not affect paper balance/equity
   widgets (or show a separate live equity section).

## ⏳ Phase 4 — Hardening (LATER)

- Rate limiting on OKX calls (avoid bans on reconnect storms)
- IP whitelist guidance for production server
- Server-side bot worker (so live bots run 24/7, not just when a tab is open)
- Audit log of every live order placed (who/when/result)

---

## Known blockers / notes

- **API key creation blocked**: OKX account requires passkey + face
  verification bound to another device; desktop browser face scan times
  out. Resume testing once a Read+Trade key (Withdraw OFF) + passphrase
  is created on the OKX mobile app.
- `.env` needs `OKX_BASE_URL` (optional, defaults to `www.okx.ac`).
- Test creds previously pasted in chat are considered exposed — create a
  fresh key for any real use.

## How to resume / smoke test

1. Create OKX API key (Read + Trade, **no Withdraw**), note passphrase
2. Settings → OKX Live Trading → enter key → **Test & Save**
3. Click **Enable live** (trade lock)
4. Dashboard → **Live** toggle → small MARKET order on a live-tradable pair
5. Then implement Phase 3 before trusting SL/TP
