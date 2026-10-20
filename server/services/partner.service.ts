import "server-only";
import { and, asc, count, desc, eq, gte, ilike, lt, notInArray, or, sql, type SQL } from "drizzle-orm";
import {
  closedPartnerStatuses,
  partnerStatuses,
  type ContentStatus,
  type PartnerActivityType,
  type PartnerStatus,
} from "@/lib/constants/outreach";
import { istDayBounds } from "@/lib/utils/dates";
import { db, schema } from "../db/client";
import type { ContentIdea, Partner, PartnerActivity } from "../db/schema";
import { HttpError, notFound } from "../http";
import { csvToObjects } from "@/lib/utils/csv-parse";
import { validatePartnerInput, type ContentInput, type PartnerInput } from "../validators/partner.validator";

const { partners: pt, partnerActivities: pa, contentIdeas: ci, users } = schema;

function assertId(id: number, what = "Partner") {
  if (!Number.isSafeInteger(id) || id <= 0) throw notFound(`${what} not found.`);
}

async function log(partnerId: number, type: PartnerActivityType, note: string, meta: Record<string, unknown>, userId: number) {
  await db.insert(pa).values({ partnerId, type, note, meta, userId });
}

/* ---------- Partners ---------- */

/** Open contacts whose follow-up date is today or earlier, or marked "Follow-up due". */
function partnerDueCondition(): SQL {
  return and(
    notInArray(pt.status, [...closedPartnerStatuses]),
    eq(pt.doNotContact, false),
    or(lt(pt.nextFollowUpAt, istDayBounds().end), eq(pt.status, "follow_up_due"))
  )!;
}

/** Who to contact next: due follow-ups first, then the oldest never-contacted contacts. */
export async function getNextPartners(limit = 5): Promise<Partner[]> {
  const due = await db.select().from(pt).where(partnerDueCondition()).orderBy(sql`${pt.nextFollowUpAt} asc nulls last`).limit(limit);
  if (due.length >= limit) return due;
  const fresh = await db
    .select()
    .from(pt)
    .where(and(eq(pt.status, "not_contacted"), eq(pt.doNotContact, false)))
    .orderBy(asc(pt.createdAt))
    .limit(limit - due.length);
  return [...due, ...fresh.filter((p) => !due.some((d) => d.id === p.id))];
}

/** New contacts added in [from, to). */
export async function countNewPartners(from: Date, to: Date = new Date()): Promise<number> {
  const [{ total }] = await db.select({ total: count() }).from(pt).where(and(gte(pt.createdAt, from), lt(pt.createdAt, to)));
  return total;
}

export async function listPartners(options: { status?: PartnerStatus; due?: boolean; q?: string }): Promise<Partner[]> {
  const where: SQL[] = [];
  if (options.status) where.push(eq(pt.status, options.status));
  if (options.due) where.push(partnerDueCondition());
  if (options.q) {
    const pattern = `%${options.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    where.push(or(ilike(pt.name, pattern), ilike(pt.company, pattern), ilike(pt.city, pattern))!);
  }
  return db
    .select()
    .from(pt)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...(options.due ? [asc(pt.nextFollowUpAt)] : [desc(pt.updatedAt)]))
    .limit(500);
}

export async function getPartnerCounts(): Promise<Record<PartnerStatus | "all" | "due", number>> {
  const [rows, [{ due }]] = await Promise.all([
    db.select({ status: pt.status, total: count() }).from(pt).groupBy(pt.status),
    db.select({ due: count() }).from(pt).where(partnerDueCondition()),
  ]);
  const counts = Object.fromEntries([["all", 0], ["due", due], ...partnerStatuses.map((s) => [s, 0])]) as Record<
    PartnerStatus | "all" | "due",
    number
  >;
  for (const row of rows) {
    if (row.status in counts) counts[row.status as PartnerStatus] = row.total;
    counts.all += row.total;
  }
  return counts;
}

export async function getPartner(id: number): Promise<{ partner: Partner; activities: (PartnerActivity & { userName: string | null })[] }> {
  assertId(id);
  const [partner] = await db.select().from(pt).where(eq(pt.id, id)).limit(1);
  if (!partner) throw notFound("Partner not found.");
  const rows = await db
    .select({ activity: pa, userName: users.name })
    .from(pa)
    .leftJoin(users, eq(pa.userId, users.id))
    .where(eq(pa.partnerId, id))
    .orderBy(desc(pa.createdAt), desc(pa.id));
  return { partner, activities: rows.map((r) => ({ ...r.activity, userName: r.userName })) };
}

export async function createPartner(input: PartnerInput, userId: number): Promise<Partner> {
  const [row] = await db.insert(pt).values({ ...input, createdBy: userId }).returning();
  await log(row.id, "created", `Added (source: ${input.contactSource})`, {}, userId);
  return row;
}

/** Full update from the edit form; status and follow-up changes are written to the history. */
export async function updatePartner(id: number, input: PartnerInput, userId: number): Promise<Partner> {
  const { partner: current } = await getPartner(id);
  const [row] = await db.update(pt).set(input).where(eq(pt.id, id)).returning();
  if (current.status !== input.status) await log(id, "status", "", { from: current.status, to: input.status }, userId);
  if ((current.nextFollowUpAt?.getTime() ?? null) !== (input.nextFollowUpAt?.getTime() ?? null)) {
    await log(id, "follow_up", input.nextFollowUpAt ? "" : "Follow-up cleared", { at: input.nextFollowUpAt?.toISOString() ?? null }, userId);
  }
  if (current.doNotContact !== input.doNotContact) {
    await log(id, "note", input.doNotContact ? "Marked do-not-contact" : "Do-not-contact removed", {}, userId);
  }
  return row;
}

/** Ticks / unticks an onboarding checklist item. */
export async function setOnboardingItem(id: number, item: string, label: string, done: boolean, userId: number): Promise<Partner> {
  const { partner } = await getPartner(id);
  const onboarding = { ...partner.onboarding };
  if (done) onboarding[item] = new Date().toISOString();
  else delete onboarding[item];
  const [row] = await db.update(pt).set({ onboarding }).where(eq(pt.id, id)).returning();
  await log(id, "onboarding", `${done ? "Done" : "Undone"}: ${label}`, { item, done }, userId);
  return row;
}

export interface ImportResult {
  created: number;
  rows: { row: number; name: string; outcome: "create" | "created" | "duplicate" | "invalid"; reason?: string }[];
}

const keyOf = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Imports partner contacts from a CSV the admin is authorised to use. Each row is validated like
 * the manual form; rows matching an existing contact (same phone, email, or name + company) are
 * skipped. With preview = true nothing is written.
 * Expected headers (case-insensitive): name, company, type, category, phone, email, city,
 * website, source_url, contact_source, notes.
 */
export async function importPartners(csv: string, source: string, preview: boolean, userId: number): Promise<ImportResult> {
  const records = csvToObjects(csv).slice(0, 500);
  const existing = await db.select({ phone: pt.phone, email: pt.email, name: pt.name, company: pt.company }).from(pt);
  const phones = new Set(existing.map((e) => e.phone).filter(Boolean));
  const emails = new Set(existing.map((e) => e.email).filter(Boolean));
  const names = new Set(existing.map((e) => `${keyOf(e.name)}|${keyOf(e.company)}`));
  const result: ImportResult = { created: 0, rows: [] };
  const today = new Date();

  for (const [index, r] of records.entries()) {
    const rowNo = index + 2; // header is row 1
    let input: PartnerInput;
    try {
      input = validatePartnerInput({
        name: r.name,
        company: r.company,
        partnerType: r.type || r.partner_type,
        category: r.category,
        phone: r.phone,
        email: r.email,
        city: r.city,
        website: r.website,
        sourceUrl: r.source_url || r.source,
        contactSource: r.contact_source || source,
        notes: r.notes,
        status: "not_contacted",
      });
    } catch (error) {
      const details = (error as { details?: Record<string, string> }).details;
      result.rows.push({ row: rowNo, name: r.name ?? "", outcome: "invalid", reason: details ? Object.values(details).join(" ") : "Invalid row." });
      continue;
    }
    const nameKey = `${keyOf(input.name)}|${keyOf(input.company)}`;
    if ((input.phone && phones.has(input.phone)) || (input.email && emails.has(input.email)) || names.has(nameKey)) {
      result.rows.push({ row: rowNo, name: input.name, outcome: "duplicate", reason: "Already in Partners (same phone, email or name + company)." });
      continue;
    }
    if (input.phone) phones.add(input.phone);
    if (input.email) emails.add(input.email);
    names.add(nameKey);
    if (preview) {
      result.rows.push({ row: rowNo, name: input.name, outcome: "create" });
      continue;
    }
    const [row] = await db.insert(pt).values({ ...input, researchedAt: input.researchedAt ?? today, createdBy: userId }).returning({ id: pt.id });
    await log(row.id, "imported", `Imported from CSV (source: ${source})`, {}, userId);
    result.created++;
    result.rows.push({ row: rowNo, name: input.name, outcome: "created" });
  }
  return result;
}

export async function addPartnerActivity(id: number, type: "note" | "template_opened", note: string, userId: number) {
  const { partner } = await getPartner(id);
  if (type === "template_opened" && partner.doNotContact) throw new HttpError(409, "This contact asked not to be contacted.");
  await log(id, type, note, {}, userId);
}

/** Id + name for the "Owner / partner" picker on the listing form. */
export async function getPartnerOptions(): Promise<{ id: number; name: string; company: string }[]> {
  return db.select({ id: pt.id, name: pt.name, company: pt.company }).from(pt).orderBy(asc(pt.name)).limit(1000);
}

export async function getAllPartners(): Promise<Partner[]> {
  return db.select().from(pt).orderBy(desc(pt.updatedAt));
}

/** Status changes in [from, to) by target status — e.g. how many moved to "replied" this week. */
export async function getPartnerStageMoves(from: Date, to: Date = new Date()): Promise<Record<string, number>> {
  const rows = await db
    .select({ to: sql<string>`${pa.meta}->>'to'`, total: count() })
    .from(pa)
    .where(and(eq(pa.type, "status"), gte(pa.createdAt, from), lt(pa.createdAt, to)))
    .groupBy(sql`1`);
  return Object.fromEntries(rows.map((r) => [r.to, r.total]));
}

export async function countPartnerActivities(type: PartnerActivityType, from: Date, to: Date = new Date()): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(pa)
    .where(and(eq(pa.type, type), gte(pa.createdAt, from), lt(pa.createdAt, to)));
  return total;
}

/* ---------- Content ideas ---------- */

export async function listContent(status?: ContentStatus): Promise<ContentIdea[]> {
  return db
    .select()
    .from(ci)
    .where(status ? eq(ci.status, status) : undefined)
    .orderBy(sql`${ci.dueDate} asc nulls last`, desc(ci.updatedAt))
    .limit(500);
}

export async function createContent(input: ContentInput, userId: number): Promise<ContentIdea> {
  const [row] = await db
    .insert(ci)
    .values({ ...input, createdBy: userId, publishedAt: input.status === "published" ? new Date() : null })
    .returning();
  return row;
}

export async function updateContent(id: number, input: ContentInput): Promise<ContentIdea> {
  assertId(id, "Content idea");
  const [current] = await db.select().from(ci).where(eq(ci.id, id)).limit(1);
  if (!current) throw notFound("Content idea not found.");
  const publishedAt = input.status === "published" ? (current.publishedAt ?? new Date()) : null;
  const [row] = await db.update(ci).set({ ...input, publishedAt }).where(eq(ci.id, id)).returning();
  return row;
}

export async function countPublishedContent(from: Date, to: Date = new Date()): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(ci)
    .where(and(gte(ci.publishedAt, from), lt(ci.publishedAt, to)));
  return total;
}
