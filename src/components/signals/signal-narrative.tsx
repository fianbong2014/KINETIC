"use client";

export function SignalNarrative() {
  return (
    <div className="bg-surface-container-low p-8">
      <h4 className="text-xl font-black uppercase tracking-tighter font-heading text-on-surface mb-4">
        Signal Narrative
      </h4>
      <p className="text-sm text-on-surface-variant leading-relaxed">
        The current setup identifies a{" "}
        <span className="text-on-surface font-semibold">Liquidity Grab</span>{" "}
        below the recent swing low, a large institutional-footprint candle,
        and a reclaim above the{" "}
        <span className="text-on-surface font-semibold">
          weekly value area high
        </span>
        . This triple confluence event has historically preceded sharp rallies
        of at least 6% in the prior four instances this quarter. Volume
        analysis shows significant{" "}
        <span className="text-on-surface font-semibold">accumulation</span>{" "}
        in the $60,200-$61,000 range with declining sell-side pressure. The
        funding rate remains neutral, suggesting the move is spot-driven
        rather than leveraged speculation.
      </p>
    </div>
  );
}
