import { cleanTag } from "@/lib/attribution";
import {
  budgetOptions,
  commissionStatuses,
  leadResponses,
  leadSources,
  leadStatuses,
  manualLeadActivityTypes,
  PRIVACY_NOTICE_VERSION,
  purchaseTimelines,
  type CommissionStatus,
  type LeadResponse,
  type LeadStatus,
} from "@/lib/constants/lead";
import { parseIstInput } from "@/lib/utils/dates";
import { normalizeIndianNumber } from "@/lib/utils/phone";
import { validationError } from "../http";
import { bool, collectErrors, num, oneOf, str } from "./helpers";

export interface LeadInput {
  name: string;
  phone: string;
  budget: string;
  message: string;
  source: (typeof leadSources)[number];
  propertyId: number | null;
  pageUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  referrer: string;
  landingPage: string;
  privacyNoticeVersion: string;
  marketingOptIn: boolean;
  timeline: string;
  /** Honeypot: a hidden field real visitors never fill in. */
  isBot: boolean;
}

const URL_PATTERN = /(https?:\/\/|www\.)\S+/i;
const URL_PATTERN_ALL = /(https?:\/\/|www\.)\S+/gi;

/** Indian mobile numbers start with 6–9 after the country code; other countries are accepted as-is. */
export function isPlausiblePhone(e164: string): boolean {
  const digits = e164.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return /^91[6-9]\d{9}$/.test(digits) && !/^91(\d)\1{9}$/.test(digits);
  return digits.length >= 11 && digits.length <= 15;
}

/** Keeps only an http(s) URL's origin + path, so query strings with personal data aren't stored. */
function cleanUrl(raw: string, max: number): string {
  try {
    const url = new URL(raw);
    if (!/^https?:$/.test(url.protocol)) return "";
    return `${url.origin}${url.pathname}`.slice(0, max);
  } catch {
    return "";
  }
}

/** POST /api/leads body from the public enquiry / brochure forms. */
export function validateLeadInput(body: Record<string, unknown>): LeadInput {
  const v = collectErrors();

  const name = str(body, "name", 80).replace(/\s+/g, " ");
  if (name.length < 2 || !/\p{L}/u.test(name)) v.add("name", "Please enter your name.");
  else if (URL_PATTERN.test(name) || /[<>{}]/.test(name)) v.add("name", "Please enter just your name.");

  const normalized = normalizeIndianNumber(str(body, "phone", 30));
  if (!normalized || !isPlausiblePhone(normalized.phone)) v.add("phone", "Please enter a valid 10-digit mobile number.");

  const message = str(body, "message", 1000);
  if ((message.match(URL_PATTERN_ALL) ?? []).length > 1) v.add("message", "Please remove the links from your message.");

  // Budget is optional; anything that isn't one of the listed ranges is dropped.
  const budget = oneOf(budgetOptions, str(body, "budget", 50)) ?? "";

  const rawId = Number(body.propertyId);
  const propertyId = Number.isInteger(rawId) && rawId > 0 ? rawId : null;

  if (v.hasErrors) throw validationError(v.errors);

  const landing = str(body, "landingPage", 300);
  return {
    name,
    phone: normalized!.phone,
    budget,
    message,
    source: oneOf(leadSources, str(body, "source", 20)) ?? "enquiry",
    propertyId,
    pageUrl: cleanUrl(str(body, "pageUrl", 1000), 500),
    utmSource: cleanTag(str(body, "utmSource", 200)),
    utmMedium: cleanTag(str(body, "utmMedium", 200)),
    utmCampaign: cleanTag(str(body, "utmCampaign", 200)),
    utmTerm: cleanTag(str(body, "utmTerm", 200)),
    utmContent: cleanTag(str(body, "utmContent", 200)),
    referrer: cleanUrl(str(body, "referrer", 500), 300),
    landingPage: landing.startsWith("/") ? landing.replace(/[^\w\-./%]/g, "") : "",
    // The notice is always shown with the form; record which wording was current.
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    marketingOptIn: bool(body, "marketingOptIn"),
    timeline: oneOf(purchaseTimelines, str(body, "timeline", 40)) ?? "",
    isBot: str(body, "website", 200) !== "",
  };
}

export interface LeadUpdateInput {
  status?: LeadStatus;
  /** null clears the follow-up. */
  followUpAt?: Date | null;
  optedOut?: boolean;
  preferredLocation?: string;
  preferredPropertyType?: string;
  timeline?: string;
  budget?: string;
  nextAction?: string;
  dealValue?: number;
  commissionAmount?: number;
  commissionStatus?: CommissionStatus;
}

/** PATCH /api/leads/:id  { status?, followUpAt?, optedOut? } — admin. */
export function validateLeadUpdate(body: Record<string, unknown>): LeadUpdateInput {
  const v = collectErrors();
  const changes: LeadUpdateInput = {};

  if (body.status !== undefined) {
    const status = oneOf(leadStatuses, str(body, "status", 30));
    if (!status) v.add("status", "Choose a valid status.");
    else changes.status = status;
  }
  if (body.followUpAt !== undefined) {
    if (body.followUpAt === null || body.followUpAt === "") changes.followUpAt = null;
    else {
      const date = parseIstInput(str(body, "followUpAt", 40));
      if (!date) v.add("followUpAt", "Pick a valid date and time.");
      else changes.followUpAt = date;
    }
  }
  if (typeof body.optedOut === "boolean") changes.optedOut = body.optedOut;

  // Buyer requirement and next step (lead page "Requirement" box)
  if (body.preferredLocation !== undefined) changes.preferredLocation = str(body, "preferredLocation", 200);
  if (body.preferredPropertyType !== undefined) changes.preferredPropertyType = str(body, "preferredPropertyType", 100);
  if (body.timeline !== undefined) changes.timeline = oneOf(purchaseTimelines, str(body, "timeline", 40)) ?? "";
  if (body.budget !== undefined) changes.budget = oneOf(budgetOptions, str(body, "budget", 50)) ?? "";
  if (body.nextAction !== undefined) changes.nextAction = str(body, "nextAction", 300);

  // Deal outcome — only what the admin enters
  if (body.dealValue !== undefined) changes.dealValue = Math.round(num(body, "dealValue"));
  if (body.commissionAmount !== undefined) changes.commissionAmount = Math.round(num(body, "commissionAmount"));
  if (body.commissionStatus !== undefined) {
    const status = oneOf(commissionStatuses, str(body, "commissionStatus", 20));
    if (status === undefined) v.add("commissionStatus", "Choose a valid commission status.");
    else changes.commissionStatus = status;
  }
  if ((changes.commissionStatus === "confirmed" || changes.commissionStatus === "received") && body.commissionAmount !== undefined && !changes.commissionAmount) {
    v.add("commissionAmount", "Enter the confirmed commission amount.");
  }

  if (v.hasErrors) throw validationError(v.errors);
  if (Object.keys(changes).length === 0) throw validationError({ status: "Nothing to update." });
  return changes;
}

/** POST /api/leads/:id/activities  { type, note } — admin. */
export function validateLeadActivity(body: Record<string, unknown>) {
  const type = oneOf(manualLeadActivityTypes, str(body, "type", 30));
  const note = str(body, "note", 2000);
  if (!type) throw validationError({ type: "Choose a valid activity type." });
  if (type === "note" && !note) throw validationError({ note: "Write a note first." });
  return { type, note };
}

/** POST /api/leads/:id/response  { outcome: replied | declined | later, note?, followUpAt? } — admin. */
export function validateLeadResponse(body: Record<string, unknown>): { outcome: LeadResponse; note: string; followUpAt: Date | null } {
  const outcome = oneOf(leadResponses, str(body, "outcome", 20));
  if (!outcome) throw validationError({ outcome: "Choose what the buyer said." });
  const raw = str(body, "followUpAt", 40);
  const followUpAt = raw ? parseIstInput(raw) : null;
  if (raw && !followUpAt) throw validationError({ followUpAt: "Pick a valid date and time." });
  return { outcome, note: str(body, "note", 2000), followUpAt };
}
