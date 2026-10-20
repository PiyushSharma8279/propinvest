-- 0001_growth_crm — lead follow-ups, attribution, consent, notifications, listing provenance,
-- partner outreach, content pipeline and job-run log.
--
-- ADDITIVE ONLY: adds nullable / defaulted columns and new tables. No existing column is changed
-- or dropped and no row is updated or deleted, so it is safe to run on a live database and safe
-- to run twice (IF NOT EXISTS everywhere).
--
-- Apply with ONE of:
--   npm run db:push                         (drizzle-kit diffs server/db/schema.ts; review the plan it prints)
--   Neon console → SQL Editor → paste this file → Run
-- Rollback: migrations/0001_growth_crm.down.sql (drops only what this file adds).

BEGIN;

-- ---------- properties: provenance ----------
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_source text NOT NULL DEFAULT '';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;

-- ---------- leads: follow-up, attribution, consent, notification ----------
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source text NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium text NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign text NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term text NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content text NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer text NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS landing_page text NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS privacy_notice_version text NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS opted_out boolean NOT NULL DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS opted_out_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notified_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notify_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_notify_attempt_at timestamptz;
CREATE INDEX IF NOT EXISTS leads_follow_up_idx ON leads (follow_up_at);
CREATE INDEX IF NOT EXISTS leads_phone_idx ON leads (phone);

-- Leads that existed before this migration were handled before notifications existed:
-- nothing to do for them (notified_at stays NULL, but the daily retry job only looks at the
-- last 48 hours, so old leads are never notified retroactively).

-- ---------- lead_activities ----------
CREATE TABLE IF NOT EXISTS lead_activities (
  id serial PRIMARY KEY,
  lead_id integer NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id integer REFERENCES users(id) ON DELETE SET NULL,
  type text NOT NULL,
  note text NOT NULL DEFAULT '',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lead_activities_lead_idx ON lead_activities (lead_id, created_at);
CREATE INDEX IF NOT EXISTS lead_activities_type_idx ON lead_activities (type, created_at);

-- ---------- partners ----------
CREATE TABLE IF NOT EXISTS partners (
  id serial PRIMARY KEY,
  name text NOT NULL,
  company text NOT NULL DEFAULT '',
  partner_type text NOT NULL DEFAULT 'builder',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  contact_source text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'to_contact',
  next_follow_up_at timestamptz,
  notes text NOT NULL DEFAULT '',
  do_not_contact boolean NOT NULL DEFAULT false,
  created_by integer REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partners_status_idx ON partners (status);
CREATE INDEX IF NOT EXISTS partners_follow_up_idx ON partners (next_follow_up_at);

CREATE TABLE IF NOT EXISTS partner_activities (
  id serial PRIMARY KEY,
  partner_id integer NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  user_id integer REFERENCES users(id) ON DELETE SET NULL,
  type text NOT NULL,
  note text NOT NULL DEFAULT '',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partner_activities_partner_idx ON partner_activities (partner_id, created_at);
CREATE INDEX IF NOT EXISTS partner_activities_type_idx ON partner_activities (type, created_at);

-- ---------- content_ideas ----------
CREATE TABLE IF NOT EXISTS content_ideas (
  id serial PRIMARY KEY,
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'location_guide',
  target_keyword text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'idea',
  url text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  due_date date,
  published_at timestamptz,
  created_by integer REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_ideas_status_idx ON content_ideas (status);

-- ---------- job_runs ----------
CREATE TABLE IF NOT EXISTS job_runs (
  id serial PRIMARY KEY,
  job text NOT NULL,
  run_key text NOT NULL,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS job_runs_job_key_idx ON job_runs (job, run_key);

COMMIT;
