import "server-only";

function required(name: string, ...fallbacks: string[]): string {
  for (const key of [name, ...fallbacks]) {
    const value = process.env[key];
    if (value) return value;
  }
  throw new Error(`Missing environment variable ${name}. See .env.example.`);
}

const optional = (name: string) => process.env[name]?.trim() || "";

/** Read lazily so a missing variable fails the request that needs it, not the whole build. */
export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  jwtSecret: () => required("JWT_SECRET"),
  imagekitPrivateKey: () => required("IMAGEKIT_PRIVATE_KEY"),
  imagekitUrlEndpoint: () => required("IMAGEKIT_URL_ENDPOINT", "IMAGE_KIT_URL_ENDPOINT"),
  isProduction: () => process.env.NODE_ENV === "production",

  // Optional integrations: each is simply skipped when its variables are empty.
  /** Lead notification email via Resend (free tier). */
  resendApiKey: () => optional("RESEND_API_KEY"),
  notifyEmailTo: () => optional("LEAD_NOTIFY_EMAIL_TO"),
  notifyEmailFrom: () => optional("LEAD_NOTIFY_EMAIL_FROM") || "InvestsProperty <onboarding@resend.dev>",
  /** Lead notification to a Telegram chat via a bot (free). */
  telegramBotToken: () => optional("TELEGRAM_BOT_TOKEN"),
  telegramChatId: () => optional("TELEGRAM_CHAT_ID"),
  /** Shared secret the scheduler sends as "Authorization: Bearer <CRON_SECRET>". */
  cronSecret: () => optional("CRON_SECRET"),
};
