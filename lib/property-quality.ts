import { AVAILABILITY_STALE_DAYS, VERIFICATION_STALE_DAYS } from "@/lib/constants/property";
import { richTextToPlain } from "@/lib/rich-text";
import type { Property } from "@/lib/types";

/**
 * Listing checks for Admin → Listing quality. Nothing here changes a listing: it only points a
 * person at fields that are missing, inconsistent, or would make an unsupported claim.
 */

export type IssueSeverity = "high" | "medium" | "low";

export interface QualityIssue {
  code: string;
  severity: IssueSeverity;
  message: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Words that suggest a test or demo listing that must not be shown as real inventory. */
const DEMO_PATTERN = /\b(demo|test|sample|dummy|lorem|ipsum|placeholder|untitled)\b/i;

/** Marketing claims that need documentary proof before they are shown. */
const CLAIM_PATTERN = /\b(guarantee[ds]?|assured returns?|\d+\s*%\s*(returns?|appreciation)|double your|risk[- ]free|100\s*% safe)\b/i;

export function getQualityIssues(p: Property, now: Date = new Date()): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const add = (severity: IssueSeverity, code: string, message: string) => issues.push({ code, severity, message });
  const description = richTextToPlain(p.description);
  const text = [p.title, description, ...p.usps].join(" ");

  // Missing basics
  if (!p.priceMin) add("medium", "missing_price", "No price — shows as “Price on request”.");
  if (!p.locality && !p.address) add("high", "missing_location", "No locality or address.");
  if (p.latitude == null || p.longitude == null) add("low", "missing_map", "No map pin.");
  if (!p.propertyType) add("high", "missing_type", "No property type.");
  if (p.images.length === 0) add("high", "missing_images", "No photos.");
  else if (p.images.length < 3) add("low", "few_images", `Only ${p.images.length} photo${p.images.length === 1 ? "" : "s"}.`);
  if (!p.areaMin) add("medium", "missing_area", "No area / size.");
  if (description.length < 150) add("medium", "thin_description", "Description is under 150 characters (thin for search engines).");
  if (!p.builder) add("low", "missing_builder", "No builder / developer name.");

  // Availability & possession
  if (p.status === "Under Construction" && !p.possessionDate) {
    add("medium", "missing_possession", "Under construction but no possession date.");
  }
  if (p.status === "Ready to Move" && p.possessionDate && new Date(p.possessionDate) > now) {
    add("high", "possession_conflict", "Marked Ready to Move but the possession date is in the future.");
  }
  if (p.status !== "Ready to Move" && p.possessionDate && new Date(p.possessionDate).getTime() < now.getTime() - 365 * DAY_MS) {
    add("medium", "possession_past", "Possession date is over a year ago but status is not Ready to Move.");
  }

  // Inconsistent numbers
  if (p.priceMax && p.priceMin && p.priceMax < p.priceMin) add("high", "price_range", "Max price is below min price.");
  if (p.areaMax && p.areaMin && p.areaMax < p.areaMin) add("high", "area_range", "Max area is below min area.");
  if (p.carpetArea && p.builtUpArea && p.carpetArea > p.builtUpArea) {
    add("high", "carpet_gt_builtup", "Carpet area is larger than built-up area.");
  }
  if (p.prelaunchRate && p.launchRate && p.prelaunchRate > p.launchRate) {
    add("medium", "offer_rates", "Pre-launch rate is higher than launch rate.");
  }
  if (p.priceMin && p.priceMin < 100000) add("medium", "price_suspicious", "Price is under ₹1 Lakh — check the unit.");

  // Claims
  if (p.reraRegistered && !p.reraNumber) {
    add("high", "rera_without_number", "Marked RERA registered without a RERA number — add it or untick.");
  }
  if (p.reraNumber && !/^[A-Za-z0-9/_\-. ]{6,}$/.test(p.reraNumber)) {
    add("medium", "rera_format", "RERA number looks malformed.");
  }
  if (CLAIM_PATTERN.test(text)) {
    add("high", "unsupported_claim", "Mentions guaranteed / percentage returns or appreciation — remove unless documented.");
  }
  if (DEMO_PATTERN.test(p.title)) add("high", "demo_listing", "Title looks like a demo or test listing.");

  // Provenance
  if (!p.listingSource) add("medium", "missing_source", "Listing source not recorded.");
  if (p.verificationStatus === "needs_review") add("high", "needs_review", "Flagged for review.");
  else if (p.verificationStatus !== "verified") add("low", "unverified", "Details not verified against builder documents yet.");
  else if (!p.lastVerifiedAt || now.getTime() - p.lastVerifiedAt.getTime() > VERIFICATION_STALE_DAYS * DAY_MS) {
    add("medium", "verification_stale", `Last verified over ${VERIFICATION_STALE_DAYS} days ago.`);
  }

  // Availability
  if (p.availability !== "unavailable" && p.isActive && !p.isDraft) {
    if (!p.availabilityConfirmedAt) add("medium", "availability_unconfirmed", "Availability never confirmed with the owner / builder.");
    else if (now.getTime() - p.availabilityConfirmedAt.getTime() > AVAILABILITY_STALE_DAYS * DAY_MS) {
      add("medium", "availability_stale", `Availability last confirmed over ${AVAILABILITY_STALE_DAYS} days ago.`);
    }
  }

  // Contact
  if (!p.phone) add("high", "missing_phone", "No contact number.");

  return issues;
}

/** Titles shared by more than one listing (duplicate content for search engines). */
export function duplicateTitles(properties: Pick<Property, "id" | "title">[]): Map<number, string> {
  const byTitle = new Map<string, number[]>();
  for (const p of properties) {
    const key = p.title.trim().toLowerCase();
    byTitle.set(key, [...(byTitle.get(key) ?? []), p.id]);
  }
  const result = new Map<number, string>();
  for (const ids of byTitle.values()) {
    if (ids.length > 1) for (const id of ids) result.set(id, `Same title as ${ids.length - 1} other listing(s).`);
  }
  return result;
}

export const severityRank: Record<IssueSeverity, number> = { high: 0, medium: 1, low: 2 };
