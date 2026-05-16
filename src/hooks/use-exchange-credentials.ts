"use client";

import { useCallback, useEffect, useState } from "react";

export interface ExchangeCredentialMeta {
  id: string;
  exchange: string; // "okx"
  label: string | null;
  apiKeyHint: string | null;
  tradeEnabled: boolean;
  lastTestedAt: string | null;
  lastTestOk: boolean | null;
  lastTestError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveCredentialInput {
  exchange: "okx";
  apiKey: string;
  secret: string;
  passphrase: string;
  label?: string;
}

export interface TestConnectionInput {
  exchange?: "okx";
  // Either provide all 3 to test before saving, or leave them off
  // to test the stored record.
  apiKey?: string;
  secret?: string;
  passphrase?: string;
}

export interface TestConnectionResult {
  ok: true;
  uid: string;
  totalEqUsdt: number;
  perms: string[];
  posMode: string;
  warnings: string[];
}

export function useExchangeCredentials() {
  const [credentials, setCredentials] = useState<ExchangeCredentialMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/exchange/credentials");
      if (!res.ok) throw new Error("Failed to load credentials");
      setCredentials(await res.json());
    } catch {
      // keep last known state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (input: SaveCredentialInput) => {
      const res = await fetch("/api/exchange/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save credential");
      }
      await refresh();
      return (await res.json()) as ExchangeCredentialMeta;
    },
    [refresh]
  );

  const setTradeEnabled = useCallback(
    async (exchange: "okx", tradeEnabled: boolean) => {
      const res = await fetch("/api/exchange/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchange, tradeEnabled }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update trade lock");
      }
      await refresh();
      return (await res.json()) as ExchangeCredentialMeta;
    },
    [refresh]
  );

  const remove = useCallback(
    async (exchange: "okx") => {
      const res = await fetch(
        `/api/exchange/credentials?exchange=${encodeURIComponent(exchange)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete credential");
      await refresh();
    },
    [refresh]
  );

  const test = useCallback(
    async (input: TestConnectionInput = {}): Promise<TestConnectionResult> => {
      const res = await fetch("/api/exchange/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Test failed");
      }
      // Refresh so lastTested* fields update in the UI when testing
      // a stored credential.
      await refresh();
      return data as TestConnectionResult;
    },
    [refresh]
  );

  return {
    credentials,
    loading,
    refresh,
    save,
    remove,
    test,
    setTradeEnabled,
  };
}
