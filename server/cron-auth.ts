import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Constant-time comparison of "Bearer <CRON_SECRET>". Refuses everything when no secret is set. */
export function isAuthorizedCron(header: string | null, secret: string): boolean {
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
