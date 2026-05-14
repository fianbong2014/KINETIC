import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// GET /api/notifications
//   ?filter=all|unread|archived  (default: all unarchived)
//   ?type=alert|sl_hit|tp_hit|bot_trade|trade|briefing|system
//   ?limit=N   (default 100, max 500)
export async function GET(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const params = request.nextUrl.searchParams;
  const filter = params.get("filter") || "all";
  const type = params.get("type");
  const limit = Math.min(parseInt(params.get("limit") || "100"), 500);

  const where: Record<string, unknown> = { userId: user!.id };
  if (filter === "unread") where.read = false;
  if (filter === "archived") where.archived = true;
  else if (filter !== "all") where.archived = false;
  // Default (filter=all) hides archived
  if (filter === "all") where.archived = false;
  if (type) where.type = type;

  const [items, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    db.notification.count({
      where: { userId: user!.id, read: false, archived: false },
    }),
  ]);

  return NextResponse.json({ items, unreadCount });
}

// POST /api/notifications
// Body: { type, title, body?, meta? }
// Called by client-side monitors (alert/SL-TP/bot) when events fire.
export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const { type, title, body, meta } = await request.json();

    if (!type || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "type and title are required" },
        { status: 400 }
      );
    }

    const notification = await db.notification.create({
      data: {
        userId: user!.id,
        type: String(type),
        title: String(title).slice(0, 200),
        body: body ? String(body).slice(0, 2000) : null,
        meta: (meta && typeof meta === "object" ? meta : {}) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications  (bulk actions)
// Body: { action: "markAllRead" | "clearAll" | "archiveAll" }
export async function PATCH(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { action } = await request.json();

  switch (action) {
    case "markAllRead":
      await db.notification.updateMany({
        where: { userId: user!.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });

    case "archiveAll":
      await db.notification.updateMany({
        where: { userId: user!.id, archived: false },
        data: { archived: true },
      });
      return NextResponse.json({ success: true });

    case "clearAll":
      await db.notification.deleteMany({ where: { userId: user!.id } });
      return NextResponse.json({ success: true });

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
