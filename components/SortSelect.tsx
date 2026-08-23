"use client";

import { useRouter, useSearchParams } from "next/navigation";

const options = [
  { value: "", label: "Most Relevant" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "possession", label: "Possession Date" },
];

export default function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      Sort By
      <select
        defaultValue={searchParams.get("sort") ?? ""}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          if (e.target.value) {
            params.set("sort", e.target.value);
          } else {
            params.delete("sort");
          }
          router.push(`/projects?${params.toString()}`);
        }}
        className="rounded-md border border-border bg-white px-2 py-1.5 text-sm font-medium text-ink-900"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
