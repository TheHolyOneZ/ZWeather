import { invoke } from "@tauri-apps/api/core";
import type { CurrentWeather, HourlyForecast, DailyForecast } from "@/types/weather";
import type { Location, GeocodingResult } from "@/types/location";
import type { WeatherAlert } from "@/types/alerts";
import type { AirQuality } from "@/types/airQuality";
import type { AppSettings } from "@/store/settingsStore";

export const api = {
  getLocations: () =>
    invoke<Location[]>("get_locations"),

  addLocation: (lat: number, lon: number, name: string, geoId?: number) =>
    invoke<Location>("add_location", { lat, lon, name, geoId: geoId ?? null }),

  removeLocation: (id: string) =>
    invoke<void>("remove_location", { id }),

  reorderLocations: (ids: string[]) =>
    invoke<void>("reorder_locations", { ids }),

  setPrimaryLocation: (id: string) =>
    invoke<void>("set_primary_location", { id }),

  getCurrentWeather: (locationId: string) =>
    invoke<CurrentWeather>("get_current_weather", { locationId }),

  getHourlyForecast: (locationId: string) =>
    invoke<HourlyForecast[]>("get_hourly_forecast", { locationId }),

  getDailyForecast: (locationId: string) =>
    invoke<DailyForecast[]>("get_daily_forecast", { locationId }),

  getAlerts: (locationId: string) =>
    invoke<WeatherAlert[]>("get_alerts", { locationId }),

  getAirQuality: (locationId: string) =>
    invoke<AirQuality>("get_air_quality", { locationId }),

  refreshLocation: (locationId: string) =>
    invoke<void>("refresh_location", { locationId }),

  searchLocations: (query: string, language?: string) =>
    invoke<GeocodingResult[]>("search_locations", { query, language }),

  refreshLocationNames: (language: string) =>
    invoke<void>("refresh_location_names", { language }),

  getSettings: () =>
    invoke<AppSettings>("get_settings"),

  updateSettings: (settings: AppSettings) =>
    invoke<void>("update_settings", { settings }),
};
