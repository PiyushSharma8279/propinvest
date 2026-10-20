import "server-only";
import { env } from "../env";

/**
 * Outbound admin notifications (new lead, daily follow-up digest). Every channel is optional:
 * with no credentials configured, nothing is sent and the result says "skipped".
 *
 * Results describe what the provider actually answered — "ok" means the provider accepted the
 * message (HTTP 2xx), not that a person read it. Logs never include the message text, because it
 * contains the lead's name and phone number.
 */

export type Channel = "email" | "telegram";

export interface ChannelResult {
  channel: Channel;
  outcome: "sent" | "failed" | "skipped";
  /** HTTP status from the provider, when there was a response. */
  status?: number;
  /** Short, non-sensitive reason for a failure or skip. */
  detail?: string;
  attempts: number;
}

export interface NotificationMessage {
  subject: string;
  /** Plain text; also used for Telegram. */
  text: string;
}

export interface NotifyConfig {
  resendApiKey: string;
  emailTo: string;
  emailFrom: string;
  telegramBotToken: string;
  telegramChatId: string;
}

type FetchLike = (url: string, init: RequestInit) => Promise<Pick<Response, "ok" | "status">>;

export function configFromEnv(): NotifyConfig {
  return {
    resendApiKey: env.resendApiKey(),
    emailTo: env.notifyEmailTo(),
    emailFrom: env.notifyEmailFrom(),
    telegramBotToken: env.telegramBotToken(),
    telegramChatId: env.telegramChatId(),
  };
}

export function isNotificationConfigured(config: NotifyConfig = configFromEnv()): boolean {
  return Boolean((config.resendApiKey && config.emailTo) || (config.telegramBotToken && config.telegramChatId));
}

const RETRY_DELAYS_MS = [0, 800, 2500];

/** POSTs with up to 3 attempts. Retries network errors, 429 and 5xx; a 4xx is final. */
async function postWithRetry(
  channel: Channel,
  url: string,
  init: RequestInit,
  fetchImpl: FetchLike,
  sleep: (ms: number) => Promise<void>
): Promise<ChannelResult> {
  let last: ChannelResult = { channel, outcome: "failed", attempts: 0 };
  for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
    if (RETRY_DELAYS_MS[i]) await sleep(RETRY_DELAYS_MS[i]);
    try {
      const res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(8000) });
      if (res.ok) return { channel, outcome: "sent", status: res.status, attempts: i + 1 };
      last = { channel, outcome: "failed", status: res.status, detail: `HTTP ${res.status}`, attempts: i + 1 };
      if (res.status < 500 && res.status !== 429) break;
    } catch (error) {
      last = { channel, outcome: "failed", detail: error instanceof Error ? error.name : "network error", attempts: i + 1 };
    }
  }
  console.warn(`[notify] ${channel} failed after ${last.attempts} attempt(s): ${last.detail ?? "unknown"}`);
  return last;
}

export async function sendNotification(
  message: NotificationMessage,
  config: NotifyConfig = configFromEnv(),
  fetchImpl: FetchLike = fetch,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms))
): Promise<ChannelResult[]> {
  const jobs: Promise<ChannelResult>[] = [];

  if (config.resendApiKey && config.emailTo) {
    jobs.push(
      postWithRetry(
        "email",
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${config.resendApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: config.emailFrom,
            to: config.emailTo.split(",").map((s) => s.trim()).filter(Boolean),
            subject: message.subject,
            text: message.text,
          }),
        },
        fetchImpl,
        sleep
      )
    );
  } else {
    jobs.push(Promise.resolve({ channel: "email", outcome: "skipped", detail: "not configured", attempts: 0 }));
  }

  if (config.telegramBotToken && config.telegramChatId) {
    jobs.push(
      postWithRetry(
        "telegram",
        `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: config.telegramChatId,
            text: `${message.subject}\n\n${message.text}`.slice(0, 4000),
            disable_web_page_preview: true,
          }),
        },
        fetchImpl,
        sleep
      )
    );
  } else {
    jobs.push(Promise.resolve({ channel: "telegram", outcome: "skipped", detail: "not configured", attempts: 0 }));
  }

  return Promise.all(jobs);
}

export const anySent = (results: ChannelResult[]) => results.some((r) => r.outcome === "sent");
