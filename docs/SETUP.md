# Setup guide: notifications, scheduled jobs, Search Console, GA4

Everything here is optional and free. The site works without any of it. Nothing is
"connected" until you complete the steps and see the check at the end of each section pass.

## 1. Lead notifications

A notification goes out right after a lead is saved, never before. Results (sent / failed /
skipped, with the provider's HTTP status) are listed under **Notes & history** on each lead.
Configure one channel or both.

### Email (Resend, free tier: 3,000 emails/month, 100/day)

1. Sign up at resend.com → **API Keys** → create a key with *Sending access*.
2. In Vercel → Settings → Environment Variables, add:
   - `RESEND_API_KEY` = the key
   - `LEAD_NOTIFY_EMAIL_TO` = where to send (comma-separate several)
3. Until you verify a domain in Resend (Domains → Add → add the DNS records), keep the default
   sender `onboarding@resend.dev`. It can only deliver to the address you signed up with.
   After verifying, set `LEAD_NOTIFY_EMAIL_FROM=InvestsProperty <leads@yourdomain.com>`.

### Telegram (free, instant on your phone)

1. In Telegram, message **@BotFather** → `/newbot` → copy the token.
2. Send any message to your new bot, then open
   `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy `chat.id`.
3. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in Vercel.

**Check:** submit a test enquiry on the live site with your own number. The lead's history should
show `email: sent` / `telegram: sent`. Then mark that lead *Lost* or *Do not contact*.

## 2. Daily job (retries + follow-up digest)

`GET /api/cron/daily` does two things, both safe to repeat:

- Retries notifications for leads from the last 48 hours that never got one (up to 5 attempts per
  lead, at least 10 minutes apart).
- Sends one summary of overdue and due-today follow-ups, at most once per IST day. A `job_runs`
  row is written per day, so a second call the same day is skipped.

**Vercel (default).** `vercel.json` schedules it daily at 03:30 UTC (09:00 IST). Add
`CRON_SECRET` (any long random string) in Vercel; Vercel sends it as the bearer token. The Hobby
plan allows daily crons only, and timing can drift by up to an hour.

**Free alternative (cron-job.org or GitHub Actions)**, if you need more control: call
`https://investsproperty.com/api/cron/daily` with header `Authorization: Bearer <CRON_SECRET>`.

Without `CRON_SECRET` the endpoint refuses every call.

**Limits / manual fallback:** if the job doesn't run, nothing is lost. The **Needs action** and
**Overdue** tabs in Admin → Leads always show the same list the digest would send.

## 3. Google Search Console

1. search.google.com/search-console → **Add property** → *Domain* → `investsproperty.com`.
2. Add the TXT record it shows at your domain registrar; wait for verification.
3. **Sitemaps** → submit `https://investsproperty.com/sitemap.xml`.
4. After a few days check **Pages** (indexing) and **Performance** (queries).

**Check:** the sitemap shows status *Success* and a discovered-URL count close to the number of
live listings plus the category, city and static pages.

## 4. Google Analytics 4

1. analytics.google.com → Admin → **Create property** → *Web* data stream for your domain.
2. Copy the Measurement ID (`G-…`) into `NEXT_PUBLIC_GA_ID` in Vercel and redeploy. GA loads on the
   public site only, never on `/admin`.
3. Admin → **Events** → mark `generate_lead` as a **key event**. Optionally also `whatsapp_click`
   and `call_click`.
4. Admin → **Custom definitions** → add event-scoped dimensions `project_name` and `lead_source`.

Events the site sends:

| Event | When | Parameters |
|---|---|---|
| `page_view` | every page (GA enhanced measurement) | — |
| `view_property` | property page opened | project_name, city, category |
| `form_start` | first field touched in an enquiry / brochure form | project_name, lead_source |
| `generate_lead` | the server confirmed the lead was saved | project_name, lead_source |
| `call_click`, `whatsapp_click` | phone / WhatsApp link clicked | project_name |
| `view_number` | "View number" pressed | project_name |

**Check:** GA → Reports → Realtime shows your own visit and a `form_start` when you click into a form.

**Qualified leads, site visits and conversions** are not sent to GA, because they happen offline.
The admin panel is the source of truth for them: Dashboard → *Lead pipeline*, and **Weekly
report**, which also breaks leads down by campaign source (`utm_source`).

### Tag your own links

Add UTM tags to every link you share so the lead records where it came from:

```
https://investsproperty.com/projects/skyline-arte?utm_source=whatsapp&utm_medium=status&utm_campaign=oct-launch
https://investsproperty.com/?utm_source=instagram&utm_medium=bio
```

## 5. Privacy

- The enquiry forms show a short notice linking to `/privacy`. If you change what you do with
  enquiries, update `/privacy` and bump `PRIVACY_NOTICE_VERSION` in `lib/constants/lead.ts`.
- Turning on a notification channel sends lead names and numbers to that provider (Resend /
  Telegram). `/privacy` already mentions notification providers.
- Run `npm run leads:retention` (dry run) every few months, then `-- --apply` after a backup.

## 6. Costs (checked 20 Oct 2026; confirm on each pricing page)

Everything this project uses can run at ₹0 at your current scale. When a free limit is reached,
the service pauses rather than charging, except where noted.

| Service | Used for | Free allowance (third-party summaries; confirm officially) | When you'd pay |
|---|---|---|---|
| Vercel Hobby | hosting, daily cron | Cron: at most once per day, fires within ±59 min of the scheduled hour | Hobby is for non-commercial use under Vercel's terms. A business site may need **Pro (~$20/month)**. Check vercel.com/legal and pricing. |
| Neon Free | database | ~0.5 GB storage, ~100 compute-hours / month; compute suspends at the limit | Launch plan, usage-based |
| ImageKit Free | listing and submission photos | ~20–25 GB delivery bandwidth / month, a few GB storage; features stop at the limit | Paid plans |
| Resend Free (optional) | lead alert emails | 3,000 emails / month, 100 / day; sending pauses at the cap | Pro ~$20/month |
| Telegram bot (optional) | lead alerts | free | — |
| Google Analytics 4 / Search Console | traffic | free | — |
| Domain | investsproperty.com | — | annual renewal (you already pay this) |

**Watch-outs:** public photo uploads from `/list-your-property` use ImageKit storage (rate-limited
to 20 photos per IP per hour, 8 per submission). Delete rejected submissions' photos from the
ImageKit dashboard now and then. The new-lead alert uses 1 email per lead. The daily digest
uses 1–2 emails per day.
