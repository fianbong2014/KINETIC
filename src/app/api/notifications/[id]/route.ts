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

  const existing = await db.notification.findFirst({
    where: { id, userId: user!.id },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 }
    );
  }

  // Whitelist patchable fields — the user should only be able to
  // change read/archived state, not retroactively edit content.
  const data: Record<string, unknown> = {};
  if (typeof body.read === "boolean") data.read = body.read;
  if (typeof body.archived === "boolean") data.archived = body.archived;

  const updated = await db.notification.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;

  const existing = await db.notification.findFirst({
    where: { id, userId: user!.id },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 }
    );
  }

  await db.notification.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
