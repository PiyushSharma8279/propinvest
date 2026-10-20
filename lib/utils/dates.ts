/** Date helpers for follow-ups. The business runs on India time, so "today" means today in IST. */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Start (inclusive) and end (exclusive) of the IST calendar day containing `now`, as UTC Dates. */
export function istDayBounds(now: Date = new Date()): { start: Date; end: Date } {
  const istMidnight = Math.floor((now.getTime() + IST_OFFSET_MS) / DAY_MS) * DAY_MS;
  const start = new Date(istMidnight - IST_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** "2026-10-20" — the IST date, used as an idempotency key for daily jobs. */
export function istDateKey(now: Date = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** `days` from now at 10:00 IST — a sensible time for a call reminder. */
export function followUpInDays(days: number, now: Date = new Date()): Date {
  const { start } = istDayBounds(now);
  return new Date(start.getTime() + days * DAY_MS + 10 * 60 * 60 * 1000);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

/** Value for <input type="datetime-local"> in IST, e.g. "2026-10-20T10:00". */
export function toIstInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 16);
}

/** Parses "2026-10-20T10:00" (IST, from datetime-local) or a full ISO string. Invalid → null. */
export function parseIstInput(value: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    const date = new Date(`${value}:00+05:30`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (/^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function formatIst(date: Date | null | undefined, withTime = true): string {
  if (!date) return "—";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    ...(withTime && { hour: "numeric", minute: "2-digit" }),
  });
}

export type FollowUpState = "overdue" | "today" | "upcoming" | "none";

export function followUpState(followUpAt: Date | null | undefined, now: Date = new Date()): FollowUpState {
  if (!followUpAt) return "none";
  const { start, end } = istDayBounds(now);
  if (followUpAt < start) return "overdue";
  if (followUpAt < end) return "today";
  return "upcoming";
}
