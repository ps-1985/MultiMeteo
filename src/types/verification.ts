import type { WeatherModelId } from './weather';

export interface FavoriteItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  timezone?: string;
  created_at: string;
  latestObservation?: {
    time: string;
    temperature_2m: number | null;
    precipitation: number | null;
    wind_speed_10m: number | null;
    surface_pressure: number | null;
  } | null;
  topModel?: {
    model_id: WeatherModelId;
    mae_temp: number;
    sample_count: number;
  } | null;
}

export interface ModelAccuracyStats {
  model_id: WeatherModelId;
  mae_temp: number;
  bias_temp: number;
  max_error_temp: number;
  mae_precip: number;
  mae_wind: number;
  sample_count: number;
}

export interface VerificationTimelinePoint {
  time: string;
  actual: {
    temperature_2m: number | null;
    precipitation: number | null;
    wind_speed_10m: number | null;
  } | null;
  models: Record<string, {
    temperature_2m: number | null;
    precipitation: number | null;
    wind_speed_10m: number | null;
  }>;
}

export interface VerificationResponse {
  favorite: FavoriteItem;
  days: number;
  timeline: VerificationTimelinePoint[];
  leaderboard: ModelAccuracyStats[];
}
