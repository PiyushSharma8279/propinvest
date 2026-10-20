# InvestsProperty — audit report (20 Oct 2026)

Scope: the code in this repository (Next.js 16 App Router, Neon Postgres via Drizzle, JWT
admin auth, ImageKit uploads, Vercel hosting). The live site, Google Search Console and GA4 were
**not** inspected — no access was available — so traffic, indexing and real page speed are not
covered here.

## What already worked well

- Enquiries (enquiry form, brochure download, price-list request) are validated server-side and
  saved with `property_id` and the project title at the time of the enquiry. A brochure link is
  only revealed after the lead is saved.
- Honeypot field plus a per-IP limit (5 per 10 minutes) on `POST /api/leads`.
- Admin access is checked twice: `proxy.ts` (JWT) for pages, and `requireAdmin()` in every API
  controller, which re-reads the user from the database so a deactivated admin loses access
  immediately. Passwords are bcrypt-hashed; the JWT lives in an httpOnly cookie.
- Soft delete for listings; drafts never appear on the site.
- Per-page titles, descriptions, canonical URLs, Open Graph images, sitemap and robots.txt.
- CSV export already escapes spreadsheet formulas.

## Findings and what was done

| # | Area | Finding | Severity | Status |
|---|------|---------|----------|--------|
| 1 | Compliance | Site-wide copy said "RERA-verified listings only", "Every listing, verified", "Verified listings", and the RERA badge said **"RERA Verified"**, but nothing in the system verified anything: the badge was driven by a checkbox an admin ticks. | High | **Fixed** in the badge, listings description and detail page. The header, home, about, OG image, property card and `site-config.ts` were being edited by hand during this work and were left alone; those edits already remove most of the claims. `about/page.tsx` still says "find verified residential projects" — see *Needs human review*. |
| 2 | Compliance | No way to record where listing details came from or whether anyone checked them. | High | **Added** `listing_source`, `verification_status`, `last_verified_at` on listings (admin form → *Source & verification*). The public page says "checked by our team on <date>" only when status is *Verified*; otherwise it says details are as provided by the builder. |
| 3 | SEO / compliance | Listing JSON-LD declared `availability: InStock` for every listing, although unit availability isn't tracked. | Medium | **Fixed** — removed. |
| 4 | SEO | Root layout set `canonical: "/"`, inherited by any page that doesn't set its own (every new page would claim to duplicate the homepage). | Medium | **Fixed** — removed; indexable pages set their own. |
| 5 | Privacy | No privacy policy; the forms didn't say how details would be used; no record of consent or opt-out. | High | **Added** `/privacy` (draft — review it), a short notice under every form, an optional *unticked* "send me similar projects" box, `privacy_notice_version` and `marketing_opt_in` per lead, and a do-not-contact flag that hides call/WhatsApp actions. |
| 6 | Privacy | `page_url` stored the full URL including query strings. | Low | **Fixed** — origin + path only. |
| 7 | Leads | Same person submitting twice (or brochure then enquiry) created two leads. | Medium | **Fixed** — same phone + same listing within 30 min is recorded as "enquired again" on the existing lead. |
| 8 | Leads | No follow-up dates, notes, history, "qualified" stage, or reminders; status labels didn't match the sales process. | High | **Added** — see README → *Lead management*. |
| 9 | Leads | No notification on a new lead: the admin had to keep checking the panel. | High | **Added** optional email (Resend) / Telegram notification after the lead is saved, with retries and the provider's real answer recorded. |
| 10 | Validation | Phone accepted any 11–15 digits (e.g. `5810000001`, `9999999999`); names could be URLs. | Medium | **Fixed** — Indian mobiles must start 6–9, repeated digits rejected; names must contain letters and no links; messages with several links are rejected. |
| 11 | Security | Lead and login rate limits are in memory, so on Vercel each serverless instance has its own counter. | Medium | **Not changed** — the honeypot + dedupe cover most spam. A shared limiter needs a store (e.g. Upstash free tier); documented as a follow-up. |
| 12 | Security | No Content-Security-Policy header. | Low | **Not changed** — GA, ImageKit, OpenStreetMap tiles and inline JSON-LD need a carefully tested policy; recommended follow-up. |
| 13 | Analytics | No event for form starts, property views or campaign attribution. | Medium | **Added** `form_start`, `view_property` GA4 events and first-touch UTM / referrer capture saved with each lead. |
| 14 | Quality | No tests. | Medium | **Added** 44 tests (`npm test`). |
| 15 | Ops | No retention rule for old personal data. | Medium | **Added** `npm run leads:retention` (dry-run by default). |

## Needs human review (not changed automatically)

1. **`app/(site)/about/page.tsx`** still says buyers "find verified residential projects". Reword
   unless you do verify every listing.
2. **`siteConfig.social`** links (Instagram / Facebook / LinkedIn `investsproperty`) are used in the
   footer and in `sameAs` structured data. Remove any that aren't your real profiles.
3. **Fallback phone numbers** in `lib/site-config.ts` (`919716390299`) differ from the
   `.env.example` placeholders. Confirm production sets `NEXT_PUBLIC_DEFAULT_WHATSAPP` /
   `NEXT_PUBLIC_DEFAULT_PHONE`.
4. **`/privacy`** is a plain-language draft that matches how the code handles data. Have it checked
   against the DPDP Act 2023 before relying on it.
5. **Each live listing**: open *Admin → Listing quality*. Every listing starts as "Not verified yet"
   with no recorded source. Fill in the source, check RERA numbers on the state portal, and only
   then set *Verified*.
6. **Google Analytics** loads for every visitor without a consent banner. That's common in India
   but required in some markets. Decide before running ads aimed outside India.
7. Mobile layout, broken links and page speed were **not** tested in a browser (pages can't render
   until the migration is applied). Run Lighthouse on the live site after deploying.

## Update — 20 Oct 2026 (operations release, migration 0002)

| Area | Change |
|---|---|
| Listings | Availability (unavailable = off the public site), availability-confirmed date, owner / partner link, derived lifecycle stage; quality checks for unconfirmed / stale availability; daily digest reminds about re-verification (80+ days) and availability (30+ days). |
| Owners | Public `/list-your-property` with an authorisation statement (versioned), honeypot, per-IP limits, image-only uploads restricted to our ImageKit host, duplicate detection, admin review (approve → draft, corrections, reject, suspend). |
| Leads | Stages now include *Visit scheduled* and *Negotiation*. Added preferred location, property type, timeline, next action, deal value and commission with status (only confirmed / received counts as revenue), and one-click buyer responses. Messages are suggested by stage. |
| Partners | New statuses (Not contacted → … → Partner onboarded / Not interested), category, source URL, research and verification dates, next action, onboarding checklist, CSV import with preview and dedupe. |
| Marketing | Drafts only for verified listings, with missing-info list and tracked links; no automatic posting. |
| Control | Today panel, weekly report with partners, verified listings, deals and commissions; website visits shown only as "see GA4" until measured. |
| Security | Audit log for sensitive actions; access test now also covers the submission endpoints. |

**Access model:** only admins can sign in. There is no partner / owner login, so owners can't see
other owners' data or any buyer leads. If a partner dashboard is added later, every query must be
scoped by `partner_id` on the server.
