CREATE TABLE IF NOT EXISTS push_tokens (
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  platform TEXT DEFAULT 'ios',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, token),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
