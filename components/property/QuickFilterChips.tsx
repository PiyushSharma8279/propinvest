import Link from "next/link";
import { categories, categoryLabels, possessionStatuses } from "@/lib/constants/property";
import type { PropertyFilters } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { projectsUrl } from "@/lib/utils/search-params";

interface Chip {
  label: string;
  href: string;
  active: boolean;
}

/** One-click toggles above the results. `base` is the current query string. */
export default function QuickFilterChips({
  current,
  base,
}: {
  current: PropertyFilters;
  base: URLSearchParams;
}) {
  const categoryChips: Chip[] = categories.map((category) => {
    const active = current.category === category;
    return {
      label: categoryLabels[category],
      href: projectsUrl(base, { category: active ? null : category, type: null }),
      active,
    };
  });

  const possessionChips: Chip[] = possessionStatuses.map((status) => {
    const selected = current.possession ?? [];
    const active = selected.includes(status);
    const next = active ? selected.filter((s) => s !== status) : [...selected, status];
    return { label: status, href: projectsUrl(base, { possession: next }), active };
  });

  const chips: Chip[] = [
    ...categoryChips,
    {
      label: "RERA Registered",
      href: projectsUrl(base, { rera: current.rera ? null : "true" }),
      active: Boolean(current.rera),
    },
    ...possessionChips,
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition",
            chip.active
              ? "border-primary bg-primary text-on-primary"
              : "border-border bg-surface text-muted hover:border-primary hover:text-primary"
          )}
        >
          {chip.label}
        </Link>
      ))}
    </div>
  );
}
