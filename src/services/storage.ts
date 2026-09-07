import type { GeoLocation, MultiModelForecast, WeatherModelId, TimeHorizon, TemperatureUnit, WindSpeedUnit } from '../types/weather';
import { DEFAULT_ACTIVE_MODELS, DEFAULT_LOCATION } from '../constants/models';

const STORAGE_KEYS = {
  LOCATION: 'multimeteo_last_location',
  FAVORITES: 'multimeteo_favorites',
  ACTIVE_MODELS: 'multimeteo_active_models',
  TIME_HORIZON: 'multimeteo_time_horizon',
  TEMP_UNIT: 'multimeteo_temp_unit',
  WIND_UNIT: 'multimeteo_wind_unit',
  CACHED_FORECAST: 'multimeteo_cached_forecast'
};

export const loadStoredLocation = (): GeoLocation => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCATION);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored location', e);
  }
  return DEFAULT_LOCATION;
};

export const saveStoredLocation = (location: GeoLocation): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(location));
  } catch (e) {
    console.warn('Error saving location to localStorage', e);
  }
};

export const loadActiveModels = (): WeatherModelId[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_MODELS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading active models', e);
  }
  return DEFAULT_ACTIVE_MODELS;
};

export const saveActiveModels = (models: WeatherModelId[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_MODELS, JSON.stringify(models));
  } catch (e) {
    console.warn('Error saving active models', e);
  }
};

export const loadTimeHorizon = (): TimeHorizon => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIME_HORIZON) as TimeHorizon;
    if (['24h', '48h', '72h', '7d'].includes(raw)) return raw;
  } catch (e) {
    console.warn('Error reading time horizon', e);
  }
  return '72h';
};

export const saveTimeHorizon = (horizon: TimeHorizon): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TIME_HORIZON, horizon);
  } catch (e) {
    console.warn('Error saving time horizon', e);
  }
};

export const loadCachedForecast = (): MultiModelForecast | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHED_FORECAST);
    if (raw) {
      const data = JSON.parse(raw) as MultiModelForecast;
      data.isOfflineCached = true;
      return data;
    }
  } catch (e) {
    console.warn('Error reading cached forecast', e);
  }
  return null;
};

export const saveCachedForecast = (forecast: MultiModelForecast): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CACHED_FORECAST, JSON.stringify(forecast));
  } catch (e) {
    console.warn('Error saving cached forecast', e);
  }
};

export const loadFavorites = (): GeoLocation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading favorites', e);
  }
  return [];
};

export const saveFavorites = (favorites: GeoLocation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  } catch (e) {
    console.warn('Error saving favorites', e);
  }
};

export const loadUnits = (): { temp: TemperatureUnit; wind: WindSpeedUnit } => {
  try {
    const temp = (localStorage.getItem(STORAGE_KEYS.TEMP_UNIT) as TemperatureUnit) || 'celsius';
    const wind = (localStorage.getItem(STORAGE_KEYS.WIND_UNIT) as WindSpeedUnit) || 'kmh';
    return { temp, wind };
  } catch (e) {
    return { temp: 'celsius', wind: 'kmh' };
  }
};

export const saveUnits = (temp: TemperatureUnit, wind: WindSpeedUnit): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMP_UNIT, temp);
    localStorage.setItem(STORAGE_KEYS.WIND_UNIT, wind);
  } catch (e) {
    console.warn('Error saving units', e);
  }
};
