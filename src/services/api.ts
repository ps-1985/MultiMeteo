import type {
  GeoLocation,
  HourlySpreadData,
  MultiModelForecast,
  WeatherModelId,
  WeatherVariable
} from '../types/weather';
import { WEATHER_MODELS } from '../constants/models';
import { loadCachedForecast, saveCachedForecast } from './storage';

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export async function searchLocations(query: string): Promise<GeoLocation[]> {
  if (!query || query.trim().length < 2) return [];

  const url = `${GEOCODING_BASE_URL}?name=${encodeURIComponent(
    query.trim()
  )}&count=8&language=it&format=json`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      elevation: r.elevation,
      timezone: r.timezone || 'auto',
      country: r.country,
      country_code: r.country_code,
      admin1: r.admin1,
      admin2: r.admin2
    }));
  } catch (error) {
    console.error('Error fetching geocoding results:', error);
    return [];
  }
}

/**
 * Checks whether a given model is compatible with the requested location.
 * Regional models like MeteoSwiss only cover specific coordinate boxes.
 */
function isModelCompatible(modelId: WeatherModelId, lat: number, lon: number): boolean {
  const model = WEATHER_MODELS[modelId];
  if (!model) return false;
  if (!model.isRegional || !model.bounds) return true;

  const { minLat, maxLat, minLon, maxLon } = model.bounds;
  return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}

export async function fetchMultiModelForecast(
  location: GeoLocation,
  requestedModels: WeatherModelId[],
  forecastDays: number = 7
): Promise<MultiModelForecast> {
  // Filter models that are geographically compatible
  const compatibleModels = requestedModels.filter((modelId) =>
    isModelCompatible(modelId, location.latitude, location.longitude)
  );

  const variables: WeatherVariable[] = [
    'temperature_2m',
    'precipitation',
    'wind_speed_10m',
    'wind_gusts_10m',
    'surface_pressure'
  ];

  const safeForecastDays = Math.min(16, Math.max(1, forecastDays));

  const params = new URLSearchParams({
    latitude: location.latitude.toFixed(4),
    longitude: location.longitude.toFixed(4),
    hourly: variables.join(','),
    models: compatibleModels.join(','),
    forecast_days: safeForecastDays.toString(),
    timezone: location.timezone || 'auto'
  });

  const url = `${FORECAST_BASE_URL}?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Open-Meteo API error ${res.status}: ${errorBody}`);
    }

    const data = await res.json();
    const timestamps: string[] = data.hourly?.time || [];
    const hourlyUnits = data.hourly_units || {};

    const units: Record<WeatherVariable, string> = {
      temperature_2m: '°C',
      precipitation: 'mm',
      wind_speed_10m: 'km/h',
      wind_gusts_10m: 'km/h',
      surface_pressure: 'hPa'
    };

    const hourlyResult: Record<WeatherVariable, HourlySpreadData[]> = {
      temperature_2m: [],
      precipitation: [],
      wind_speed_10m: [],
      wind_gusts_10m: [],
      surface_pressure: []
    };

    // Determine actual models present in response
    const presentModels = compatibleModels.filter((modelId) => {
      // Check if at least temperature or another variable is present for this model
      const sampleKey = `temperature_2m_${modelId}`;
      return data.hourly && (data.hourly[sampleKey] !== undefined || (compatibleModels.length === 1 && data.hourly['temperature_2m'] !== undefined));
    });

    variables.forEach((variable) => {
      // Find unit from response or fallback
      const unitKey = presentModels.length > 1 ? `${variable}_${presentModels[0]}` : variable;
      if (hourlyUnits[unitKey]) {
        units[variable] = hourlyUnits[unitKey];
      }

      hourlyResult[variable] = timestamps.map((time, idx) => {
        const modelValues: Record<WeatherModelId, number | null> = {} as any;
        const validValues: number[] = [];

        presentModels.forEach((modelId) => {
          let val: number | null = null;
          // In multi-model query, open-meteo keys it as `${variable}_${modelId}`
          const multiKey = `${variable}_${modelId}`;
          if (data.hourly[multiKey] && data.hourly[multiKey][idx] !== undefined) {
            val = data.hourly[multiKey][idx];
          } else if (presentModels.length === 1 && data.hourly[variable]) {
            val = data.hourly[variable][idx];
          }

          if (val !== null && typeof val === 'number' && !isNaN(val)) {
            // Round to 1 decimal place for clean telemetry
            val = Math.round(val * 10) / 10;
            validValues.push(val);
            modelValues[modelId] = val;
          } else {
            modelValues[modelId] = null;
          }
        });

        let consensus: number | null = null;
        let min: number | null = null;
        let max: number | null = null;
        let spread: number | null = null;
        let stdDev: number | null = null;

        if (validValues.length > 0) {
          const sum = validValues.reduce((a, b) => a + b, 0);
          consensus = Math.round((sum / validValues.length) * 10) / 10;
          min = Math.min(...validValues);
          max = Math.max(...validValues);
          spread = Math.round((max - min) * 10) / 10;

          // Standard deviation
          const variance =
            validValues.reduce((acc, val) => acc + Math.pow(val - consensus!, 2), 0) /
            validValues.length;
          stdDev = Math.round(Math.sqrt(variance) * 10) / 10;
        }

        return {
          time,
          consensus,
          min,
          max,
          spread,
          stdDev,
          modelValues
        };
      });
    });

    const forecast: MultiModelForecast = {
      location,
      lastUpdated: new Date().toISOString(),
      timestamps,
      activeModels: presentModels,
      hourly: hourlyResult,
      units,
      isOfflineCached: false
    };

    // Cache locally for offline usage
    saveCachedForecast(forecast);
    return forecast;
  } catch (err) {
    console.warn('Network request failed, checking offline cache...', err);
    const cached = loadCachedForecast();
    if (cached) {
      return cached;
    }
    throw err;
  }
}
