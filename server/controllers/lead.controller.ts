import "server-only";
import { leadSourceLabels, leadStatusLabels, type LeadSource, type LeadStatus } from "@/lib/constants/lead";
import { handle, json, readJson } from "../http";
import { requireAdmin } from "../services/auth.service";
import * as leadService from "../services/lead.service";
import { validateLeadInput, validateLeadStatus } from "../validators/lead.validator";

type IdContext = { params: Promise<{ id: string }> };

/** POST /api/leads — public. Enquiry form, brochure download or price list request. */
export const create = handle(async (request: Request) => {
  const input = validateLeadInput(await readJson(request));
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const { brochureUrl } = await leadService.createLead(input, ip);
  return json({ ok: true, brochureUrl }, { status: 201 });
});

/** PATCH /api/leads/:id  { status } — admin. */
export const updateStatus = handle(async (request: Request, { params }: IdContext) => {
  await requireAdmin();
  const { status } = validateLeadStatus(await readJson(request));
  const lead = await leadService.setLeadStatus(Number((await params).id), status);
  return json({ lead });
});

/** Quotes a CSV cell; a leading = + - @ is neutralised so Excel doesn't run it as a formula. */
function csvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** GET /api/leads/export — admin. All leads as a CSV file (opens in Excel / Google Sheets). */
export const exportCsv = handle(async () => {
  await requireAdmin();
  const leads = await leadService.getAllLeads();
  const header = ["Date", "Name", "Phone", "Budget", "Project", "Source", "Status", "Message", "Page"];
  const rows = leads.map((lead) => [
    lead.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    lead.name,
    lead.phone,
    lead.budget,
    lead.projectTitle,
    leadSourceLabels[lead.source as LeadSource] ?? lead.source,
    leadStatusLabels[lead.status as LeadStatus] ?? lead.status,
    lead.message,
    lead.pageUrl,
  ]);
  // BOM so Excel reads ₹ and other UTF-8 characters correctly.
  const csv = "﻿" + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${date}.csv"`,
    },
  });
});
