import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lt, notInArray, or, sql, type SQL } from "drizzle-orm";
import {
  autoFollowUpDays,
  closedLeadStatuses,
  leadStatuses,
  type LeadActivityType,
  type LeadSource,
  type LeadStatus,
  type LeadView,
} from "@/lib/constants/lead";
import { siteConfig } from "@/lib/site-config";
import type { Paginated } from "@/lib/types";
import { followUpInDays, istDateKey, istDayBounds } from "@/lib/utils/dates";
import { db, schema } from "../db/client";
import type { Lead, LeadActivity } from "../db/schema";
import { HttpError, notFound } from "../http";
import type { LeadInput, LeadUpdateInput } from "../validators/lead.validator";
import { followUpDigestMessage, newLeadMessage } from "./notification-messages";
import { anySent, isNotificationConfigured, sendNotification, type ChannelResult } from "./notify.service";

const { leads: l, leadActivities: a, properties: p, jobRuns } = schema;

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

/** The same number enquiring about the same listing within this window is one lead, not two. */
export const DUPLICATE_WINDOW_MS = 30 * 60 * 1000;

async function logActivity(
  leadId: number,
  type: LeadActivityType,
  note = "",
  meta: Record<string, unknown> = {},
  userId: number | null = null
): Promise<void> {
  await db.insert(a).values({ leadId, type, note, meta, userId });
}

export interface CreateLeadResult {
  brochureUrl: string;
  /** Null when nothing was saved (honeypot). */
  leadId: number | null;
  /** True when this matched a recent lead and was recorded on it instead of creating a new one. */
  duplicate: boolean;
}

/**
 * Saves a website enquiry. Returns the listing's brochure link (if it has one), which is only
 * revealed once the visitor has left their number. A repeat submission (same phone, same
 * listing, within 30 minutes) is added to the existing lead's history instead of creating a
 * second lead, so the admin isn't asked to call the same person twice.
 */
export async function createLead(input: LeadInput, ip: string): Promise<CreateLeadResult> {
  // Bots that fill the hidden field get a normal-looking reply and nothing is saved.
  if (input.isBot) return { brochureUrl: "", leadId: null, duplicate: false };
  assertLeadAllowed(ip);

  const [property] = input.propertyId
    ? await db
        .select({ id: p.id, title: p.title, brochureUrl: p.brochureUrl })
        .from(p)
        .where(and(eq(p.id, input.propertyId), eq(p.isDeleted, false)))
        .limit(1)
    : [];
  const propertyId = property?.id ?? null;
  const brochureUrl = property?.brochureUrl ?? "";

  const [recent] = await db
    .select({ id: l.id })
    .from(l)
    .where(
      and(
        eq(l.phone, input.phone),
        propertyId ? eq(l.propertyId, propertyId) : isNull(l.propertyId),
        gte(l.createdAt, new Date(Date.now() - DUPLICATE_WINDOW_MS))
      )
    )
    .orderBy(desc(l.createdAt))
    .limit(1);

  if (recent) {
    await logActivity(recent.id, "repeat_enquiry", input.message, { source: input.source });
    if (input.marketingOptIn) await db.update(l).set({ marketingOptIn: true }).where(eq(l.id, recent.id));
    return { brochureUrl, leadId: recent.id, duplicate: true };
  }

  const [lead] = await db
    .insert(l)
    .values({
      name: input.name,
      phone: input.phone,
      budget: input.budget,
      message: input.message,
      source: input.source,
      propertyId,
      projectTitle: property?.title ?? "",
      pageUrl: input.pageUrl,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      utmTerm: input.utmTerm,
      utmContent: input.utmContent,
      referrer: input.referrer,
      landingPage: input.landingPage,
      privacyNoticeVersion: input.privacyNoticeVersion,
      marketingOptIn: input.marketingOptIn,
      timeline: input.timeline,
    })
    .returning({ id: l.id });

  await logActivity(lead.id, "created", "", { source: input.source });
  return { brochureUrl, leadId: lead.id, duplicate: false };
}

/* ---------- Notifications ---------- */

/** Another attempt is allowed this long after the previous one (guards against double-sends). */
const NOTIFY_CLAIM_MS = 10 * 60 * 1000;
const MAX_NOTIFY_ATTEMPTS = 5;

/**
 * Sends the new-lead notification once. The lead row is "claimed" with a conditional UPDATE, so
 * the post-submit send and the daily retry job can't both send it. Success sets notifiedAt;
 * failure leaves it empty for the retry job. Every attempt is recorded in the lead's history
 * with the providers' actual answers.
 */
export async function notifyNewLead(leadId: number): Promise<ChannelResult[] | null> {
  if (!isNotificationConfigured()) return null;
  const now = new Date();
  const [lead] = await db
    .update(l)
    .set({ notifyAttempts: sql`${l.notifyAttempts} + 1`, lastNotifyAttemptAt: now })
    .where(
      and(
        eq(l.id, leadId),
        isNull(l.notifiedAt),
        lt(l.notifyAttempts, MAX_NOTIFY_ATTEMPTS),
        or(isNull(l.lastNotifyAttemptAt), lt(l.lastNotifyAttemptAt, new Date(now.getTime() - NOTIFY_CLAIM_MS)))
      )
    )
    .returning();
  if (!lead) return null;

  const results = await sendNotification(newLeadMessage(lead, siteConfig.url));
  if (anySent(results)) await db.update(l).set({ notifiedAt: new Date() }).where(eq(l.id, leadId));
  const summary = results.map((r) => `${r.channel}: ${r.outcome}${r.detail ? ` (${r.detail})` : ""}`).join(", ");
  await logActivity(leadId, "notification", summary, { results });
  return results;
}

/** Daily job: retries notifications for leads from the last 48 hours that never got one. */
export async function retryPendingNotifications(): Promise<{ attempted: number; sent: number }> {
  if (!isNotificationConfigured()) return { attempted: 0, sent: 0 };
  const pending = await db
    .select({ id: l.id })
    .from(l)
    .where(
      and(
        isNull(l.notifiedAt),
        lt(l.notifyAttempts, MAX_NOTIFY_ATTEMPTS),
        gte(l.createdAt, new Date(Date.now() - 48 * 60 * 60 * 1000))
      )
    )
    .limit(50);
  let sent = 0;
  for (const { id } of pending) {
    const results = await notifyNewLead(id);
    if (results && anySent(results)) sent++;
  }
  return { attempted: pending.length, sent };
}

/**
 * Daily job: one summary of overdue and due-today follow-ups. A job_runs row keyed by the IST
 * date makes it run at most once per day even if the scheduler fires twice.
 */
export async function sendFollowUpDigest(now: Date = new Date()): Promise<{ status: string; results?: ChannelResult[] }> {
  if (!isNotificationConfigured()) return { status: "skipped: notifications not configured" };
  const runKey = istDateKey(now);
  const [claimed] = await db
    .insert(jobRuns)
    .values({ job: "follow_up_digest", runKey })
    .onConflictDoNothing()
    .returning({ id: jobRuns.id });
  if (!claimed) return { status: `skipped: already ran for ${runKey}` };

  const { start, end } = istDayBounds(now);
  const open = notInArray(l.status, [...closedLeadStatuses]);
  const columns = { id: l.id, name: l.name, projectTitle: l.projectTitle, status: l.status, followUpAt: l.followUpAt };
  const [overdue, dueToday, [{ total: newUncontacted }]] = await Promise.all([
    db.select(columns).from(l).where(and(open, eq(l.optedOut, false), lt(l.followUpAt, start))).orderBy(asc(l.followUpAt)),
    db
      .select(columns)
      .from(l)
      .where(and(open, eq(l.optedOut, false), gte(l.followUpAt, start), lt(l.followUpAt, end)))
      .orderBy(asc(l.followUpAt)),
    db.select({ total: count() }).from(l).where(and(eq(l.status, "new"), isNull(l.followUpAt), eq(l.optedOut, false))),
  ]);

  const [[{ staleVerification }], [{ staleAvailability }], [{ partnersDue }], [{ submissions }]] = await Promise.all([
    db
      .select({ staleVerification: count() })
      .from(p)
      .where(and(eq(p.isDeleted, false), eq(p.isDraft, false), eq(p.isActive, true), eq(p.verificationStatus, "verified"), lt(p.lastVerifiedAt, new Date(now.getTime() - 80 * 86_400_000)))),
    db
      .select({ staleAvailability: count() })
      .from(p)
      .where(and(eq(p.isDeleted, false), eq(p.isDraft, false), eq(p.isActive, true), sql`${p.availability} <> 'unavailable'`, or(isNull(p.availabilityConfirmedAt), lt(p.availabilityConfirmedAt, new Date(now.getTime() - 30 * 86_400_000))))),
    db
      .select({ partnersDue: count() })
      .from(schema.partners)
      .where(and(notInArray(schema.partners.status, ["onboarded", "not_interested"]), eq(schema.partners.doNotContact, false), or(lt(schema.partners.nextFollowUpAt, end), eq(schema.partners.status, "follow_up_due")))),
    db.select({ submissions: count() }).from(schema.propertySubmissions).where(inArray(schema.propertySubmissions.status, ["pending", "needs_correction"])),
  ]);
  const extras = [
    staleVerification && `Listings due for re-verification (verified 80+ days ago): ${staleVerification}`,
    staleAvailability && `Listings whose availability needs reconfirming: ${staleAvailability}`,
    partnersDue && `Partner follow-ups due: ${partnersDue}`,
    submissions && `Owner / builder submissions awaiting review: ${submissions}`,
  ].filter((x): x is string => Boolean(x));

  const message = followUpDigestMessage(overdue, dueToday, newUncontacted, siteConfig.url, extras);
  const results = message ? await sendNotification(message) : [];
  await db
    .update(jobRuns)
    .set({ result: { overdue: overdue.length, dueToday: dueToday.length, newUncontacted, results } })
    .where(eq(jobRuns.id, claimed.id));
  return { status: message ? "sent" : "nothing due", results };
}

/* ---------- Admin: lists & counts ---------- */

/** "Needs action": follow-up due by end of today, or a new lead nobody has scheduled yet. */
function viewCondition(view: LeadView, now = new Date()): SQL {
  const { start, end } = istDayBounds(now);
  const open = and(notInArray(l.status, [...closedLeadStatuses]), eq(l.optedOut, false))!;
  if (view === "overdue") {
    return and(
      open,
      or(lt(l.followUpAt, start), and(eq(l.status, "new"), isNull(l.followUpAt), lt(l.createdAt, new Date(now.getTime() - 86_400_000))))
    )!;
  }
  return and(open, or(lt(l.followUpAt, end), and(eq(l.status, "new"), isNull(l.followUpAt))))!;
}

export async function listLeads(options: {
  status?: LeadStatus;
  source?: LeadSource;
  view?: LeadView;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<Lead>> {
  const where: SQL[] = [];
  if (options.status) where.push(eq(l.status, options.status));
  if (options.source) where.push(eq(l.source, options.source));
  if (options.view) where.push(viewCondition(options.view));
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
    // Follow-up views: soonest first. Otherwise newest first.
    .orderBy(...(options.view ? [sql`${l.followUpAt} asc nulls first`, asc(l.createdAt)] : [desc(l.createdAt), desc(l.id)]))
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
  const counts = Object.fromEntries([["all", 0], ...leadStatuses.map((s) => [s, 0])]) as Record<LeadStatus | "all", number>;
  for (const row of rows) {
    if (row.status in counts) counts[row.status as LeadStatus] = row.total;
    counts.all += row.total;
  }
  return counts;
}

export async function getFollowUpCounts(): Promise<Record<LeadView, number>> {
  const [[{ due }], [{ overdue }]] = await Promise.all([
    db.select({ due: count() }).from(l).where(viewCondition("due")),
    db.select({ overdue: count() }).from(l).where(viewCondition("overdue")),
  ]);
  return { due, overdue };
}

/* ---------- Admin: one lead ---------- */

function assertId(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) throw notFound("Lead not found.");
}

export async function getLead(id: number): Promise<{ lead: Lead; activities: (LeadActivity & { userName: string | null })[] }> {
  assertId(id);
  const [lead] = await db.select().from(l).where(eq(l.id, id)).limit(1);
  if (!lead) throw notFound("Lead not found.");
  const activities = await db
    .select({ activity: a, userName: schema.users.name })
    .from(a)
    .leftJoin(schema.users, eq(a.userId, schema.users.id))
    .where(eq(a.leadId, id))
    .orderBy(desc(a.createdAt), desc(a.id));
  return { lead, activities: activities.map((row) => ({ ...row.activity, userName: row.userName })) };
}

/**
 * Status / follow-up / opt-out changes from the admin. Each change is written to the history.
 * Moving to Contacted / Qualified / Site visit with no follow-up date schedules one; moving to
 * Converted or Lost clears it.
 */
export async function updateLead(id: number, changes: LeadUpdateInput, userId: number): Promise<Lead> {
  const { lead: current } = await getLead(id);
  const set: Partial<Lead> = {};
  const log: Promise<void>[] = [];

  if (changes.status && changes.status !== current.status) {
    set.status = changes.status;
    log.push(logActivity(id, "status", "", { from: current.status, to: changes.status }, userId));
    if (changes.status !== "new" && !current.lastContactedAt) set.lastContactedAt = new Date();
    if (closedLeadStatuses.includes(changes.status)) {
      if (changes.followUpAt === undefined && current.followUpAt) set.followUpAt = null;
    } else {
      const days = autoFollowUpDays[changes.status];
      if (days && changes.followUpAt === undefined && (!current.followUpAt || current.followUpAt < new Date())) {
        set.followUpAt = followUpInDays(days);
        log.push(logActivity(id, "follow_up", `Automatically scheduled in ${days} day${days === 1 ? "" : "s"}`, { at: set.followUpAt.toISOString() }, userId));
      }
    }
  }

  if (changes.followUpAt !== undefined) {
    set.followUpAt = changes.followUpAt;
    log.push(logActivity(id, "follow_up", changes.followUpAt ? "" : "Follow-up cleared", { at: changes.followUpAt?.toISOString() ?? null }, userId));
  }

  if (changes.optedOut !== undefined && changes.optedOut !== current.optedOut) {
    set.optedOut = changes.optedOut;
    set.optedOutAt = changes.optedOut ? new Date() : null;
    if (changes.optedOut) {
      set.followUpAt = null;
      set.marketingOptIn = false;
    }
    log.push(logActivity(id, "opt_out", changes.optedOut ? "Marked do-not-contact" : "Do-not-contact removed", {}, userId));
  }

  // Requirement fields: one history entry listing what changed.
  const detailKeys = ["preferredLocation", "preferredPropertyType", "timeline", "budget", "nextAction"] as const;
  const changedDetails = detailKeys.filter((k) => changes[k] !== undefined && changes[k] !== current[k]);
  for (const k of changedDetails) set[k] = changes[k]!;
  if (changedDetails.length) {
    log.push(logActivity(id, "details", changedDetails.map((k) => `${detailLabels[k]}: ${changes[k] || "—"}`).join("\n"), {}, userId));
  }

  // Deal outcome.
  const dealKeys = ["dealValue", "commissionAmount", "commissionStatus"] as const;
  const changedDeal = dealKeys.filter((k) => changes[k] !== undefined && changes[k] !== current[k]);
  if (changedDeal.length) {
    if (changes.dealValue !== undefined) set.dealValue = changes.dealValue;
    if (changes.commissionAmount !== undefined) set.commissionAmount = changes.commissionAmount;
    if (changes.commissionStatus !== undefined) {
      set.commissionStatus = changes.commissionStatus;
      const confirmed = changes.commissionStatus === "confirmed" || changes.commissionStatus === "received";
      set.commissionConfirmedAt = confirmed ? (current.commissionConfirmedAt ?? new Date()) : null;
    }
    log.push(
      logActivity(id, "deal", "", {
        dealValue: set.dealValue ?? current.dealValue,
        commissionAmount: set.commissionAmount ?? current.commissionAmount,
        commissionStatus: set.commissionStatus ?? current.commissionStatus,
      }, userId)
    );
  }

  if (Object.keys(set).length === 0) return current;
  const [row] = await db.update(l).set(set).where(eq(l.id, id)).returning();
  await Promise.all(log);
  return row;
}

const detailLabels = {
  preferredLocation: "Preferred location",
  preferredPropertyType: "Property type",
  timeline: "Timeline",
  budget: "Budget",
  nextAction: "Next action",
} as const;

/**
 * Records what the buyer said. "Declined" moves the lead to Lost and clears the follow-up;
 * "Later" schedules the next follow-up (the given time, or 3 days at 10:00 IST); "Replied"
 * just logs it and counts as contact.
 */
export async function recordLeadResponse(
  id: number,
  outcome: "replied" | "declined" | "later",
  note: string,
  followUpAt: Date | null,
  userId: number
): Promise<void> {
  const { lead } = await getLead(id);
  await logActivity(id, "response", note, { outcome }, userId);
  await db.update(l).set({ lastContactedAt: new Date() }).where(eq(l.id, id));
  if (outcome === "declined") {
    await updateLead(id, { status: "not_interested" }, userId);
  } else if (outcome === "later") {
    await updateLead(id, { followUpAt: followUpAt ?? followUpInDays(3) }, userId);
  } else if (lead.status === "new") {
    await updateLead(id, { status: "contacted" }, userId);
  }
}

/** Manual note / call log / "opened WhatsApp" entry from the lead page. */
export async function addLeadActivity(
  id: number,
  type: "note" | "call" | "whatsapp_opened",
  note: string,
  userId: number
): Promise<void> {
  const { lead } = await getLead(id);
  if (lead.optedOut && type !== "note") throw new HttpError(409, "This person asked not to be contacted.");
  await logActivity(id, type, note, {}, userId);
  if (type !== "note") await db.update(l).set({ lastContactedAt: new Date() }).where(eq(l.id, id));
}

/* ---------- Reports ---------- */

export interface LeadFunnel {
  total: number;
  byStatus: Record<LeadStatus, number>;
  bySource: { source: string; total: number; converted: number }[];
}

/** Leads created in [from, to): how far each got, and where they came from. Real rows only. */
export async function getLeadFunnel(from: Date, to: Date = new Date()): Promise<LeadFunnel> {
  const range = and(gte(l.createdAt, from), lt(l.createdAt, to));
  const [statusRows, sourceRows] = await Promise.all([
    db.select({ status: l.status, total: count() }).from(l).where(range).groupBy(l.status),
    db
      .select({
        source: sql<string>`coalesce(nullif(${l.utmSource}, ''), case when ${l.referrer} <> '' then 'referral' else 'direct / unknown' end)`,
        total: count(),
        converted: sql<number>`count(*) filter (where ${l.status} = 'closed')`.mapWith(Number),
      })
      .from(l)
      .where(range)
      .groupBy(sql`1`)
      .orderBy(desc(count())),
  ]);
  const byStatus = Object.fromEntries(leadStatuses.map((s) => [s, 0])) as Record<LeadStatus, number>;
  let total = 0;
  for (const row of statusRows) {
    if (row.status in byStatus) byStatus[row.status as LeadStatus] = row.total;
    total += row.total;
  }
  return { total, byStatus, bySource: sourceRows };
}

/** Status changes recorded in [from, to), e.g. how many leads were moved to "site_visit" this week. */
export async function getLeadStageMoves(from: Date, to: Date = new Date()): Promise<Record<string, number>> {
  const rows = await db
    .select({ to: sql<string>`${a.meta}->>'to'`, total: count() })
    .from(a)
    .where(and(eq(a.type, "status"), gte(a.createdAt, from), lt(a.createdAt, to)))
    .groupBy(sql`1`);
  return Object.fromEntries(rows.map((r) => [r.to, r.total]));
}


/* ---------- Today panel ---------- */

/** Leads needing action today, soonest first. */
export async function getDueLeads(limit = 6): Promise<Lead[]> {
  return db
    .select()
    .from(l)
    .where(viewCondition("due"))
    .orderBy(sql`${l.followUpAt} asc nulls first`, asc(l.createdAt))
    .limit(limit);
}

export async function getRecentLeads(limit = 8): Promise<Lead[]> {
  return db.select().from(l).orderBy(desc(l.createdAt)).limit(limit);
}

/** Leads per listing in the last `days` days — which properties attract interest. */
export async function getInterestByProperty(days = 30, limit = 5): Promise<{ propertyId: number | null; title: string; total: number }[]> {
  return db
    .select({ propertyId: l.propertyId, title: sql<string>`max(${l.projectTitle})`, total: count() })
    .from(l)
    .where(gte(l.createdAt, new Date(Date.now() - days * 86_400_000)))
    .groupBy(l.propertyId)
    .orderBy(desc(count()))
    .limit(limit);
}

/** Converted leads and commissions recorded in [from, to) — actual figures only. */
export async function getDealTotals(from: Date, to: Date = new Date()): Promise<{ confirmedCount: number; confirmedCommission: number; expectedCommission: number }> {
  const [row] = await db
    .select({
      confirmedCount: sql<number>`count(*) filter (where ${l.commissionStatus} in ('confirmed','received'))`.mapWith(Number),
      confirmedCommission: sql<number>`coalesce(sum(${l.commissionAmount}) filter (where ${l.commissionStatus} in ('confirmed','received')), 0)`.mapWith(Number),
      expectedCommission: sql<number>`coalesce(sum(${l.commissionAmount}) filter (where ${l.commissionStatus} = 'expected'), 0)`.mapWith(Number),
    })
    .from(l)
    .where(or(and(gte(l.commissionConfirmedAt, from), lt(l.commissionConfirmedAt, to)), and(eq(l.commissionStatus, "expected"), gte(l.updatedAt, from), lt(l.updatedAt, to))));
  return row;
}
