use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeocodingResult {
    pub geo_id: i64,
    pub name: String,
    pub display_name: String,
    pub latitude: f64,
    pub longitude: f64,
    pub country: String,
    pub admin1: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Location {
    pub id: String,
    pub name: String,
    pub display_name: String,
    pub latitude: f64,
    pub longitude: f64,
    pub is_primary: bool,
    pub sort_order: i32,
    #[serde(default)]
    pub geo_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurrentWeather {
    pub location_id: String,
    pub temperature: f64,
    pub feels_like: f64,
    pub condition_code: i32,
    pub condition_label: String,
    pub wind_speed: f64,
    pub wind_direction: i32,
    pub humidity: i32,
    pub dew_point: f64,
    pub pressure: f64,
    pub pressure_trend: String,
    pub visibility: f64,
    pub uv_index: f64,
    pub sunrise: i64,
    pub sunset: i64,
    pub fetched_at: i64,
    #[serde(default)]
    pub utc_offset_seconds: i32,
    #[serde(default)]
    pub timezone: String,
    #[serde(default)]
    pub timezone_abbreviation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HourlyForecast {
    pub location_id: String,
    pub time: i64,
    pub temperature: f64,
    pub condition_code: i32,
    pub precip_probability: f64,
    pub wind_speed: f64,
    pub wind_direction: i32,
    #[serde(default)]
    pub feels_like: f64,
    #[serde(default)]
    pub humidity: i32,
    #[serde(default)]
    pub precip_amount: f64,
    #[serde(default)]
    pub cloud_cover: i32,
    #[serde(default)]
    pub uv_index: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyForecast {
    pub location_id: String,
    pub date: String,
    pub temp_high: f64,
    pub temp_low: f64,
    pub condition_code: i32,
    pub precip_probability: f64,
    pub wind_speed: f64,
    pub sunrise: i64,
    pub sunset: i64,
    #[serde(default)]
    pub feels_high: f64,
    #[serde(default)]
    pub feels_low: f64,
    #[serde(default)]
    pub precip_amount: f64,
    #[serde(default)]
    pub uv_max: f64,
    #[serde(default)]
    pub wind_gust_max: f64,
    #[serde(default)]
    pub sunshine_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AirQuality {
    pub location_id: String,
    pub european_aqi: i32,
    pub us_aqi: i32,
    pub pm10: f64,
    pub pm2_5: f64,
    pub ozone: f64,
    pub nitrogen_dioxide: f64,
    pub sulphur_dioxide: f64,
    pub carbon_monoxide: f64,
    pub dust: f64,
    pub alder_pollen: f64,
    pub birch_pollen: f64,
    pub grass_pollen: f64,
    pub mugwort_pollen: f64,
    pub olive_pollen: f64,
    pub ragweed_pollen: f64,
    pub dominant_pollutant: String,
    pub hourly: Vec<AirQualityHourly>,
    pub daily_max_aqi: Vec<AirQualityDaily>,
    pub fetched_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AirQualityHourly {
    pub time: i64,
    pub european_aqi: i32,
    pub us_aqi: i32,
    pub pm2_5: f64,
    pub pm10: f64,
    pub ozone: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AirQualityDaily {
    pub date: String,
    pub european_aqi_max: i32,
    pub us_aqi_max: i32,
    pub dominant_pollutant: String,
    pub max_pollen_label: String,
    pub max_pollen_value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeatherAlert {
    pub id: String,
    pub location_id: String,
    pub title: String,
    pub severity: String,
    pub description: String,
    pub issued: i64,
    pub expires: i64,
    pub areas: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub temp_unit: String,
    pub wind_unit: String,
    pub pressure_unit: String,
    pub precip_unit: String,
    pub visibility_unit: String,
    pub time_format: String,
    pub refresh_interval_minutes: i32,
    pub tray_icon_style: String,
    pub notify_extreme: bool,
    pub notify_severe: bool,
    pub notify_moderate: bool,
    pub notify_minor: bool,
    pub animated_background: bool,
    pub animated_icons: bool,
    pub time_of_day_shift: bool,
    pub theme: String,
    #[serde(default = "default_language")]
    pub language: String,
    #[serde(default)]
    pub setup_complete: bool,
}

fn default_language() -> String { "en".into() }

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            temp_unit: "C".into(),
            wind_unit: "kmh".into(),
            pressure_unit: "hpa".into(),
            precip_unit: "mm".into(),
            visibility_unit: "km".into(),
            time_format: "24h".into(),
            refresh_interval_minutes: 15,
            tray_icon_style: "both".into(),
            notify_extreme: true,
            notify_severe: true,
            notify_moderate: false,
            notify_minor: false,
            animated_background: true,
            animated_icons: true,
            time_of_day_shift: true,
            theme: "dark".into(),
            language: "en".into(),
            setup_complete: false,
        }
    }
}
