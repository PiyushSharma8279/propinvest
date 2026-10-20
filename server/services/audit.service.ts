import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "../db/client";
import type { AuditEntry } from "../db/schema";

const { auditLog, users } = schema;

/**
 * Records a sensitive admin action (export, delete, approval, opt-out change…). The summary is
 * short and avoids customer names / numbers: entity + id is enough to find the record.
 * Never throws — a failed audit write must not block the action itself.
 */
export async function audit(userId: number | null, action: string, entity: string, entityId: number | null, summary = ""): Promise<void> {
  try {
    await db.insert(auditLog).values({ userId, action, entity, entityId, summary: summary.slice(0, 300) });
  } catch (error) {
    console.error("[audit] write failed", error instanceof Error ? error.name : "");
  }
}

export async function recentAudit(limit = 100): Promise<(AuditEntry & { userName: string | null })[]> {
  const rows = await db
    .select({ entry: auditLog, userName: users.name })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.userId, users.id))
    .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
    .limit(limit);
  return rows.map((r) => ({ ...r.entry, userName: r.userName }));
}
