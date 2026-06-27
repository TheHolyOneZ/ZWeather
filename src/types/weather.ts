export interface CurrentWeather {
  location_id: string;
  temperature: number;
  feels_like: number;
  condition_code: number;
  condition_label: string;
  wind_speed: number;
  wind_direction: number;
  humidity: number;
  dew_point: number;
  pressure: number;
  pressure_trend: "rising" | "falling" | "steady";
  visibility: number;
  uv_index: number;
  sunrise: number;
  sunset: number;
  fetched_at: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
}

export interface HourlyForecast {
  location_id: string;
  time: number;
  temperature: number;
  condition_code: number;
  precip_probability: number;
  wind_speed: number;
  wind_direction: number;
  feels_like: number;
  humidity: number;
  precip_amount: number;
  cloud_cover: number;
  uv_index: number;
}

export interface DailyForecast {
  location_id: string;
  date: string;
  temp_high: number;
  temp_low: number;
  condition_code: number;
  precip_probability: number;
  wind_speed: number;
  sunrise: number;
  sunset: number;
  feels_high: number;
  feels_low: number;
  precip_amount: number;
  uv_max: number;
  wind_gust_max: number;
  sunshine_seconds: number;
}

export type ConditionGroup =
  | "clear-day"
  | "clear-night"
  | "cloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm";

export function wmoToConditionGroup(code: number, isDay = true): ConditionGroup {
  if (code === 0) return isDay ? "clear-day" : "clear-night";
  if (code <= 2) return isDay ? "clear-day" : "clear-night";
  if (code === 3) return "overcast";
  if (code <= 48) return "fog";
  if (code <= 55) return "drizzle";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "rain";
  if (code <= 86) return "snow";
  return "thunderstorm";
}
