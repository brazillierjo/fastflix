-- Migration 005: Remove Free Trial Columns
-- Created: 2026-02-06
-- Description: Remove trial tracking fields from users table.
-- Trial functionality is now handled by Apple's native Introductory Offers via App Store Connect.

-- Step 1: Drop trial index
DROP INDEX IF EXISTS idx_users_trial_ends_at;

-- Step 2: Remove trial columns from users table
ALTER TABLE users DROP COLUMN trial_started_at;
ALTER TABLE users DROP COLUMN trial_ends_at;
ALTER TABLE users DROP COLUMN trial_used;
