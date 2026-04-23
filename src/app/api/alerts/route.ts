import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// GET /api/alerts — list alerts for the authenticated user.
// Query params:
//   ?includeTriggered=true → also return alerts that have fired
export async function GET(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const includeTriggered =
    request.nextUrl.searchParams.get("includeTriggered") === "true";

  const alerts = await db.priceAlert.findMany({
    where: {
      userId: user!.id,
      ...(includeTriggered ? {} : { active: true }),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(alerts);
}

// POST /api/alerts
// Body: { symbol, price, direction: "above" | "below", message? }
export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const { symbol, price, direction, message } = await request.json();

    if (!symbol || typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        { error: "symbol and positive price are required" },
        { status: 400 }
      );
    }
    if (direction !== "above" && direction !== "below") {
      return NextResponse.json(
        { error: "direction must be 'above' or 'below'" },
        { status: 400 }
      );
    }

    const alert = await db.priceAlert.create({
      data: {
        userId: user!.id,
        symbol,
        price,
        direction,
        message: message || null,
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}
