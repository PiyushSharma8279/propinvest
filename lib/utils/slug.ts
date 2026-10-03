/**
 * "Skyline Arte — Phase 2!" → "skyline-arte-phase-2", "SECTOR 145,5% PLOT" → "sector-145-5-plot".
 * Punctuation separates words (so "145,5" doesn't become "1455"); apostrophes are just dropped.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-$/, "");
}

/**
 * Picks the first free slug: "base", then "base-2", "base-3", …
 * `taken` is the set of slugs already used by other records.
 */
export function nextAvailableSlug(base: string, taken: Set<string>): string {
  const root = base || "property";
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}
