"use client";

import { useEffect, useState } from "react";
import { Bell, Volume2 } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import {
  getPermission,
  isNotificationSupported,
  requestPermission,
} from "@/lib/notifications";

export function NotificationSettings() {
  const { settings, loading, saving, update } = useSettings();
  const notifications = settings.notifications || {};
  const alertTypes = notifications.alertTypes || {};
  const deliveryMethods = notifications.deliveryMethods || {};

  const [permission, setPermissionState] = useState<
    NotificationPermission | "unsupported"
  >("default");

  useEffect(() => {
    setPermissionState(getPermission());
  }, []);

  async function handleRequestPermission() {
    const result = await requestPermission();
    setPermissionState(result);
    if (result === "granted") {
      // auto-enable browser push toggle
      update({
        notifications: {
          ...notifications,
          deliveryMethods: { ...deliveryMethods, browserPush: true },
        },
      });
    }
  }

  function patchAlert(key: string, value: boolean) {
    update({
      notifications: {
        ...notifications,
        alertTypes: { ...alertTypes, [key]: value },
      },
    });
  }

  function patchDelivery(key: string, value: boolean) {
    update({
      notifications: {
        ...notifications,
        deliveryMethods: { ...deliveryMethods, [key]: value },
      },
    });
  }

  function patchSound(value: boolean) {
    update({
      notifications: { ...notifications, soundEffects: value },
    });
  }

  return (
    <section className="bg-surface-container-low p-5 space-y-6 border border-outline-variant/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            Notifications
          </h2>
        </div>
        {saving && (
          <span className="text-[10px] text-cyan tracking-wider">SAVING…</span>
        )}
      </div>

      <div className={`space-y-4 ${loading ? "opacity-50" : ""}`}>
        {/* Browser permission */}
        {isNotificationSupported() && (
          <div className="bg-surface-container p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-on-surface">
                  Browser Notifications
                </p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  {permission === "granted"
                    ? "Permission granted"
                    : permission === "denied"
                      ? "Permission denied — enable in browser settings"
                      : "Allow KINETIC to send alerts when SL/TP is hit"}
                </p>
              </div>
              {permission !== "granted" && permission !== "denied" && (
                <button
                  onClick={handleRequestPermission}
                  className="shrink-0 bg-primary text-[#004343] font-bold text-[10px] uppercase tracking-wider px-3 py-2 hover:opacity-90 transition-opacity"
                >
                  Enable
                </button>
              )}
              {permission === "granted" && (
                <span className="shrink-0 text-[10px] text-emerald-accent font-bold tracking-wider uppercase">
                  ✓ ON
                </span>
              )}
            </div>
          </div>
        )}

        {/* Alert Categories */}
        <div className="bg-surface-container p-3 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
            Alert Types
          </p>
          <ToggleRow
            label="Price target alerts"
            checked={alertTypes.priceTarget ?? true}
            onChange={(v) => patchAlert("priceTarget", v)}
          />
          <ToggleRow
            label="Signal detection"
            checked={alertTypes.signalDetection ?? true}
            onChange={(v) => patchAlert("signalDetection", v)}
          />
          <ToggleRow
            label="Trade execution"
            checked={alertTypes.tradeExecution ?? true}
            onChange={(v) => patchAlert("tradeExecution", v)}
          />
          <ToggleRow
            label="Risk limit warnings"
            checked={alertTypes.riskLimitWarnings ?? true}
            onChange={(v) => patchAlert("riskLimitWarnings", v)}
          />
          <ToggleRow
            label="Stop-loss triggered"
            checked={alertTypes.stopLossTriggered ?? true}
            onChange={(v) => patchAlert("stopLossTriggered", v)}
          />
          <ToggleRow
            label="Take-profit hit"
            checked={alertTypes.takeProfitHit ?? true}
            onChange={(v) => patchAlert("takeProfitHit", v)}
          />
        </div>

        {/* Delivery */}
        <div className="bg-surface-container p-3 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
            Delivery Method
          </p>
          <ToggleRow
            label="In-app notifications"
            checked={deliveryMethods.inApp ?? true}
            onChange={(v) => patchDelivery("inApp", v)}
          />
          <ToggleRow
            label="Browser push"
            checked={deliveryMethods.browserPush ?? false}
            onChange={(v) => patchDelivery("browserPush", v)}
          />
          <ToggleRow
            label="Email digest"
            checked={deliveryMethods.emailDigest ?? false}
            onChange={(v) => patchDelivery("emailDigest", v)}
          />
          <ToggleRow
            label="Telegram bot"
            checked={deliveryMethods.telegram ?? false}
            onChange={(v) => patchDelivery("telegram", v)}
          />
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
                checked={notifications.soundEffects ?? true}
                onChange={(e) => patchSound(e.target.checked)}
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
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-on-surface">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-surface-container-high peer-checked:bg-cyan/30 transition-colors relative">
          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-on-surface-variant peer-checked:bg-cyan transition-all peer-checked:translate-x-4" />
        </div>
      </label>
    </div>
  );
}
