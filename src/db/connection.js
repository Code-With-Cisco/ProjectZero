const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

const DB_PATH = path.join(__dirname, '../../data/integration.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db;

function getDb() {
  if (db) return db;

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);

  logger.info('SQLite database initialized', { path: DB_PATH });
  return db;
}

module.exports = { getDb };
