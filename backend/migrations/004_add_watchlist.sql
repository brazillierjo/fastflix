-- Migration 004: Add Watchlist Table
-- Created: 2025-12-04
-- Description: Add watchlist table for users to save movies/TV shows to watch later

-- ============================================================================
-- Step 1: Create watchlist table
-- ============================================================================

CREATE TABLE IF NOT EXISTS watchlist (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_provider_check DATETIME,
  providers_json TEXT DEFAULT '[]',
  country TEXT NOT NULL DEFAULT 'FR',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- Step 2: Create indexes for performance
-- ============================================================================

-- Index for user lookups (getting user's watchlist)
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);

-- Unique index to prevent duplicates (user can't add same item twice)
CREATE UNIQUE INDEX IF NOT EXISTS idx_watchlist_unique ON watchlist(user_id, tmdb_id, media_type);

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Usage notes:
-- - id: UUID for the watchlist item
-- - user_id: Foreign key to users table
-- - tmdb_id: TMDB ID of the movie/TV show
-- - media_type: 'movie' or 'tv'
-- - title: Title of the movie/TV show (cached for display)
-- - poster_path: TMDB poster path (cached for display)
-- - added_at: When the item was added to watchlist
-- - last_provider_check: Last time providers were refreshed
-- - providers_json: JSON array of streaming providers (cached)
-- - country: Country for provider lookup (e.g., 'FR', 'US')
--
-- To get user's watchlist:
--   SELECT * FROM watchlist WHERE user_id = ? ORDER BY added_at DESC
--
-- To check if item is in watchlist:
--   SELECT id FROM watchlist WHERE user_id = ? AND tmdb_id = ? AND media_type = ?
--
-- To add to watchlist:
--   INSERT INTO watchlist (id, user_id, tmdb_id, media_type, title, poster_path, providers_json, country)
--   VALUES (?, ?, ?, ?, ?, ?, ?, ?)
--
-- To remove from watchlist:
--   DELETE FROM watchlist WHERE id = ? AND user_id = ?
