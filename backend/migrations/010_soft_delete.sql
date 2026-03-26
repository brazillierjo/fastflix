-- Migration 010: Add soft delete support to users table
-- Allows marking accounts as deleted without removing data (prevents trial abuse)

ALTER TABLE users ADD COLUMN deleted_at TEXT;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
