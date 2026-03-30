CREATE TABLE IF NOT EXISTS user_activity (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  actions_count INTEGER DEFAULT 1,
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id, date);
