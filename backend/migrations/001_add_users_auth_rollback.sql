-- Rollback Migration 001: Remove Users and Authentication
-- Created: 2025-11-29
-- Description: Rollback users table and user_id columns

-- WARNING: This will delete all user data!
-- Only use this in development or if you need to completely rollback the migration

-- ============================================================================
-- Step 1: Remove indexes from prompt_logs
-- ============================================================================

DROP INDEX IF EXISTS idx_prompt_logs_user_id;

-- ============================================================================
-- Step 2: Remove user_id column from prompt_logs
-- ============================================================================

-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
CREATE TABLE prompt_logs_backup (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  response_time_ms INTEGER
);

INSERT INTO prompt_logs_backup (id, device_id, query, results_count, created_at, response_time_ms)
SELECT id, device_id, query, results_count, created_at, response_time_ms
FROM prompt_logs;

DROP TABLE prompt_logs;

ALTER TABLE prompt_logs_backup RENAME TO prompt_logs;

-- ============================================================================
-- Step 3: Remove indexes from subscriptions
-- ============================================================================

DROP INDEX IF EXISTS idx_subscriptions_user_id;

-- ============================================================================
-- Step 4: Remove user_id column from subscriptions
-- ============================================================================

CREATE TABLE subscriptions_backup (
  device_id TEXT PRIMARY KEY,
  revenuecat_user_id TEXT,
  status TEXT NOT NULL,
  expires_at TEXT,
  product_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  last_updated TEXT DEFAULT (datetime('now'))
);

INSERT INTO subscriptions_backup (device_id, revenuecat_user_id, status, expires_at, product_id, created_at, last_updated)
SELECT device_id, revenuecat_user_id, status, expires_at, product_id, created_at, last_updated
FROM subscriptions;

DROP TABLE subscriptions;

ALTER TABLE subscriptions_backup RENAME TO subscriptions;

-- ============================================================================
-- Step 5: Drop users indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_provider;

-- ============================================================================
-- Step 6: Drop users table
-- ============================================================================

DROP TABLE IF EXISTS users;

-- ============================================================================
-- Rollback complete
-- ============================================================================
