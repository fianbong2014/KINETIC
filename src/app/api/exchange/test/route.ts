import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { decryptString } from "@/lib/crypto";
import {
  testConnection,
  OkxApiError,
  type OkxCredentials,
} from "@/lib/exchange/okx";

/**
 * POST /api/exchange/test
 *
 * Body (optional): { exchange?: "okx", apiKey?, secret?, passphrase? }
 *
 * Two modes:
 *   1. Body has full credentials → test those WITHOUT persisting
 *      (used by the settings form before save)
 *   2. Body is empty / only has exchange → load the saved record,
 *      decrypt, and test (used by the "Test Connection" button next
 *      to an already-saved credential)
 *
 * Always writes lastTestedAt / lastTestOk / lastTestError when a
 * stored record was used.
 */
export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  let body: {
    exchange?: string;
    apiKey?: string;
    secret?: string;
    passphrase?: string;
  } = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const exchange = body.exchange || "okx";
  if (exchange !== "okx") {
    return NextResponse.json(
      { error: `Unsupported exchange: ${exchange}` },
      { status: 400 }
    );
  }

  // Decide credential source
  let creds: OkxCredentials | null = null;
  let usingStored = false;

  if (body.apiKey && body.secret && body.passphrase) {
    creds = {
      apiKey: body.apiKey.trim(),
      secret: body.secret.trim(),
      passphrase: body.passphrase.trim(),
    };
  } else {
    usingStored = true;
    const row = await db.exchangeCredential.findUnique({
      where: { userId_exchange: { userId: user!.id, exchange } },
    });
    if (!row) {
      return NextResponse.json(
        { error: "No saved credential for this exchange" },
        { status: 404 }
      );
    }
    if (!row.passphraseCipher || !row.passphraseIv || !row.passphraseTag) {
      return NextResponse.json(
        { error: "Stored credential is missing passphrase — please re-save" },
        { status: 400 }
      );
    }
    try {
      creds = {
        apiKey: decryptString({
          cipher: row.apiKeyCipher,
          iv: row.apiKeyIv,
          tag: row.apiKeyTag,
        }),
        secret: decryptString({
          cipher: row.apiSecretCipher,
          iv: row.apiSecretIv,
          tag: row.apiSecretTag,
        }),
        passphrase: decryptString({
          cipher: row.passphraseCipher,
          iv: row.passphraseIv,
          tag: row.passphraseTag,
        }),
      };
    } catch (e) {
      return NextResponse.json(
        {
          error:
            e instanceof Error
              ? `Failed to decrypt stored credentials: ${e.message}`
              : "Failed to decrypt stored credentials",
        },
        { status: 500 }
      );
    }
  }

  // Run the actual OKX call
  try {
    const result = await testConnection(creds!);

    // Sanity check perms — warn (not fail) if "withdraw" is enabled
    // because best-practice for trading bots is read+trade only.
    const warnings: string[] = [];
    if (!result.perms.includes("trade")) {
      warnings.push(
        "API key does not have Trade permission — live orders will fail"
      );
    }
    if (result.perms.includes("withdraw")) {
      warnings.push(
        "API key has Withdraw permission enabled — recommended to disable for safety"
      );
    }

    if (usingStored) {
      await db.exchangeCredential.update({
        where: { userId_exchange: { userId: user!.id, exchange } },
        data: {
          lastTestedAt: new Date(),
          lastTestOk: true,
          lastTestError: null,
        },
      });
    }

    return NextResponse.json({ ...result, warnings });
  } catch (err) {
    const errorMsg =
      err instanceof OkxApiError
        ? `${err.code}: ${err.message}`
        : err instanceof Error
        ? err.message
        : "Unknown error";

    if (usingStored) {
      await db.exchangeCredential.update({
        where: { userId_exchange: { userId: user!.id, exchange } },
        data: {
          lastTestedAt: new Date(),
          lastTestOk: false,
          lastTestError: errorMsg.slice(0, 500),
        },
      });
    }

    return NextResponse.json(
      { ok: false, error: errorMsg },
      { status: 400 }
    );
  }
}
