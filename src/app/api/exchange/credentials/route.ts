import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { encryptString, makeApiKeyHint } from "@/lib/crypto";

const SUPPORTED_EXCHANGES = new Set(["okx"]);

/**
 * GET /api/exchange/credentials
 *
 * Returns metadata only — never the secrets. Safe for the settings UI.
 */
export async function GET() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const rows = await db.exchangeCredential.findMany({
    where: { userId: user!.id },
    select: {
      id: true,
      exchange: true,
      label: true,
      apiKeyHint: true,
      tradeEnabled: true,
      lastTestedAt: true,
      lastTestOk: true,
      lastTestError: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(rows);
}

/**
 * POST /api/exchange/credentials
 *
 * Body: { exchange, apiKey, secret, passphrase, label? }
 *
 * Encrypts everything before persisting. Replaces an existing record
 * for the same (user, exchange) since the schema has a unique key.
 * Always resets `tradeEnabled` to false on save — user must explicitly
 * flip the switch to enable live trading after re-saving keys.
 */
export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { exchange, apiKey, secret, passphrase, label } = (body || {}) as {
    exchange?: string;
    apiKey?: string;
    secret?: string;
    passphrase?: string;
    label?: string;
  };

  if (!exchange || !SUPPORTED_EXCHANGES.has(exchange)) {
    return NextResponse.json(
      { error: `Unsupported exchange. Allowed: ${[...SUPPORTED_EXCHANGES].join(", ")}` },
      { status: 400 }
    );
  }
  if (!isNonEmptyString(apiKey) || !isNonEmptyString(secret)) {
    return NextResponse.json(
      { error: "apiKey and secret are required" },
      { status: 400 }
    );
  }
  // OKX requires passphrase; future exchanges may not.
  if (exchange === "okx" && !isNonEmptyString(passphrase)) {
    return NextResponse.json(
      { error: "passphrase is required for OKX" },
      { status: 400 }
    );
  }

  let encKey, encSecret, encPass;
  try {
    encKey = encryptString(apiKey!.trim());
    encSecret = encryptString(secret!.trim());
    encPass = passphrase ? encryptString(passphrase.trim()) : null;
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Failed to encrypt credentials — check AUTH_SECRET",
      },
      { status: 500 }
    );
  }

  const data = {
    userId: user!.id,
    exchange,
    label: label?.trim() || null,
    apiKeyCipher: encKey.cipher,
    apiKeyIv: encKey.iv,
    apiKeyTag: encKey.tag,
    apiSecretCipher: encSecret.cipher,
    apiSecretIv: encSecret.iv,
    apiSecretTag: encSecret.tag,
    passphraseCipher: encPass?.cipher ?? null,
    passphraseIv: encPass?.iv ?? null,
    passphraseTag: encPass?.tag ?? null,
    apiKeyHint: makeApiKeyHint(apiKey!),
    tradeEnabled: false,
    lastTestedAt: null,
    lastTestOk: null,
    lastTestError: null,
  };

  const saved = await db.exchangeCredential.upsert({
    where: { userId_exchange: { userId: user!.id, exchange } },
    create: data,
    update: data,
    select: {
      id: true,
      exchange: true,
      label: true,
      apiKeyHint: true,
      tradeEnabled: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(saved, { status: 201 });
}

/**
 * PATCH /api/exchange/credentials
 *
 * Body: { exchange, tradeEnabled }
 *
 * Flips the trade lock. This is the ONLY thing PATCH can change —
 * secrets are never mutated here (re-POST to replace a key). Enabling
 * the lock is the explicit user opt-in required before any live order.
 */
export async function PATCH(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  let body: { exchange?: string; tradeEnabled?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const exchange = body.exchange;
  if (!exchange || !SUPPORTED_EXCHANGES.has(exchange)) {
    return NextResponse.json({ error: "Invalid exchange" }, { status: 400 });
  }
  if (typeof body.tradeEnabled !== "boolean") {
    return NextResponse.json(
      { error: "tradeEnabled (boolean) is required" },
      { status: 400 }
    );
  }

  const existing = await db.exchangeCredential.findUnique({
    where: { userId_exchange: { userId: user!.id, exchange } },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "No saved credential for this exchange" },
      { status: 404 }
    );
  }

  const updated = await db.exchangeCredential.update({
    where: { userId_exchange: { userId: user!.id, exchange } },
    data: { tradeEnabled: body.tradeEnabled },
    select: {
      id: true,
      exchange: true,
      label: true,
      apiKeyHint: true,
      tradeEnabled: true,
      lastTestedAt: true,
      lastTestOk: true,
      lastTestError: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/exchange/credentials?exchange=okx
 *
 * Removes the credential row for the given exchange. Also clears
 * any bot.mode = "live" → "paper" because they'd otherwise try to
 * trade with no key.
 */
export async function DELETE(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const exchange = request.nextUrl.searchParams.get("exchange");
  if (!exchange || !SUPPORTED_EXCHANGES.has(exchange)) {
    return NextResponse.json({ error: "Invalid exchange" }, { status: 400 });
  }

  await db.$transaction([
    db.exchangeCredential.deleteMany({
      where: { userId: user!.id, exchange },
    }),
    db.tradingBot.updateMany({
      where: { userId: user!.id, exchange, mode: "live" },
      data: { mode: "paper", exchange: null },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
