import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    db.journalEntry.findMany({
      where: { userId: user!.id },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    db.journalEntry.count({ where: { userId: user!.id } }),
  ]);

  return NextResponse.json({ entries, total, page, limit });
}

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const { date, pair, side, entry, exit, pnl, pnlPct, rrr, strategy, notes } =
      await request.json();

    if (!pair || !side || entry == null || exit == null) {
      return NextResponse.json(
        { error: "pair, side, entry, and exit are required" },
        { status: 400 }
      );
    }

    // Generate next displayId
    const lastEntry = await db.journalEntry.findFirst({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
      select: { displayId: true },
    });

    let nextNum = 1001;
    if (lastEntry?.displayId) {
      const match = lastEntry.displayId.match(/K-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }

    const journalEntry = await db.journalEntry.create({
      data: {
        userId: user!.id,
        displayId: `K-${nextNum}`,
        date: new Date(date || Date.now()),
        pair,
        side,
        entry,
        exit,
        pnl: pnl ?? exit - entry,
        pnlPct: pnlPct ?? 0,
        rrr: rrr || "1:1",
        strategy: strategy || "",
        notes: notes || "",
      },
    });

    return NextResponse.json(journalEntry, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create journal entry" },
      { status: 500 }
    );
  }
}
