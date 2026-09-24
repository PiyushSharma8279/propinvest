"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { sortOptions } from "@/lib/constants/property";
import { projectsUrl } from "@/lib/utils/search-params";

export default function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      Sort by
      <select
        defaultValue={searchParams.get("sort") ?? ""}
        onChange={(e) =>
          router.push(projectsUrl(new URLSearchParams(searchParams), { sort: e.target.value || null }))
        }
        className="rounded-md border border-border bg-white px-2 py-1.5 text-sm font-medium text-ink-900"
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
