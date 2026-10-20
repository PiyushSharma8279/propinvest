-- Rollback for 0002_operations.sql. Deletes owner submissions, the audit log, availability,
-- buyer-requirement and deal fields. Take a Neon backup branch first.
-- The code from before 0002 keeps working without running this (it ignores the extra columns),
-- except that partner statuses would show raw values; the UPDATE below maps them back.

BEGIN;

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS property_submissions;

UPDATE partners SET status = CASE status
  WHEN 'not_contacted' THEN 'to_contact'
  WHEN 'interested' THEN 'replied'
  WHEN 'follow_up_due' THEN 'contacted'
  WHEN 'onboarded' THEN 'won'
  WHEN 'not_interested' THEN 'lost'
  ELSE status END;
ALTER TABLE partners ALTER COLUMN status SET DEFAULT 'to_contact';
ALTER TABLE partners
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS source_url,
  DROP COLUMN IF EXISTS researched_at,
  DROP COLUMN IF EXISTS last_verified_at,
  DROP COLUMN IF EXISTS next_action,
  DROP COLUMN IF EXISTS onboarding;

UPDATE leads SET status = 'site_visit' WHERE status = 'negotiation';
ALTER TABLE leads
  DROP COLUMN IF EXISTS preferred_location,
  DROP COLUMN IF EXISTS preferred_property_type,
  DROP COLUMN IF EXISTS timeline,
  DROP COLUMN IF EXISTS next_action,
  DROP COLUMN IF EXISTS deal_value,
  DROP COLUMN IF EXISTS commission_amount,
  DROP COLUMN IF EXISTS commission_status,
  DROP COLUMN IF EXISTS commission_confirmed_at;

ALTER TABLE properties
  DROP COLUMN IF EXISTS availability,
  DROP COLUMN IF EXISTS availability_confirmed_at,
  DROP COLUMN IF EXISTS partner_id;

COMMIT;
