/**
 * Server-side OKX credential resolver.
 *
 * Loads a user's stored ExchangeCredential, decrypts it, and enforces
 * the trade lock. Never import from client code — this touches the
 * decryption key.
 */

import { db } from "@/lib/db";
import { decryptString } from "@/lib/crypto";
import type { OkxCredentials } from "@/lib/exchange/okx";

export class CredentialError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number = 400
  ) {
    super(message);
    this.name = "CredentialError";
  }
}

interface ResolveOptions {
  /** require `tradeEnabled` to be true (use for order placement) */
  requireTradeEnabled?: boolean;
}

/**
 * Returns decrypted OKX credentials for the given user, or throws a
 * CredentialError with an appropriate HTTP status.
 */
export async function resolveOkxCredentials(
  userId: string,
  opts: ResolveOptions = {}
): Promise<OkxCredentials> {
  const row = await db.exchangeCredential.findUnique({
    where: { userId_exchange: { userId, exchange: "okx" } },
  });

  if (!row) {
    throw new CredentialError(
      "No OKX credentials saved — connect OKX in Settings first",
      400
    );
  }

  if (opts.requireTradeEnabled && !row.tradeEnabled) {
    throw new CredentialError(
      "OKX trade lock is DISABLED — enable it in Settings before placing live orders",
      403
    );
  }

  if (!row.passphraseCipher || !row.passphraseIv || !row.passphraseTag) {
    throw new CredentialError(
      "Stored OKX credential is missing passphrase — please re-save the key",
      400
    );
  }

  try {
    return {
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
    // Most common cause: AUTH_SECRET changed after the key was saved.
    throw new CredentialError(
      e instanceof Error
        ? `Failed to decrypt OKX credentials: ${e.message} — re-save the key (AUTH_SECRET may have changed)`
        : "Failed to decrypt OKX credentials",
      500
    );
  }
}
