export interface LatLng {
  lat: number;
  lng: number;
}

export function isValidLatLng(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

export function googleMapsUrl({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function googleDirectionsUrl({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Centre of India, used when a property has no pin yet. */
export const DEFAULT_MAP_CENTER: LatLng = { lat: 22.9734, lng: 78.6569 };
