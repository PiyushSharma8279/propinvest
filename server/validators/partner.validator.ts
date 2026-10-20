import {
  contentStatuses,
  contentTypes,
  onboardingChecklist,
  partnerCategories,
  partnerStatuses,
  partnerTypes,
  type ContentStatus,
  type PartnerStatus,
} from "@/lib/constants/outreach";
import { parseIstInput } from "@/lib/utils/dates";
import { normalizeIndianNumber } from "@/lib/utils/phone";
import { validationError } from "../http";
import { bool, collectErrors, oneOf, str } from "./helpers";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function optionalDate(body: Record<string, unknown>, key: string, add: (field: string, msg: string) => void): Date | null {
  const raw = str(body, key, 40);
  if (!raw) return null;
  const date = parseIstInput(raw.length === 10 ? `${raw}T10:00` : raw);
  if (!date) add(key, "Pick a valid date.");
  return date;
}

export interface PartnerInput {
  name: string;
  company: string;
  partnerType: (typeof partnerTypes)[number];
  phone: string;
  email: string;
  city: string;
  website: string;
  category: string;
  contactSource: string;
  sourceUrl: string;
  researchedAt: Date | null;
  lastVerifiedAt: Date | null;
  status: PartnerStatus;
  nextFollowUpAt: Date | null;
  nextAction: string;
  notes: string;
  doNotContact: boolean;
}

/** Create / full update of a partner contact from the admin form. */
export function validatePartnerInput(body: Record<string, unknown>): PartnerInput {
  const v = collectErrors();
  const name = str(body, "name", 120);
  if (name.length < 2) v.add("name", "Enter the contact's name.");

  const rawPhone = str(body, "phone", 30);
  const phone = rawPhone ? normalizeIndianNumber(rawPhone) : null;
  if (rawPhone && !phone) v.add("phone", "Enter a valid phone number.");

  const email = str(body, "email", 200).toLowerCase();
  if (email && !EMAIL.test(email)) v.add("email", "Enter a valid email.");

  const website = str(body, "website", 300);
  if (website && !/^https?:\/\/\S+$/.test(website)) v.add("website", "Start the link with https://");

  const contactSource = str(body, "contactSource", 300);
  if (!contactSource) v.add("contactSource", "Note where this contact came from (e.g. met at site office, their public website).");

  const sourceUrl = str(body, "sourceUrl", 500);
  if (sourceUrl && !/^https?:\/\/\S+$/.test(sourceUrl)) v.add("sourceUrl", "Start the link with https://");

  const nextFollowUpAt = optionalDate(body, "nextFollowUpAt", v.add);
  const researchedAt = optionalDate(body, "researchedAt", v.add);
  const lastVerifiedAt = optionalDate(body, "lastVerifiedAt", v.add);
  if (v.hasErrors) throw validationError(v.errors);

  return {
    name,
    company: str(body, "company", 200),
    partnerType: oneOf(partnerTypes, str(body, "partnerType")) ?? "builder",
    phone: phone?.phone ?? "",
    email,
    city: str(body, "city", 100),
    website,
    category: oneOf(partnerCategories, str(body, "category")) ?? "",
    contactSource,
    sourceUrl,
    researchedAt,
    lastVerifiedAt,
    status: oneOf(partnerStatuses, str(body, "status")) ?? "not_contacted",
    nextFollowUpAt,
    nextAction: str(body, "nextAction", 300),
    notes: str(body, "notes", 5000),
    doNotContact: bool(body, "doNotContact"),
  };
}

/** POST /api/partners/:id/activities  { type: note | template_opened, note } */
export function validatePartnerActivity(body: Record<string, unknown>) {
  const type = oneOf(["note", "template_opened"] as const, str(body, "type", 30));
  const note = str(body, "note", 3000);
  if (!type) throw validationError({ type: "Choose a valid activity type." });
  if (type === "note" && !note) throw validationError({ note: "Write a note first." });
  return { type, note };
}

export interface ContentInput {
  title: string;
  contentType: (typeof contentTypes)[number];
  targetKeyword: string;
  city: string;
  status: ContentStatus;
  url: string;
  notes: string;
  dueDate: string | null;
}

export function validateContentInput(body: Record<string, unknown>): ContentInput {
  const v = collectErrors();
  const title = str(body, "title", 200);
  if (title.length < 3) v.add("title", "Enter a working title.");
  const url = str(body, "url", 500);
  if (url && !/^https?:\/\/\S+$/.test(url)) v.add("url", "Start the link with https://");
  const dueDate = str(body, "dueDate", 10);
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) v.add("dueDate", "Pick a valid date.");
  const status = oneOf(contentStatuses, str(body, "status")) ?? "idea";
  if (status === "published" && !url) v.add("url", "Add the published link.");
  if (v.hasErrors) throw validationError(v.errors);
  return {
    title,
    contentType: oneOf(contentTypes, str(body, "contentType")) ?? "location_guide",
    targetKeyword: str(body, "targetKeyword", 200),
    city: str(body, "city", 100),
    status,
    url,
    notes: str(body, "notes", 5000),
    dueDate: dueDate || null,
  };
}

/** PATCH /api/partners/:id/onboarding  { item, done } */
export function validateOnboardingToggle(body: Record<string, unknown>) {
  const item = onboardingChecklist.find((i) => i.id === str(body, "item", 40));
  if (!item) throw validationError({ item: "Unknown checklist item." });
  return { item: item.id, label: item.label, done: body.done === true };
}

/** POST /api/partners/import  { csv, source, preview } */
export function validateImportRequest(body: Record<string, unknown>) {
  const csv = typeof body.csv === "string" ? body.csv.slice(0, 1_000_000) : "";
  const source = str(body, "source", 300);
  if (!csv.trim()) throw validationError({ csv: "Choose a CSV file." });
  if (!source) throw validationError({ source: "Say where this list came from (e.g. your own research of official websites, an expo visitor list you were given)." });
  return { csv, source, preview: body.preview === true };
}
