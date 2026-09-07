export type WeatherModelId =
  | 'ecmwf_ifs025'
  | 'icon_seamless'
  | 'gfs_seamless'
  | 'meteofrance_seamless'
  | 'ukmo_seamless'
  | 'jma_seamless'
  | 'gem_seamless'
  | 'meteoswiss_icon_seamless';

export type WeatherVariable =
  | 'temperature_2m'
  | 'precipitation'
  | 'wind_speed_10m'
  | 'wind_gusts_10m'
  | 'surface_pressure';

export interface WeatherModelInfo {
  id: WeatherModelId;
  name: string;
  shortName: string;
  provider: string;
  country: string;
  flag: string;
  color: string;
  resolution: string;
  description: string;
  isRegional?: boolean;
  bounds?: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

export interface GeoLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone: string;
  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
}

export interface ModelValuePoint {
  modelId: WeatherModelId;
  value: number | null;
}

export interface HourlySpreadData {
  time: string;
  consensus: number | null;
  min: number | null;
  max: number | null;
  spread: number | null;
  stdDev: number | null;
  modelValues: Record<WeatherModelId, number | null>;
}

export interface MultiModelForecast {
  location: GeoLocation;
  lastUpdated: string;
  timestamps: string[];
  activeModels: WeatherModelId[];
  hourly: Record<WeatherVariable, HourlySpreadData[]>;
  units: Record<WeatherVariable, string>;
  isOfflineCached?: boolean;
}

export type TimeHorizon = '24h' | '48h' | '72h' | '7d';

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type WindSpeedUnit = 'kmh' | 'ms' | 'knots';
