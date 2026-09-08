const express = require('express');
const cors = require('cors');
const db = require('./db');
const { syncAllFavorites, syncActualObservations, syncForecastSnapshots, startScheduler } = require('./worker');

const app = express();
const PORT = process.env.PORT || 8086;

app.use(cors());
app.use(express.json());

// 1. Health check & status
app.get('/api/status', (req, res) => {
  try {
    const favCount = db.prepare('SELECT count(*) as count FROM favorites').get().count;
    const snapCount = db.prepare('SELECT count(*) as count FROM forecast_snapshots').get().count;
    const obsCount = db.prepare('SELECT count(*) as count FROM actual_observations').get().count;

    res.json({
      status: 'online',
      uptime: process.uptime(),
      db: {
        favorites: favCount,
        forecast_snapshots: snapCount,
        actual_observations: obsCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get list of favorites with quick accuracy badge
app.get('/api/favorites', (req, res) => {
  try {
    const favorites = db.prepare('SELECT * FROM favorites ORDER BY id ASC').all();

    // Attach latest stats for each favorite
    const result = favorites.map((fav) => {
      // Find latest actual temp
      const latestObs = db
        .prepare('SELECT * FROM actual_observations WHERE favorite_id = ? ORDER BY time DESC LIMIT 1')
        .get(fav.id);

      // Calculate best model overall for this favorite
      const stats = db
        .prepare(`
          SELECT 
            fs.model_id,
            ROUND(AVG(ABS(fs.temperature_2m - ao.temperature_2m)), 2) as mae_temp,
            COUNT(*) as sample_count
          FROM forecast_snapshots fs
          JOIN actual_observations ao 
            ON fs.favorite_id = ao.favorite_id 
           AND fs.target_time = ao.time
          WHERE fs.favorite_id = ?
            AND fs.temperature_2m IS NOT NULL
            AND ao.temperature_2m IS NOT NULL
          GROUP BY fs.model_id
          HAVING sample_count >= 6
          ORDER BY mae_temp ASC
          LIMIT 1
        `)
        .get(fav.id);

      return {
        ...fav,
        latestObservation: latestObs || null,
        topModel: stats
          ? {
              model_id: stats.model_id,
              mae_temp: stats.mae_temp,
              sample_count: stats.sample_count
            }
          : null
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Add a new favorite
app.post('/api/favorites', async (req, res) => {
  try {
    const { name, latitude, longitude, country, timezone } = req.body;
    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Name, latitude, and longitude are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO favorites (name, latitude, longitude, country, timezone)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(name, latitude, longitude, country || '', timezone || 'auto');
    const newFav = db.prepare('SELECT * FROM favorites WHERE id = ?').get(info.lastInsertRowid);

    // Run initial sync in background
    syncActualObservations(newFav)
      .then(() => syncForecastSnapshots(newFav))
      .catch((err) => console.error('Initial sync on add favorite failed:', err));

    res.status(201).json(newFav);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Questa località è già presente tra i preferiti' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 4. Remove a favorite
app.delete('/api/favorites/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const del = db.prepare('DELETE FROM favorites WHERE id = ?').run(id);
    if (del.changes === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Verification & Accuracy details for a favorite
app.get('/api/verification/:favoriteId', (req, res) => {
  try {
    const favId = parseInt(req.params.favoriteId, 10);
    const favorite = db.prepare('SELECT * FROM favorites WHERE id = ?').get(favId);
    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    const days = Math.min(parseInt(req.query.days || '3', 10), 7);
    const nowIso = new Date().toISOString();
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const includeFuture = req.query.include_future === 'true';

    // 1. Fetch actual observations
    const observations = db
      .prepare(
        'SELECT time, temperature_2m, precipitation, wind_speed_10m, surface_pressure FROM actual_observations WHERE favorite_id = ? AND time >= ? AND time <= ? ORDER BY time ASC'
      )
      .all(favId, cutoffDate, nowIso);

    // Latest verified hour
    const maxVerifiedTime = observations.length > 0 ? observations[observations.length - 1].time : nowIso;

    // 2. Fetch forecast snapshots (if includeFuture is false, strictly limit to verified period)
    const snapshotsQuery = includeFuture
      ? db.prepare(
          'SELECT target_time, model_id, temperature_2m, precipitation, wind_speed_10m FROM forecast_snapshots WHERE favorite_id = ? AND target_time >= ? ORDER BY target_time ASC'
        ).all(favId, cutoffDate)
      : db.prepare(
          'SELECT target_time, model_id, temperature_2m, precipitation, wind_speed_10m FROM forecast_snapshots WHERE favorite_id = ? AND target_time >= ? AND target_time <= ? ORDER BY target_time ASC'
        ).all(favId, cutoffDate, maxVerifiedTime);

    const snapshots = snapshotsQuery;

    // Build timeline map
    const timelineMap = new Map();
    observations.forEach((obs) => {
      timelineMap.set(obs.time, {
        time: obs.time,
        actual: {
          temperature_2m: obs.temperature_2m,
          precipitation: obs.precipitation,
          wind_speed_10m: obs.wind_speed_10m
        },
        models: {}
      });
    });

    snapshots.forEach((snap) => {
      let entry = timelineMap.get(snap.target_time);
      if (!entry) {
        entry = {
          time: snap.target_time,
          actual: null,
          models: {}
        };
        timelineMap.set(snap.target_time, entry);
      }
      entry.models[snap.model_id] = {
        temperature_2m: snap.temperature_2m,
        precipitation: snap.precipitation,
        wind_speed_10m: snap.wind_speed_10m
      };
    });

    const timeline = Array.from(timelineMap.values()).sort((a, b) => a.time.localeCompare(b.time));

    // 3. Compute Accuracy Leaderboard per model
    const statsQuery = db
      .prepare(`
        SELECT 
          fs.model_id,
          ROUND(AVG(ABS(fs.temperature_2m - ao.temperature_2m)), 2) as mae_temp,
          ROUND(AVG(fs.temperature_2m - ao.temperature_2m), 2) as bias_temp,
          ROUND(MAX(ABS(fs.temperature_2m - ao.temperature_2m)), 2) as max_error_temp,
          ROUND(AVG(ABS(fs.precipitation - ao.precipitation)), 2) as mae_precip,
          ROUND(AVG(ABS(fs.wind_speed_10m - ao.wind_speed_10m)), 2) as mae_wind,
          COUNT(*) as sample_count
        FROM forecast_snapshots fs
        JOIN actual_observations ao 
          ON fs.favorite_id = ao.favorite_id 
         AND fs.target_time = ao.time
        WHERE fs.favorite_id = ?
          AND fs.target_time >= ?
          AND fs.temperature_2m IS NOT NULL
          AND ao.temperature_2m IS NOT NULL
        GROUP BY fs.model_id
        ORDER BY mae_temp ASC
      `)
      .all(favId, cutoffDate);

    res.json({
      favorite,
      days,
      timeline,
      leaderboard: statsQuery
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Manual sync trigger
app.post('/api/sync', async (req, res) => {
  try {
    const stats = await syncAllFavorites();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start HTTP server & scheduler
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 MultiMeteo Telemetry Server attivo sulla porta ${PORT}`);
  startScheduler();
});
