import { budgetOptions, leadSources, leadStatuses } from "@/lib/constants/lead";
import { normalizeIndianNumber } from "@/lib/utils/phone";
import { validationError } from "../http";
import { collectErrors, oneOf, str } from "./helpers";

export interface LeadInput {
  name: string;
  phone: string;
  budget: string;
  message: string;
  source: (typeof leadSources)[number];
  propertyId: number | null;
  pageUrl: string;
  /** Honeypot: a hidden field real visitors never fill in. */
  isBot: boolean;
}

/** POST /api/leads body from the public enquiry / brochure forms. */
export function validateLeadInput(body: Record<string, unknown>): LeadInput {
  const v = collectErrors();

  const name = str(body, "name", 80);
  if (name.length < 2) v.add("name", "Please enter your name.");

  const phone = normalizeIndianNumber(str(body, "phone", 30));
  if (!phone) v.add("phone", "Please enter a valid 10-digit mobile number.");

  // Budget is optional; anything that isn't one of the listed ranges is dropped.
  const budget = oneOf(budgetOptions, str(body, "budget", 50)) ?? "";

  const rawId = Number(body.propertyId);
  const propertyId = Number.isInteger(rawId) && rawId > 0 ? rawId : null;

  if (v.hasErrors) throw validationError(v.errors);

  return {
    name,
    phone: phone!.phone,
    budget,
    message: str(body, "message", 1000),
    source: oneOf(leadSources, str(body, "source", 20)) ?? "enquiry",
    propertyId,
    pageUrl: str(body, "pageUrl", 500),
    isBot: str(body, "website", 200) !== "",
  };
}

/** PATCH /api/leads/:id  { status } — admin. */
export function validateLeadStatus(body: Record<string, unknown>) {
  const status = oneOf(leadStatuses, str(body, "status", 30));
  if (!status) throw validationError({ status: "Choose a valid status." });
  return { status };
}
