/** Display formatting. Safe to import from client components. */

const LAKH = 100_000;
const CRORE = 10_000_000;

function trimNumber(value: number): string {
  return Number(value.toFixed(2)).toString();
}

/** 34700000 → "3.47 Cr", 8500000 → "85 L", 45000 → "45,000" */
export function formatAmount(rupees: number): string {
  if (rupees >= CRORE) return `${trimNumber(rupees / CRORE)} Cr`;
  if (rupees >= LAKH) return `${trimNumber(rupees / LAKH)} L`;
  return rupees.toLocaleString("en-IN");
}

export function formatPriceRange(min: number, max: number): string {
  if (!min && !max) return "Price on Request";
  if (!max || max === min) return `₹${formatAmount(min || max)}`;
  if (!min) return `Up to ₹${formatAmount(max)}`;
  return `₹${formatAmount(min)} - ${formatAmount(max)}`;
}

export function formatAreaRange(min: number, max: number, unit: string): string {
  const fmt = (n: number) => n.toLocaleString("en-IN");
  if (!min && !max) return "—";
  if (!max || max === min) return `${fmt(min || max)} ${unit}`;
  return `${fmt(min)} - ${fmt(max)} ${unit}`;
}

/** "2031-02-01" → "Feb 2031" */
export function formatPossession(isoDate: string | null, status: string): string {
  if (!isoDate) return status === "Ready to Move" ? "Immediate" : "To be announced";
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "To be announced";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

/** Rupees ↔ Lakh, for the admin form's price inputs. */
export const rupeesToLakh = (rupees: number) => (rupees ? Number((rupees / LAKH).toFixed(2)) : 0);
export const lakhToRupees = (lakh: number) => Math.round(lakh * LAKH);

/** "Sector 150, Noida, Uttar Pradesh" — skips empty parts. */
export function joinAddress(...parts: (string | null | undefined)[]): string {
  return parts.map((p) => p?.trim()).filter(Boolean).join(", ");
}

/** Makes a root-relative path absolute; leaves full URLs (e.g. ImageKit) alone. */
export function absoluteUrl(pathOrUrl: string, siteUrl: string): string {
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${siteUrl}${pathOrUrl}`;
}

/** Indian digit grouping without a currency symbol: 250000 → "2,50,000". */
export function formatRupees(rupees: number): string {
  return Math.round(rupees).toLocaleString("en-IN");
}

/**
 * Price per unit area. `sqmPerUnit` maps each unit to its size in square metres
 * (lib/constants/property.ts), so a price for 100 sq.m. can be expressed per sq.yd. or sq.ft.
 */
export function ratePerUnit(
  price: number,
  area: number,
  areaUnit: string,
  targetUnit: string,
  sqmPerUnit: Record<string, number>
): number | null {
  const from = sqmPerUnit[areaUnit];
  const to = sqmPerUnit[targetUnit];
  if (!price || !area || !from || !to) return null;
  const sqm = area * from;
  return (price / sqm) * to;
}

/** Amount in Indian words for form hints: 2600000 → "26 Lakh", 12500000 → "1.25 Crore", 45000 → "45 Thousand". */
export function formatAmountInWords(rupees: number): string {
  if (!rupees) return "";
  if (rupees >= CRORE) return `${trimNumber(rupees / CRORE)} Crore`;
  if (rupees >= LAKH) return `${trimNumber(rupees / LAKH)} Lakh`;
  if (rupees >= 1000) return `${trimNumber(rupees / 1000)} Thousand`;
  return `${trimNumber(rupees)}`;
}

/** "NOIDA" / "uttar pradesh" → "Noida" / "Uttar Pradesh"; mixed-case input ("Greater Noida West") is kept as typed. */
export function tidyPlaceName(value: string): string {
  const v = value.trim().replace(/\s+/g, " ");
  if (v !== v.toUpperCase() && v !== v.toLowerCase() && !/ [a-z]/.test(v)) return v;
  return v.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

/**
 * De-duplicates place names case-insensitively ("NOIDA" and "Noida" become one "Noida"),
 * sorted A-Z. Filters and search already match case-insensitively, so either spelling works.
 */
export function uniquePlaceNames(values: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const value of values) {
    const tidy = tidyPlaceName(value);
    if (tidy && !byKey.has(tidy.toLowerCase())) byKey.set(tidy.toLowerCase(), tidy);
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}
