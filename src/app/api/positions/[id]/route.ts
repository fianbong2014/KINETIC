import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const position = await db.position.findFirst({
    where: { id, userId: user!.id },
  });

  if (!position) {
    return NextResponse.json({ error: "Position not found" }, { status: 404 });
  }

  const isClosing =
    position.status === "active" && body.status === "closed";

  // If this PATCH is closing the position, run everything in a transaction:
  //  1. Update the position row
  //  2. Credit the user's paper balance with the PNL
  //  3. Create a JournalEntry snapshot of the trade
  if (isClosing) {
    const exit = typeof body.exit === "number" ? body.exit : position.entry;
    const pnl =
      typeof body.pnl === "number"
        ? body.pnl
        : position.side === "LONG"
          ? (exit - position.entry) * position.size
          : (position.entry - exit) * position.size;

    const pnlPct =
      position.entry > 0
        ? (pnl / (position.entry * position.size)) * 100
        : 0;

    // Risk / reward ratio — derived from SL if present, otherwise a placeholder
    let rrr = "—";
    if (position.stopLoss && position.stopLoss > 0) {
      const risk =
        position.side === "LONG"
          ? position.entry - position.stopLoss
          : position.stopLoss - position.entry;
      const reward =
        position.side === "LONG"
          ? exit - position.entry
          : position.entry - exit;
      if (risk > 0) {
        const multiple = Math.abs(reward / risk);
        rrr = `1:${multiple.toFixed(2)}`;
      }
    }

    const [updated] = await db.$transaction([
      db.position.update({
        where: { id },
        data: {
          status: "closed",
          exit,
          pnl,
          closedAt: body.closedAt ? new Date(body.closedAt) : new Date(),
        },
      }),
      db.user.update({
        where: { id: user!.id },
        data: { paperBalance: { increment: pnl } },
      }),
      db.journalEntry.create({
        data: {
          userId: user!.id,
          displayId: await nextDisplayId(user!.id),
          date: new Date(),
          pair: formatPair(position.asset),
          side: position.side,
          entry: position.entry,
          exit,
          pnl,
          pnlPct,
          rrr,
          strategy: body.strategy || "Manual close",
          notes: body.notes || "",
        },
      }),
    ]);

    return NextResponse.json(updated);
  }

  // Not closing — plain update (e.g. modify SL/TP)
  const updated = await db.position.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;

  const position = await db.position.findFirst({
    where: { id, userId: user!.id },
  });

  if (!position) {
    return NextResponse.json({ error: "Position not found" }, { status: 404 });
  }

  await db.position.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

// ─── helpers ──────────────────────────────────────────────────────────

async function nextDisplayId(userId: string): Promise<string> {
  const last = await db.journalEntry.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { displayId: true },
  });
  let n = 1001;
  if (last?.displayId) {
    const match = last.displayId.match(/K-(\d+)/);
    if (match) n = parseInt(match[1]) + 1;
  }
  return `K-${n}`;
}

function formatPair(asset: string): string {
  // "BTCUSDT" → "BTC/USD"
  if (asset.endsWith("USDT")) {
    return `${asset.slice(0, -4)}/USD`;
  }
  return asset;
}
