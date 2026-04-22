import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const status = request.nextUrl.searchParams.get("status");

  const positions = await db.position.findMany({
    where: {
      userId: user!.id,
      ...(status ? { status } : {}),
    },
    orderBy: { openedAt: "desc" },
  });

  return NextResponse.json(positions);
}

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const {
      asset,
      side,
      size,
      entry,
      stopLoss,
      takeProfit,
      trailingDistance,
    } = await request.json();

    if (!asset || !side || !size || !entry) {
      return NextResponse.json(
        { error: "asset, side, size, and entry are required" },
        { status: 400 }
      );
    }

    const position = await db.position.create({
      data: {
        userId: user!.id,
        asset,
        side,
        size,
        entry,
        stopLoss: stopLoss ?? null,
        takeProfit: takeProfit ?? null,
        trailingDistance:
          typeof trailingDistance === "number" && trailingDistance > 0
            ? trailingDistance
            : null,
        trailingHighWater:
          typeof trailingDistance === "number" && trailingDistance > 0
            ? entry
            : null,
      },
    });

    return NextResponse.json(position, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create position" },
      { status: 500 }
    );
  }
}
