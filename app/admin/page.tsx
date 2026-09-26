import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building,
  Building2,
  Eye,
  FilePen,
  EyeOff,
  LandPlot,
  LayoutList,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { categories, categoryLabels, type PropertyCategory } from "@/lib/constants/property";
import { cn } from "@/lib/utils/cn";
import { formatPriceRange } from "@/lib/utils/format";
import {
  getAdminCategoryCounts,
  getAdminCities,
  getAdminCounts,
  listAdminProperties,
} from "@/server/services/property.service";

export const metadata: Metadata = { title: "Dashboard" };

const categoryIcons: Record<PropertyCategory, typeof Building> = {
  Residential: Building2,
  Commercial: Building,
  Plot: LandPlot,
};

export default async function AdminDashboardPage() {
  const [counts, byCategory, cities, recent] = await Promise.all([
    getAdminCounts(),
    getAdminCategoryCounts(),
    getAdminCities(),
    listAdminProperties({ view: "all", sort: "updated", dir: "desc", pageSize: 5 }),
  ]);

  const stats = [
    { label: "Total listings", value: counts.all, icon: LayoutList, tone: "bg-primary-soft text-primary", href: "/admin/properties" },
    { label: "Live on website", value: counts.active, icon: Eye, tone: "bg-primary-soft text-primary", href: "/admin/properties?view=active" },
    { label: "Featured", value: counts.featured, icon: Star, tone: "bg-highlight-soft text-highlight", href: "/admin/properties?view=featured" },
    { label: "Hidden", value: counts.inactive, icon: EyeOff, tone: "bg-surface-muted text-muted", href: "/admin/properties?view=inactive" },
    { label: "Drafts", value: counts.drafts, icon: FilePen, tone: "bg-highlight-soft text-highlight", href: "/admin/properties?view=drafts" },
    { label: "Deleted", value: counts.deleted, icon: Trash2, tone: "bg-danger-soft text-danger", href: "/admin/properties?view=deleted" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Overview of your listings across {cities.length} {cities.length === 1 ? "city" : "cities"}.
          </p>
        </div>
        <LinkButton href="/admin/properties/new">
          <Plus className="h-4 w-4" /> Add property
        </LinkButton>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ label, value, icon: Icon, tone, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-card border border-border bg-surface p-4 shadow-card transition hover:border-primary/40 hover:shadow-card-hover"
          >
            <span className={cn("grid h-9 w-9 place-items-center rounded-lg", tone)}>
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-2xl font-bold tabular-nums text-ink">{value}</p>
            <p className="text-sm text-muted group-hover:text-ink">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        {/* By category */}
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="text-base font-semibold text-ink">By category</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {categories.map((c) => {
              const Icon = categoryIcons[c];
              const { total, live } = byCategory[c];
              const share = counts.all ? Math.round((total / counts.all) * 100) : 0;
              return (
                <li key={c}>
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/admin/properties?category=${c}`}
                      className="flex items-center gap-2.5 text-sm font-medium text-ink hover:text-primary"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      {categoryLabels[c]}
                    </Link>
                    <span className="text-sm tabular-nums text-muted">
                      <span className="font-semibold text-ink">{total}</span> · {live} live
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
            {categories.map((c) => (
              <LinkButton key={c} href={`/admin/properties/new?category=${c}`} variant="outline" size="sm">
                + {categoryLabels[c]}
              </LinkButton>
            ))}
          </div>
        </section>

        {/* Recently updated */}
        <section className="rounded-card border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-ink">Recently updated</h2>
            <Link
              href="/admin/properties"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recent.items.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No listings yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.items.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/properties/${p.id}/edit`}
                    className="flex items-center gap-3 px-5 py-3 transition hover:bg-canvas"
                  >
                    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                      {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="56px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{p.title}</p>
                      <p className="truncate text-xs text-muted">
                        {categoryLabels[p.category]} · {[p.locality, p.city].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-semibold tabular-nums text-ink">
                        {formatPriceRange(p.priceMin, p.priceMax)}
                      </p>
                      <p className="text-xs text-muted">
                        {p.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    {p.isDraft ? <Badge tone="gold">Draft</Badge> : p.isActive ? <Badge tone="teal">Live</Badge> : <Badge>Hidden</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
