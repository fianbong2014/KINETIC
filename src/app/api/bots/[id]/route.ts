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

  const bot = await db.tradingBot.findFirst({
    where: { id, userId: user!.id },
  });
  if (!bot) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  // Whitelist fields the client can update
  const allowed: Record<string, unknown> = {};
  const fields = [
    "name",
    "symbols",
    "triggerType",
    "tfFilter",
    "minConfidence",
    "side",
    "positionSizePct",
    "stopLossPct",
    "takeProfitPct",
    "trailingPct",
    "maxOpenPositions",
    "cooldownMinutes",
    "enabled",
    "lastRunAt",
    "lastTradeAt",
  ];
  for (const f of fields) {
    if (f in body) allowed[f] = body[f];
  }

  const updated = await db.tradingBot.update({
    where: { id },
    data: allowed,
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

  const bot = await db.tradingBot.findFirst({
    where: { id, userId: user!.id },
  });
  if (!bot) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  // Detach positions instead of cascading — keep trade history visible
  // even after the bot is gone. Position.botId already set to SetNull
  // via Prisma schema, so just delete the bot.
  await db.tradingBot.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
