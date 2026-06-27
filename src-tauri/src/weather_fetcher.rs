use crate::models::{CurrentWeather, HourlyForecast, DailyForecast};
use crate::error::Result;

pub struct WeatherFetcher {
    client: reqwest::Client,
}

impl WeatherFetcher {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .user_agent("ZWeather/0.1.0 (https://github.com/TheHolyOneZ/ZWeather)")
            .build()
            .expect("failed to build HTTP client");
        Self { client }
    }

    pub async fn fetch_current(
        &self,
        lat: f64,
        lon: f64,
        location_id: &str,
    ) -> Result<CurrentWeather> {
        let url = format!(
            "https://api.open-meteo.com/v1/forecast?\
             latitude={lat}&longitude={lon}\
             &current=temperature_2m,apparent_temperature,weather_code,\
             wind_speed_10m,wind_direction_10m,relative_humidity_2m,\
             dew_point_2m,surface_pressure,visibility,uv_index\
             &hourly=surface_pressure\
             &past_hours=3&forecast_hours=1\
             &daily=sunrise,sunset\
             &timezone=auto\
             &forecast_days=1"
        );

        let resp: serde_json::Value = self.client.get(&url).send().await?.json().await?;

        let utc_offset = resp["utc_offset_seconds"].as_i64().unwrap_or(0);
        let timezone = resp["timezone"].as_str().unwrap_or("UTC").to_string();
        let timezone_abbr = resp["timezone_abbreviation"].as_str().unwrap_or("UTC").to_string();
        let c = &resp["current"];
        let d = &resp["daily"];


        let pressure_now = c["surface_pressure"].as_f64().unwrap_or(0.0);
        let hourly_pressures = resp["hourly"]["surface_pressure"]
            .as_array()
            .cloned()
            .unwrap_or_default();
        let pressure_past = hourly_pressures
            .first()
            .and_then(|v| v.as_f64())
            .unwrap_or(pressure_now);
        let delta = pressure_now - pressure_past;
        let trend = if delta > 0.6 {
            "rising"
        } else if delta < -0.6 {
            "falling"
        } else {
            "steady"
        };

        Ok(CurrentWeather {
            location_id: location_id.to_string(),
            temperature: c["temperature_2m"].as_f64().unwrap_or(0.0),
            feels_like: c["apparent_temperature"].as_f64().unwrap_or(0.0),
            condition_code: c["weather_code"].as_i64().unwrap_or(0) as i32,
            condition_label: wmo_code_label(c["weather_code"].as_i64().unwrap_or(0) as i32),
            wind_speed: c["wind_speed_10m"].as_f64().unwrap_or(0.0),
            wind_direction: c["wind_direction_10m"].as_i64().unwrap_or(0) as i32,
            humidity: c["relative_humidity_2m"].as_i64().unwrap_or(0) as i32,
            dew_point: c["dew_point_2m"].as_f64().unwrap_or(0.0),
            pressure: pressure_now,
            pressure_trend: trend.into(),
            visibility: c["visibility"].as_f64().unwrap_or(0.0),
            uv_index: c["uv_index"].as_f64().unwrap_or(0.0),
            sunrise: parse_local_iso(d["sunrise"][0].as_str().unwrap_or(""), utc_offset),
            sunset: parse_local_iso(d["sunset"][0].as_str().unwrap_or(""), utc_offset),
            fetched_at: chrono::Utc::now().timestamp(),
            utc_offset_seconds: utc_offset as i32,
            timezone,
            timezone_abbreviation: timezone_abbr,
        })
    }

    pub async fn fetch_hourly(
        &self,
        lat: f64,
        lon: f64,
        location_id: &str,
    ) -> Result<Vec<HourlyForecast>> {
        let url = format!(
            "https://api.open-meteo.com/v1/forecast?\
             latitude={lat}&longitude={lon}\
             &hourly=temperature_2m,apparent_temperature,weather_code,\
             precipitation_probability,precipitation,relative_humidity_2m,\
             cloud_cover,uv_index,wind_speed_10m,wind_direction_10m\
             &timezone=auto\
             &forecast_days=10"
        );

        let resp: serde_json::Value = self.client.get(&url).send().await?.json().await?;
        let utc_offset = resp["utc_offset_seconds"].as_i64().unwrap_or(0);
        let h = &resp["hourly"];

        let times = h["time"].as_array().cloned().unwrap_or_default();
        let mut forecasts = Vec::with_capacity(times.len());

        for (i, t) in times.iter().enumerate() {
            forecasts.push(HourlyForecast {
                location_id: location_id.to_string(),
                time: parse_local_iso(t.as_str().unwrap_or(""), utc_offset),
                temperature: h["temperature_2m"][i].as_f64().unwrap_or(0.0),
                condition_code: h["weather_code"][i].as_i64().unwrap_or(0) as i32,
                precip_probability: h["precipitation_probability"][i].as_f64().unwrap_or(0.0),
                wind_speed: h["wind_speed_10m"][i].as_f64().unwrap_or(0.0),
                wind_direction: h["wind_direction_10m"][i].as_i64().unwrap_or(0) as i32,
                feels_like: h["apparent_temperature"][i].as_f64().unwrap_or(0.0),
                humidity: h["relative_humidity_2m"][i].as_i64().unwrap_or(0) as i32,
                precip_amount: h["precipitation"][i].as_f64().unwrap_or(0.0),
                cloud_cover: h["cloud_cover"][i].as_i64().unwrap_or(0) as i32,
                uv_index: h["uv_index"][i].as_f64().unwrap_or(0.0),
            });
        }

        Ok(forecasts)
    }

    pub async fn fetch_daily(
        &self,
        lat: f64,
        lon: f64,
        location_id: &str,
    ) -> Result<Vec<DailyForecast>> {
        let url = format!(
            "https://api.open-meteo.com/v1/forecast?\
             latitude={lat}&longitude={lon}\
             &daily=temperature_2m_max,temperature_2m_min,\
             apparent_temperature_max,apparent_temperature_min,\
             weather_code,precipitation_probability_max,precipitation_sum,\
             uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,\
             sunshine_duration,sunrise,sunset\
             &timezone=auto\
             &forecast_days=10"
        );

        let resp: serde_json::Value = self.client.get(&url).send().await?.json().await?;
        let utc_offset = resp["utc_offset_seconds"].as_i64().unwrap_or(0);
        let d = &resp["daily"];

        let dates = d["time"].as_array().cloned().unwrap_or_default();
        let mut forecasts = Vec::with_capacity(10);

        for (i, date) in dates.iter().enumerate() {
            forecasts.push(DailyForecast {
                location_id: location_id.to_string(),
                date: date.as_str().unwrap_or("").to_string(),
                temp_high: d["temperature_2m_max"][i].as_f64().unwrap_or(0.0),
                temp_low: d["temperature_2m_min"][i].as_f64().unwrap_or(0.0),
                condition_code: d["weather_code"][i].as_i64().unwrap_or(0) as i32,
                precip_probability: d["precipitation_probability_max"][i].as_f64().unwrap_or(0.0),
                wind_speed: d["wind_speed_10m_max"][i].as_f64().unwrap_or(0.0),
                sunrise: parse_local_iso(d["sunrise"][i].as_str().unwrap_or(""), utc_offset),
                sunset: parse_local_iso(d["sunset"][i].as_str().unwrap_or(""), utc_offset),
                feels_high: d["apparent_temperature_max"][i].as_f64().unwrap_or(0.0),
                feels_low: d["apparent_temperature_min"][i].as_f64().unwrap_or(0.0),
                precip_amount: d["precipitation_sum"][i].as_f64().unwrap_or(0.0),
                uv_max: d["uv_index_max"][i].as_f64().unwrap_or(0.0),
                wind_gust_max: d["wind_gusts_10m_max"][i].as_f64().unwrap_or(0.0),
                sunshine_seconds: d["sunshine_duration"][i].as_f64().unwrap_or(0.0) as i64,
            });
        }

        Ok(forecasts)
    }
}

fn parse_local_iso(s: &str, utc_offset_seconds: i64) -> i64 {
    chrono::NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M")
        .map(|dt| dt.and_utc().timestamp() - utc_offset_seconds)
        .unwrap_or(0)
}

fn wmo_code_label(code: i32) -> String {
    match code {
        0 => "Clear Sky",
        1 => "Mostly Clear",
        2 => "Partly Cloudy",
        3 => "Overcast",
        45 | 48 => "Fog",
        51 | 53 | 55 => "Drizzle",
        61 | 63 | 65 => "Rain",
        71 | 73 | 75 => "Snow",
        80 | 81 | 82 => "Showers",
        95 => "Thunderstorm",
        96 | 99 => "Thunderstorm with Hail",
        _ => "Unknown",
    }
    .to_string()
}
