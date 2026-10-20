/** Owner / builder property submissions (/list-your-property → Admin → Submissions). */

export const submitterTypes = ["owner", "builder", "channel_partner", "agent"] as const;
export type SubmitterType = (typeof submitterTypes)[number];

export const submitterTypeLabels: Record<SubmitterType, string> = {
  owner: "Property owner",
  builder: "Builder / developer",
  channel_partner: "Authorised channel partner",
  agent: "Broker / agent (with owner's mandate)",
};

export const contactMethods = ["whatsapp", "call", "email"] as const;
export type ContactMethod = (typeof contactMethods)[number];
export const contactMethodLabels: Record<ContactMethod, string> = { whatsapp: "WhatsApp", call: "Phone call", email: "Email" };

export const submissionStatuses = ["pending", "needs_correction", "approved", "rejected", "suspended"] as const;
export type SubmissionStatus = (typeof submissionStatuses)[number];

export const submissionStatusLabels: Record<SubmissionStatus, string> = {
  pending: "Pending review",
  needs_correction: "Needs correction",
  approved: "Approved (draft created)",
  rejected: "Rejected",
  suspended: "Suspended",
};

/** Review actions an admin can take. "approve" also creates a draft listing. */
export const reviewActions = ["approve", "needs_correction", "reject", "suspend", "reopen"] as const;
export type ReviewAction = (typeof reviewActions)[number];

export const MAX_SUBMISSION_IMAGES = 8;

/** Bump when the authorisation wording below changes; stored with each submission. */
export const SUBMISSION_TERMS_VERSION = "2026-10-v1";

export const SUBMISSION_AUTHORIZATION_TEXT =
  "I own this property or am authorised by its owner / builder to market it, the details and photos are accurate " +
  "to the best of my knowledge and I have the right to share them, and I allow InvestsProperty to review, edit and " +
  "publish this listing and to contact me about it.";
