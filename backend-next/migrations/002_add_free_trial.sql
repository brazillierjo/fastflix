-- Migration 002: Add Free Trial Support
-- Created: 2025-11-30
-- Description: Add trial tracking fields to users table for 7-day free trial feature

-- ============================================================================
-- Step 1: Add trial fields to users table
-- ============================================================================

-- When the trial started (NULL if never started)
ALTER TABLE users ADD COLUMN trial_started_at TEXT;

-- When the trial ends (NULL if never started)
ALTER TABLE users ADD COLUMN trial_ends_at TEXT;

-- Whether the user has used their trial (0 = false, 1 = true)
-- Once set to 1, user cannot start another trial
ALTER TABLE users ADD COLUMN trial_used INTEGER DEFAULT 0;

-- ============================================================================
-- Step 2: Create index for efficient trial queries
-- ============================================================================

-- Index to quickly find users with active trials
CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at ON users(trial_ends_at);

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Usage notes:
-- - trial_started_at: Set when user starts trial (datetime('now'))
-- - trial_ends_at: Set to trial_started_at + 7 days
-- - trial_used: Set to 1 when trial starts, prevents re-use
--
-- To check if user is in active trial:
--   SELECT * FROM users
--   WHERE id = ?
--   AND trial_used = 1
--   AND trial_ends_at > datetime('now')
--
-- To start a trial:
--   UPDATE users
--   SET trial_started_at = datetime('now'),
--       trial_ends_at = datetime('now', '+7 days'),
--       trial_used = 1
--   WHERE id = ? AND trial_used = 0
