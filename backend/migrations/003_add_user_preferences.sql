-- Migration 003: Add User Preferences
-- Created: 2025-12-03
-- Description: Add search preferences to users table for default filters

-- ============================================================================
-- Step 1: Add preference fields to users table
-- ============================================================================

-- Default country for streaming providers (ISO 3166-1 alpha-2, e.g., 'FR', 'US')
ALTER TABLE users ADD COLUMN pref_country TEXT DEFAULT 'FR';

-- Default content type: 'all', 'movies', 'tvshows'
ALTER TABLE users ADD COLUMN pref_content_type TEXT DEFAULT 'all';

-- Selected streaming platforms (JSON array of provider IDs, e.g., '[8, 119, 337]')
-- Provider IDs come from TMDB watch providers API
ALTER TABLE users ADD COLUMN pref_platforms TEXT DEFAULT '[]';

-- Availability filters (what type of content availability to show)
-- 1 = enabled, 0 = disabled
ALTER TABLE users ADD COLUMN pref_include_flatrate INTEGER DEFAULT 1;  -- Subscription
ALTER TABLE users ADD COLUMN pref_include_rent INTEGER DEFAULT 0;       -- Rental
ALTER TABLE users ADD COLUMN pref_include_buy INTEGER DEFAULT 0;        -- Purchase

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Usage notes:
-- - pref_country: Used for watch provider lookups (e.g., 'FR', 'US', 'GB')
-- - pref_content_type: 'all' | 'movies' | 'tvshows'
-- - pref_platforms: JSON array of TMDB provider IDs (e.g., '[8, 119]' for Netflix, Prime)
-- - pref_include_flatrate: Include content available with subscription
-- - pref_include_rent: Include content available for rental
-- - pref_include_buy: Include content available for purchase
--
-- To get user preferences:
--   SELECT pref_country, pref_content_type, pref_platforms,
--          pref_include_flatrate, pref_include_rent, pref_include_buy
--   FROM users WHERE id = ?
--
-- To update user preferences:
--   UPDATE users
--   SET pref_country = ?, pref_content_type = ?, pref_platforms = ?,
--       pref_include_flatrate = ?, pref_include_rent = ?, pref_include_buy = ?
--   WHERE id = ?
