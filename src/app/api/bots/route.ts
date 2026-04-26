import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// GET /api/bots — list user's bots with current performance metrics
// computed from related positions.
export async function GET() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const bots = await db.tradingBot.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
    include: {
      positions: {
        select: {
          status: true,
          pnl: true,
        },
      },
    },
  });

  // Derive stats per bot from its positions
  const enriched = bots.map((b) => {
    const closed = b.positions.filter((p) => p.status === "closed");
    const active = b.positions.filter((p) => p.status === "active");
    const totalPnl = closed.reduce((s, p) => s + (p.pnl ?? 0), 0);
    const wins = closed.filter((p) => (p.pnl ?? 0) > 0).length;
    const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;

    // Strip raw positions before sending — keep payload tight
    const { positions: _positions, ...botCore } = b;
    void _positions;
    return {
      ...botCore,
      activeCount: active.length,
      totalTrades: closed.length,
      totalPnl,
      winRate,
    };
  });

  return NextResponse.json(enriched);
}

// POST /api/bots — create a new bot
export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const bot = await db.tradingBot.create({
      data: {
        userId: user!.id,
        name,
        symbols: Array.isArray(body.symbols) ? body.symbols : [],
        triggerType: body.triggerType || "mtf_aligned",
        tfFilter: body.tfFilter || "4h",
        minConfidence: clamp(toInt(body.minConfidence, 70), 0, 99),
        side: ["LONG", "SHORT", "ANY"].includes(body.side) ? body.side : "ANY",
        positionSizePct: clamp(toFloat(body.positionSizePct, 5), 0.1, 100),
        stopLossPct: optionalPositive(body.stopLossPct),
        takeProfitPct: optionalPositive(body.takeProfitPct),
        trailingPct: optionalPositive(body.trailingPct),
        maxOpenPositions: clamp(toInt(body.maxOpenPositions, 1), 1, 50),
        cooldownMinutes: clamp(toInt(body.cooldownMinutes, 60), 0, 10080),
        enabled: body.enabled !== false,
      },
    });

    return NextResponse.json(bot, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create bot" },
      { status: 500 }
    );
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function toInt(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toFloat(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function optionalPositive(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) && n > 0 ? n : null;
}
