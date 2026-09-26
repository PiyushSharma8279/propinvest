import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/layout/JsonLd";
import FilterSidebar from "@/components/property/FilterSidebar";
import Pagination from "@/components/property/Pagination";
import PropertyCard from "@/components/property/PropertyCard";
import QuickFilterChips from "@/components/property/QuickFilterChips";
import SortSelect from "@/components/property/SortSelect";
import { siteConfig } from "@/lib/site-config";
import {
  describeFilters,
  parsePropertyFilters,
  toSearchParams,
  type RawSearchParams,
} from "@/lib/utils/search-params";
import { getLocationOptions, listPublicProperties } from "@/server/services/property.service";

/** Server-side rendered on every request: results depend on the query string. */
type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const filters = parsePropertyFilters(params);
  const { total } = await listPublicProperties(filters);
  const { heading, place } = describeFilters(filters);
  const query = toSearchParams(params).toString();

  return {
    title: `${heading} for Sale in ${place} - ${total} ${total === 1 ? "Listing" : "Listings"}`,
    description: `Browse ${total} verified ${heading.toLowerCase()} in ${place}. Compare price, area, possession and exact location, then call or WhatsApp the project team directly.`,
    alternates: { canonical: `/projects${query ? `?${query}` : ""}` },
    // Deep filter combinations are near-duplicates; keep them out of the index.
    robots: filters.page > 1 || Object.keys(params).length > 2 ? { index: false, follow: true } : undefined,
  };
}

export default async function ProjectsPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parsePropertyFilters(params);
  const [result, locations] = await Promise.all([listPublicProperties(filters), getLocationOptions()]);
  const base = toSearchParams(params);
  const { heading, place } = describeFilters(filters);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: result.total,
    itemListElement: result.items.map((property, index) => ({
      "@type": "ListItem",
      position: (result.page - 1) * result.pageSize + index + 1,
      url: `${siteConfig.url}/projects/${property.slug}`,
      name: property.title,
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <JsonLd data={itemListJsonLd} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: `${heading} in ${place}`, href: "/projects" },
        ]}
      />

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          {result.total} {result.total === 1 ? "Property" : "Properties"}{" "}
          <span className="font-medium text-muted">
            | {heading} in {place}
          </span>
        </h1>
        <SortSelect />
      </div>

      <div className="mt-4">
        <QuickFilterChips current={filters} base={base} />
      </div>

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <FilterSidebar current={filters} locations={locations} />

        <div className="min-w-0 flex-1">
          {result.items.length === 0 ? (
            <div className="rounded-card border border-dashed border-border-strong bg-surface p-10 text-center">
              <p className="text-lg font-semibold text-ink">
                No properties match these filters
              </p>
              <p className="mt-1 text-sm text-muted">
                Location search matches the exact phrase you type. Try a shorter phrase (for
                example just the city), widen your budget, or clear a filter.
              </p>
              <Link
                href="/projects"
                className="mt-4 inline-block rounded-control bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover"
              >
                Clear all filters
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
              <Pagination page={result.page} totalPages={result.totalPages} base={base} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
