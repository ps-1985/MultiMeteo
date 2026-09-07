import type { WeatherModelId, WeatherModelInfo, WeatherVariable, GeoLocation } from '../types/weather';

export const WEATHER_MODELS: Record<WeatherModelId, WeatherModelInfo> = {
  ecmwf_ifs025: {
    id: 'ecmwf_ifs025',
    name: 'ECMWF IFS 0.25°',
    shortName: 'ECMWF',
    provider: 'European Centre for Medium-Range Weather Forecasts',
    country: 'Europa',
    flag: '🇪🇺',
    color: '#10b981', // Emerald
    resolution: '~25 km',
    description: 'Gold standard globale. Riferimento per sinottica, fronti e geopotenziali a medio termine.'
  },
  icon_seamless: {
    id: 'icon_seamless',
    name: 'DWD ICON Seamless',
    shortName: 'ICON',
    provider: 'Deutscher Wetterdienst (DWD)',
    country: 'Germania',
    flag: '🇩🇪',
    color: '#3b82f6', // Blue
    resolution: '~7-13 km',
    description: 'Fusione seamless ad alta risoluzione (ICON-EU + Global). Ottima resa orografica e termica.'
  },
  gfs_seamless: {
    id: 'gfs_seamless',
    name: 'NOAA GFS Seamless',
    shortName: 'GFS',
    provider: 'National Oceanic and Atmospheric Administration (NOAA)',
    country: 'USA',
    flag: '🇺🇸',
    color: '#f59e0b', // Amber
    resolution: '~13-22 km',
    description: 'Modello globale statunitense. Aggiornamenti quadridimensionali frequenti ogni 6 ore.'
  },
  meteofrance_seamless: {
    id: 'meteofrance_seamless',
    name: 'Météo-France Seamless',
    shortName: 'M-France',
    provider: 'Météo-France (ARPEGE / AROME)',
    country: 'Francia',
    flag: '🇫🇷',
    color: '#8b5cf6', // Violet
    resolution: '~1.3-10 km',
    description: 'Accuratezza micro-meteorologica e convettiva eccellente, specialmente in Europa occidentale.'
  },
  ukmo_seamless: {
    id: 'ukmo_seamless',
    name: 'UK Met Office Unified',
    shortName: 'UKMO',
    provider: 'UK Meteorological Office',
    country: 'Regno Unito',
    flag: '🇬🇧',
    color: '#ec4899', // Pink
    resolution: '~10-17 km',
    description: 'Modello Unified Model globale. Riconosciuto per la precisione dei minimi barici atlantici.'
  },
  jma_seamless: {
    id: 'jma_seamless',
    name: 'JMA Seamless',
    shortName: 'JMA',
    provider: 'Japan Meteorological Agency',
    country: 'Giappone',
    flag: '🇯🇵',
    color: '#ef4444', // Red
    resolution: '~13-20 km',
    description: 'Modello dell’agenzia meteorologica giapponese per sinottica globale e dinamiche marittime.'
  },
  gem_seamless: {
    id: 'gem_seamless',
    name: 'GEM Seamless (CMC)',
    shortName: 'GEM',
    provider: 'Canadian Meteorological Centre (CMC)',
    country: 'Canada',
    flag: '🇨🇦',
    color: '#06b6d4', // Cyan
    resolution: '~15-25 km',
    description: 'Global Environmental Multiscale model canadese. Specializzato in masse polari e fronti artici.'
  },
  meteoswiss_icon_seamless: {
    id: 'meteoswiss_icon_seamless',
    name: 'MeteoSwiss ICON-CH',
    shortName: 'MeteoSwiss',
    provider: 'Ufficio Federale di Meteorologia e Climatologia Svizzera',
    country: 'Svizzera / Alpi',
    flag: '🇨🇭',
    color: '#f97316', // Orange
    resolution: '~1-2.8 km (Ultra-HD)',
    description: 'Modello ad altissima risoluzione su Alpi e regioni limitrofe (Nord Italia, Francia SE, Svizzera, Austria Ovest).',
    isRegional: true,
    bounds: {
      minLat: 42.5,
      maxLat: 49.5,
      minLon: 4.0,
      maxLon: 14.5
    }
  }
};

export const MODEL_LIST: WeatherModelInfo[] = Object.values(WEATHER_MODELS);

export const DEFAULT_ACTIVE_MODELS: WeatherModelId[] = [
  'ecmwf_ifs025',
  'icon_seamless',
  'gfs_seamless',
  'meteofrance_seamless',
  'ukmo_seamless',
  'jma_seamless',
  'gem_seamless',
  'meteoswiss_icon_seamless'
];

export const WEATHER_VARIABLES: Record<WeatherVariable, {
  id: WeatherVariable;
  label: string;
  unit: string;
  iconName: string;
  description: string;
  divergenceThresholds: { moderate: number; high: number };
}> = {
  temperature_2m: {
    id: 'temperature_2m',
    label: 'Temperatura a 2m',
    unit: '°C',
    iconName: 'Thermometer',
    description: 'Temperatura dell’aria a 2 metri dal suolo',
    divergenceThresholds: { moderate: 1.5, high: 3.5 }
  },
  precipitation: {
    id: 'precipitation',
    label: 'Precipitazioni',
    unit: 'mm',
    iconName: 'CloudRain',
    description: 'Precipitazioni totali cumulate all’ora (pioggia + neve equivalente)',
    divergenceThresholds: { moderate: 1.0, high: 4.0 }
  },
  wind_speed_10m: {
    id: 'wind_speed_10m',
    label: 'Velocità Vento (10m)',
    unit: 'km/h',
    iconName: 'Wind',
    description: 'Velocità media del vento sostenuto a 10 metri dal suolo',
    divergenceThresholds: { moderate: 8, high: 18 }
  },
  wind_gusts_10m: {
    id: 'wind_gusts_10m',
    label: 'Raffiche Vento',
    unit: 'km/h',
    iconName: 'Zap',
    description: 'Massima raffica oraria prevista al suolo',
    divergenceThresholds: { moderate: 12, high: 25 }
  },
  surface_pressure: {
    id: 'surface_pressure',
    label: 'Pressione al Suolo',
    unit: 'hPa',
    iconName: 'Gauge',
    description: 'Pressione atmosferica locale al suolo (non ridotta al livello del mare)',
    divergenceThresholds: { moderate: 2.0, high: 5.0 }
  }
};

export const DEFAULT_LOCATION: GeoLocation = {
  id: 3173435,
  name: 'Milano',
  latitude: 45.46427,
  longitude: 9.18951,
  timezone: 'Europe/Rome',
  country: 'Italia',
  country_code: 'IT',
  admin1: 'Lombardia',
  elevation: 122
};

export const PRESET_LOCATIONS: GeoLocation[] = [
  { id: 3173435, name: 'Milano', latitude: 45.46427, longitude: 9.18951, timezone: 'Europe/Rome', country: 'Italia', country_code: 'IT', admin1: 'Lombardia' },
  { id: 3169070, name: 'Roma', latitude: 41.89193, longitude: 12.51133, timezone: 'Europe/Rome', country: 'Italia', country_code: 'IT', admin1: 'Lazio' },
  { id: 3176959, name: 'Firenze', latitude: 43.76667, longitude: 11.25, timezone: 'Europe/Rome', country: 'Italia', country_code: 'IT', admin1: 'Toscana' },
  { id: 3165524, name: 'Torino', latitude: 45.07049, longitude: 7.68682, timezone: 'Europe/Rome', country: 'Italia', country_code: 'IT', admin1: 'Piemonte' },
  { id: 2657896, name: 'Zurigo', latitude: 47.36667, longitude: 8.55, timezone: 'Europe/Zurich', country: 'Svizzera', country_code: 'CH', admin1: 'Zurigo' },
  { id: 2988507, name: 'Parigi', latitude: 48.85341, longitude: 2.3488, timezone: 'Europe/Paris', country: 'Francia', country_code: 'FR', admin1: 'Île-de-France' },
  { id: 2643743, name: 'Londra', latitude: 51.50853, longitude: -0.12574, timezone: 'Europe/London', country: 'Regno Unito', country_code: 'GB', admin1: 'Inghilterra' },
  { id: 5128581, name: 'New York', latitude: 40.71427, longitude: -74.00597, timezone: 'America/New_York', country: 'USA', country_code: 'US', admin1: 'New York' },
  { id: 1850147, name: 'Tokyo', latitude: 35.6895, longitude: 139.69171, timezone: 'Asia/Tokyo', country: 'Giappone', country_code: 'JP', admin1: 'Tokyo' }
];
