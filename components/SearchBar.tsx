import { Search } from "lucide-react";
import { getAllCities } from "@/lib/properties";

export default function SearchBar() {
  const cities = getAllCities();

  return (
    <form
      action="/projects"
      method="GET"
      className="flex w-full flex-col gap-2 rounded-lg bg-cream p-2 shadow-lg sm:flex-row sm:items-center"
    >
      <select
        name="type"
        defaultValue="residential"
        className="rounded-md border border-border bg-white px-3 py-2.5 text-sm text-ink-900 sm:w-44"
        aria-label="Property type"
      >
        <option value="residential">Residential</option>
        <option value="commercial">Commercial</option>
      </select>

      <select
        name="city"
        defaultValue=""
        className="flex-1 rounded-md border border-border bg-white px-3 py-2.5 text-sm text-ink-900"
        aria-label="City"
      >
        <option value="">All Cities</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
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
    </form>
  );
}
