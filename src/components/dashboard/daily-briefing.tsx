"use client";

import { useDailyBriefing } from "@/hooks/use-daily-briefing";
import { DailyBriefingModal } from "@/components/dashboard/daily-briefing-modal";

/**
 * Mounts the daily briefing flow. Auto-opens once per calendar day on
 * dashboard load; renders nothing the rest of the time.
 */
export function DailyBriefing() {
  const { data, loading, open, dismiss } = useDailyBriefing(true);

  if (!open) return null;

  return (
    <DailyBriefingModal data={data} loading={loading} onClose={dismiss} />
  );
}
