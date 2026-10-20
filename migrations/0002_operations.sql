-- 0002_operations — owner/builder submissions, listing availability + owner link, buyer
-- requirement and deal fields on leads, partner research fields + onboarding, audit log.
--
-- Additive: new nullable / defaulted columns and new tables. The only UPDATE renames partner
-- statuses in the `partners` table (created by 0001, used only by the new admin tracker) to the
-- new status names. No other row is changed and nothing is dropped. Safe to run twice.
--
-- Apply with ONE of:  npm run db:push   |   Neon console → SQL Editor → paste → Run
-- Rollback: migrations/0002_operations.down.sql

BEGIN;

-- ---------- properties ----------
ALTER TABLE properties ADD COLUMN IF NOT EXISTS availability text NOT NULL DEFAULT 'available';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS availability_confirmed_at timestamptz;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS partner_id integer;

-- ---------- leads ----------
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_location text NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_property_type text NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline text NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action text NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value bigint NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS commission_amount bigint NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS commission_status text NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS commission_confirmed_at timestamptz;

-- ---------- partners ----------
ALTER TABLE partners ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT '';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS source_url text NOT NULL DEFAULT '';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS researched_at timestamptz;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS next_action text NOT NULL DEFAULT '';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS onboarding jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE partners ALTER COLUMN status SET DEFAULT 'not_contacted';
UPDATE partners SET status = CASE status
  WHEN 'to_contact' THEN 'not_contacted'
  WHEN 'replied' THEN 'interested'
  WHEN 'meeting' THEN 'interested'
  WHEN 'proposal' THEN 'interested'
  WHEN 'won' THEN 'onboarded'
  WHEN 'lost' THEN 'not_interested'
  ELSE status END
WHERE status IN ('to_contact', 'replied', 'meeting', 'proposal', 'won', 'lost');

-- ---------- property_submissions ----------
CREATE TABLE IF NOT EXISTS property_submissions (
  id serial PRIMARY KEY,
  partner_id integer REFERENCES partners(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL DEFAULT '',
  submitter_type text NOT NULL DEFAULT 'owner',
  preferred_contact text NOT NULL DEFAULT 'whatsapp',
  title text NOT NULL,
  category text NOT NULL,
  property_type text NOT NULL DEFAULT '',
  locality text NOT NULL DEFAULT '',
  city text NOT NULL,
  address text NOT NULL DEFAULT '',
  price bigint NOT NULL DEFAULT 0,
  area real NOT NULL DEFAULT 0,
  area_unit text NOT NULL DEFAULT 'sq.ft.',
  description text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  rera_number text NOT NULL DEFAULT '',
  authorization_confirmed boolean NOT NULL DEFAULT false,
  terms_version text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  review_note text NOT NULL DEFAULT '',
  reviewed_by integer REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  property_id integer REFERENCES properties(id) ON DELETE SET NULL,
  possible_duplicates jsonb NOT NULL DEFAULT '{"properties":[],"submissions":[]}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS property_submissions_status_idx ON property_submissions (status);
CREATE INDEX IF NOT EXISTS property_submissions_phone_idx ON property_submissions (phone);

-- ---------- audit_log ----------
CREATE TABLE IF NOT EXISTS audit_log (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id integer,
  summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log (created_at);

COMMIT;
