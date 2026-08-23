import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import FilterSidebar from "@/components/FilterSidebar";
import QuickFilterChips from "@/components/QuickFilterChips";
import SortSelect from "@/components/SortSelect";
import PropertyCard from "@/components/PropertyCard";
import JsonLd from "@/components/JsonLd";
import { filterProperties, parseFilters } from "@/lib/properties";
import { siteConfig } from "@/lib/site-config";

type SearchParams = Record<string, string | string[] | undefined>;

function toQueryString(searchParams: SearchParams) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value) {
      params.set(key, value);
    }
  });
  return params;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const resolved = await searchParams;
  const filters = parseFilters(resolved);
  const results = filterProperties(filters);
  const cityLabel = filters.city ?? "India";

  const title = filters.city
    ? `New Projects in ${filters.city} for Sale - ${results.length} Properties`
    : `New Projects for Sale in India - ${results.length} Properties`;

  return {
    title,
    description: `Browse ${results.length} RERA-verified residential projects in ${cityLabel}. Compare price, possession date and configuration, then call or WhatsApp the project team directly.`,
    alternates: {
      canonical: `/projects${resolved && Object.keys(resolved).length ? `?${toQueryString(resolved).toString()}` : ""}`,
    },
  };
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;
  const filters = parseFilters(resolved);
  const results = filterProperties(filters);
  const baseQuery = toQueryString(resolved);
  const cityLabel = filters.city ?? "India";

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: results.map((property, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteConfig.url}/projects/${property.slug}`,
      name: property.title,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <JsonLd data={itemListJsonLd} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: `Projects in ${cityLabel}`, href: "/projects" },
        ]}
      />

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
          {results.length} Projects{" "}
          <span className="text-slate-600">| New Projects in {cityLabel} for Sale</span>
        </h1>
        <SortSelect />
      </div>

      <div className="mt-4">
        <QuickFilterChips current={filters} baseQuery={baseQuery} />
      </div>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row">
        <FilterSidebar current={filters} />

        <div className="flex-1">
          {results.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-white p-10 text-center">
              <p className="font-display text-lg font-semibold text-ink-900">
                No projects match these filters
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Try widening your budget range or clearing a filter to see more results.
              </p>
              <Link
                href="/projects"
                className="mt-4 inline-block rounded-md bg-teal-900 px-4 py-2 text-sm font-semibold text-cream"
              >
                Clear all filters
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {results.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
