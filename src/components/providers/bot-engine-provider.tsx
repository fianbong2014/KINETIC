"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useBotEngine } from "@/hooks/use-bot-engine";

interface BotEngineContextValue {
  forceRun: (
    botId: string,
    options?: { ignoreCooldown?: boolean }
  ) => Promise<void>;
}

const BotEngineContext = createContext<BotEngineContextValue | null>(null);

/**
 * Mounts the bot engine once for the whole authenticated app and
 * exposes its `forceRun` action via context, so the /bots page can
 * trigger a manual evaluation regardless of which page the user is on.
 */
export function BotEngineProvider({ children }: { children: ReactNode }) {
  const { forceRun } = useBotEngine();
  return (
    <BotEngineContext.Provider value={{ forceRun }}>
      {children}
    </BotEngineContext.Provider>
  );
}

export function useBotEngineContext(): BotEngineContextValue {
  const ctx = useContext(BotEngineContext);
  if (!ctx) {
    // Graceful fallback so components that mount before the provider
    // (or outside the authenticated tree) don't crash.
    return {
      forceRun: async () => {},
    };
  }
  return ctx;
}
