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

  const alert = await db.priceAlert.findFirst({
    where: { id, userId: user!.id },
  });
  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  // Whitelist fields
  const allowed: Record<string, unknown> = {};
  if ("active" in body) allowed.active = body.active;
  if ("price" in body) allowed.price = body.price;
  if ("direction" in body) allowed.direction = body.direction;
  if ("message" in body) allowed.message = body.message;
  if ("triggeredAt" in body) allowed.triggeredAt = body.triggeredAt;

  const updated = await db.priceAlert.update({
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

  const alert = await db.priceAlert.findFirst({
    where: { id, userId: user!.id },
  });
  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  await db.priceAlert.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
