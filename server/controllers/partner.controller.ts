import "server-only";
import { partnerStatusLabels, partnerTypeLabels, type PartnerStatus, type PartnerType } from "@/lib/constants/outreach";
import { toCsv } from "@/lib/utils/csv";
import { handle, json, readJson } from "../http";
import { audit } from "../services/audit.service";
import { requireAdmin } from "../services/auth.service";
import * as partnerService from "../services/partner.service";
import {
  validateContentInput,
  validateImportRequest,
  validateOnboardingToggle,
  validatePartnerActivity,
  validatePartnerInput,
} from "../validators/partner.validator";
import { csvResponse } from "./lead.controller";

type IdContext = { params: Promise<{ id: string }> };

/** POST /api/partners — admin. */
export const create = handle(async (request: Request) => {
  const admin = await requireAdmin();
  const partner = await partnerService.createPartner(validatePartnerInput(await readJson(request)), admin.id);
  return json({ partner }, { status: 201 });
});

/** PUT /api/partners/:id — admin. */
export const update = handle(async (request: Request, { params }: IdContext) => {
  const admin = await requireAdmin();
  const input = validatePartnerInput(await readJson(request));
  const partner = await partnerService.updatePartner(Number((await params).id), input, admin.id);
  return json({ partner });
});

/** POST /api/partners/:id/activities  { type, note } — admin. */
export const addActivity = handle(async (request: Request, { params }: IdContext) => {
  const admin = await requireAdmin();
  const { type, note } = validatePartnerActivity(await readJson(request));
  await partnerService.addPartnerActivity(Number((await params).id), type, note, admin.id);
  return json({ ok: true }, { status: 201 });
});

/** PATCH /api/partners/:id/onboarding  { item, done } — admin. */
export const toggleOnboarding = handle(async (request: Request, { params }: IdContext) => {
  const admin = await requireAdmin();
  const { item, label, done } = validateOnboardingToggle(await readJson(request));
  const partner = await partnerService.setOnboardingItem(Number((await params).id), item, label, done, admin.id);
  return json({ onboarding: partner.onboarding });
});

/** POST /api/partners/import  { csv, source, preview } — admin. Preview first, then import. */
export const importCsv = handle(async (request: Request) => {
  const admin = await requireAdmin();
  const { csv, source, preview } = validateImportRequest(await readJson(request));
  const result = await partnerService.importPartners(csv, source, preview, admin.id);
  if (!preview) await audit(admin.id, "import", "partner", null, `${result.created} created from CSV (${source})`);
  return json(result);
});

const ist = (date: Date | null) => (date ? date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "");

/** GET /api/partners/export — admin. */
export const exportCsv = handle(async () => {
  const admin = await requireAdmin();
  const partners = await partnerService.getAllPartners();
  await audit(admin.id, "export", "partner", null, `${partners.length} partners`);
  const header = [
    "Name", "Company", "Type", "Category", "Phone", "Email", "City", "Website", "Source", "Source URL",
    "Researched", "Last verified", "Status", "Next follow-up", "Next action", "Do not contact", "Notes", "Added",
  ];
  const rows = partners.map((p) => [
    p.name,
    p.company,
    partnerTypeLabels[p.partnerType as PartnerType] ?? p.partnerType,
    p.category,
    p.phone,
    p.email,
    p.city,
    p.website,
    p.contactSource,
    p.sourceUrl,
    ist(p.researchedAt),
    ist(p.lastVerifiedAt),
    partnerStatusLabels[p.status as PartnerStatus] ?? p.status,
    ist(p.nextFollowUpAt),
    p.nextAction,
    p.doNotContact ? "Yes" : "No",
    p.notes,
    ist(p.createdAt),
  ]);
  return csvResponse(toCsv(header, rows), "partners");
});

/** POST /api/content — admin. */
export const createContent = handle(async (request: Request) => {
  const admin = await requireAdmin();
  const item = await partnerService.createContent(validateContentInput(await readJson(request)), admin.id);
  return json({ item }, { status: 201 });
});

/** PUT /api/content/:id — admin. */
export const updateContent = handle(async (request: Request, { params }: IdContext) => {
  await requireAdmin();
  const item = await partnerService.updateContent(Number((await params).id), validateContentInput(await readJson(request)));
  return json({ item });
});
