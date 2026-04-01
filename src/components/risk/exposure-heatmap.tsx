"use client";

const heatmapTiles = [
  { label: "BTC", colorClass: "bg-primary/20 text-primary" },
  { label: "ETH", colorClass: "bg-secondary/10 text-secondary" },
  { label: "SOL", colorClass: "bg-emerald-accent/15 text-emerald-accent" },
  { label: "LINK", colorClass: "bg-orange/15 text-orange" },
  { label: "AVAX", colorClass: "bg-crimson/10 text-crimson" },
  { label: "DOT", colorClass: "bg-on-surface-variant/10 text-on-surface-variant" },
];

export function ExposureHeatmap() {
  return (
    <div className="col-span-12 lg:col-span-5 bg-surface-container-low overflow-hidden">
      {/* Title */}
      <div className="p-6 pb-4">
        <h3 className="text-sm font-medium text-on-surface tracking-wider uppercase mb-2">
          Exposure Heatmap
        </h3>
        <div className="h-[1px] w-12 bg-primary" />
      </div>

      {/* 3x2 Grid of tiles */}
      <div className="grid grid-cols-3 grid-rows-2 gap-[1px] p-1">
        {heatmapTiles.map((tile) => (
          <div
            key={tile.label}
            className={`${tile.colorClass} flex items-center justify-center py-8 transition-opacity hover:opacity-80`}
          >
            <span className="text-2xl font-black uppercase tracking-wider">
              {tile.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
