import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { defaultSettings } from "@/lib/default-settings";
import { recordAudit } from "@/lib/audit";

// Fields safe to expose to the backoffice UI — never passwordHash/settings.
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  disabled: true,
  paperBalance: true,
  startingBalance: true,
  createdAt: true,
  _count: { select: { positions: true, tradingBots: true } },
} as const;

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const users = await db.user.findMany({
    select: USER_SELECT,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const { user: admin, error } = await requireAdmin();
  if (error) return error;

  try {
    const { name, email, password, role } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    if (role !== undefined && role !== "USER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
        role: role ?? "USER",
        settings: defaultSettings(),
      },
      select: USER_SELECT,
    });

    await recordAudit({
      actorId: admin!.id,
      actorEmail: admin!.email ?? "",
      action: "user.create",
      targetId: user.id,
      targetEmail: user.email,
      meta: { role: user.role },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
