import Link from "next/link";
import {
  bedroomOptions,
  categories,
  categoryLabels,
  facingOptions,
  furnishingOptions,
  possessionStatuses,
  propertyTypes,
} from "@/lib/constants/property";
import type { LocationOptions, PropertyFilters } from "@/lib/types";
import { rupeesToLakh } from "@/lib/utils/format";

const controlClass = "mt-2 w-full rounded-md border border-border bg-white px-2 py-2 text-sm";

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-5 border-t border-border pt-4">
      <legend className="text-sm font-semibold text-ink-900">{legend}</legend>
      {children}
    </fieldset>
  );
}

function OptionSelect({
  name,
  value,
  placeholder,
  options,
}: {
  name: string;
  value?: string;
  placeholder: string;
  options: readonly string[];
}) {
  return (
    <select name={name} defaultValue={value ?? ""} className={controlClass}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/** A GET form to /projects: every filter combination is a real, shareable URL. */
export default function FilterSidebar({
  current,
  locations,
}: {
  current: PropertyFilters;
  locations: LocationOptions;
}) {
  const typeCategories = current.category ? [current.category] : categories;
  // BHK and furnishing only apply to buildings; hide them when browsing plots.
  const showBedrooms = !current.category || current.category === "Residential";
  const showFurnishing = current.category !== "Plot";

  return (
    <form
      action="/projects"
      method="GET"
      className="w-full shrink-0 self-start rounded-lg border border-border bg-white p-4 sm:w-64"
    >
      <h2 className="font-display text-lg font-semibold text-ink-900">Filters</h2>
      {current.sort && <input type="hidden" name="sort" value={current.sort} />}

      <label className="mt-4 block">
        <span className="text-sm font-semibold text-ink-900">Location</span>
        <input
          type="search"
          name="q"
          defaultValue={current.q ?? ""}
          placeholder="Address, sector, city…"
          className={controlClass}
        />
      </label>

      <Group legend="Category">
        <select name="category" defaultValue={current.category ?? ""} className={controlClass}>
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {categoryLabels[category]}
            </option>
          ))}
        </select>
        <select name="type" defaultValue={current.type ?? ""} className={controlClass} aria-label="Property type">
          <option value="">All Types</option>
          {typeCategories.map((category) => (
            <optgroup key={category} label={categoryLabels[category]}>
              {propertyTypes[category].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Group>

      <Group legend="City, State & Country">
        <OptionSelect name="city" value={current.city} placeholder="Any city" options={locations.cities} />
        <OptionSelect name="state" value={current.state} placeholder="Any state" options={locations.states} />
        <OptionSelect
          name="country"
          value={current.country}
          placeholder="Any country"
          options={locations.countries}
        />
      </Group>

      <Group legend="Budget (in Lakh ₹)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="minBudget"
            min="0"
            placeholder="Min"
            defaultValue={current.minBudget ? rupeesToLakh(current.minBudget) : ""}
            className={controlClass}
          />
          <span className="mt-2 text-slate-600">—</span>
          <input
            type="number"
            name="maxBudget"
            min="0"
            placeholder="Max"
            defaultValue={current.maxBudget ? rupeesToLakh(current.maxBudget) : ""}
            className={controlClass}
          />
        </div>
      </Group>

      <Group legend="Area">
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="minArea"
            min="0"
            placeholder="Min"
            defaultValue={current.minArea ?? ""}
            className={controlClass}
          />
          <span className="mt-2 text-slate-600">—</span>
          <input
            type="number"
            name="maxArea"
            min="0"
            placeholder="Max"
            defaultValue={current.maxArea ?? ""}
            className={controlClass}
          />
        </div>
        <p className="mt-1 text-xs text-slate-600">In the unit shown on each listing.</p>
      </Group>

      {showBedrooms && (
        <Group legend="Bedrooms">
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-ink-900">
            {bedroomOptions.map((bhk) => (
              <label key={bhk} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="bhk"
                  value={bhk}
                  defaultChecked={current.bhk?.includes(bhk)}
                  className="h-4 w-4 accent-teal-900"
                />
                {bhk} BHK
              </label>
            ))}
          </div>
        </Group>
      )}

      <Group legend="Possession">
        <div className="mt-2 flex flex-col gap-2 text-sm text-ink-900">
          {possessionStatuses.map((status) => (
            <label key={status} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="possession"
                value={status}
                defaultChecked={current.possession?.includes(status)}
                className="h-4 w-4 accent-teal-900"
              />
              {status}
            </label>
          ))}
        </div>
      </Group>

      <Group legend="More">
        {showFurnishing && (
          <OptionSelect
            name="furnishing"
            value={current.furnishing}
            placeholder="Any furnishing"
            options={furnishingOptions}
          />
        )}
        <OptionSelect name="facing" value={current.facing} placeholder="Any facing" options={facingOptions} />
        <label className="mt-3 flex items-center gap-2 text-sm text-ink-900">
          <input
            type="checkbox"
            name="rera"
            value="true"
            defaultChecked={current.rera}
            className="h-4 w-4 accent-teal-900"
          />
          RERA registered only
        </label>
      </Group>

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
