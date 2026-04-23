import { TradingPreferences } from "@/components/settings/trading-preferences";
import { RiskLimits } from "@/components/settings/risk-limits";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { DisplaySettings } from "@/components/settings/display-settings";
import { ApiConnections } from "@/components/settings/api-connections";
import { AccountSettings } from "@/components/settings/account-settings";
import { CustomIndicatorsSettings } from "@/components/settings/custom-indicators-settings";

export default function SettingsPage() {
  return (
    <div className="grid grid-cols-12 gap-3 lg:gap-6">
      {/* Left Column */}
      <div className="col-span-12 xl:col-span-4 flex flex-col gap-3 lg:gap-6">
        <AccountSettings />
        <ApiConnections />
      </div>

      {/* Middle Column */}
      <div className="col-span-12 lg:col-span-6 xl:col-span-4 flex flex-col gap-3 lg:gap-6">
        <TradingPreferences />
        <RiskLimits />
      </div>

      {/* Right Column */}
      <div className="col-span-12 lg:col-span-6 xl:col-span-4 flex flex-col gap-3 lg:gap-6">
        <NotificationSettings />
        <DisplaySettings />
      </div>

      {/* Full-width */}
      <div className="col-span-12">
        <CustomIndicatorsSettings />
      </div>
    </div>
  );
}
