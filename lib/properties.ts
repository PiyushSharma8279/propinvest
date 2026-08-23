import rawProperties from "@/data/properties.json";
import type { Property, ProjectFilters } from "./types";

const properties = rawProperties as Property[];

export function getAllProperties(): Property[] {
  return properties;
}

export function getResidentialProperties(): Property[] {
  return properties.filter((p) => p.category === "Residential");
}

export function getCommercialProperties(): Property[] {
  return properties.filter((p) => p.category === "Commercial");
}

export function getFeaturedProperties(limit = 3): Property[] {
  return properties.filter((p) => p.featured).slice(0, limit);
}

export function getPropertyBySlug(slug: string): Property | undefined {
  return properties.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return properties.map((p) => p.slug);
}

export function getAllCities(): string[] {
  return Array.from(new Set(properties.map((p) => p.city))).sort();
}

export function getRelatedProperties(current: Property, limit = 3): Property[] {
  return properties
    .filter((p) => p.slug !== current.slug && p.city === current.city)
    .slice(0, limit);
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/** Converts Next.js `searchParams` from a /projects request into typed ProjectFilters. */
export function parseFilters(searchParams: RawSearchParams): ProjectFilters {
  const bhk = toArray(searchParams.bhk);
  const possession = toArray(searchParams.possession);
  const minBudgetLakh = Array.isArray(searchParams.minBudget)
    ? searchParams.minBudget[0]
    : searchParams.minBudget;
  const maxBudgetLakh = Array.isArray(searchParams.maxBudget)
    ? searchParams.maxBudget[0]
    : searchParams.maxBudget;
  const city = Array.isArray(searchParams.city) ? searchParams.city[0] : searchParams.city;
  const sort = Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort;
  const category = Array.isArray(searchParams.category)
    ? searchParams.category[0]
    : searchParams.category;

  return {
    city: city || undefined,
    category: (category as ProjectFilters["category"]) || undefined,
    bhk: bhk.length ? bhk : undefined,
    possession: possession.length ? possession : undefined,
    minBudget: minBudgetLakh ? Number(minBudgetLakh) * 100000 : undefined,
    maxBudget: maxBudgetLakh ? Number(maxBudgetLakh) * 100000 : undefined,
    rera: searchParams.rera === "true",
    sort: (sort as ProjectFilters["sort"]) || undefined,
  };
}

export function filterProperties(filters: ProjectFilters): Property[] {
  let results = [...properties];

  if (filters.city) {
    results = results.filter(
      (p) => p.city.toLowerCase() === filters.city!.toLowerCase()
    );
  }

  if (filters.category) {
    results = results.filter((p) => p.category === filters.category);
  }

  if (filters.bhk && filters.bhk.length > 0) {
    const wanted = filters.bhk.map((b) => b.toLowerCase());
    results = results.filter((p) =>
      p.configurations.some((c) =>
        wanted.some((w) => c.toLowerCase().includes(w))
      )
    );
  }

  if (filters.minBudget !== undefined) {
    results = results.filter((p) => p.priceMax >= filters.minBudget!);
  }

  if (filters.maxBudget !== undefined) {
    results = results.filter((p) => p.priceMin <= filters.maxBudget!);
  }

  if (filters.possession && filters.possession.length > 0) {
    const wanted = filters.possession.map((s) => s.toLowerCase());
    results = results.filter((p) => wanted.includes(p.status.toLowerCase()));
  }

  if (filters.rera) {
    results = results.filter((p) => p.reraRegistered);
  }

  switch (filters.sort) {
    case "price-asc":
      results.sort((a, b) => a.priceMin - b.priceMin);
      break;
    case "price-desc":
      results.sort((a, b) => b.priceMax - a.priceMax);
      break;
    case "possession":
      results.sort(
        (a, b) => new Date(a.possessionDate).getTime() - new Date(b.possessionDate).getTime()
      );
      break;
  }

  return results;
}
