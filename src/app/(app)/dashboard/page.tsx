import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { PositionMonitor } from "@/components/dashboard/position-monitor";
import { AlertMonitor } from "@/components/dashboard/alert-monitor";
import { DailyBriefing } from "@/components/dashboard/daily-briefing";

export default function DashboardPage() {
  return (
    <>
      {/* Renderless: auto-close on SL/TP, fire price alerts. The bot
          engine lives in (app) layout so it runs on every page. */}
      <PositionMonitor />
      <AlertMonitor />

      {/* Auto-opens once per day with overnight summary + top movers */}
      <DailyBriefing />

      <WorkspaceSwitcher />
    </>
  );
}
