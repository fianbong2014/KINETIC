/**
 * OKX REST adapter — server-side only.
 *
 * Phase 1 surface: minimum needed to validate credentials and read
 * account state. Order placement / algo orders come in Phase 2/3.
 *
 * OKX auth requires THREE values per request:
 *   - api key (public)
 *   - secret (used as HMAC-SHA256 key)
 *   - passphrase (sent in OK-ACCESS-PASSPHRASE header)
 *
 * Signature = base64( HMAC-SHA256( secret, timestamp + method + path + body ) )
 *
 * Docs: https://www.okx.com/docs-v5/en/#overview-rest-authentication
 */

import { createHmac } from "node:crypto";

/**
 * OKX base URL.
 *
 * `www.okx.com` is DNS-blocked in some regions (e.g. TH). OKX serves
 * the identical v5 API on mirror domains (`www.okx.ac`, `www.okx.cab`),
 * so the host is env-overridable. Trailing slashes are trimmed so
 * paths like `/api/v5/...` always concatenate cleanly.
 */
const OKX_BASE_URL = (
  process.env.OKX_BASE_URL || "https://www.okx.ac"
).replace(/\/+$/, "");

export interface OkxCredentials {
  apiKey: string;
  secret: string;
  passphrase: string;
}

export interface OkxResponse<T> {
  code: string; // "0" = success
  msg: string;
  data: T;
}

export class OkxApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus?: number
  ) {
    super(message);
    this.name = "OkxApiError";
  }
}

function sign(
  secret: string,
  timestamp: string,
  method: string,
  path: string,
  body: string
): string {
  return createHmac("sha256", secret)
    .update(timestamp + method.toUpperCase() + path + body)
    .digest("base64");
}

async function request<T>(
  creds: OkxCredentials,
  method: "GET" | "POST",
  path: string,
  query?: Record<string, string | number | undefined>,
  body?: Record<string, unknown>
): Promise<T> {
  // Build query string
  let fullPath = path;
  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      params.append(k, String(v));
    }
    const qs = params.toString();
    if (qs) fullPath = `${path}?${qs}`;
  }

  const bodyStr = body ? JSON.stringify(body) : "";
  const timestamp = new Date().toISOString();
  const signature = sign(creds.secret, timestamp, method, fullPath, bodyStr);

  const headers: Record<string, string> = {
    "OK-ACCESS-KEY": creds.apiKey,
    "OK-ACCESS-SIGN": signature,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": creds.passphrase,
    "Content-Type": "application/json",
  };

  let res: Response;
  try {
    res = await fetch(`${OKX_BASE_URL}${fullPath}`, {
      method,
      headers,
      body: bodyStr || undefined,
      // Important: don't cache auth requests
      cache: "no-store",
    });
  } catch (err) {
    throw new OkxApiError(
      "network",
      err instanceof Error ? err.message : "Network error contacting OKX"
    );
  }

  let json: OkxResponse<T>;
  try {
    json = (await res.json()) as OkxResponse<T>;
  } catch {
    throw new OkxApiError(
      "parse",
      `OKX returned non-JSON (HTTP ${res.status})`,
      res.status
    );
  }

  if (json.code !== "0") {
    throw new OkxApiError(
      json.code || "unknown",
      json.msg || "OKX request failed",
      res.status
    );
  }
  return json.data;
}

// ─── Public surface ─────────────────────────────────────────────

/**
 * Account balance — returns the trading account totals (USDT equity etc.).
 * Used as the smoke-test endpoint for "Test Connection".
 */
export interface OkxBalance {
  totalEq: string; // total equity in USDT
  details: Array<{
    ccy: string;
    eq: string;
    availBal: string;
    upl: string; // unrealized PnL
  }>;
}

export async function getAccountBalance(
  creds: OkxCredentials
): Promise<OkxBalance> {
  const data = await request<OkxBalance[]>(
    creds,
    "GET",
    "/api/v5/account/balance"
  );
  if (!data?.[0]) {
    throw new OkxApiError("empty", "OKX returned empty balance payload");
  }
  return data[0];
}

/**
 * Instruments lookup — used to validate symbols exist + read tick size /
 * lot size before sending orders. SWAP = perpetual.
 */
export interface OkxInstrument {
  instId: string; // "BTC-USDT-SWAP"
  instType: string; // "SWAP"
  ctVal: string; // contract value (multiplier)
  lotSz: string; // min lot increment
  minSz: string; // min order size
  tickSz: string; // price tick
  state: string; // "live" | "suspend" | etc.
}

export async function getInstruments(
  creds: OkxCredentials,
  instType: "SPOT" | "SWAP" = "SWAP"
): Promise<OkxInstrument[]> {
  return request<OkxInstrument[]>(
    creds,
    "GET",
    "/api/v5/public/instruments",
    { instType }
  );
}

/**
 * Quick ping that the credential is valid AND has trade permission.
 * We call /account/balance (requires Read) then /account/config
 * (returns posMode etc., requires Read) — together these confirm
 * the key is alive.
 */
export interface OkxAccountConfig {
  uid: string;
  acctLv: string; // account mode level
  posMode: string; // "long_short_mode" | "net_mode"
  perm: string; // comma-separated: "read_only,trade,withdraw"
}

export async function getAccountConfig(
  creds: OkxCredentials
): Promise<OkxAccountConfig> {
  const data = await request<OkxAccountConfig[]>(
    creds,
    "GET",
    "/api/v5/account/config"
  );
  if (!data?.[0]) {
    throw new OkxApiError("empty", "OKX returned empty account config");
  }
  return data[0];
}

export interface OkxConnectionTest {
  ok: true;
  uid: string;
  totalEqUsdt: number;
  perms: string[]; // parsed from `perm`
  posMode: string;
}

/**
 * Combined health check used by the "Test Connection" button.
 * Returns a flat object the UI can render directly.
 */
export async function testConnection(
  creds: OkxCredentials
): Promise<OkxConnectionTest> {
  const [balance, config] = await Promise.all([
    getAccountBalance(creds),
    getAccountConfig(creds),
  ]);

  const perms = (config.perm || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    ok: true,
    uid: config.uid,
    totalEqUsdt: parseFloat(balance.totalEq) || 0,
    perms,
    posMode: config.posMode,
  };
}

// ─── Order placement (Phase 2: perpetual market entry) ──────────

/**
 * Fetch a single SWAP instrument's spec — needed to convert a
 * base-coin size into OKX contract count and to validate the
 * instrument is tradable.
 */
export async function getSwapInstrument(
  creds: OkxCredentials,
  instId: string
): Promise<OkxInstrument> {
  const data = await request<OkxInstrument[]>(
    creds,
    "GET",
    "/api/v5/public/instruments",
    { instType: "SWAP", instId }
  );
  const inst = data?.[0];
  if (!inst) {
    throw new OkxApiError("no_instrument", `Unknown OKX instrument ${instId}`);
  }
  if (inst.state !== "live") {
    throw new OkxApiError(
      "not_live",
      `Instrument ${instId} is not tradable (state=${inst.state})`
    );
  }
  return inst;
}

/**
 * Convert a base-coin amount (e.g. 0.05 BTC) into a whole number of
 * OKX contracts, snapped to the instrument's lot size.
 *
 * contracts = baseSize / ctVal, floored to a multiple of lotSz,
 * then verified against minSz.
 *
 * Returns the contract count as a string (OKX wants `sz` as string).
 */
export function baseSizeToContracts(
  baseSize: number,
  inst: OkxInstrument
): string {
  const ctVal = parseFloat(inst.ctVal);
  const lotSz = parseFloat(inst.lotSz);
  const minSz = parseFloat(inst.minSz);

  if (!(ctVal > 0)) {
    throw new OkxApiError("bad_ctval", `Invalid ctVal for ${inst.instId}`);
  }

  const rawContracts = baseSize / ctVal;
  // Snap down to a whole multiple of lotSz
  const step = lotSz > 0 ? lotSz : 1;
  const snapped = Math.floor(rawContracts / step) * step;

  if (snapped < minSz || snapped <= 0) {
    throw new OkxApiError(
      "below_min",
      `Order too small: ${baseSize} → ${snapped} contracts (min ${minSz}) for ${inst.instId}`
    );
  }
  // Avoid float dust in the string (e.g. 4.9999999 → "5")
  const decimals = (inst.lotSz.split(".")[1] || "").length;
  return snapped.toFixed(decimals);
}

/**
 * Set leverage for an instrument before opening. OKX requires this
 * per (instId, mgnMode[, posSide]). Idempotent — safe to call each
 * time. Errors here are non-fatal for net-mode accounts where the
 * leverage may already be set; caller decides whether to surface.
 */
export async function setLeverage(
  creds: OkxCredentials,
  params: {
    instId: string;
    lever: number;
    mgnMode: "isolated" | "cross";
    posSide?: "long" | "short";
  }
): Promise<void> {
  await request(creds, "POST", "/api/v5/account/set-leverage", undefined, {
    instId: params.instId,
    lever: String(params.lever),
    mgnMode: params.mgnMode,
    ...(params.posSide ? { posSide: params.posSide } : {}),
  });
}

export interface OkxOrderResult {
  ordId: string;
  clOrdId: string;
  sCode: string; // "0" = accepted
  sMsg: string;
}

/**
 * Place a MARKET order on a perpetual SWAP.
 *
 * `side` is the trade direction in our domain ("LONG"/"SHORT"); we
 * translate to OKX buy/sell + posSide. posSide is only sent when the
 * account is in long_short_mode (caller passes `hedgeMode`).
 */
export async function placeMarketSwapOrder(
  creds: OkxCredentials,
  params: {
    instId: string;
    side: "LONG" | "SHORT";
    contracts: string;
    tdMode: "isolated" | "cross";
    hedgeMode: boolean; // true = long_short_mode → must send posSide
    clOrdId?: string;
  }
): Promise<OkxOrderResult> {
  const okxSide = params.side === "LONG" ? "buy" : "sell";
  const posSide = params.side === "LONG" ? "long" : "short";

  const body: Record<string, unknown> = {
    instId: params.instId,
    tdMode: params.tdMode,
    side: okxSide,
    ordType: "market",
    sz: params.contracts,
    ...(params.hedgeMode ? { posSide } : {}),
    ...(params.clOrdId ? { clOrdId: params.clOrdId } : {}),
  };

  const data = await request<OkxOrderResult[]>(
    creds,
    "POST",
    "/api/v5/trade/order",
    undefined,
    body
  );
  const res = data?.[0];
  if (!res) {
    throw new OkxApiError("empty", "OKX returned no order result");
  }
  if (res.sCode !== "0") {
    throw new OkxApiError(
      res.sCode,
      `Order rejected: ${res.sMsg || "unknown"} (sCode ${res.sCode})`
    );
  }
  return res;
}
