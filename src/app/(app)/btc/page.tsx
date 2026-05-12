import { BtcHero } from "@/components/btc/btc-hero";
import { BtcFunding } from "@/components/btc/btc-funding";
import { BtcOpenInterest } from "@/components/btc/btc-open-interest";
import { BtcLongShort } from "@/components/btc/btc-long-short";
import { BtcFearGreed } from "@/components/btc/btc-fear-greed";
import { BtcDominance } from "@/components/btc/btc-dominance";
import { BtcMempool } from "@/components/btc/btc-mempool";
import { BtcLiquidations } from "@/components/btc/btc-liquidations";
import { BtcWhales } from "@/components/btc/btc-whales";

export const metadata = {
  title: "BTC Monitor · KINETIC",
};

export default function BtcMonitorPage() {
  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      {/* Hero strip */}
      <BtcHero />

      {/* Row 1 — derivatives */}
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

      {/* Row 2 — sentiment & market */}
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

      {/* Row 3 — flow */}
      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 lg:col-span-6">
          <BtcLiquidations />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <BtcWhales />
        </div>
      </div>
    </div>
  );
}
