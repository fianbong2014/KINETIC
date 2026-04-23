import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { compileExpression } from "@/lib/custom-indicators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;
  const existing = await db.customIndicator.findFirst({
    where: { id, userId: user!.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Indicator not found" }, { status: 404 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if ("name" in body) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    data.name = body.name.trim().slice(0, 60);
  }
  if ("expression" in body) {
    if (typeof body.expression !== "string" || body.expression.length > 2000) {
      return NextResponse.json({ error: "Invalid expression" }, { status: 400 });
    }
    const compiled = compileExpression(body.expression);
    if (!compiled.ok) {
      return NextResponse.json(
        { error: `Invalid expression: ${compiled.error}` },
        { status: 400 }
      );
    }
    data.expression = body.expression;
  }
  if ("color" in body && typeof body.color === "string") data.color = body.color;
  if ("overlay" in body && typeof body.overlay === "boolean") data.overlay = body.overlay;
  if ("enabled" in body && typeof body.enabled === "boolean") data.enabled = body.enabled;

  const updated = await db.customIndicator.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;
  const existing = await db.customIndicator.findFirst({
    where: { id, userId: user!.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Indicator not found" }, { status: 404 });
  }

  await db.customIndicator.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
