import { NextRequest, NextResponse } from "next/server";
// Regular (non-type-only) import — we use `Prisma.JsonNull` as a runtime
// sentinel value when clearing a `chartSnapshotMeta` JSON column.
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// Hard cap on stored chart snapshot size — prevents a runaway data URL
// from blowing up a row. 600 KB of base64 ≈ 450 KB of image, which is
// already generous for a ~1280px JPEG at quality 0.85.
const MAX_SNAPSHOT_DATAURL_BYTES = 600_000;

/**
 * GET /api/journal/[id]
 *
 * Returns a single entry including the full `chartSnapshot` data URL.
 * The list endpoint deliberately omits the image to keep payloads small;
 * the UI calls this when the user clicks a thumbnail to expand.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;
  const entry = await db.journalEntry.findFirst({
    where: { id, userId: user!.id },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
  return NextResponse.json(entry);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const entry = await db.journalEntry.findFirst({
    where: { id, userId: user!.id },
    select: { id: true },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  // Whitelisted updatable fields. Previously this route did a wholesale
  // spread of the body into Prisma; tightening because chart snapshots
  // are new untrusted data and we don't want, say, a stray `userId` in
  // a PATCH body to escalate.
  const data: Prisma.JournalEntryUpdateInput = {};
  if (typeof body.strategy === "string") data.strategy = body.strategy;
  if (typeof body.notes === "string") data.notes = body.notes;
  if (typeof body.pair === "string") data.pair = body.pair;
  if (body.side === "LONG" || body.side === "SHORT") data.side = body.side;
  if (typeof body.entry === "number") data.entry = body.entry;
  if (typeof body.exit === "number") data.exit = body.exit;
  if (typeof body.pnl === "number") data.pnl = body.pnl;
  if (typeof body.pnlPct === "number") data.pnlPct = body.pnlPct;
  if (typeof body.rrr === "string") data.rrr = body.rrr;

  if (body.chartSnapshot !== undefined) {
    if (body.chartSnapshot === null) {
      data.chartSnapshot = null;
      data.chartSnapshotMeta = Prisma.JsonNull;
    } else if (typeof body.chartSnapshot === "string") {
      if (!body.chartSnapshot.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "chartSnapshot must be a data URL" },
          { status: 400 }
        );
      }
      if (body.chartSnapshot.length > MAX_SNAPSHOT_DATAURL_BYTES) {
        return NextResponse.json(
          {
            error: `chartSnapshot exceeds ${MAX_SNAPSHOT_DATAURL_BYTES} bytes`,
          },
          { status: 413 }
        );
      }
      data.chartSnapshot = body.chartSnapshot;
      // Only update meta if the caller provided it; otherwise leave the
      // existing meta alone (e.g. when only refreshing the image).
      if (body.chartSnapshotMeta !== undefined) {
        data.chartSnapshotMeta = (body.chartSnapshotMeta as Prisma.InputJsonValue) ?? Prisma.JsonNull;
      }
    } else {
      return NextResponse.json(
        { error: "chartSnapshot must be a string data URL or null" },
        { status: 400 }
      );
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No updatable fields supplied" },
      { status: 400 }
    );
  }

  const updated = await db.journalEntry.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;

  const entry = await db.journalEntry.findFirst({
    where: { id, userId: user!.id },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  await db.journalEntry.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
