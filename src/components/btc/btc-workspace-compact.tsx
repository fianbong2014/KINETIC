"use client";

import { BtcHero } from "@/components/btc/btc-hero";
import { BtcFunding } from "@/components/btc/btc-funding";
import { BtcOpenInterest } from "@/components/btc/btc-open-interest";
import { BtcLongShort } from "@/components/btc/btc-long-short";
import { BtcFearGreed } from "@/components/btc/btc-fear-greed";
import { BtcDominance } from "@/components/btc/btc-dominance";
import { BtcMempool } from "@/components/btc/btc-mempool";
import { BtcLiquidations } from "@/components/btc/btc-liquidations";
import { BtcWhales } from "@/components/btc/btc-whales";
import { BtcNotifications } from "@/components/btc/btc-notifications";

// Compact workspace — the original BTC monitor layout. Three dense
// rows with all widgets visible at once.
export function BtcWorkspaceCompact() {
  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <BtcHero />

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 md:col-span-4">
          <BtcFunding />
        </div>
        <div className="col-span-12 md:col-span-4">
          <BtcOpenInterest />
        </div>
        <div className="col-span-12 md:col-span-4">
          <BtcLongShort />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 md:col-span-4">
          <BtcFearGreed />
        </div>
        <div className="col-span-12 md:col-span-4">
          <BtcDominance />
        </div>
        <div className="col-span-12 md:col-span-4">
          <BtcMempool />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 lg:col-span-4">
          <BtcLiquidations />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <BtcWhales />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <BtcNotifications />
        </div>
      </div>
    </div>
  );
}
