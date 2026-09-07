const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'telemetry.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance concurrency
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    country TEXT,
    timezone TEXT DEFAULT 'auto',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, latitude, longitude)
  );

  CREATE TABLE IF NOT EXISTS forecast_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    favorite_id INTEGER NOT NULL REFERENCES favorites(id) ON DELETE CASCADE,
    target_time TEXT NOT NULL,
    model_id TEXT NOT NULL,
    lead_hours INTEGER NOT NULL,
    temperature_2m REAL,
    precipitation REAL,
    wind_speed_10m REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(favorite_id, target_time, model_id, lead_hours)
  );

  CREATE TABLE IF NOT EXISTS actual_observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    favorite_id INTEGER NOT NULL REFERENCES favorites(id) ON DELETE CASCADE,
    time TEXT NOT NULL,
    temperature_2m REAL,
    precipitation REAL,
    wind_speed_10m REAL,
    surface_pressure REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(favorite_id, time)
  );

  CREATE INDEX IF NOT EXISTS idx_snapshots_lookup ON forecast_snapshots(favorite_id, target_time);
  CREATE INDEX IF NOT EXISTS idx_actual_lookup ON actual_observations(favorite_id, time);
`);

// Seed default favorites if table is empty
const countFavorites = db.prepare('SELECT count(*) as count FROM favorites').get();
if (countFavorites.count === 0) {
  const insertFav = db.prepare(`
    INSERT INTO favorites (name, latitude, longitude, country, timezone)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertFav.run('Milano', 45.46427, 9.18951, 'Italia', 'Europe/Rome');
  insertFav.run('Roma', 41.89193, 12.51133, 'Italia', 'Europe/Rome');
  insertFav.run('Zurigo', 47.36667, 8.55, 'Svizzera', 'Europe/Zurich');
}

module.exports = db;
