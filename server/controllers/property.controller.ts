import "server-only";
import { parsePropertyFilters } from "@/lib/utils/search-params";
import { handle, json, readJson } from "../http";
import { requireAdmin } from "../services/auth.service";
import * as propertyService from "../services/property.service";
import { revalidatePublicPages } from "../services/revalidate.service";
import { validatePropertyInput, validateStatusInput } from "../validators/property.validator";

type IdContext = { params: Promise<{ id: string }> };

/** Route params are strings; property ids are serial integers. */
async function propertyId(params: IdContext["params"]): Promise<number> {
  return Number((await params).id);
}

/** GET /api/properties?city=Noida&category=Plot… — public, same filters as /projects. */
export const list = handle(async (request: Request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const result = await propertyService.listPublicProperties(parsePropertyFilters(params));
  return json(result);
});

/** POST /api/properties — admin. Slug is generated from the title. */
export const create = handle(async (request: Request) => {
  const admin = await requireAdmin();
  const input = validatePropertyInput(await readJson(request));
  const property = await propertyService.createProperty(input, admin.id);
  revalidatePublicPages();
  return json({ property }, { status: 201 });
});

/**
 * POST /api/properties/draft — admin autosave: creates a draft from a partly filled form.
 * Drafts are never public, so the website cache is left alone.
 */
export const createDraft = handle(async (request: Request) => {
  const admin = await requireAdmin();
  const input = validatePropertyInput(await readJson(request), "draft");
  const property = await propertyService.createDraft(input, admin.id);
  return json({ property }, { status: 201 });
});

/** PUT /api/properties/:id/draft — admin autosave for an existing draft (409 if already published). */
export const updateDraft = handle(async (request: Request, { params }: IdContext) => {
  await requireAdmin();
  const id = await propertyId(params);
  const input = validatePropertyInput(await readJson(request), "draft");
  const property = await propertyService.updateDraft(id, input);
  return json({ property });
});

/** GET /api/properties/:id — admin (includes inactive and deleted). */
export const getById = handle(async (_request: Request, { params }: IdContext) => {
  await requireAdmin();
  const id = await propertyId(params);
  return json({ property: await propertyService.getPropertyById(id) });
});

/** PUT /api/properties/:id — admin, full update. Also publishes a draft. */
export const update = handle(async (request: Request, { params }: IdContext) => {
  await requireAdmin();
  const id = await propertyId(params);
  const input = validatePropertyInput(await readJson(request));
  const property = await propertyService.updateProperty(id, input);
  revalidatePublicPages();
  return json({ property });
});

/** PATCH /api/properties/:id/status  { isFeatured?, isActive? } — admin. */
export const updateStatus = handle(async (request: Request, { params }: IdContext) => {
  await requireAdmin();
  const id = await propertyId(params);
  const changes = validateStatusInput(await readJson(request));
  const property = await propertyService.setPropertyFlags(id, changes);
  revalidatePublicPages();
  return json({ property });
});

/** DELETE /api/properties/:id — admin, soft delete (sets isDeleted = true). */
export const softDelete = handle(async (_request: Request, { params }: IdContext) => {
  await requireAdmin();
  const id = await propertyId(params);
  const property = await propertyService.softDeleteProperty(id);
  revalidatePublicPages();
  return json({ property });
});

/** POST /api/properties/:id/restore — admin, undoes a soft delete. */
export const restore = handle(async (_request: Request, { params }: IdContext) => {
  await requireAdmin();
  const id = await propertyId(params);
  const property = await propertyService.restoreProperty(id);
  revalidatePublicPages();
  return json({ property });
});
