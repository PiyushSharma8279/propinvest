# Operating plan: daily workflow and first 7 days

Goal for the week: onboard your first genuine property partner and get your first genuine buyer
inquiry, at ₹0 spend. Neither is guaranteed. These are the actions most likely to get you there,
and the admin panel records whether they happened.

## Daily workflow (about 60–90 minutes)

| When | Where | What |
|---|---|---|
| Morning, 10 min | **Dashboard → Today** | Read *Blocking progress*. Note today's due leads and partners. |
| Morning, 20 min | **Leads → Needs action** | Call or WhatsApp every due lead. Composer → suggested message → edit → *Open in WhatsApp*. Then press *Buyer replied / declined / follow up later*. New leads: call within 2 hours. |
| Midday, 20 min | **Partners → Follow-up due**, then *Not contacted* | Message 3–5 contacts (template → personalise → send yourself). Set status + next follow-up date + next action. |
| Midday, 10 min | **Submissions** | Review anything pending. Ask for corrections or approve → finish the draft listing. |
| Evening, 15 min | **Listing quality** → *High* | Verify one listing properly (RERA portal, price list, availability). Set *Verified*. |
| Evening, 10 min | **Marketing drafts** | Post one verified listing (WhatsApp Status / community post) using the tracked link. |
| Monday, 20 min | **Weekly report** | Compare with last week. Do the *Recommended next actions*. |

## First 7 days

**Day 1 — switch it on**
- Apply migrations 0001 + 0002 (done / with your approval), deploy, run the live-site checklist below.
- Set up Telegram alerts (10 min, free) so you never miss a lead. Add `CRON_SECRET`.
- Submit the sitemap in Google Search Console. Add `NEXT_PUBLIC_GA_ID` if you have GA4.
- Fix the high-priority items in the audit's *Needs human review* list (About-page wording, social links).

**Day 2 — make 3 listings trustworthy**
- Pick the 3 listings you know best. Confirm price and availability with the builder / owner by
  phone, check RERA on the UP RERA portal, fill *Source & verification*, set *Verified* and *Availability confirmed today*.
- Mark anything sold or no longer offered as *Unavailable*. It drops off the site and stops wasting buyer trust.

**Day 3 — build the partner list**
- Research 15 businesses in Noida from legitimate public sources: builders' official websites,
  resale brokers with a Google Business Profile, channel-partner firms listed on project sites.
  Record each with the source URL and date (manually, or as a CSV → *Import*).
- Only business contact details they publish. No personal numbers from groups, no bought lists.

**Day 4 — first outreach**
- Send the *First message* template to 8–10 contacts, personalised (name, their project, why you).
- Share `/list-your-property` with property owners you already know personally (friends, family,
  past clients) and ask if they or someone they know is selling.

**Day 5 — first content**
- Marketing drafts for your 3 verified listings → WhatsApp Status + one local community post each
  (RWA group or Facebook group where property posts are allowed; read the group rules first).
- Use the tracked links, so an inquiry shows *whatsapp* / *community* as its source.

**Day 6 — follow up**
- Follow up once with everyone contacted on Day 4 who hasn't replied. Mark *Not interested* /
  *Do not contact* when asked.
- For any interested partner: open the onboarding checklist and start collecting the authorisation
  letter, price list and photos.

**Day 7 — review**
- Weekly report: how many contacts, replies, verified listings, inquiries.
- Decide one change for next week: a different audience, a better message, or more verified listings.

## Live-site test checklist (safe)

Use your own phone number; afterwards mark test records *Lost* / *Do not contact*. Don't use real
customers' details.

1. Open a property page on mobile. The badge says *RERA Registered* (not "Verified"), the
   verification note shows, and the enquiry form shows the privacy notice and an unticked opt-in box.
2. Submit an enquiry. "Thank you" appears. **Admin → Leads**: the lead is there, linked to the
   property, status *New*. The Telegram / email alert arrives (if configured), and the lead history
   says `telegram: sent`.
3. Submit the same enquiry again within 30 minutes. There's still one lead, with "Enquired again" in its history.
4. On the lead page: set a follow-up, add a note, press *Follow up later*. It appears under *Needs action* on that date.
5. Open `/list-your-property`, submit a test property with one photo. **Admin → Submissions** shows
   it; *Reject* it with the note "test".
6. Open `/api/cron/daily` in a browser. It must return 401 (no secret).
7. Sign out and open `/admin/leads`. It must redirect to the login page.
8. Download the leads CSV. The **Audit log** shows the export.
9. GA4 → Realtime shows your visit and `form_start` / `generate_lead` (only once GA is configured).

## Next three priorities for genuine inquiries

1. **Verify and confirm availability of your best 3–5 listings, and mark stale ones unavailable.**
   Trust is the bottleneck; only verified listings can be promoted from the marketing workspace.
2. **Onboard one real partner with fresh inventory** (owner or builder) through outreach and
   `/list-your-property`, then publish their listing with full documents.
3. **Distribute verified listings through free channels with tracked links** (WhatsApp Status,
   community groups, Google Business Profile, personal referrals), and respond to every inquiry
   within 2 hours using the follow-up tools.
