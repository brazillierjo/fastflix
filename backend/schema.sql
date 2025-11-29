-- FastFlix Backend Database Schema
-- Turso SQLite Database

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
CREATE INDEX IF NOT EXISTS idx_prompt_logs_device ON prompt_logs(device_id, created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status, expires_at);
