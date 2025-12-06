-- FastFlix Backend Database Schema
-- Turso SQLite Database

-- Table pour les utilisateurs (ajoutée dans migration 001)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                    -- UUID v4
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL,            -- 'apple' | 'google'
  provider_user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  -- Trial fields (ajoutés dans migration 002)
  trial_started_at TEXT,                  -- Quand l'essai a commencé
  trial_ends_at TEXT,                     -- Quand l'essai se termine
  trial_used INTEGER DEFAULT 0            -- 1 si l'essai a été utilisé
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(auth_provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at ON users(trial_ends_at);

-- Table pour les abonnements (RevenueCat)
CREATE TABLE IF NOT EXISTS subscriptions (
  device_id TEXT PRIMARY KEY,
  revenuecat_user_id TEXT,
  user_id TEXT,                           -- Ajouté dans migration 001
  status TEXT,                            -- 'active', 'expired', 'cancelled'
  expires_at TIMESTAMP,
  product_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Table pour les appareils bloqués (anti-abus)
CREATE TABLE IF NOT EXISTS blocked_devices (
  device_id TEXT PRIMARY KEY,
  reason TEXT,
  blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  blocked_until TIMESTAMP               -- NULL = permanent
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status, expires_at);
