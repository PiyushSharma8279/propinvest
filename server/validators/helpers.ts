/** Small, dependency-free readers for untrusted JSON input. */

export function str(body: Record<string, unknown>, key: string, max = 5000): string {
  const value = body[key];
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function num(body: Record<string, unknown>, key: string): number {
  const value = typeof body[key] === "string" ? Number(body[key]) : body[key];
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

export function optionalNum(body: Record<string, unknown>, key: string): number | null {
  const raw = body[key];
  if (raw === null || raw === undefined || raw === "") return null;
  const value = typeof raw === "string" ? Number(raw) : raw;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function bool(body: Record<string, unknown>, key: string): boolean {
  return body[key] === true || body[key] === "true" || body[key] === "on";
}

/** Trimmed, de-duplicated, non-empty strings. */
export function strArray(body: Record<string, unknown>, key: string, maxItems = 50): string[] {
  const value = body[key];
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item === "string" && item.trim()) seen.add(item.trim().slice(0, 300));
  }
  return [...seen].slice(0, maxItems);
}

export function oneOf<T extends string>(options: readonly T[], value: string): T | undefined {
  return options.find((o) => o === value);
}

export function collectErrors() {
  const errors: Record<string, string> = {};
  return {
    errors,
    add(field: string, message: string) {
      errors[field] ??= message;
    },
    get hasErrors() {
      return Object.keys(errors).length > 0;
    },
  };
}
