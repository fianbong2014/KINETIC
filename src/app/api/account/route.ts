import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// GET /api/account — Returns user's paper trading account + live stats
export async function GET() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const [dbUser, activePositions, closedPositions] = await Promise.all([
    db.user.findUnique({
      where: { id: user!.id },
      select: {
        paperBalance: true,
        startingBalance: true,
        email: true,
        name: true,
      },
    }),
    db.position.findMany({
      where: { userId: user!.id, status: "active" },
      select: { size: true, entry: true, side: true },
    }),
    db.position.findMany({
      where: { userId: user!.id, status: "closed" },
      select: { pnl: true, closedAt: true },
    }),
  ]);

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Total exposure = sum of active position notionals
  const totalExposure = activePositions.reduce(
    (sum, p) => sum + p.size * p.entry,
    0
  );

  // Realized PNL = sum of closed position pnls
  const realizedPnl = closedPositions.reduce(
    (sum, p) => sum + (p.pnl || 0),
    0
  );

  // Today's realized PNL
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const todayPnl = closedPositions
    .filter((p) => p.closedAt && new Date(p.closedAt) >= startOfDay)
    .reduce((sum, p) => sum + (p.pnl || 0), 0);

  // Equity curve value: starting + all realized PNL (unrealized computed on client from positions)
  const equity = dbUser.startingBalance + realizedPnl;

  // Drawdown: (equity - peak) / peak. Peak approximated as max(starting, equity).
  const peak = Math.max(dbUser.startingBalance, equity);
  const drawdown = peak > 0 ? ((equity - peak) / peak) * 100 : 0;

  return NextResponse.json({
    balance: dbUser.paperBalance,
    startingBalance: dbUser.startingBalance,
    equity,
    totalExposure,
    realizedPnl,
    todayPnl,
    drawdown,
    openPositions: activePositions.length,
    totalClosedTrades: closedPositions.length,
  });
}

// POST /api/account/reset — Reset paper account back to starting balance (handy for testing)
// Not implementing now, can add later if needed.
