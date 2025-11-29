-- Migration 001: Add Users and Authentication
-- Created: 2025-11-29
-- Description: Add users table and migrate subscriptions/prompt_logs to use user_id

-- ============================================================================
-- Step 1: Create users table
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                    -- UUID v4
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL,            -- 'apple' | 'google'
  provider_user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- Step 2: Create indexes on users table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(auth_provider, provider_user_id);

-- ============================================================================
-- Step 3: Migrate subscriptions table
-- ============================================================================

-- Add user_id column (nullable for now to allow migration)
ALTER TABLE subscriptions ADD COLUMN user_id TEXT;

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Note: We keep device_id for backward compatibility during migration
-- It will be removed in a future migration after full auth rollout

-- ============================================================================
-- Step 4: Migrate prompt_logs table
-- ============================================================================

-- Add user_id column (nullable)
ALTER TABLE prompt_logs ADD COLUMN user_id TEXT;

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_prompt_logs_user_id ON prompt_logs(user_id);

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Next steps:
-- 1. Deploy backend with new auth endpoints
-- 2. Update frontend to use Sign in with Apple/Google
-- 3. New users will have user_id populated
-- 4. Old device_id subscriptions will continue to work
-- 5. Later migration will clean up device_id column
