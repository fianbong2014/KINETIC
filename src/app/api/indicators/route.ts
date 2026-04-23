import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { compileExpression } from "@/lib/custom-indicators";

export async function GET() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const indicators = await db.customIndicator.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(indicators);
}

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const { name, expression, color, overlay, enabled } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }
    if (!expression || typeof expression !== "string") {
      return NextResponse.json(
        { error: "expression is required" },
        { status: 400 }
      );
    }
    if (expression.length > 2000) {
      return NextResponse.json(
        { error: "expression exceeds 2000 characters" },
        { status: 400 }
      );
    }

    const compiled = compileExpression(expression);
    if (!compiled.ok) {
      return NextResponse.json(
        { error: `Invalid expression: ${compiled.error}` },
        { status: 400 }
      );
    }

    const indicator = await db.customIndicator.create({
      data: {
        userId: user!.id,
        name: name.trim().slice(0, 60),
        expression,
        color: typeof color === "string" ? color : "#00ffff",
        overlay: typeof overlay === "boolean" ? overlay : true,
        enabled: typeof enabled === "boolean" ? enabled : true,
      },
    });

    return NextResponse.json(indicator, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create indicator" },
      { status: 500 }
    );
  }
}
