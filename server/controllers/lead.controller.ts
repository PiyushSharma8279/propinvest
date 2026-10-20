import "server-only";
import { after } from "next/server";
import { leadSourceLabels, leadStatusLabels, type LeadSource, type LeadStatus } from "@/lib/constants/lead";
import { toCsv } from "@/lib/utils/csv";
import { handle, json, readJson } from "../http";
import { audit } from "../services/audit.service";
import { requireAdmin } from "../services/auth.service";
import * as leadService from "../services/lead.service";
import { validateLeadActivity, validateLeadInput, validateLeadResponse, validateLeadUpdate } from "../validators/lead.validator";

type IdContext = { params: Promise<{ id: string }> };

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** POST /api/leads — public. Enquiry form, brochure download or price list request. */
export const create = handle(async (request: Request) => {
  const input = validateLeadInput(await readJson(request));
  const { brochureUrl, leadId, duplicate } = await leadService.createLead(input, clientIp(request));
  // The lead is already saved; the notification goes out after the response so the visitor
  // never waits on (or sees an error from) an email / Telegram provider.
  if (leadId && !duplicate) {
    after(() =>
      leadService.notifyNewLead(leadId).catch((error) => console.error("[notify] lead notification crashed", error?.name))
    );
  }
  return json({ ok: true, brochureUrl }, { status: 201 });
});

/** PATCH /api/leads/:id  { status?, followUpAt?, optedOut? } — admin. */
export const update = handle(async (request: Request, { params }: IdContext) => {
  const admin = await requireAdmin();
  const changes = validateLeadUpdate(await readJson(request));
  const lead = await leadService.updateLead(Number((await params).id), changes, admin.id);
  if (changes.optedOut !== undefined) await audit(admin.id, changes.optedOut ? "opt_out" : "opt_in", "lead", lead.id);
  if (changes.commissionStatus !== undefined) await audit(admin.id, "commission", "lead", lead.id, `${changes.commissionStatus} ₹${lead.commissionAmount}`);
  return json({ lead });
});

/** POST /api/leads/:id/activities  { type: note | call | whatsapp_opened, note } — admin. */
export const addActivity = handle(async (request: Request, { params }: IdContext) => {
  const admin = await requireAdmin();
  const { type, note } = validateLeadActivity(await readJson(request));
  await leadService.addLeadActivity(Number((await params).id), type, note, admin.id);
  return json({ ok: true }, { status: 201 });
});

/** POST /api/leads/:id/response  { outcome, note?, followUpAt? } — admin. */
export const addResponse = handle(async (request: Request, { params }: IdContext) => {
  const admin = await requireAdmin();
  const { outcome, note, followUpAt } = validateLeadResponse(await readJson(request));
  await leadService.recordLeadResponse(Number((await params).id), outcome, note, followUpAt, admin.id);
  return json({ ok: true }, { status: 201 });
});

const ist = (date: Date | null) => (date ? date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "");

/** GET /api/leads/export — admin. All leads as a CSV file (opens in Excel / Google Sheets). */
export const exportCsv = handle(async () => {
  const admin = await requireAdmin();
  const leads = await leadService.getAllLeads();
  await audit(admin.id, "export", "lead", null, `${leads.length} leads`);
  const header = [
    "Date", "Name", "Phone", "Budget", "Project", "Source", "Status", "Follow-up", "Last contacted",
    "Message", "Page", "UTM source", "UTM medium", "UTM campaign", "Referrer", "Marketing opt-in", "Do not contact",
    "Preferred location", "Property type", "Timeline", "Next action", "Deal value (₹)", "Commission (₹)", "Commission status",
  ];
  const rows = leads.map((lead) => [
    ist(lead.createdAt),
    lead.name,
    lead.phone,
    lead.budget,
    lead.projectTitle,
    leadSourceLabels[lead.source as LeadSource] ?? lead.source,
    leadStatusLabels[lead.status as LeadStatus] ?? lead.status,
    ist(lead.followUpAt),
    ist(lead.lastContactedAt),
    lead.message,
    lead.pageUrl,
    lead.utmSource,
    lead.utmMedium,
    lead.utmCampaign,
    lead.referrer,
    lead.marketingOptIn ? "Yes" : "No",
    lead.optedOut ? "Yes" : "No",
    lead.preferredLocation,
    lead.preferredPropertyType,
    lead.timeline,
    lead.nextAction,
    lead.dealValue ? String(lead.dealValue) : "",
    lead.commissionAmount ? String(lead.commissionAmount) : "",
    lead.commissionStatus,
  ]);
  return csvResponse(toCsv(header, rows), "leads");
});

export function csvResponse(csv: string, name: string): Response {
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
