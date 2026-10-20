/** Where a lead came from on the website. */
export const leadSources = ["enquiry", "brochure", "price_list"] as const;
export type LeadSource = (typeof leadSources)[number];

export const leadSourceLabels: Record<LeadSource, string> = {
  enquiry: "Enquiry form",
  brochure: "Brochure download",
  price_list: "Price list request",
};

/**
 * Follow-up stage, set by the admin. The stored values of the last two ("closed",
 * "not_interested") predate the Converted / Lost labels and are kept so existing rows stay valid.
 */
export const leadStatuses = ["new", "contacted", "qualified", "site_visit", "negotiation", "closed", "not_interested"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  site_visit: "Visit scheduled",
  negotiation: "Negotiation",
  closed: "Converted",
  not_interested: "Lost",
};

/** Stages where the lead is finished: no follow-up reminders. */
export const closedLeadStatuses: readonly LeadStatus[] = ["closed", "not_interested"];

/**
 * When the admin moves a lead to one of these stages and no follow-up date is set,
 * a reminder is scheduled this many days ahead automatically.
 */
export const autoFollowUpDays: Partial<Record<LeadStatus, number>> = {
  contacted: 2,
  qualified: 3,
  site_visit: 1,
  negotiation: 2,
};

/** Entries in a lead's activity history. */
export const leadActivityTypes = [
  "created",
  "repeat_enquiry",
  "status",
  "follow_up",
  "note",
  "call",
  "whatsapp_opened",
  "notification",
  "opt_out",
  "response",
  "details",
  "deal",
] as const;
export type LeadActivityType = (typeof leadActivityTypes)[number];

/** Activity types an admin can add by hand from the lead page. */
export const manualLeadActivityTypes = ["note", "call", "whatsapp_opened"] as const;
export type ManualLeadActivityType = (typeof manualLeadActivityTypes)[number];

/** What the buyer said after the last message — quick buttons on the lead page. */
export const leadResponses = ["replied", "declined", "later"] as const;
export type LeadResponse = (typeof leadResponses)[number];

export const leadResponseLabels: Record<LeadResponse, string> = {
  replied: "Buyer replied",
  declined: "Buyer declined",
  later: "Asked to follow up later",
};

/** Optional "when are you planning to buy?" on the enquiry form and lead page. */
export const purchaseTimelines = ["Immediately", "Within 3 months", "3–6 months", "6–12 months", "Just exploring"] as const;

/** Commission on a converted lead. Only "confirmed" and "received" count as actual revenue. */
export const commissionStatuses = ["", "expected", "confirmed", "received"] as const;
export type CommissionStatus = (typeof commissionStatuses)[number];
export const commissionStatusLabels: Record<CommissionStatus, string> = {
  "": "Not recorded",
  expected: "Expected (not confirmed)",
  confirmed: "Confirmed in writing",
  received: "Received",
};

/** Follow-up views in the admin leads list. */
export const leadViews = ["due", "overdue"] as const;
export type LeadView = (typeof leadViews)[number];

/**
 * Version of the short privacy notice shown under the enquiry forms. Saved with each lead so it
 * is clear which wording the visitor saw. Bump it whenever the notice text changes.
 */
export const PRIVACY_NOTICE_VERSION = "2026-10-v1";

export const budgetOptions = [
  "Under ₹50 Lakh",
  "₹50 Lakh – 1 Cr",
  "₹1 – 2 Cr",
  "₹2 – 5 Cr",
  "Above ₹5 Cr",
] as const;
