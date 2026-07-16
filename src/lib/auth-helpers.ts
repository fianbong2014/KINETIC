import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // JWT sessions outlive DB state — re-check on every call so disabled
  // or deleted users lose API access immediately, and role stays fresh.
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, disabled: true },
  });

  if (!dbUser || dbUser.disabled) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user: { ...session.user, role: dbUser.role }, error: null };
}

export async function requireAdmin() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return { user: null, error };

  if (user!.role !== "ADMIN") {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, error: null };
}
