import Link from "next/link";
import type { ProjectFilters } from "@/lib/types";

interface Chip {
  label: string;
  href: string;
  active: boolean;
}

export default function QuickFilterChips({
  current,
  baseQuery,
}: {
  current: ProjectFilters;
  baseQuery: URLSearchParams;
}) {
  const toggleBoolean = (key: string, isActive: boolean) => {
    const params = new URLSearchParams(baseQuery.toString());
    if (isActive) {
      params.delete(key);
    } else {
      params.set(key, "true");
    }
    return `/projects?${params.toString()}`;
  };

  const toggleSingleValue = (key: string, value: string, isActive: boolean) => {
    const params = new URLSearchParams(baseQuery.toString());
    params.delete(key);
    if (!isActive) {
      params.set(key, value);
    }
    return `/projects?${params.toString()}`;
  };

  const toggleMultiValue = (key: string, value: string, isActive: boolean) => {
    const params = new URLSearchParams(baseQuery.toString());
    const existing = params.getAll(key);
    params.delete(key);
    const next = isActive
      ? existing.filter((v) => v !== value)
      : [...existing, value];
    next.forEach((v) => params.append(key, v));
    return `/projects?${params.toString()}`;
  };

  const isReady = Boolean(current.possession?.includes("Ready to Move"));
  const isNewLaunch = Boolean(current.possession?.includes("New Launch"));
  const isUnderConstruction = Boolean(current.possession?.includes("Under Construction"));

  const isResidential = current.category === "Residential";
  const isCommercial = current.category === "Commercial";

  const chips: Chip[] = [
    {
      label: "Residential",
      href: toggleSingleValue("category", "Residential", isResidential),
      active: isResidential,
    },
    {
      label: "Commercial",
      href: toggleSingleValue("category", "Commercial", isCommercial),
      active: isCommercial,
    },
    {
      label: "RERA Registered",
      href: toggleBoolean("rera", Boolean(current.rera)),
      active: Boolean(current.rera),
    },
    {
      label: "Ready to Move",
      href: toggleMultiValue("possession", "Ready to Move", isReady),
      active: isReady,
    },
    {
      label: "New Launch",
      href: toggleMultiValue("possession", "New Launch", isNewLaunch),
      active: isNewLaunch,
    },
    {
      label: "Under Construction",
      href: toggleMultiValue("possession", "Under Construction", isUnderConstruction),
      active: isUnderConstruction,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
            chip.active
              ? "border-teal-900 bg-teal-900 text-cream"
              : "border-border bg-white text-ink-900 hover:border-teal-900"
          }`}
        >
          {chip.label}
        </Link>
      ))}
    </div>
  );
}
