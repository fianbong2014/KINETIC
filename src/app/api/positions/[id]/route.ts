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
