/**
 * AES-256-GCM helpers for encrypting exchange API secrets at rest.
 *
 * The encryption key is derived from `AUTH_SECRET` via PBKDF2 with a
 * fixed app-level salt. This means:
 *   - rotating AUTH_SECRET will invalidate all stored credentials
 *     (user has to re-enter their OKX key — acceptable trade-off for
 *     not adding a separate `KEY_ENCRYPTION_KEY` env var)
 *   - the salt is constant *within* the app, but each ciphertext gets
 *     a fresh random IV so identical plaintexts encrypt to different
 *     ciphertexts (so secrets can't be compared by ciphertext)
 *
 * Server-only — never import from client code.
 */

import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from "node:crypto";

const ALGO = "aes-256-gcm";
const KEY_LEN = 32; // 256-bit key
const IV_LEN = 12; // GCM standard
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_SALT = "kinetic.exchange.cred.v1"; // app-level constant

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short — required for encrypting exchange credentials"
    );
  }

  cachedKey = pbkdf2Sync(
    secret,
    PBKDF2_SALT,
    PBKDF2_ITERATIONS,
    KEY_LEN,
    "sha256"
  );
  return cachedKey;
}

export interface EncryptedField {
  cipher: string; // base64
  iv: string; // base64
  tag: string; // base64
}

export function encryptString(plaintext: string): EncryptedField {
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    throw new Error("encryptString: plaintext must be a non-empty string");
  }

  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    cipher: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptString(field: EncryptedField): string {
  const { cipher, iv, tag } = field;
  if (!cipher || !iv || !tag) {
    throw new Error("decryptString: missing cipher/iv/tag");
  }

  const decipher = createDecipheriv(
    ALGO,
    getKey(),
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipher, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Display hint = first 4 + ellipsis + last 4 of a public api key.
 * Safe to render in UI / logs.
 */
export function makeApiKeyHint(apiKey: string): string {
  const k = apiKey.trim();
  if (k.length <= 8) return "****";
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}
