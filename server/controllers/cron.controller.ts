import "server-only";
import { isAuthorizedCron } from "../cron-auth";
import { env } from "../env";
import { handle, json, unauthorized } from "../http";
import * as leadService from "../services/lead.service";

/**
 * GET /api/cron/daily — called once a day by Vercel Cron (vercel.json) or any free scheduler
 * (cron-job.org, GitHub Actions) with "Authorization: Bearer <CRON_SECRET>".
 * Safe to call repeatedly: notifications are claimed per lead and the digest once per IST day.
 */
export const daily = handle(async (request: Request) => {
  if (!isAuthorizedCron(request.headers.get("authorization"), env.cronSecret())) throw unauthorized("Bad cron secret.");
  const [notifications, digest] = await Promise.all([
    leadService.retryPendingNotifications(),
    leadService.sendFollowUpDigest(),
  ]);
  console.info(`[cron] daily: retried ${notifications.attempted}, sent ${notifications.sent}; digest ${digest.status}`);
  return json({ ok: true, notifications, digest: digest.status });
});
