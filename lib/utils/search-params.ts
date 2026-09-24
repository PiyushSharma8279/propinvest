import {
  bedroomOptions,
  categories,
  possessionStatuses,
  sortOptions,
  type PossessionStatus,
  type SortOption,
} from "@/lib/constants/property";
import type { PropertyFilters } from "@/lib/types";
import { lakhToRupees } from "./format";

export type RawSearchParams = Record<string, string | string[] | undefined>;

function all(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map((v) => v.trim()).filter(Boolean);
}

function first(value: string | string[] | undefined): string | undefined {
  return all(value)[0];
}

function positiveNumber(value: string | undefined): number | undefined {
  const n = Number(value);
  return value && Number.isFinite(n) && n > 0 ? n : undefined;
}

function matchIgnoreCase<T extends string>(options: readonly T[], value?: string): T | undefined {
  return options.find((o) => o.toLowerCase() === value?.toLowerCase());
}

/** Converts `searchParams` from /projects into typed, validated filters. */
export function parsePropertyFilters(params: RawSearchParams): PropertyFilters {
  const minBudgetLakh = positiveNumber(first(params.minBudget));
  const maxBudgetLakh = positiveNumber(first(params.maxBudget));
  const sortValues = sortOptions.map((o) => o.value).filter(Boolean) as SortOption[];

  return {
    q: first(params.q),
    city: first(params.city),
    state: first(params.state),
    country: first(params.country),
    category: matchIgnoreCase(categories, first(params.category)),
    type: first(params.type),
    bhk: all(params.bhk).filter((b) => bedroomOptions.includes(b)),
    minBudget: minBudgetLakh ? lakhToRupees(minBudgetLakh) : undefined,
    maxBudget: maxBudgetLakh ? lakhToRupees(maxBudgetLakh) : undefined,
    minArea: positiveNumber(first(params.minArea)),
    maxArea: positiveNumber(first(params.maxArea)),
    possession: all(params.possession)
      .map((p) => matchIgnoreCase(possessionStatuses, p))
      .filter((p): p is PossessionStatus => Boolean(p)),
    rera: first(params.rera) === "true",
    furnishing: first(params.furnishing),
    facing: first(params.facing),
    sort: matchIgnoreCase(sortValues, first(params.sort)),
    page: Math.max(1, Math.floor(positiveNumber(first(params.page)) ?? 1)),
  };
}

/** Rebuilds a URLSearchParams from raw params (keeps repeated keys like bhk=2&bhk=3). */
export function toSearchParams(params: RawSearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const v of all(value)) out.append(key, v);
  }
  return out;
}

/** Returns `/projects?...` with `changes` applied. `null` removes a key. */
export function projectsUrl(
  base: URLSearchParams,
  changes: Record<string, string | string[] | null>
): string {
  const params = new URLSearchParams(base.toString());
  params.delete("page"); // any filter change starts from page 1
  for (const [key, value] of Object.entries(changes)) {
    params.delete(key);
    if (value === null) continue;
    for (const v of Array.isArray(value) ? value : [value]) params.append(key, v);
  }
  const qs = params.toString();
  return qs ? `/projects?${qs}` : "/projects";
}

/** Human heading for the current filters, e.g. "Residential Plots in Noida". */
export function describeFilters(filters: PropertyFilters): { heading: string; place: string } {
  const heading = filters.type
    ? `${filters.type}s`
    : filters.category === "Plot"
      ? "Plots & Land"
      : filters.category
        ? `${filters.category} Projects`
        : "Properties";
  const place = filters.city ?? filters.state ?? filters.country ?? filters.q ?? "India";
  return { heading, place };
}
