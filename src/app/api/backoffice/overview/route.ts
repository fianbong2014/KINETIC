import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const now = Date.now();
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    adminCount,
    disabledCount,
    paperBalanceAgg,
    activeTraderRows,
    openPositions,
    totalPositions,
    closedPnlAgg,
    activeBots,
    totalBots,
    newUsers7d,
    newUsers30d,
    topByBalance,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "ADMIN" } }),
    db.user.count({ where: { disabled: true } }),
    db.user.aggregate({ _sum: { paperBalance: true } }),
    db.position.findMany({
      where: { status: "active" },
      select: { userId: true },
      distinct: ["userId"],
    }),
    db.position.count({ where: { status: "active" } }),
    db.position.count(),
    db.position.aggregate({
      where: { status: "closed" },
      _sum: { pnl: true },
    }),
    db.tradingBot.count({ where: { enabled: true } }),
    db.tradingBot.count(),
    db.user.count({ where: { createdAt: { gte: since7d } } }),
    db.user.count({ where: { createdAt: { gte: since30d } } }),
    db.user.findMany({
      orderBy: { paperBalance: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, paperBalance: true, role: true },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    adminCount,
    disabledCount,
    totalPaperBalance: paperBalanceAgg._sum.paperBalance ?? 0,
    activeTraders: activeTraderRows.length,
    openPositions,
    totalPositions,
    totalClosedPnl: closedPnlAgg._sum.pnl ?? 0,
    activeBots,
    totalBots,
    newUsers7d,
    newUsers30d,
    topByBalance,
  });
}
