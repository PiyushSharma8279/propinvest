"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { sortOptions } from "@/lib/constants/property";
import { projectsUrl } from "@/lib/utils/search-params";

export default function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      Sort by
      <select
        defaultValue={searchParams.get("sort") ?? ""}
        onChange={(e) =>
          router.push(projectsUrl(new URLSearchParams(searchParams), { sort: e.target.value || null }))
        }
        className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-medium text-ink"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
