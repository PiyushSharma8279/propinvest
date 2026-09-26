"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { categories, categoryLabels, possessionStatuses } from "@/lib/constants/property";
import { cn } from "@/lib/utils/cn";

const controlClass =
  "h-9 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:border-primary focus:outline-none";

/** Updates the URL query (resetting to page 1) so the server re-renders the table. */
function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (changes: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) sp.set(key, value);
      else sp.delete(key);
    }
    if (!("page" in changes)) sp.delete("page");
    const qs = sp.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  return { update, pending, searchParams };
}

export function AdminTableToolbar({ cities }: { cities: string[] }) {
  const { update, pending, searchParams } = useQueryUpdater();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const first = useRef(true);

  // Debounced search: fires 350ms after the user stops typing.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => update({ q: q.trim() || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filters = [
    {
      name: "category",
      label: "All categories",
      options: categories.map((c) => ({ value: c, label: categoryLabels[c] })),
    },
    {
      name: "status",
      label: "Any possession",
      options: possessionStatuses.map((s) => ({ value: s, label: s })),
    },
    { name: "city", label: "All cities", options: cities.map((c) => ({ value: c, label: c })) },
  ];

  const hasFilters = Boolean(q || filters.some((f) => searchParams.get(f.name)));

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <label className="relative flex-1">
        <span className="sr-only">Search properties</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, builder, city, address…"
          className={cn(controlClass, "w-full pl-9")}
        />
        {pending && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-subtle" />
        )}
      </label>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        {filters.map((f) => (
          <select
            key={f.name}
            aria-label={f.label}
            value={searchParams.get(f.name) ?? ""}
            onChange={(e) => update({ [f.name]: e.target.value || null })}
            className={cn(controlClass, "sm:w-40", searchParams.get(f.name) && "border-primary text-primary")}
          >
            <option value="">{f.label}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              update({ q: null, category: null, status: null, city: null });
            }}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-control px-3 text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-ink"
          >
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}

export function PageSizeSelect({ value, options }: { value: number; options: number[] }) {
  const { update } = useQueryUpdater();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      Rows per page
      <select
        value={value}
        onChange={(e) => update({ size: e.target.value === String(options[0]) ? null : e.target.value })}
        className={cn(controlClass, "h-8 px-2")}
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}
