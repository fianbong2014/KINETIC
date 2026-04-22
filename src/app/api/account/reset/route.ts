import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// POST /api/account/reset — wipe paper trading state back to a clean slate
// Body: { startingBalance?: number; wipeJournal?: boolean }
export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const newStarting =
    typeof body.startingBalance === "number" && body.startingBalance > 0
      ? body.startingBalance
      : 10000;
  const wipeJournal = body.wipeJournal === true;

  // Sequential transaction — never leaves account half-reset.
  await db.$transaction(async (tx) => {
    await tx.position.deleteMany({ where: { userId: user!.id } });
    if (wipeJournal) {
      await tx.journalEntry.deleteMany({ where: { userId: user!.id } });
    }
    await tx.user.update({
      where: { id: user!.id },
      data: {
        paperBalance: newStarting,
        startingBalance: newStarting,
      },
    });
  });

  return NextResponse.json({ success: true, balance: newStarting });
}
