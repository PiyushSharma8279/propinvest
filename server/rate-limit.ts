import "server-only";
import { HttpError } from "./http";

/**
 * Fixed-window in-memory limiter, per server instance (same trade-off as the existing lead and
 * login limits: a speed bump against bots, not a guarantee across serverless instances).
 */
export function createLimiter(max: number, windowMs: number, message: string) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return function assertAllowed(key: string): void {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      if (hits.size > 10_000) hits.clear();
      return;
    }
    if (entry.count >= max) throw new HttpError(429, message);
    entry.count++;
  };
}
