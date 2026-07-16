import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Record an admin action to the audit log.
 *
 * Audit logging must NEVER break the main admin action, so any failure is
 * swallowed and only logged to the console — the caller should not await
 * this for correctness of the primary operation.
 */
export async function recordAudit(entry: {
  actorId: string;
  actorEmail: string;
  action: string;
  targetId?: string;
  targetEmail?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: { ...entry, meta: (entry.meta ?? {}) as Prisma.InputJsonValue },
    });
  } catch (err) {
    console.error("Failed to record audit log entry", err);
  }
}
