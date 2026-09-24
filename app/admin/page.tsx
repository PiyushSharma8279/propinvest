import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Pencil, Search } from "lucide-react";
import PropertyRowActions from "@/components/admin/PropertyRowActions";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/styles";
import { categories, categoryLabels } from "@/lib/constants/property";
import type { AdminPropertyView, PropertyCategory } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatPriceRange } from "@/lib/utils/format";
import { getAdminCounts, listAdminProperties } from "@/server/services/property.service";

export const metadata: Metadata = { title: "Properties" };

const views: { value: AdminPropertyView; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "featured", label: "Featured" },
  { value: "deleted", label: "Deleted" },
];

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function AdminPropertiesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const view = views.find((v) => v.value === params.view)?.value ?? "all";
  const category = categories.find((c) => c === params.category) as PropertyCategory | undefined;
  const q = params.q?.trim() ?? "";

  const [rows, counts] = await Promise.all([
    listAdminProperties({ view, category, q: q || undefined }),
    getAdminCounts(),
  ]);

  const href = (changes: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const next = { view, category, q: q || undefined, ...changes };
    for (const [key, value] of Object.entries(next)) {
      if (value && !(key === "view" && value === "all")) sp.set(key, value);
    }
    const qs = sp.toString();
    return qs ? `/admin?${qs}` : "/admin";
  };

  return (
    <div>
      {params.saved && (
        <p className="mb-6 flex items-center gap-2 rounded-md border border-teal-600/30 bg-teal-100 px-4 py-3 text-sm text-teal-900">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <strong>{params.saved}</strong> was saved. The website is updated.
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Properties</h1>
          <p className="mt-1 text-sm text-slate-600">
            {counts.all} listings · {counts.active} live on the website
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <LinkButton key={c} href={`/admin/properties/new?category=${c}`} variant="outline" size="sm">
              + {categoryLabels[c]}
            </LinkButton>
          ))}
        </div>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-border" aria-label="Filter by status">
        {views.map((v) => (
          <Link
            key={v.value}
            href={href({ view: v.value })}
            aria-current={view === v.value ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
              view === v.value
                ? "border-teal-900 text-teal-900"
                : "border-transparent text-slate-600 hover:text-ink-900"
            )}
          >
            {v.label} <span className="tabular-nums opacity-70">{counts[v.value]}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="Filter by category">
          {[undefined, ...categories].map((c) => (
            <Link
              key={c ?? "any"}
              href={href({ category: c })}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition",
                category === c
                  ? "border-teal-900 bg-teal-900 text-cream"
                  : "border-border bg-white text-ink-900 hover:border-teal-900"
              )}
            >
              {c ? categoryLabels[c] : "All categories"}
            </Link>
          ))}
        </div>
        <form action="/admin" method="GET" className="relative sm:w-72">
          {view !== "all" && <input type="hidden" name="view" value={view} />}
          {category && <input type="hidden" name="category" value={category} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, city, address…"
            aria-label="Search properties"
            className={`${inputClass} pl-9`}
          />
        </form>
      </div>

      {rows.length === 0 ? (
        <Card className="mt-6 border-dashed p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink-900">Nothing here</p>
          <p className="mt-1 text-sm text-slate-600">
            {q ? "No properties match your search." : view === "deleted" ? "No deleted properties." : "Add your first listing to get started."}
          </p>
        </Card>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {rows.map((p) => (
            <li key={p.id}>
              <Card
                className={cn(
                  "flex flex-col gap-4 p-3 sm:flex-row sm:items-center",
                  p.isDeleted && "bg-cream-200/50"
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-cream-200">
                    {p.images[0] && (
                      <Image
                        src={p.images[0]}
                        alt=""
                        fill
                        sizes="96px"
                        className={cn("object-cover", p.isDeleted && "grayscale")}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/properties/${p.id}/edit`}
                        className="truncate font-semibold text-ink-900 hover:underline"
                      >
                        {p.title}
                      </Link>
                      {p.isDeleted && <Badge tone="danger">Deleted</Badge>}
                      {!p.isDeleted && !p.isActive && <Badge>Inactive</Badge>}
                      {p.isFeatured && <Badge tone="gold">Featured</Badge>}
                    </div>
                    <p className="truncate text-sm text-slate-600">
                      {[p.locality, p.city, p.state].filter(Boolean).join(", ")} ·{" "}
                      {categoryLabels[p.category]} · {p.propertyType}
                    </p>
                    <p className="text-sm">
                      <span className="tabular-nums font-semibold text-teal-900">
                        {formatPriceRange(p.priceMin, p.priceMax)}
                      </span>
                      <span className="text-slate-600">
                        {" "}
                        · {p.isDeleted && p.deletedAt ? `Deleted ${p.deletedAt.toLocaleDateString("en-IN")}` : p.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1 border-t border-border pt-3 sm:border-0 sm:pt-0">
                  {p.isActive && !p.isDeleted && (
                    <LinkButton href={`/projects/${p.slug}`} target="_blank" variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" /> View
                    </LinkButton>
                  )}
                  {!p.isDeleted && (
                    <LinkButton
                      href={`/admin/properties/${p.id}/edit`}
                      variant="ghost"
                      size="sm"
                      className="text-teal-900"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </LinkButton>
                  )}
                  <PropertyRowActions property={p} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
