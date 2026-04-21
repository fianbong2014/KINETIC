import { JournalStats } from "@/components/journal/journal-stats";
import { JournalEntries } from "@/components/journal/journal-entries";
import { EquityCurve } from "@/components/journal/equity-curve";
import { PerformanceBreakdown } from "@/components/journal/performance-breakdown";

export default function JournalPage() {
  return (
    <div className="flex flex-col gap-1 h-full">
      {/* Stats row */}
      <JournalStats />

      {/* Equity curve */}
      <EquityCurve />

      {/* Performance breakdown */}
      <PerformanceBreakdown />

      {/* Trade entries */}
      <JournalEntries />
    </div>
  );
}
