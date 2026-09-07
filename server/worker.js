const db = require('./db');

const MODELS = [
  'ecmwf_ifs025',
  'icon_seamless',
  'gfs_seamless',
  'meteofrance_seamless',
  'ukmo_seamless',
  'jma_seamless',
  'gem_seamless'
];

/**
 * Fetch and upsert actual observations for a given favorite
 */
async function syncActualObservations(favorite) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${favorite.latitude.toFixed(
    4
  )}&longitude=${favorite.longitude.toFixed(
    4
  )}&hourly=temperature_2m,precipitation,wind_speed_10m,surface_pressure&past_days=3&forecast_days=1&timezone=${encodeURIComponent(
    favorite.timezone || 'auto'
  )}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error ${res.status} fetching actual observations for ${favorite.name}`);
  const data = await res.json();

  if (!data.hourly || !data.hourly.time) return 0;

  const insertStmt = db.prepare(`
    INSERT INTO actual_observations (favorite_id, time, temperature_2m, precipitation, wind_speed_10m, surface_pressure, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(favorite_id, time) DO UPDATE SET
      temperature_2m = excluded.temperature_2m,
      precipitation = excluded.precipitation,
      wind_speed_10m = excluded.wind_speed_10m,
      surface_pressure = excluded.surface_pressure,
      updated_at = CURRENT_TIMESTAMP
  `);

  const nowIso = new Date().toISOString();
  let count = 0;

  const insertMany = db.transaction((times, temps, precips, winds, pressures) => {
    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      // Only record actual observations for past or present hours
      if (t <= nowIso) {
        insertStmt.run(
          favorite.id,
          t,
          temps[i] !== undefined ? temps[i] : null,
          precips[i] !== undefined ? precips[i] : null,
          winds[i] !== undefined ? winds[i] : null,
          pressures[i] !== undefined ? pressures[i] : null
        );
        count++;
      }
    }
  });

  insertMany(
    data.hourly.time,
    data.hourly.temperature_2m || [],
    data.hourly.precipitation || [],
    data.hourly.wind_speed_10m || [],
    data.hourly.surface_pressure || []
  );

  return count;
}

/**
 * Fetch and upsert model forecasts snapshots for a given favorite
 */
async function syncForecastSnapshots(favorite) {
  const modelsParam = MODELS.join(',');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${favorite.latitude.toFixed(
    4
  )}&longitude=${favorite.longitude.toFixed(
    4
  )}&hourly=temperature_2m,precipitation,wind_speed_10m&models=${modelsParam}&past_days=3&forecast_days=3&timezone=${encodeURIComponent(
    favorite.timezone || 'auto'
  )}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error ${res.status} fetching model forecasts for ${favorite.name}`);
  const data = await res.json();

  if (!data.hourly || !data.hourly.time) return 0;

  const insertSnapshotStmt = db.prepare(`
    INSERT INTO forecast_snapshots (favorite_id, target_time, model_id, lead_hours, temperature_2m, precipitation, wind_speed_10m, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(favorite_id, target_time, model_id, lead_hours) DO UPDATE SET
      temperature_2m = excluded.temperature_2m,
      precipitation = excluded.precipitation,
      wind_speed_10m = excluded.wind_speed_10m
  `);

  let count = 0;

  const insertAllSnapshots = db.transaction(() => {
    const times = data.hourly.time;

    MODELS.forEach((modelId) => {
      const tempKey = `temperature_2m_${modelId}`;
      const precipKey = `precipitation_${modelId}`;
      const windKey = `wind_speed_10m_${modelId}`;

      const temps = data.hourly[tempKey] || [];
      const precips = data.hourly[precipKey] || [];
      const winds = data.hourly[windKey] || [];

      for (let i = 0; i < times.length; i++) {
        const targetTime = times[i];
        const tempVal = temps[i] !== undefined ? temps[i] : null;
        const precipVal = precips[i] !== undefined ? precips[i] : null;
        const windVal = winds[i] !== undefined ? winds[i] : null;

        if (tempVal !== null) {
          // Standard lead time 24h
          insertSnapshotStmt.run(
            favorite.id,
            targetTime,
            modelId,
            24,
            tempVal,
            precipVal,
            windVal
          );
          count++;
        }
      }
    });
  });

  insertAllSnapshots();
  return count;
}

/**
 * Synchronize all favorites in database
 */
async function syncAllFavorites() {
  console.log(`[${new Date().toISOString()}] 🔄 Avvio sincronizzazione telemetria per tutte le località preferite...`);
  const favorites = db.prepare('SELECT * FROM favorites ORDER BY id ASC').all();
  let totalObservations = 0;
  let totalSnapshots = 0;

  for (const fav of favorites) {
    try {
      const obsCount = await syncActualObservations(fav);
      const snapCount = await syncForecastSnapshots(fav);
      totalObservations += obsCount;
      totalSnapshots += snapCount;
      console.log(`  ✓ ${fav.name}: ${obsCount} osservazioni reali, ${snapCount} previsioni archiviate`);
    } catch (err) {
      console.error(`  ✗ Errore sincronizzazione ${fav.name}:`, err.message);
    }
  }

  console.log(`[${new Date().toISOString()}] ✅ Sincronizzazione completata: ${totalObservations} osservazioni, ${totalSnapshots} previsioni.`);
  return { favoritesCount: favorites.length, totalObservations, totalSnapshots };
}

/**
 * Start recurring background scheduler
 */
function startScheduler() {
  // Initial sync immediately upon startup
  setTimeout(() => {
    syncAllFavorites().catch((err) => console.error('Initial sync failed:', err));
  }, 2000);

  // Repeat every 60 minutes
  const INTERVAL_MS = 60 * 60 * 1000;
  setInterval(() => {
    syncAllFavorites().catch((err) => console.error('Scheduled sync failed:', err));
  }, INTERVAL_MS);
}

module.exports = {
  syncAllFavorites,
  syncActualObservations,
  syncForecastSnapshots,
  startScheduler
};
