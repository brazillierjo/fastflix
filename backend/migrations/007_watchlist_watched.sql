-- Migration 007: Watchlist Watched Tracking
-- Created: 2026-03-25
-- Description: Add watched status, rating, and notes to watchlist items

ALTER TABLE watchlist ADD COLUMN watched INTEGER DEFAULT 0;
ALTER TABLE watchlist ADD COLUMN watched_at TEXT;
ALTER TABLE watchlist ADD COLUMN user_rating INTEGER;
ALTER TABLE watchlist ADD COLUMN user_note TEXT;

-- Index for querying watched items
CREATE INDEX IF NOT EXISTS idx_watchlist_watched ON watchlist(user_id, watched);
