import "server-only";
import { cache } from "react";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  ne,
  or,
  sql,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";
import { PAGE_SIZE } from "@/lib/constants/property";
import type {
  AdminPropertyView,
  LocationOptions,
  Paginated,
  PossessionStatus,
  Property,
  PropertyCategory,
  PropertyFilters,
} from "@/lib/types";
import { nextAvailableSlug, slugify } from "@/lib/utils/slug";
import { db, schema } from "../db/client";
import { notFound } from "../http";
import type { PropertyInput } from "../validators/property.validator";

const { properties: p } = schema;

/* ---------- Query building blocks ---------- */

/** Rejects ids that aren't positive integers (e.g. "/admin/properties/abc/edit"). */
function assertId(id: number): void {
  if (!Number.isSafeInteger(id) || id <= 0) throw notFound("Property not found.");
}

/** Visible on the public website: active and not soft-deleted. */
const isPublic = and(eq(p.isActive, true), eq(p.isDeleted, false))!;

/** Escapes % and _ so user input is matched literally inside ILIKE. */
function likeEscape(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Case-insensitive exact match: "noida" matches "Noida" but not "Greater Noida". */
function equalsIgnoreCase(column: AnyColumn, value: string): SQL {
  return sql`lower(${column}) = lower(${value})`;
}

/** "Sector 150, Noida!" → ["Sector", "150", "Noida"], regex-escaped. */
function searchWords(q: string): string[] {
  return q
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 10)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}

/**
 * The hero / sidebar location search over the full address (project name, address, locality,
 * city, state, PIN code, country). Exact, case-insensitive, whole-word matching: every word
 * typed must appear as a complete word, in any order. So "gurugram sector 89" finds
 * "Sector 89, Gurugram", while "Sector 15" does NOT match "Sector 150" and "Noid" matches nothing.
 */
function locationSearch(q: string): SQL {
  const words = searchWords(q);
  if (words.length === 0) return sql`true`;
  const haystack = sql`concat_ws(', ', ${p.title}, ${p.address}, ${p.locality}, ${p.city}, ${p.state}, ${p.pincode}, ${p.country})`;
  return and(
    ...words.map((word) => sql`${haystack} ~* ${`(^|[^[:alnum:]])${word}($|[^[:alnum:]])`}`)
  )!;
}

function filterConditions(f: PropertyFilters): SQL[] {
  const where: SQL[] = [isPublic];

  if (f.q) where.push(locationSearch(f.q));
  if (f.city) where.push(equalsIgnoreCase(p.city, f.city));
  if (f.state) where.push(equalsIgnoreCase(p.state, f.state));
  if (f.country) where.push(equalsIgnoreCase(p.country, f.country));
  if (f.category) where.push(eq(p.category, f.category));
  if (f.type) where.push(equalsIgnoreCase(p.propertyType, f.type));
  if (f.furnishing) where.push(eq(p.furnishing, f.furnishing));
  if (f.facing) where.push(eq(p.facing, f.facing));
  if (f.rera) where.push(eq(p.reraRegistered, true));
  if (f.possession?.length) where.push(inArray(p.status, f.possession));

  if (f.bhk?.length) {
    const wanted = f.bhk.map((b) => `${b} BHK`);
    where.push(
      sql`jsonb_exists_any(${p.configurations}, ARRAY[${sql.join(
        wanted.map((w) => sql`${w}`),
        sql`, `
      )}]::text[])`
    );
  }

  // Ranges overlap: a 50L–1Cr project matches a 80L–2Cr budget.
  if (f.minBudget) where.push(gte(p.priceMax, f.minBudget));
  if (f.maxBudget) where.push(and(lte(p.priceMin, f.maxBudget), ne(p.priceMin, 0))!);
  if (f.minArea) where.push(gte(p.areaMax, f.minArea));
  if (f.maxArea) where.push(lte(p.areaMin, f.maxArea));

  return where;
}

function orderFor(sort: PropertyFilters["sort"]): SQL[] {
  switch (sort) {
    case "price-asc":
      return [asc(p.priceMin)];
    case "price-desc":
      return [desc(p.priceMax)];
    case "area-desc":
      return [desc(p.areaMax)];
    case "possession":
      return [sql`${p.possessionDate} asc nulls first`];
    default:
      return [desc(p.isFeatured), desc(p.createdAt)];
  }
}

/* ---------- Public reads ---------- */

export async function listPublicProperties(filters: PropertyFilters): Promise<Paginated<Property>> {
  const where = and(...filterConditions(filters));
  const pageSize = PAGE_SIZE;
  const page = filters.page;

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(p)
      .where(where)
      .orderBy(...orderFor(filters.sort))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(p).where(where),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getFeaturedProperties(limit = 3): Promise<Property[]> {
  return db
    .select()
    .from(p)
    .where(and(isPublic, eq(p.isFeatured, true)))
    .orderBy(desc(p.updatedAt))
    .limit(limit);
}

/** Wrapped in cache() so a page and its generateMetadata share one query. */
export const getPublicPropertyBySlug = cache(async (slug: string): Promise<Property | undefined> => {
  const [row] = await db
    .select()
    .from(p)
    .where(and(isPublic, eq(p.slug, slug)))
    .limit(1);
  return row;
});

export async function getRelatedProperties(property: Property, limit = 3): Promise<Property[]> {
  return db
    .select()
    .from(p)
    .where(and(isPublic, ne(p.id, property.id), equalsIgnoreCase(p.city, property.city)))
    .orderBy(desc(p.isFeatured), desc(p.createdAt))
    .limit(limit);
}

export async function getPublicSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return db.select({ slug: p.slug, updatedAt: p.updatedAt }).from(p).where(isPublic);
}

/** Distinct values for the city / state / country dropdowns. */
export const getLocationOptions = cache(async (): Promise<LocationOptions> => {
  const rows = await db
    .selectDistinct({ city: p.city, state: p.state, country: p.country })
    .from(p)
    .where(isPublic);
  const unique = (values: string[]) =>
    [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return {
    cities: unique(rows.map((r) => r.city)),
    states: unique(rows.map((r) => r.state)),
    countries: unique(rows.map((r) => r.country)),
  };
});

export async function getPublicStats() {
  const [row] = await db
    .select({
      properties: count(),
      cities: sql<number>`count(distinct lower(${p.city}))`.mapWith(Number),
      builders: sql<number>`count(distinct nullif(${p.builder}, ''))`.mapWith(Number),
    })
    .from(p)
    .where(isPublic);
  return row;
}

/* ---------- Admin reads ---------- */

const adminViewCondition: Record<AdminPropertyView, SQL> = {
  all: eq(p.isDeleted, false),
  active: and(eq(p.isDeleted, false), eq(p.isActive, true))!,
  inactive: and(eq(p.isDeleted, false), eq(p.isActive, false))!,
  featured: and(eq(p.isDeleted, false), eq(p.isFeatured, true))!,
  deleted: eq(p.isDeleted, true),
};

export const adminSortColumns = {
  title: p.title,
  city: p.city,
  price: p.priceMin,
  updated: p.updatedAt,
} as const;
export type AdminSortColumn = keyof typeof adminSortColumns;

export async function listAdminProperties(options: {
  view: AdminPropertyView;
  category?: PropertyCategory;
  status?: PossessionStatus;
  city?: string;
  q?: string;
  sort?: AdminSortColumn;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}): Promise<Paginated<Property>> {
  const where: SQL[] = [adminViewCondition[options.view]];
  if (options.category) where.push(eq(p.category, options.category));
  if (options.status) where.push(eq(p.status, options.status));
  if (options.city) where.push(eq(p.city, options.city));
  if (options.q) {
    const pattern = `%${likeEscape(options.q)}%`;
    where.push(
      or(
        ilike(p.title, pattern),
        ilike(p.builder, pattern),
        ilike(p.city, pattern),
        ilike(p.locality, pattern),
        ilike(p.address, pattern)
      )!
    );
  }

  const pageSize = options.pageSize ?? 10;
  const column = adminSortColumns[options.sort ?? "updated"];
  const order = options.dir === "asc" ? asc(column) : desc(column);
  const condition = and(...where);

  const [[{ total }], firstPass] = await Promise.all([
    db.select({ total: count() }).from(p).where(condition),
    db
      .select()
      .from(p)
      .where(condition)
      .orderBy(order, desc(p.id))
      .limit(pageSize)
      .offset(((options.page ?? 1) - 1) * pageSize),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, options.page ?? 1), totalPages);
  // A page past the end (e.g. after deleting the last row) falls back to the last page.
  const items =
    page === (options.page ?? 1)
      ? firstPass
      : await db
          .select()
          .from(p)
          .where(condition)
          .orderBy(order, desc(p.id))
          .limit(pageSize)
          .offset((page - 1) * pageSize);

  return { items, total, page, pageSize, totalPages };
}

/** Distinct cities across all non-deleted listings, for the admin city filter. */
export async function getAdminCities(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ city: p.city })
    .from(p)
    .where(and(eq(p.isDeleted, false), ne(p.city, "")))
    .orderBy(asc(p.city));
  return rows.map((r) => r.city);
}

export async function getAdminCounts(): Promise<Record<AdminPropertyView, number>> {
  const [row] = await db
    .select({
      all: sql<number>`count(*) filter (where not ${p.isDeleted})`.mapWith(Number),
      active: sql<number>`count(*) filter (where not ${p.isDeleted} and ${p.isActive})`.mapWith(Number),
      inactive: sql<number>`count(*) filter (where not ${p.isDeleted} and not ${p.isActive})`.mapWith(Number),
      featured: sql<number>`count(*) filter (where not ${p.isDeleted} and ${p.isFeatured})`.mapWith(Number),
      deleted: sql<number>`count(*) filter (where ${p.isDeleted})`.mapWith(Number),
    })
    .from(p);
  return row;
}

export async function getPropertyById(id: number): Promise<Property> {
  assertId(id);
  const [row] = await db.select().from(p).where(eq(p.id, id)).limit(1);
  if (!row) throw notFound("Property not found.");
  return row;
}

/* ---------- Writes ---------- */

/** Slug from the title, made unique by adding -2, -3, … (soft-deleted rows still hold theirs). */
export async function generateUniqueSlug(title: string, excludeId?: number): Promise<string> {
  const base = slugify(title);
  const rows = await db
    .select({ slug: p.slug })
    .from(p)
    .where(
      and(
        or(eq(p.slug, base), ilike(p.slug, `${likeEscape(base)}-%`)),
        excludeId ? ne(p.id, excludeId) : undefined
      )
    );
  return nextAvailableSlug(base, new Set(rows.map((r) => r.slug)));
}

export async function createProperty(input: PropertyInput, userId: number): Promise<Property> {
  const slug = await generateUniqueSlug(input.title);
  const [row] = await db
    .insert(p)
    .values({ ...input, slug, createdBy: userId })
    .returning();
  return row;
}

/** Re-generates the slug only when the title changed, so shared links keep working otherwise. */
export async function updateProperty(id: number, input: PropertyInput): Promise<Property> {
  const existing = await getPropertyById(id);
  const slug =
    existing.title === input.title ? existing.slug : await generateUniqueSlug(input.title, id);
  const [row] = await db.update(p).set({ ...input, slug }).where(eq(p.id, id)).returning();
  return row;
}

export async function setPropertyFlags(
  id: number,
  changes: { isFeatured?: boolean; isActive?: boolean }
): Promise<Property> {
  assertId(id);
  const [row] = await db.update(p).set(changes).where(eq(p.id, id)).returning();
  if (!row) throw notFound("Property not found.");
  return row;
}

/** Soft delete: hides the listing everywhere but keeps the row (and can be restored). */
export async function softDeleteProperty(id: number): Promise<Property> {
  assertId(id);
  const [row] = await db
    .update(p)
    .set({ isDeleted: true, deletedAt: new Date(), isFeatured: false })
    .where(eq(p.id, id))
    .returning();
  if (!row) throw notFound("Property not found.");
  return row;
}

export async function restoreProperty(id: number): Promise<Property> {
  assertId(id);
  const [row] = await db
    .update(p)
    .set({ isDeleted: false, deletedAt: null })
    .where(eq(p.id, id))
    .returning();
  if (!row) throw notFound("Property not found.");
  return row;
}
