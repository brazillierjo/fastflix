-- FastFlix Backend Database Schema
-- Turso SQLite Database

-- Table principale pour le comptage des prompts
CREATE TABLE IF NOT EXISTS user_prompts (
  device_id TEXT PRIMARY KEY,           -- ID unique de l'appareil (iOS/Android)
  prompt_count INTEGER DEFAULT 0,       -- Nombre de prompts utilisés ce mois
  current_month TEXT NOT NULL,          -- Format: YYYY-MM
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  platform TEXT,                        -- 'ios' ou 'android'
  app_version TEXT                      -- Pour analytics
);

-- Table pour les abonnements (RevenueCat)
CREATE TABLE IF NOT EXISTS subscriptions (
  device_id TEXT PRIMARY KEY,
  revenuecat_user_id TEXT,
  status TEXT,                          -- 'active', 'expired', 'cancelled'
  expires_at TIMESTAMP,
  product_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour tracer les requêtes (analytics optionnel)
CREATE TABLE IF NOT EXISTS prompt_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  query TEXT,                           -- Requête de l'utilisateur (optionnel)
  results_count INTEGER,                -- Nombre de résultats retournés
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  response_time_ms INTEGER              -- Temps de réponse de l'API
);

-- Table pour les appareils bloqués (anti-abus)
CREATE TABLE IF NOT EXISTS blocked_devices (
  device_id TEXT PRIMARY KEY,
  reason TEXT,
  blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  blocked_until TIMESTAMP               -- NULL = permanent
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_current_month ON user_prompts(current_month);
CREATE INDEX IF NOT EXISTS idx_device_created ON user_prompts(device_id, created_at);
CREATE INDEX IF NOT EXISTS idx_prompt_logs_device ON prompt_logs(device_id, created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status, expires_at);
