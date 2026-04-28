"use client";

import { useEffect, useState } from "react";
import { getEvaluations, type BotEvaluation } from "@/lib/bot-diagnostics";

/**
 * Subscribes to a single bot's diagnostic log. Re-renders whenever the
 * engine appends a new evaluation via `recordEvaluation()`.
 */
export function useBotDiagnostics(botId: string): {
  evaluations: BotEvaluation[];
  latest: BotEvaluation | null;
} {
  const [evaluations, setEvaluations] = useState<BotEvaluation[]>(() =>
    getEvaluations(botId)
  );

  useEffect(() => {
    setEvaluations(getEvaluations(botId));

    function handle(e: Event) {
      const ce = e as CustomEvent<{ botId: string }>;
      if (!ce.detail || ce.detail.botId === botId) {
        setEvaluations(getEvaluations(botId));
      }
    }

    window.addEventListener("kinetic:bot-diagnostics", handle);
    // Also refresh on storage events (other tabs)
    window.addEventListener("storage", handle);
    return () => {
      window.removeEventListener("kinetic:bot-diagnostics", handle);
      window.removeEventListener("storage", handle);
    };
  }, [botId]);

  return {
    evaluations,
    latest: evaluations[0] ?? null,
  };
}
