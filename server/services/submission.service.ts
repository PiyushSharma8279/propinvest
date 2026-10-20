import "server-only";
import { and, count, desc, eq, gte, ilike, ne, or, sql } from "drizzle-orm";
import type { ReviewAction, SubmissionStatus } from "@/lib/constants/submission";
import { siteConfig } from "@/lib/site-config";
import { formatIst } from "@/lib/utils/dates";
import { db, schema } from "../db/client";
import type { Property, PropertySubmission } from "../db/schema";
import { HttpError, notFound } from "../http";
import type { SubmissionInput } from "../validators/submission.validator";
import { validatePropertyInput } from "../validators/property.validator";
import { audit } from "./audit.service";
import { isNotificationConfigured, sendNotification } from "./notify.service";
import { createDraft } from "./property.service";

const { propertySubmissions: ps, properties: p, partners: pt, partnerActivities: pa } = schema;

/** Listings / submissions that look like the same property: same phone, or same locality + type at a similar price. */
async function findPossibleDuplicates(input: SubmissionInput): Promise<{ properties: number[]; submissions: number[] }> {
  const priceBand = input.price
    ? and(gte(p.priceMin, Math.round(input.price * 0.85)), sql`${p.priceMin} <= ${Math.round(input.price * 1.15)}`)
    : undefined;
  const [propertyRows, submissionRows] = await Promise.all([
    db
      .select({ id: p.id })
      .from(p)
      .where(
        and(
          eq(p.isDeleted, false),
          or(
            eq(p.phone, input.phone),
            and(ilike(p.locality, input.locality), ilike(p.city, input.city), eq(p.propertyType, input.propertyType), priceBand)
          )
        )
      )
      .limit(10),
    db
      .select({ id: ps.id })
      .from(ps)
      .where(
        and(
          ne(ps.status, "rejected"),
          or(eq(ps.phone, input.phone), and(ilike(ps.locality, input.locality), ilike(ps.title, input.title)))
        )
      )
      .limit(10),
  ]);
  return { properties: propertyRows.map((r) => r.id), submissions: submissionRows.map((r) => r.id) };
}

/** Finds the submitter in Partners by phone / email, or adds them, so every owner has one id. */
async function matchOrCreatePartner(input: SubmissionInput): Promise<number> {
  const [existing] = await db
    .select({ id: pt.id })
    .from(pt)
    .where(input.email ? or(eq(pt.phone, input.phone), eq(pt.email, input.email)) : eq(pt.phone, input.phone))
    .limit(1);
  if (existing) return existing.id;
  const partnerType = input.submitterType === "builder" ? "builder" : input.submitterType === "channel_partner" ? "channel_partner" : input.submitterType === "agent" ? "agent" : "owner";
  const [row] = await db
    .insert(pt)
    .values({
      name: input.name,
      phone: input.phone,
      email: input.email,
      partnerType,
      city: input.city,
      contactSource: "Submitted a property on the website",
      researchedAt: new Date(),
      status: "interested",
      notes: `Prefers ${input.preferredContact}.`,
    })
    .returning({ id: pt.id });
  await db.insert(pa).values({ partnerId: row.id, type: "created", note: "Added from a website property submission" });
  return row.id;
}

export async function createSubmission(input: SubmissionInput): Promise<{ id: number | null }> {
  if (input.isBot) return { id: null };
  const [possibleDuplicates, partnerId] = await Promise.all([findPossibleDuplicates(input), matchOrCreatePartner(input)]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isBot, ...values } = input;
  const [row] = await db.insert(ps).values({ ...values, partnerId, possibleDuplicates }).returning();
  return { id: row.id };
}

/** Admin alert for a new submission — same optional channels as new leads. */
export async function notifyNewSubmission(id: number): Promise<void> {
  if (!isNotificationConfigured()) return;
  const [s] = await db.select().from(ps).where(eq(ps.id, id)).limit(1);
  if (!s) return;
  const dup = s.possibleDuplicates.properties.length + s.possibleDuplicates.submissions.length;
  await sendNotification({
    subject: `New property submission: ${s.title}`,
    text: [
      `${s.title} — ${s.propertyType}, ${s.locality}, ${s.city}`,
      `From: ${s.name} (${s.submitterType}), ${s.phone}, prefers ${s.preferredContact}`,
      `Received: ${formatIst(s.createdAt)}`,
      dup ? `Possible duplicates: ${dup} — check before approving.` : null,
      `\nReview: ${siteConfig.url}/admin/submissions/${s.id}`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });
}

export async function listSubmissions(status?: SubmissionStatus): Promise<PropertySubmission[]> {
  return db
    .select()
    .from(ps)
    .where(status ? eq(ps.status, status) : undefined)
    .orderBy(desc(ps.createdAt))
    .limit(300);
}

export async function getSubmissionCounts(): Promise<Record<string, number>> {
  const rows = await db.select({ status: ps.status, total: count() }).from(ps).groupBy(ps.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.total]));
}

export async function getSubmission(id: number): Promise<{ submission: PropertySubmission; duplicates: Pick<Property, "id" | "title" | "locality" | "city" | "priceMin">[]; duplicateSubmissions: Pick<PropertySubmission, "id" | "title" | "status">[] }> {
  if (!Number.isSafeInteger(id) || id <= 0) throw notFound("Submission not found.");
  const [submission] = await db.select().from(ps).where(eq(ps.id, id)).limit(1);
  if (!submission) throw notFound("Submission not found.");
  const { properties: propIds, submissions: subIds } = submission.possibleDuplicates;
  const [duplicates, duplicateSubmissions] = await Promise.all([
    propIds.length
      ? db.select({ id: p.id, title: p.title, locality: p.locality, city: p.city, priceMin: p.priceMin }).from(p).where(sql`${p.id} in ${propIds}`)
      : [],
    subIds.filter((x) => x !== id).length
      ? db.select({ id: ps.id, title: ps.title, status: ps.status }).from(ps).where(and(sql`${ps.id} in ${subIds}`, ne(ps.id, id)))
      : [],
  ]);
  return { submission, duplicates, duplicateSubmissions };
}

const nextStatus: Record<ReviewAction, SubmissionStatus> = {
  approve: "approved",
  needs_correction: "needs_correction",
  reject: "rejected",
  suspend: "suspended",
  reopen: "pending",
};

/**
 * Review a submission. Approving creates a *draft* listing (never published automatically)
 * marked "needs review", with the source recorded, linked to the owner's partner record. The
 * admin then checks documents, edits and publishes it from the normal listing editor.
 */
export async function reviewSubmission(id: number, action: ReviewAction, note: string, userId: number): Promise<{ propertyId: number | null }> {
  const { submission: s } = await getSubmission(id);
  if (action === "approve" && s.propertyId) throw new HttpError(409, "A draft listing was already created for this submission.");

  let propertyId = s.propertyId;
  if (action === "approve") {
    const input = validatePropertyInput(
      {
        title: s.title,
        category: s.category,
        propertyType: s.propertyType,
        description: s.description
          .split(/\n{2,}/)
          .map((para) => `<p>${para.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`)
          .join(""),
        locality: s.locality,
        city: s.city,
        state: s.city.toLowerCase().includes("noida") || s.city.toLowerCase().includes("ghaziabad") ? "Uttar Pradesh" : "",
        address: s.address,
        priceMin: s.price,
        priceMax: s.price,
        areaMin: s.area,
        areaUnit: s.areaUnit,
        status: "Ready to Move",
        reraRegistered: Boolean(s.reraNumber),
        reraNumber: s.reraNumber,
        images: s.images,
        // Buyers reach InvestsProperty first; the owner's number stays internal.
        phone: siteConfig.contact.phone,
        listingSource: `Website submission #${s.id} by ${s.submitterType}, ${formatIst(s.createdAt, false)}; authorisation ticked (terms ${s.termsVersion})`,
        verificationStatus: "needs_review",
        availability: "available",
        availabilityConfirmedAt: new Date(s.createdAt.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10),
        partnerId: s.partnerId ?? undefined,
        isActive: false,
      },
      "draft"
    );
    const property = await createDraft(input, userId);
    propertyId = property.id;
  }

  await db
    .update(ps)
    .set({ status: nextStatus[action], reviewNote: note, reviewedBy: userId, reviewedAt: new Date(), propertyId })
    .where(eq(ps.id, id));
  await audit(userId, `submission_${action}`, "submission", id, note.slice(0, 200));
  return { propertyId };
}
