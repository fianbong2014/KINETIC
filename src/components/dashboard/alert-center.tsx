"use client";

import { useState } from "react";
import { Bell, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useAlerts, type PriceAlert } from "@/hooks/use-alerts";
import { useToast } from "@/components/providers/toast-provider";
import { usePrice } from "@/components/providers/price-provider";
import { CreateAlertDialog } from "@/components/dashboard/create-alert-dialog";
import { formatPrice } from "@/lib/format";

type View = "active" | "triggered";

export function AlertCenter() {
  const { alerts: activeAlerts, loading, toggle, remove } = useAlerts();
  const { alerts: allAlerts } = useAlerts({ includeTriggered: true });
  const triggeredAlerts = allAlerts.filter((a) => a.triggeredAt);

  const { price: livePrice, symbol } = usePrice();
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [view, setView] = useState<View>("active");

  async function handleDelete(alert: PriceAlert) {
    try {
      await remove(alert.id);
      toast.info("Alert Deleted", `${alert.symbol} ${alert.direction} $${formatPrice(alert.price)}`);
    } catch {
      toast.error("Delete Failed", "Try again");
    }
  }

  async function handleToggle(alert: PriceAlert) {
    try {
      await toggle(alert.id, !alert.active);
    } catch {
      toast.error("Update Failed", "Try again");
    }
  }

  const displayed = view === "active" ? activeAlerts : triggeredAlerts;

  return (
    <>
      <section className="bg-surface-container-low p-4 lg:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan" />
              <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
                Alerts
              </h2>
            </div>
            <div className="flex gap-1">
              <TabButton
                active={view === "active"}
                onClick={() => setView("active")}
              >
                Active ({activeAlerts.length})
              </TabButton>
              <TabButton
                active={view === "triggered"}
                onClick={() => setView("triggered")}
              >
                Fired ({triggeredAlerts.length})
              </TabButton>
            </div>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 bg-cyan text-[#004343] text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3 h-3" />
            New Alert
          </button>
        </div>

        <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-xs text-on-surface-variant">
              Loading alerts...
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-8 text-xs text-on-surface-variant">
              {view === "active"
                ? "No active alerts. Click New Alert to create one."
                : "No alerts have fired yet."}
            </div>
          ) : (
            displayed.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                currentPrice={alert.symbol === symbol ? livePrice : 0}
                onToggle={() => handleToggle(alert)}
                onDelete={() => handleDelete(alert)}
              />
            ))
          )}
        </div>
      </section>

      {dialogOpen && <CreateAlertDialog onClose={() => setDialogOpen(false)} />}
    </>
  );
}

function AlertRow({
  alert,
  currentPrice,
  onToggle,
  onDelete,
}: {
  alert: PriceAlert;
  currentPrice: number;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isAbove = alert.direction === "above";
  const triggered = !!alert.triggeredAt;

  // Distance from current price
  const diffPct =
    currentPrice > 0
      ? ((alert.price - currentPrice) / currentPrice) * 100
      : 0;

  const DirectionIcon = isAbove ? ArrowUp : ArrowDown;
  const dirColor = isAbove ? "text-emerald-accent" : "text-crimson";

  return (
    <div
      className={`group flex items-center gap-3 bg-surface-container p-2.5 hover:bg-surface-container-high transition-colors ${
        !alert.active && !triggered ? "opacity-50" : ""
      }`}
    >
      <DirectionIcon className={`w-3.5 h-3.5 shrink-0 ${dirColor}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-on-surface">
            {alert.symbol}
          </span>
          <span className="font-mono tabular-nums text-xs text-on-surface">
            ${formatPrice(alert.price)}
          </span>
          {currentPrice > 0 && !triggered && (
            <span
              className={`text-[9px] font-mono tabular-nums ${
                diffPct >= 0 ? "text-emerald-accent" : "text-crimson"
              }`}
            >
              ({diffPct >= 0 ? "+" : ""}
              {diffPct.toFixed(2)}%)
            </span>
          )}
        </div>
        {(alert.message || triggered) && (
          <p className="text-[10px] text-on-surface-variant truncate">
            {triggered
              ? `Fired ${new Date(alert.triggeredAt!).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : alert.message}
          </p>
        )}
      </div>

      {!triggered && (
        <button
          onClick={onToggle}
          className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant hover:text-cyan transition-colors"
        >
          {alert.active ? "Pause" : "Resume"}
        </button>
      )}

      <button
        onClick={onDelete}
        className="text-on-surface-variant hover:text-crimson transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Delete alert"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-[9px] font-bold tracking-widest uppercase transition-colors ${
        active
          ? "bg-surface-container-highest text-cyan border-b-2 border-cyan"
          : "text-on-surface-variant hover:text-on-surface"
      }`}
    >
      {children}
    </button>
  );
}
