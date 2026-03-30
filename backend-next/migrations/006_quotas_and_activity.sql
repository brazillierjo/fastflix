-- Migration 006: Quotas and Activity Tracking
-- Created: 2026-03-25
-- Description: Add quota tracking, search history, and user taste profiles

-- Table: user_quotas - tracks daily usage for free-tier limits
CREATE TABLE IF NOT EXISTS user_quotas (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  search_count INTEGER DEFAULT 0,
  watchlist_additions INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: search_history - stores user search history
CREATE TABLE IF NOT EXISTS search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: user_taste_profile - stores user taste preferences for better recommendations
CREATE TABLE IF NOT EXISTS user_taste_profile (
  user_id TEXT PRIMARY KEY,
  favorite_genres TEXT DEFAULT '[]',
  disliked_genres TEXT DEFAULT '[]',
  favorite_decades TEXT DEFAULT '[]',
  rated_movies TEXT DEFAULT '[]',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_quotas_date ON user_quotas(date);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at);
