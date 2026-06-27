export interface AirQualityHourly {
  time: number;
  european_aqi: number;
  us_aqi: number;
  pm2_5: number;
  pm10: number;
  ozone: number;
}

export interface AirQualityDaily {
  date: string;
  european_aqi_max: number;
  us_aqi_max: number;
  dominant_pollutant: string;
  max_pollen_label: string;
  max_pollen_value: number;
}

export interface AirQuality {
  location_id: string;
  european_aqi: number;
  us_aqi: number;
  pm10: number;
  pm2_5: number;
  ozone: number;
  nitrogen_dioxide: number;
  sulphur_dioxide: number;
  carbon_monoxide: number;
  dust: number;
  alder_pollen: number;
  birch_pollen: number;
  grass_pollen: number;
  mugwort_pollen: number;
  olive_pollen: number;
  ragweed_pollen: number;
  dominant_pollutant: string;
  hourly: AirQualityHourly[];
  daily_max_aqi: AirQualityDaily[];
  fetched_at: number;
}

export type AqiBand = "good" | "fair" | "moderate" | "poor" | "veryPoor" | "extreme";

export function europeanAqiBand(value: number): AqiBand {
  if (value <= 20) return "good";
  if (value <= 40) return "fair";
  if (value <= 60) return "moderate";
  if (value <= 80) return "poor";
  if (value <= 100) return "veryPoor";
  return "extreme";
}

export function usAqiBand(value: number): AqiBand {
  if (value <= 50) return "good";
  if (value <= 100) return "fair";
  if (value <= 150) return "moderate";
  if (value <= 200) return "poor";
  if (value <= 300) return "veryPoor";
  return "extreme";
}

export const AQI_BAND_COLOR: Record<AqiBand, string> = {
  good: "#84cc16",
  fair: "#facc15",
  moderate: "#fb923c",
  poor: "#ef4444",
  veryPoor: "#a855f7",
  extreme: "#7e22ce",
};
