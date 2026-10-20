import type { LeadStatus } from "@/lib/constants/lead";

/**
 * Pre-filled WhatsApp replies for the admin lead page. The admin picks one, edits it, and sends
 * it from their own WhatsApp — the site only opens the chat, it never sends anything itself.
 * Messages never promise returns, discounts or availability that hasn't been confirmed.
 */

export interface LeadMessageContext {
  name: string;
  projectTitle: string;
  senderName: string;
}

export interface LeadMessageTemplate {
  id: string;
  label: string;
  /** Stages this template is suggested for (first match is pre-selected). */
  stages: LeadStatus[];
  build: (c: LeadMessageContext) => string;
}

export const leadMessageTemplates: LeadMessageTemplate[] = [
  {
    id: "first-reply",
    label: "First reply",
    stages: ["new"],
    build: ({ name, projectTitle, senderName }) =>
      `Hi ${firstName(name)}, this is ${senderName} from InvestsProperty. Thank you for your enquiry` +
      `${projectTitle ? ` about ${projectTitle}` : ""}. When would be a good time for a quick call to understand your requirement?`,
  },
  {
    id: "no-answer",
    label: "Couldn't reach you",
    stages: ["new", "contacted"],
    build: ({ name, projectTitle }) =>
      `Hi ${firstName(name)}, we tried calling you about your enquiry${projectTitle ? ` for ${projectTitle}` : ""}. ` +
      `Please let us know a convenient time to call. If you're no longer interested, just reply STOP and we won't contact you again.`,
  },
  {
    id: "share-details",
    label: "Share details",
    stages: ["contacted", "qualified"],
    build: ({ name, projectTitle, senderName }) =>
      `Hi ${firstName(name)}, ${senderName} here from InvestsProperty. Sharing the details${projectTitle ? ` of ${projectTitle}` : ""} ` +
      `as requested. Prices and availability are as per the builder's / owner's latest information and can change — please confirm before booking. ` +
      `Would you like to schedule a site visit?`,
  },
  {
    id: "site-visit",
    label: "Confirm site visit",
    stages: ["qualified", "site_visit"],
    build: ({ name, projectTitle }) =>
      `Hi ${firstName(name)}, confirming your site visit${projectTitle ? ` to ${projectTitle}` : ""} on [date] at [time]. ` +
      `We'll share the location pin. Reply here if you need to reschedule.`,
  },
  {
    id: "after-visit",
    label: "After the visit",
    stages: ["site_visit", "negotiation"],
    build: ({ name, projectTitle }) =>
      `Hi ${firstName(name)}, thank you for visiting${projectTitle ? ` ${projectTitle}` : ""}. ` +
      `Do you have any questions on the price, payment plan or paperwork? Happy to help you compare options.`,
  },
  {
    id: "negotiation",
    label: "Next steps on offer",
    stages: ["negotiation"],
    build: ({ name }) =>
      `Hi ${firstName(name)}, following up on the discussion. I've shared your offer of [amount] with the [builder / owner] and ` +
      `will update you as soon as I hear back. Please keep KYC documents ready in case they agree.`,
  },
  {
    id: "referral",
    label: "Thank you + referral",
    stages: ["closed"],
    build: ({ name, senderName }) =>
      `Hi ${firstName(name)}, congratulations once again, and thank you for trusting us. If anyone you know is looking to buy ` +
      `or sell property in Noida, I'd be grateful if you shared my number. — ${senderName}, InvestsProperty`,
  },
];

/** Templates for a stage: suggested ones first. */
export function templatesForStage(stage: LeadStatus): LeadMessageTemplate[] {
  const suggested = leadMessageTemplates.filter((t) => t.stages.includes(stage));
  return [...suggested, ...leadMessageTemplates.filter((t) => !t.stages.includes(stage))];
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

/** wa.me link for an E.164 number ("+919810000001") with the message pre-filled. */
export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
