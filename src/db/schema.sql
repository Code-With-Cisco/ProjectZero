CREATE TABLE IF NOT EXISTS sync_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id  TEXT UNIQUE,
  source      TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  payload     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'received',
  error       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS data_mapping (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  fub_person_id   TEXT NOT NULL UNIQUE,
  bamboohr_id     TEXT,
  deel_contract_id TEXT,
  jira_issue_key  TEXT,
  region          TEXT NOT NULL,
  sync_stage      TEXT NOT NULL DEFAULT 'fub_received',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS validation_errors (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  fub_person_id TEXT NOT NULL,
  field       TEXT NOT NULL,
  message     TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'warning',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sync_events_source    ON sync_events(source);
CREATE INDEX IF NOT EXISTS idx_sync_events_status    ON sync_events(status);
CREATE INDEX IF NOT EXISTS idx_data_mapping_region   ON data_mapping(region);
CREATE INDEX IF NOT EXISTS idx_data_mapping_stage    ON data_mapping(sync_stage);
