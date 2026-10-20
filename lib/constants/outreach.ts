/** Builder / channel-partner outreach tracker (Admin → Partners). Contacts are entered by hand. */

export const partnerTypes = ["builder", "channel_partner", "owner", "agent", "other"] as const;
export type PartnerType = (typeof partnerTypes)[number];

export const partnerTypeLabels: Record<PartnerType, string> = {
  builder: "Builder / developer",
  channel_partner: "Channel partner",
  owner: "Property owner",
  agent: "Broker / agent",
  other: "Other",
};

export const partnerStatuses = ["not_contacted", "contacted", "interested", "follow_up_due", "onboarded", "not_interested"] as const;
export type PartnerStatus = (typeof partnerStatuses)[number];

export const partnerStatusLabels: Record<PartnerStatus, string> = {
  not_contacted: "Not contacted",
  contacted: "Contacted",
  interested: "Interested",
  follow_up_due: "Follow-up due",
  onboarded: "Partner onboarded",
  not_interested: "Not interested",
};

export const closedPartnerStatuses: readonly PartnerStatus[] = ["onboarded", "not_interested"];

/** Business categories for researched contacts. */
export const partnerCategories = [
  "Developer / builder",
  "Channel partner firm",
  "Resale broker",
  "Property owner",
  "Home loan / legal / interiors",
  "Other",
] as const;

/** Checklist shown once a partner is onboarded. Ticked items are stored on the partner. */
export const onboardingChecklist = [
  { id: "authorisation", label: "Written authorisation to market their project(s) / property" },
  { id: "rera", label: "RERA registration checked on the state portal (where applicable)" },
  { id: "price_list", label: "Current approved price list received, with date" },
  { id: "media_rights", label: "Photos / brochure supplied with permission to use" },
  { id: "agreement", label: "Commission / fee terms agreed in writing" },
  { id: "contact_person", label: "Contact person for buyer enquiries and site visits confirmed" },
  { id: "first_listing", label: "First listing added, verified and published" },
] as const;

/** Entries in a partner's activity history. */
export const partnerActivityTypes = ["created", "status", "follow_up", "note", "template_opened", "imported", "onboarding"] as const;
export type PartnerActivityType = (typeof partnerActivityTypes)[number];

/* ---------- Content ideas (Admin → Content) ---------- */

export const contentTypes = ["location_guide", "buyer_guide", "project_update", "social_post", "other"] as const;
export type ContentType = (typeof contentTypes)[number];

export const contentTypeLabels: Record<ContentType, string> = {
  location_guide: "Location guide",
  buyer_guide: "Buyer education",
  project_update: "Project update",
  social_post: "Social post",
  other: "Other",
};

/** Nothing moves to "published" automatically: an admin sets it after publishing by hand. */
export const contentStatuses = ["idea", "drafting", "review", "approved", "published", "dropped"] as const;
export type ContentStatus = (typeof contentStatuses)[number];

export const contentStatusLabels: Record<ContentStatus, string> = {
  idea: "Idea",
  drafting: "Drafting",
  review: "Needs review",
  approved: "Approved",
  published: "Published",
  dropped: "Dropped",
};

/* ---------- Outreach message templates ---------- */

export interface OutreachTemplate {
  id: string;
  name: string;
  channel: "whatsapp" | "email";
  /** Email only. */
  subject?: string;
  /** Placeholders: {{name}} {{company}} {{city}} {{senderName}} {{site}} */
  body: string;
}

/**
 * Starting points only: the admin edits each message before sending it themselves. Nothing here
 * is ever sent automatically. Keep claims factual — no promised lead numbers or returns.
 */
export const outreachTemplates: OutreachTemplate[] = [
  {
    id: "intro-whatsapp",
    name: "First message (WhatsApp)",
    channel: "whatsapp",
    body:
      "Hi {{name}}, this is {{senderName}} from InvestsProperty ({{site}}). We list new projects in {{city}} " +
      "with a dedicated page, enquiry form and WhatsApp/call buttons, and every enquiry is tracked in our dashboard. " +
      "Would you be open to a 15-minute call to see if a listing for {{company}} makes sense? " +
      "If you'd rather not hear from us, just reply STOP and we won't message again.",
  },
  {
    id: "intro-email",
    name: "First message (email)",
    channel: "email",
    subject: "Project listing & enquiry tracking for {{company}}",
    body:
      "Hi {{name}},\n\n" +
      "I'm {{senderName}} from InvestsProperty ({{site}}). We help builders and authorised channel partners in {{city}} " +
      "present their projects online and handle buyer enquiries:\n\n" +
      "• A project page with photos, price, RERA details and location map\n" +
      "• Enquiry, brochure and price-list forms that land in a tracked lead list\n" +
      "• Follow-up reminders and a weekly report of enquiries and site visits\n\n" +
      "I'd be glad to show you a short demo with sample data. Would a 15-minute call this week work?\n\n" +
      "We can't promise a number of leads — results depend on the project, price and market — but you will see every enquiry we receive.\n\n" +
      "Regards,\n{{senderName}}\nInvestsProperty\n\n" +
      "If you'd prefer not to receive further emails, reply \"unsubscribe\" and we'll remove you.",
  },
  {
    id: "follow-up",
    name: "Polite follow-up",
    channel: "whatsapp",
    body:
      "Hi {{name}}, just following up on my earlier message about listing {{company}}'s projects on InvestsProperty. " +
      "Happy to share a quick demo whenever convenient. If now isn't a good time, no problem — reply STOP and I won't follow up again.",
  },
  {
    id: "after-meeting",
    name: "After the meeting",
    channel: "email",
    subject: "Summary of our call — InvestsProperty pilot for {{company}}",
    body:
      "Hi {{name}},\n\nThank you for your time today. As discussed, here is a summary of the pilot:\n\n" +
      "• Scope: [projects to list]\n• Duration: [e.g. 30 days]\n• Fee: [as agreed]\n" +
      "• What you'll receive: listing pages, all enquiries with contact details, and a weekly report\n\n" +
      "Before we publish, we'll need the RERA registration number, approved price list and authorised photos/brochure for each project.\n\n" +
      "Regards,\n{{senderName}}",
  },
];

/** Fills {{placeholders}}; an unknown or empty value becomes an obvious [blank] to edit. */
export function fillTemplate(text: string, values: Record<string, string | undefined>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key]?.trim() || `[${key}]`);
}
