import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { AdminTableToolbar, PageSizeSelect } from "@/components/admin/AdminTableControls";
import PropertyRowActions from "@/components/admin/PropertyRowActions";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { categories, categoryLabels, possessionStatuses } from "@/lib/constants/property";
import type { AdminPropertyView, PossessionStatus, Property, PropertyCategory } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatPriceRange } from "@/lib/utils/format";
import {
  adminSortColumns,
  getAdminCities,
  getAdminCounts,
  listAdminProperties,
  type AdminSortColumn,
} from "@/server/services/property.service";

export const metadata: Metadata = { title: "Properties" };

const views: { value: AdminPropertyView; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "featured", label: "Featured" },
  { value: "deleted", label: "Deleted" },
];

const PAGE_SIZES = [10, 20, 50];

const statusDot: Record<PossessionStatus, string> = {
  "New Launch": "bg-highlight",
  "Under Construction": "bg-info",
  "Ready to Move": "bg-primary",
};

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function AdminPropertiesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const view = views.find((v) => v.value === params.view)?.value ?? "all";
  const category = categories.find((c) => c === params.category) as PropertyCategory | undefined;
  const status = possessionStatuses.find((s) => s === params.status);
  const city = params.city?.trim() || undefined;
  const q = params.q?.trim() || undefined;
  const sort = (params.sort && params.sort in adminSortColumns ? params.sort : "updated") as AdminSortColumn;
  const dir = params.dir === "asc" ? "asc" : "desc";
  const pageSize = PAGE_SIZES.includes(Number(params.size)) ? Number(params.size) : PAGE_SIZES[0];
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const [result, counts, cities] = await Promise.all([
    listAdminProperties({ view, category, status, city, q, sort, dir, page: requestedPage, pageSize }),
    getAdminCounts(),
    getAdminCities(),
  ]);
  const { items: rows, total, page, totalPages } = result;

  /** Builds an /admin URL from the current state plus changes (undefined removes a key). */
  const href = (changes: Record<string, string | number | undefined>) => {
    const current: Record<string, string | number | undefined> = {
      view: view === "all" ? undefined : view,
      category,
      status,
      city,
      q,
      sort: sort === "updated" ? undefined : sort,
      dir: dir === "desc" ? undefined : dir,
      size: pageSize === PAGE_SIZES[0] ? undefined : pageSize,
      page: page > 1 ? page : undefined,
    };
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...current, ...changes })) {
      if (value !== undefined && value !== "") sp.set(key, String(value));
    }
    const qs = sp.toString();
    return qs ? `/admin?${qs}` : "/admin";
  };

  const sortHref = (column: AdminSortColumn) => {
    const nextDir = sort === column ? (dir === "asc" ? "desc" : "asc") : column === "updated" || column === "price" ? "desc" : "asc";
    return href({
      sort: column === "updated" ? undefined : column,
      dir: nextDir === "desc" ? undefined : nextDir,
      page: undefined,
    });
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1
  );

  return (
    <div>
      {params.saved && (
        <p className="mb-6 flex items-center gap-2 rounded-control border border-primary/30 bg-primary-soft px-4 py-3 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <strong>{params.saved}</strong> was saved. The website is updated.
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Properties</h1>
          <p className="mt-1 text-sm text-muted">
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

      <div className="mt-6 overflow-hidden rounded-card border border-border bg-surface shadow-card">
        {/* Status tabs */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-3" aria-label="Filter by status">
          {views.map((v) => (
            <Link
              key={v.value}
              href={href({ view: v.value === "all" ? undefined : v.value, page: undefined })}
              aria-current={view === v.value ? "page" : undefined}
              className={cn(
                "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium",
                view === v.value ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"
              )}
            >
              {v.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  view === v.value ? "bg-primary-soft text-primary" : "bg-surface-muted text-muted"
                )}
              >
                {counts[v.value]}
              </span>
            </Link>
          ))}
        </nav>

        {/* Search + filters */}
        <div className="border-b border-border p-3">
          <Suspense>
            <AdminTableToolbar cities={cities} />
          </Suspense>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted/60 text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <SortHeader label="Property" column="title" sort={sort} dir={dir} href={sortHref("title")} />
                <SortHeader label="Location" column="city" sort={sort} dir={dir} href={sortHref("city")} className="hidden lg:table-cell" />
                <SortHeader label="Price" column="price" sort={sort} dir={dir} href={sortHref("price")} />
                <th className="hidden px-4 py-3 xl:table-cell">Possession</th>
                <th className="px-4 py-3">Visibility</th>
                <SortHeader label="Updated" column="updated" sort={sort} dir={dir} href={sortHref("updated")} className="hidden xl:table-cell" />
                <th className="sticky right-0 bg-surface-muted px-4 py-3 text-right shadow-[-8px_0_12px_-10px_rgb(16_24_40/0.25)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Inbox className="mx-auto h-8 w-8 text-subtle" aria-hidden="true" />
                    <p className="mt-2 font-semibold text-ink">No properties found</p>
                    <p className="mt-1 text-sm text-muted">
                      {q || category || status || city
                        ? "Try a different search or clear the filters."
                        : view === "deleted"
                          ? "No deleted properties."
                          : "Add your first listing to get started."}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((p) => <PropertyRow key={p.id} property={p} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: count, page size, pagination */}
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Showing <span className="font-semibold text-ink tabular-nums">{from}</span>–
            <span className="font-semibold text-ink tabular-nums">{to}</span> of{" "}
            <span className="font-semibold text-ink tabular-nums">{total}</span>
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Suspense>
              <PageSizeSelect value={pageSize} options={PAGE_SIZES} />
            </Suspense>
            <nav aria-label="Pagination" className="flex items-center gap-1">
              <PageLink href={href({ page: page - 1 > 1 ? page - 1 : undefined })} disabled={page <= 1} label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </PageLink>
              {pageNumbers.map((n, i) => (
                <span key={n} className="flex items-center gap-1">
                  {i > 0 && n - pageNumbers[i - 1] > 1 && <span className="px-1 text-subtle">…</span>}
                  <PageLink href={href({ page: n > 1 ? n : undefined })} active={n === page} label={`Page ${n}`}>
                    {n}
                  </PageLink>
                </span>
              ))}
              <PageLink href={href({ page: page + 1 })} disabled={page >= totalPages} label="Next page">
                <ChevronRight className="h-4 w-4" />
              </PageLink>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  column,
  sort,
  dir,
  href,
  className,
}: {
  label: string;
  column: AdminSortColumn;
  sort: AdminSortColumn;
  dir: "asc" | "desc";
  href: string;
  className?: string;
}) {
  const active = sort === column;
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={cn("px-4 py-3", className)} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <Link href={href} className={cn("inline-flex items-center gap-1 hover:text-ink", active && "text-ink")}>
        {label}
        <Icon className={cn("h-3.5 w-3.5", !active && "opacity-40")} aria-hidden="true" />
      </Link>
    </th>
  );
}

function PageLink({
  href,
  active,
  disabled,
  label,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className = cn(
    "grid h-8 min-w-8 place-items-center rounded-control border px-2 text-sm font-medium tabular-nums transition",
    active ? "border-primary bg-primary text-on-primary" : "border-border bg-surface text-ink hover:border-primary hover:text-primary"
  );
  if (disabled) {
    return (
      <span aria-hidden="true" className={cn(className, "pointer-events-none opacity-40")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
}

function PropertyRow({ property: p }: { property: Property }) {
  return (
    <tr className={cn("group transition hover:bg-canvas", p.isDeleted && "bg-surface-muted/40")}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
            {p.images[0] && (
              <Image
                src={p.images[0]}
                alt=""
                fill
                sizes="64px"
                className={cn("object-cover", p.isDeleted && "grayscale")}
              />
            )}
          </div>
          <div className="min-w-0 max-w-[260px]">
            <Link
              href={p.isDeleted ? "#" : `/admin/properties/${p.id}/edit`}
              className="block truncate font-semibold text-ink hover:text-primary"
              title={p.title}
            >
              {p.title}
            </Link>
            <p className="truncate text-xs text-muted">
              {categoryLabels[p.category]} · {p.propertyType}
              {p.builder && ` · ${p.builder}`}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <p className="max-w-[180px] truncate text-ink" title={[p.locality, p.city].filter(Boolean).join(", ")}>
          {p.locality || "—"}
        </p>
        <p className="text-xs text-muted">{[p.city, p.state].filter(Boolean).join(", ")}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-ink">
        {formatPriceRange(p.priceMin, p.priceMax)}
      </td>
      <td className="hidden whitespace-nowrap px-4 py-3 xl:table-cell">
        <span className="inline-flex items-center gap-1.5 text-ink">
          <span className={cn("h-2 w-2 rounded-full", statusDot[p.status])} aria-hidden="true" />
          {p.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {p.isDeleted ? (
            <Badge tone="danger">Deleted</Badge>
          ) : p.isActive ? (
            <Badge tone="teal">Live</Badge>
          ) : (
            <Badge>Hidden</Badge>
          )}
          {p.isFeatured && !p.isDeleted && <Badge tone="gold">Featured</Badge>}
        </div>
      </td>
      <td className="hidden whitespace-nowrap px-4 py-3 text-muted tabular-nums xl:table-cell">
        {(p.isDeleted && p.deletedAt ? p.deletedAt : p.updatedAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="sticky right-0 bg-surface px-3 py-3 shadow-[-8px_0_12px_-10px_rgb(16_24_40/0.25)] transition group-hover:bg-canvas">
        <PropertyRowActions property={p} />
      </td>
    </tr>
  );
}
