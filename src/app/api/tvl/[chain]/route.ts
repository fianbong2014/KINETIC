import { NextResponse } from "next/server";
import { PAIRS } from "@/lib/symbols";

// Restrict the proxy to chains we actually map from a trading pair so this
// endpoint can't be turned into a general DeFiLlama fetcher.
const ALLOWED = new Set(
  PAIRS.map((p) => p.defillamaChain).filter((c): c is string => !!c),
);

const REVALIDATE = 600; // DeFiLlama updates daily — 10 min cache is fine.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chain: string }> },
) {
  const { chain } = await params;
  if (!ALLOWED.has(chain)) {
    return NextResponse.json(
      { error: "Unknown chain" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `https://api.llama.fi/v2/historicalChainTvl/${encodeURIComponent(chain)}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: REVALIDATE },
      },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status}` },
        { status: 502 },
      );
    }
    const raw = (await res.json()) as Array<{ date: number; tvl: number }>;
    // Take last 30 daily points for sparkline + change calc; full history
    // would bloat the response unnecessarily.
    const trimmed = raw.slice(-30);
    const latest = trimmed[trimmed.length - 1]?.tvl ?? null;
    const first = trimmed[0]?.tvl ?? null;
    const changePct30d =
      latest !== null && first !== null && first > 0
        ? ((latest - first) / first) * 100
        : null;

    return NextResponse.json(
      {
        chain,
        latestTvlUsd: latest,
        changePct30d,
        history: trimmed,
      },
      {
        headers: {
          "Cache-Control": `public, max-age=120, s-maxage=${REVALIDATE}`,
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fetch failed" },
      { status: 500 },
    );
  }
}
