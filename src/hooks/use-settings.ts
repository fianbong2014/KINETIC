"use client";

import { useCallback, useEffect, useState } from "react";

export interface Settings {
  trading?: {
    defaultOrderType?: string;
    defaultLeverage?: string;
    defaultSizePercent?: number;
    confirmBeforeOpen?: boolean;
    confirmBeforeClose?: boolean;
    confirmBeforeModifySLTP?: boolean;
    slippageTolerance?: string;
  };
  risk?: {
    maxDailyLossPercent?: number;
    maxDrawdownPercent?: number;
    maxPositionSizePercent?: number;
    maxOpenPositions?: number;
    maxLeverage?: number;
    killSwitch?: boolean;
  };
  display?: {
    defaultChartTimeframe?: string;
    numberFormat?: string;
    timezone?: string;
    priceFlashAnimations?: boolean;
  };
  notifications?: {
    alertTypes?: {
      priceTarget?: boolean;
      signalDetection?: boolean;
      tradeExecution?: boolean;
      riskLimitWarnings?: boolean;
      stopLossTriggered?: boolean;
      takeProfitHit?: boolean;
    };
    deliveryMethods?: {
      inApp?: boolean;
      browserPush?: boolean;
      emailDigest?: boolean;
      telegram?: boolean;
    };
    soundEffects?: boolean;
  };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to load settings");
        setSettings(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to save");
      const merged = await res.json();
      setSettings(merged);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, error, update };
}
