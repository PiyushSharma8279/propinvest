import { MapPin, Search } from "lucide-react";
import { categories, categoryLabels } from "@/lib/constants/property";
import type { LocationOptions } from "@/lib/types";

const selectClass =
  "w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-ink-900";

/**
 * Homepage search. A plain GET form to /projects, so every search is a shareable,
 * crawlable URL and the homepage itself can stay statically generated.
 */
export default function HeroSearch({ locations }: { locations: LocationOptions }) {
  return (
    <form
      action="/projects"
      method="GET"
      className="flex w-full flex-col gap-2 rounded-lg bg-cream p-2 shadow-lg"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Address, locality, city, state or country</span>
          <MapPin
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            placeholder="Search address, sector, city, state or country"
            className={`${selectClass} pl-9`}
          />
        </label>
        <select name="category" defaultValue="" className={`${selectClass} sm:w-44`} aria-label="Property category">
          <option value="">All Properties</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {categoryLabels[category]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-gold-600 px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-600/90"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Search
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <LocationSelect name="city" label="Any city" options={locations.cities} />
        <LocationSelect name="state" label="Any state" options={locations.states} />
        <LocationSelect name="country" label="Any country" options={locations.countries} />
      </div>
    </form>
  );
}

function LocationSelect({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <select name={name} defaultValue="" className={selectClass} aria-label={label}>
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
