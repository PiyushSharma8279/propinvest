import type { LatLng } from "./maps";

/**
 * Looks up an address with OpenStreetMap's free Nominatim service (browser only).
 * Fine for occasional admin use; not for bulk or automated lookups.
 */
export async function geocodeAddress(query: string): Promise<(LatLng & { label: string }) | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  return hit ? { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name } : null;
}
