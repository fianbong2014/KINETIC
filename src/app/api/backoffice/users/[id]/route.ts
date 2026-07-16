import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { recordAudit } from "@/lib/audit";

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

/** True when no other active admin would remain besides `excludeId`. */
async function isLastActiveAdmin(excludeId: string) {
  const others = await db.user.count({
    where: { role: "ADMIN", disabled: false, id: { not: excludeId } },
  });
  return others === 0;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: admin, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  if ("role" in body && body.role !== "USER" && body.role !== "ADMIN") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if ("disabled" in body && typeof body.disabled !== "boolean") {
    return NextResponse.json({ error: "Invalid disabled flag" }, { status: 400 });
  }
  if ("password" in body && (typeof body.password !== "string" || body.password.length < 8)) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }
  if ("name" in body && body.name !== null && typeof body.name !== "string") {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (id === admin!.id && ("role" in body || "disabled" in body)) {
    return NextResponse.json(
      { error: "Cannot change your own role or status" },
      { status: 400 }
    );
  }

  const demotes = "role" in body && target.role === "ADMIN" && body.role !== "ADMIN";
  const disables = body.disabled === true && target.role === "ADMIN" && !target.disabled;
  if ((demotes || disables) && (await isLastActiveAdmin(id))) {
    return NextResponse.json(
      { error: "Cannot remove the last active admin" },
      { status: 409 }
    );
  }

  const data: Record<string, unknown> = {};
  if ("name" in body) data.name = body.name || null;
  if ("role" in body) data.role = body.role;
  if ("disabled" in body) data.disabled = body.disabled;
  if ("password" in body) data.passwordHash = await bcrypt.hash(body.password, 12);
  if (body.resetBalance === true) data.paperBalance = target.startingBalance;

  const updated = await db.user.update({
    where: { id },
    data,
    select: USER_SELECT,
  });

  // Record the single most significant change for this request.
  let action: string;
  let meta: Record<string, unknown>;
  if ("role" in body) {
    action = "user.role_change";
    meta = { from: target.role, to: body.role };
  } else if (body.disabled === true && !target.disabled) {
    action = "user.disable";
    meta = {};
  } else if (body.disabled === false && target.disabled) {
    action = "user.enable";
    meta = {};
  } else if ("password" in body) {
    action = "user.password_reset";
    meta = {};
  } else if (body.resetBalance === true) {
    action = "user.balance_reset";
    meta = { to: target.startingBalance };
  } else {
    action = "user.update";
    meta = { fields: Object.keys(data) };
  }

  await recordAudit({
    actorId: admin!.id,
    actorEmail: admin!.email ?? "",
    action,
    targetId: id,
    targetEmail: target.email,
    meta,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: admin, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (id === admin!.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  if (target.role === "ADMIN" && !target.disabled && (await isLastActiveAdmin(id))) {
    return NextResponse.json(
      { error: "Cannot remove the last active admin" },
      { status: 409 }
    );
  }

  // Record BEFORE the delete so the target row still exists to read.
  // AuditLog has no FK to User, so this row persists after deletion.
  await recordAudit({
    actorId: admin!.id,
    actorEmail: admin!.email ?? "",
    action: "user.delete",
    targetId: id,
    targetEmail: target.email,
    meta: { role: target.role },
  });

  // All User relations cascade in the schema — positions, bots, journal,
  // alerts, indicators, notifications, credentials, accounts, sessions.
  await db.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
