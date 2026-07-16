import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

// Safe fields only — never passwordHash, never settings.
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  disabled: true,
  paperBalance: true,
  startingBalance: true,
  createdAt: true,
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [
    positions,
    positionsTotal,
    activePositions,
    tradingBots,
    journalEntriesCount,
    activeAlerts,
    exchangeCredentials,
    closedAgg,
    closedCount,
    wins,
    bots,
    journalEntries,
  ] = await Promise.all([
    db.position.findMany({
      where: { userId: id },
      orderBy: { openedAt: "desc" },
      take: 10,
      select: {
        id: true,
        asset: true,
        side: true,
        size: true,
        entry: true,
        exit: true,
        pnl: true,
        status: true,
        mode: true,
        openedAt: true,
        closedAt: true,
      },
    }),
    db.position.count({ where: { userId: id } }),
    db.position.count({ where: { userId: id, status: "active" } }),
    db.tradingBot.count({ where: { userId: id } }),
    db.journalEntry.count({ where: { userId: id } }),
    db.priceAlert.count({ where: { userId: id, active: true } }),
    db.exchangeCredential.count({ where: { userId: id } }),
    db.position.aggregate({
      where: { userId: id, status: "closed" },
      _sum: { pnl: true },
    }),
    db.position.count({ where: { userId: id, status: "closed" } }),
    db.position.count({ where: { userId: id, status: "closed", pnl: { gt: 0 } } }),
    db.tradingBot.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        enabled: true,
        symbols: true,
        createdAt: true,
      },
    }),
    db.journalEntry.findMany({
      where: { userId: id },
      orderBy: { date: "desc" },
      take: 5,
      select: {
        id: true,
        pair: true,
        side: true,
        pnl: true,
        pnlPct: true,
        date: true,
      },
    }),
  ]);

  const closedPnl = closedAgg._sum.pnl ?? 0;
  const winRate = closedCount > 0 ? (wins / closedCount) * 100 : 0;

  return NextResponse.json({
    user,
    counts: {
      positions: positionsTotal,
      activePositions,
      tradingBots,
      journalEntries: journalEntriesCount,
      activeAlerts,
      exchangeCredentials,
    },
    stats: {
      closedPnl,
      closedCount,
      wins,
      winRate,
    },
    positions,
    bots,
    journalEntries,
  });
}
