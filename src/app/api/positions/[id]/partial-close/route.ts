import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// POST /api/positions/[id]/partial-close
// Body: { closeSize: number; exit: number }
//
// Closes a portion of an active position. Implementation:
//   1. Reduce the original position's size by closeSize
//   2. Create a new closed position for the portion that was closed
//   3. Credit paperBalance with the realized PNL
//   4. Create a matching JournalEntry
//
// This preserves the history of individual partial exits instead of
// folding them all into the original row.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const closeSize = parseFloat(body.closeSize);
  const exit = parseFloat(body.exit);

  if (!Number.isFinite(closeSize) || closeSize <= 0) {
    return NextResponse.json(
      { error: "closeSize must be a positive number" },
      { status: 400 }
    );
  }
  if (!Number.isFinite(exit) || exit <= 0) {
    return NextResponse.json(
      { error: "exit must be a positive number" },
      { status: 400 }
    );
  }

  const original = await db.position.findFirst({
    where: { id, userId: user!.id, status: "active" },
  });

  if (!original) {
    return NextResponse.json(
      { error: "Active position not found" },
      { status: 404 }
    );
  }

  if (closeSize > original.size) {
    return NextResponse.json(
      { error: "closeSize exceeds position size" },
      { status: 400 }
    );
  }

  const remainingSize = original.size - closeSize;
  const isFullClose = remainingSize <= 1e-12; // floating-point tolerance

  const pnl =
    original.side === "LONG"
      ? (exit - original.entry) * closeSize
      : (original.entry - exit) * closeSize;

  const pnlPct =
    original.entry > 0
      ? (pnl / (original.entry * closeSize)) * 100
      : 0;

  // Risk / reward ratio from original SL if present
  let rrr = "—";
  if (original.stopLoss && original.stopLoss > 0) {
    const risk =
      original.side === "LONG"
        ? original.entry - original.stopLoss
        : original.stopLoss - original.entry;
    const reward =
      original.side === "LONG"
        ? exit - original.entry
        : original.entry - exit;
    if (risk > 0) {
      rrr = `1:${Math.abs(reward / risk).toFixed(2)}`;
    }
  }

  await db.$transaction(async (tx) => {
    if (isFullClose) {
      // Full close via this endpoint — mark original as closed
      await tx.position.update({
        where: { id },
        data: {
          status: "closed",
          exit,
          pnl,
          closedAt: new Date(),
        },
      });
    } else {
      // Partial: shrink original and insert a new closed row for the portion
      await tx.position.update({
        where: { id },
        data: { size: remainingSize },
      });
      await tx.position.create({
        data: {
          userId: user!.id,
          asset: original.asset,
          side: original.side,
          size: closeSize,
          entry: original.entry,
          stopLoss: original.stopLoss,
          takeProfit: original.takeProfit,
          exit,
          pnl,
          status: "closed",
          openedAt: original.openedAt,
          closedAt: new Date(),
        },
      });
    }

    await tx.user.update({
      where: { id: user!.id },
      data: { paperBalance: { increment: pnl } },
    });

    // Journal entry — same shape as full close
    const last = await tx.journalEntry.findFirst({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
      select: { displayId: true },
    });
    let n = 1001;
    if (last?.displayId) {
      const m = last.displayId.match(/K-(\d+)/);
      if (m) n = parseInt(m[1]) + 1;
    }

    await tx.journalEntry.create({
      data: {
        userId: user!.id,
        displayId: `K-${n}`,
        date: new Date(),
        pair: original.asset.endsWith("USDT")
          ? `${original.asset.slice(0, -4)}/USD`
          : original.asset,
        side: original.side,
        entry: original.entry,
        exit,
        pnl,
        pnlPct,
        rrr,
        strategy: isFullClose ? "Full close" : "Partial close",
        notes: isFullClose
          ? ""
          : `Partial exit of ${closeSize} / ${original.size} ${original.asset}`,
      },
    });
  });

  return NextResponse.json({
    success: true,
    pnl,
    remainingSize,
    fullyClosed: isFullClose,
  });
}
