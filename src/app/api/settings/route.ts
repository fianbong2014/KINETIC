import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const dbUser = await db.user.findUnique({
    where: { id: user!.id },
    select: { settings: true },
  });

  return NextResponse.json(dbUser?.settings || {});
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const updates = await request.json();

    const dbUser = await db.user.findUnique({
      where: { id: user!.id },
      select: { settings: true },
    });

    const currentSettings = (dbUser?.settings as Record<string, unknown>) || {};

    // Shallow merge: top-level keys are spread, nested objects are spread within their key
    const merged: Record<string, unknown> = { ...currentSettings };
    for (const [key, value] of Object.entries(updates)) {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        typeof currentSettings[key] === "object" &&
        currentSettings[key] !== null
      ) {
        merged[key] = {
          ...(currentSettings[key] as Record<string, unknown>),
          ...(value as Record<string, unknown>),
        };
      } else {
        merged[key] = value;
      }
    }

    await db.user.update({
      where: { id: user!.id },
      data: { settings: merged as Prisma.InputJsonValue },
    });

    return NextResponse.json(merged);
  } catch {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
