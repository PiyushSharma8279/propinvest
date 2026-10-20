import { leadSourceLabels, leadStatusLabels, type LeadSource, type LeadStatus } from "@/lib/constants/lead";
import { formatIst } from "@/lib/utils/dates";
import type { NotificationMessage } from "./notify.service";

/** Message texts for admin notifications. No database access, so they are easy to test. */

export interface LeadSummary {
  id: number;
  name: string;
  phone: string;
  budget: string;
  message: string;
  source: string;
  projectTitle: string;
  utmSource: string;
  utmCampaign: string;
  createdAt: Date;
}

export function newLeadMessage(lead: LeadSummary, siteUrl: string): NotificationMessage {
  const lines = [
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Project: ${lead.projectTitle || "General enquiry"}`,
    `Form: ${leadSourceLabels[lead.source as LeadSource] ?? lead.source}`,
    lead.budget ? `Budget: ${lead.budget}` : null,
    lead.message ? `Message: ${lead.message}` : null,
    lead.utmSource || lead.utmCampaign ? `Campaign: ${[lead.utmSource, lead.utmCampaign].filter(Boolean).join(" / ")}` : null,
    `Received: ${formatIst(lead.createdAt)}`,
    "",
    `Open in admin: ${siteUrl}/admin/leads/${lead.id}`,
  ];
  return {
    subject: `New lead: ${lead.name} — ${lead.projectTitle || "General enquiry"}`,
    text: lines.filter((line) => line !== null).join("\n"),
  };
}

export interface DigestLead {
  id: number;
  name: string;
  projectTitle: string;
  status: string;
  followUpAt: Date | null;
}

export function followUpDigestMessage(
  overdue: DigestLead[],
  dueToday: DigestLead[],
  newUncontacted: number,
  siteUrl: string,
  /** Other reminders, e.g. listings to reconfirm, partners due. */
  extras: string[] = []
): NotificationMessage | null {
  if (overdue.length === 0 && dueToday.length === 0 && newUncontacted === 0 && extras.length === 0) return null;
  const line = (l: DigestLead) =>
    `• ${l.name} — ${l.projectTitle || "General"} (${leadStatusLabels[l.status as LeadStatus] ?? l.status}, ${formatIst(l.followUpAt)})`;
  const sections = [
    overdue.length && `Overdue (${overdue.length}):\n${overdue.slice(0, 20).map(line).join("\n")}`,
    dueToday.length && `Due today (${dueToday.length}):\n${dueToday.slice(0, 20).map(line).join("\n")}`,
    newUncontacted && `New leads not yet contacted: ${newUncontacted}`,
    extras.length > 0 && extras.join("\n"),
    `Open: ${siteUrl}/admin`,
  ].filter(Boolean);
  return {
    subject: `Follow-ups today: ${overdue.length} overdue, ${dueToday.length} due`,
    text: sections.join("\n\n"),
  };
}
