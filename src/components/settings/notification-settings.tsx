"use client";

import { Bell, Volume2 } from "lucide-react";

export function NotificationSettings() {
  return (
    <section className="bg-surface-container-low p-5 space-y-6 border border-outline-variant/10">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-cyan" />
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
          Notifications
        </h2>
      </div>

      <div className="space-y-4">
        {/* Alert Categories */}
        <div className="bg-surface-container p-3 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
            Alert Types
          </p>
          <ToggleRow label="Price target alerts" defaultOn={true} />
          <ToggleRow label="Signal detection" defaultOn={true} />
          <ToggleRow label="Trade execution" defaultOn={true} />
          <ToggleRow label="Risk limit warnings" defaultOn={true} />
          <ToggleRow label="Stop-loss triggered" defaultOn={true} />
          <ToggleRow label="Take-profit hit" defaultOn={true} />
        </div>

        {/* Delivery */}
        <div className="bg-surface-container p-3 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
            Delivery Method
          </p>
          <ToggleRow label="In-app notifications" defaultOn={true} />
          <ToggleRow label="Browser push" defaultOn={false} />
          <ToggleRow label="Email digest" defaultOn={false} />
          <ToggleRow label="Telegram bot" defaultOn={false} />
        </div>

        {/* Sound */}
        <div className="bg-surface-container p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
                Sound Effects
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={true}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-container-high peer-checked:bg-cyan/30 transition-colors relative">
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-on-surface-variant peer-checked:bg-cyan transition-all peer-checked:translate-x-4" />
              </div>
            </label>
          </div>
          <p className="text-[10px] text-on-surface-variant">
            Audio feedback for trade execution and alerts
          </p>
        </div>
      </div>
    </section>
  );
}

function ToggleRow({
  label,
  defaultOn,
}: {
  label: string;
  defaultOn: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-on-surface">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          defaultChecked={defaultOn}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-surface-container-high peer-checked:bg-cyan/30 transition-colors relative">
          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-on-surface-variant peer-checked:bg-cyan transition-all peer-checked:translate-x-4" />
        </div>
      </label>
    </div>
  );
}
