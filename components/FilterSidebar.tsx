import Link from "next/link";
import type { ProjectFilters } from "@/lib/types";
import { getAllCities } from "@/lib/properties";

const bedroomOptions = ["1", "2", "3", "4", "5", "6"];
const possessionOptions = ["New Launch", "Under Construction", "Ready to Move"];

export default function FilterSidebar({ current }: { current: ProjectFilters }) {
  const cities = getAllCities();
  const selectedBhk = current.bhk ?? [];
  const selectedPossession = current.possession ?? [];

  return (
    <form
      action="/projects"
      method="GET"
      className="w-full shrink-0 rounded-lg border border-border bg-white p-4 sm:w-64"
    >
      <h2 className="font-display text-lg font-semibold text-ink-900">Filters</h2>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink-900">
        <input
          type="checkbox"
          name="rera"
          value="true"
          defaultChecked={current.rera}
          className="h-4 w-4 rounded border-border accent-teal-900"
        />
        RERA Registered Projects
      </label>

      <fieldset className="mt-5 border-t border-border pt-4">
        <legend className="text-sm font-semibold text-ink-900">Property Category</legend>
        <select
          name="category"
          defaultValue={current.category ?? ""}
          className="mt-2 w-full rounded-md border border-border px-2 py-2 text-sm"
        >
          <option value="">Residential &amp; Commercial</option>
          <option value="Residential">Residential</option>
          <option value="Commercial">Commercial</option>
        </select>
      </fieldset>

      <fieldset className="mt-5 border-t border-border pt-4">
        <legend className="text-sm font-semibold text-ink-900">City</legend>
        <select
          name="city"
          defaultValue={current.city ?? ""}
          className="mt-2 w-full rounded-md border border-border px-2 py-2 text-sm"
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="mt-5 border-t border-border pt-4">
        <legend className="text-sm font-semibold text-ink-900">Budget (in Lakh ₹)</legend>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            name="minBudget"
            placeholder="Min"
            defaultValue={current.minBudget ? current.minBudget / 100000 : ""}
            className="w-full rounded-md border border-border px-2 py-2 text-sm"
          />
          <span className="text-slate-600">—</span>
          <input
            type="number"
            name="maxBudget"
            placeholder="Max"
            defaultValue={current.maxBudget ? current.maxBudget / 100000 : ""}
            className="w-full rounded-md border border-border px-2 py-2 text-sm"
          />
        </div>
      </fieldset>

      <fieldset className="mt-5 border-t border-border pt-4">
        <legend className="text-sm font-semibold text-ink-900">Bedroom</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-ink-900">
          {bedroomOptions.map((bhk) => (
            <label key={bhk} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="bhk"
                value={bhk}
                defaultChecked={selectedBhk.includes(bhk)}
                className="h-4 w-4 rounded border-border accent-teal-900"
              />
              {bhk} BHK
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5 border-t border-border pt-4">
        <legend className="text-sm font-semibold text-ink-900">Possession In</legend>
        <div className="mt-2 flex flex-col gap-2 text-sm text-ink-900">
          {possessionOptions.map((status) => (
            <label key={status} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="possession"
                value={status}
                defaultChecked={selectedPossession.includes(status)}
                className="h-4 w-4 rounded border-border accent-teal-900"
              />
              {status}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className="mt-6 w-full rounded-md bg-teal-900 px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-teal-700"
      >
        Apply Filters
      </button>
      <Link
        href="/projects"
        className="mt-2 block w-full rounded-md border border-border px-4 py-2 text-center text-sm font-medium text-slate-600 transition hover:bg-cream-200"
      >
        Clear All
      </Link>
    </form>
  );
}
