-- Rollback for 0001_growth_crm.sql.
-- WARNING: this permanently deletes follow-up dates, notes / activity history, partner contacts,
-- content ideas and attribution data recorded since the migration. Take a Neon branch or backup
-- first (Neon console → Branches → Create branch). The original lead and property columns are
-- untouched, so the previous version of the app keeps working after this runs.

BEGIN;

DROP TABLE IF EXISTS job_runs;
DROP TABLE IF EXISTS content_ideas;
DROP TABLE IF EXISTS partner_activities;
DROP TABLE IF EXISTS partners;
DROP TABLE IF EXISTS lead_activities;

DROP INDEX IF EXISTS leads_follow_up_idx;
DROP INDEX IF EXISTS leads_phone_idx;
ALTER TABLE leads
  DROP COLUMN IF EXISTS follow_up_at,
  DROP COLUMN IF EXISTS last_contacted_at,
  DROP COLUMN IF EXISTS utm_source,
  DROP COLUMN IF EXISTS utm_medium,
  DROP COLUMN IF EXISTS utm_campaign,
  DROP COLUMN IF EXISTS utm_term,
  DROP COLUMN IF EXISTS utm_content,
  DROP COLUMN IF EXISTS referrer,
  DROP COLUMN IF EXISTS landing_page,
  DROP COLUMN IF EXISTS privacy_notice_version,
  DROP COLUMN IF EXISTS marketing_opt_in,
  DROP COLUMN IF EXISTS opted_out,
  DROP COLUMN IF EXISTS opted_out_at,
  DROP COLUMN IF EXISTS notified_at,
  DROP COLUMN IF EXISTS notify_attempts,
  DROP COLUMN IF EXISTS last_notify_attempt_at;

-- Leads moved to the new "qualified" stage would show a raw status in the old app; map them back.
UPDATE leads SET status = 'contacted' WHERE status = 'qualified';

ALTER TABLE properties
  DROP COLUMN IF EXISTS listing_source,
  DROP COLUMN IF EXISTS verification_status,
  DROP COLUMN IF EXISTS last_verified_at;

COMMIT;
