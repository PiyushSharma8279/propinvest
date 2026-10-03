import "server-only";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import type { LeadSource, LeadStatus } from "@/lib/constants/lead";
import type { Paginated } from "@/lib/types";
import { db, schema } from "../db/client";
import type { Lead } from "../db/schema";
import { HttpError, notFound } from "../http";
import type { LeadInput } from "../validators/lead.validator";

const { leads: l, properties: p } = schema;

/* ---------- Spam throttling ---------- */

const MAX_LEADS_PER_WINDOW = 5;
const LEAD_WINDOW_MS = 10 * 60 * 1000;
const recentLeads = new Map<string, { count: number; resetAt: number }>();

/**
 * At most 5 enquiries per IP every 10 minutes. In-memory, so per server instance — enough to
 * stop a bot filling the admin inbox, without getting in the way of a real buyer.
 */
function assertLeadAllowed(ip: string): void {
  const now = Date.now();
  const entry = recentLeads.get(ip);
  if (!entry || now > entry.resetAt) {
    recentLeads.set(ip, { count: 1, resetAt: now + LEAD_WINDOW_MS });
    if (recentLeads.size > 10_000) recentLeads.clear(); // never let the map grow unbounded
    return;
  }
  if (entry.count >= MAX_LEADS_PER_WINDOW) {
    throw new HttpError(429, "You've sent several enquiries already. Please try again in a few minutes.");
  }
  entry.count++;
}

/**
 * Saves a website enquiry. Returns the listing's brochure link (if it has one), which is only
 * revealed once the visitor has left their number.
 */
export async function createLead(input: LeadInput, ip: string): Promise<{ brochureUrl: string }> {
  // Bots that fill the hidden field get a normal-looking reply and nothing is saved.
  if (input.isBot) return { brochureUrl: "" };
  assertLeadAllowed(ip);

  const [property] = input.propertyId
    ? await db
        .select({ id: p.id, title: p.title, brochureUrl: p.brochureUrl })
        .from(p)
        .where(and(eq(p.id, input.propertyId), eq(p.isDeleted, false)))
        .limit(1)
    : [];

  await db.insert(l).values({
    name: input.name,
    phone: input.phone,
    budget: input.budget,
    message: input.message,
    source: input.source,
    propertyId: property?.id ?? null,
    projectTitle: property?.title ?? "",
    pageUrl: input.pageUrl,
  });

  return { brochureUrl: property?.brochureUrl ?? "" };
}

export async function listLeads(options: {
  status?: LeadStatus;
  source?: LeadSource;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<Lead>> {
  const where: SQL[] = [];
  if (options.status) where.push(eq(l.status, options.status));
  if (options.source) where.push(eq(l.source, options.source));
  if (options.q) {
    const pattern = `%${options.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    where.push(or(ilike(l.name, pattern), ilike(l.phone, pattern), ilike(l.projectTitle, pattern))!);
  }
  const condition = where.length ? and(...where) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(l).where(condition);
  const pageSize = options.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, options.page ?? 1), totalPages);
  const items = await db
    .select()
    .from(l)
    .where(condition)
    .orderBy(desc(l.createdAt), desc(l.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { items, total, page, pageSize, totalPages };
}

/** Every lead, newest first — for the CSV download. */
export async function getAllLeads(): Promise<Lead[]> {
  return db.select().from(l).orderBy(desc(l.createdAt), desc(l.id));
}

/** Lead count per status, plus "all". */
export async function getLeadCounts(): Promise<Record<LeadStatus | "all", number>> {
  const rows = await db.select({ status: l.status, total: count() }).from(l).groupBy(l.status);
  const counts = { all: 0, new: 0, contacted: 0, site_visit: 0, closed: 0, not_interested: 0 };
  for (const row of rows) {
    if (row.status in counts) counts[row.status as LeadStatus] = row.total;
    counts.all += row.total;
  }
  return counts;
}

export async function setLeadStatus(id: number, status: LeadStatus): Promise<Lead> {
  if (!Number.isSafeInteger(id) || id <= 0) throw notFound("Lead not found.");
  const [row] = await db.update(l).set({ status }).where(eq(l.id, id)).returning();
  if (!row) throw notFound("Lead not found.");
  return row;
}
