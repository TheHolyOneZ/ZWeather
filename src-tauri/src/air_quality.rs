use crate::error::Result;
use crate::models::{AirQuality, AirQualityDaily, AirQualityHourly};

pub struct AirQualityFetcher {
    client: reqwest::Client,
}

impl AirQualityFetcher {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .user_agent("ZWeather/0.1.0 (https://github.com/TheHolyOneZ/ZWeather)")
            .build()
            .expect("failed to build HTTP client");
        Self { client }
    }

    pub async fn fetch(
        &self,
        lat: f64,
        lon: f64,
        location_id: &str,
    ) -> Result<AirQuality> {
        let url = format!(
            "https://air-quality-api.open-meteo.com/v1/air-quality?\
             latitude={lat}&longitude={lon}\
             &current=european_aqi,us_aqi,pm10,pm2_5,ozone,nitrogen_dioxide,\
             sulphur_dioxide,carbon_monoxide,dust,alder_pollen,birch_pollen,\
             grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen\
             &hourly=european_aqi,us_aqi,pm2_5,pm10,ozone\
             &timezone=auto\
             &forecast_days=5"
        );

        let resp: serde_json::Value = self.client.get(&url).send().await?.json().await?;

        let utc_offset = resp["utc_offset_seconds"].as_i64().unwrap_or(0);
        let c = &resp["current"];

        let european_aqi = c["european_aqi"].as_f64().unwrap_or(0.0).round() as i32;
        let us_aqi = c["us_aqi"].as_f64().unwrap_or(0.0).round() as i32;
        let pm10 = c["pm10"].as_f64().unwrap_or(0.0);
        let pm2_5 = c["pm2_5"].as_f64().unwrap_or(0.0);
        let ozone = c["ozone"].as_f64().unwrap_or(0.0);
        let nitrogen_dioxide = c["nitrogen_dioxide"].as_f64().unwrap_or(0.0);
        let sulphur_dioxide = c["sulphur_dioxide"].as_f64().unwrap_or(0.0);
        let carbon_monoxide = c["carbon_monoxide"].as_f64().unwrap_or(0.0);
        let dust = c["dust"].as_f64().unwrap_or(0.0);

        let dominant = dominant_pollutant(pm2_5, pm10, ozone, nitrogen_dioxide, sulphur_dioxide);

        let hourly = parse_hourly(&resp["hourly"], utc_offset);
        let daily_max_aqi = aggregate_daily(&hourly, &resp["hourly"]);

        Ok(AirQuality {
            location_id: location_id.to_string(),
            european_aqi,
            us_aqi,
            pm10,
            pm2_5,
            ozone,
            nitrogen_dioxide,
            sulphur_dioxide,
            carbon_monoxide,
            dust,
            alder_pollen: c["alder_pollen"].as_f64().unwrap_or(0.0),
            birch_pollen: c["birch_pollen"].as_f64().unwrap_or(0.0),
            grass_pollen: c["grass_pollen"].as_f64().unwrap_or(0.0),
            mugwort_pollen: c["mugwort_pollen"].as_f64().unwrap_or(0.0),
            olive_pollen: c["olive_pollen"].as_f64().unwrap_or(0.0),
            ragweed_pollen: c["ragweed_pollen"].as_f64().unwrap_or(0.0),
            dominant_pollutant: dominant,
            hourly,
            daily_max_aqi,
            fetched_at: chrono::Utc::now().timestamp(),
        })
    }
}

fn parse_hourly(h: &serde_json::Value, utc_offset: i64) -> Vec<AirQualityHourly> {
    let times = match h["time"].as_array() {
        Some(t) => t,
        None => return vec![],
    };
    let mut out = Vec::with_capacity(times.len());
    for (i, t) in times.iter().enumerate() {
        out.push(AirQualityHourly {
            time: parse_local_iso(t.as_str().unwrap_or(""), utc_offset),
            european_aqi: h["european_aqi"][i].as_f64().unwrap_or(0.0).round() as i32,
            us_aqi: h["us_aqi"][i].as_f64().unwrap_or(0.0).round() as i32,
            pm2_5: h["pm2_5"][i].as_f64().unwrap_or(0.0),
            pm10: h["pm10"][i].as_f64().unwrap_or(0.0),
            ozone: h["ozone"][i].as_f64().unwrap_or(0.0),
        });
    }
    out
}

fn aggregate_daily(hourly: &[AirQualityHourly], h_raw: &serde_json::Value) -> Vec<AirQualityDaily> {
    use std::collections::BTreeMap;
    let mut groups: BTreeMap<String, Vec<(usize, &AirQualityHourly)>> = BTreeMap::new();

    let times = match h_raw["time"].as_array() {
        Some(t) => t,
        None => return vec![],
    };

    for (i, hr) in hourly.iter().enumerate() {
        let date = times
            .get(i)
            .and_then(|v| v.as_str())
            .and_then(|s| s.split('T').next())
            .unwrap_or("")
            .to_string();
        if date.is_empty() {
            continue;
        }
        groups.entry(date).or_insert_with(Vec::new).push((i, hr));
    }

    groups
        .into_iter()
        .map(|(date, items)| {
            let eu_max = items
                .iter()
                .map(|(_, h)| h.european_aqi)
                .max()
                .unwrap_or(0);
            let us_max = items
                .iter()
                .map(|(_, h)| h.us_aqi)
                .max()
                .unwrap_or(0);

            let mut sum_pm25 = 0.0;
            let mut sum_pm10 = 0.0;
            let mut sum_o3 = 0.0;
            for (_, h) in &items {
                sum_pm25 += h.pm2_5;
                sum_pm10 += h.pm10;
                sum_o3 += h.ozone;
            }
            let dominant = if sum_pm25 >= sum_pm10 && sum_pm25 >= sum_o3 / 4.0 {
                "pm25"
            } else if sum_pm10 >= sum_o3 / 4.0 {
                "pm10"
            } else {
                "ozone"
            };

            AirQualityDaily {
                date,
                european_aqi_max: eu_max,
                us_aqi_max: us_max,
                dominant_pollutant: dominant.to_string(),
                max_pollen_label: String::new(),
                max_pollen_value: 0.0,
            }
        })
        .collect()
}


fn dominant_pollutant(pm25: f64, pm10: f64, o3: f64, no2: f64, so2: f64) -> String {
    let pm25_n = pm25 / 25.0;
    let pm10_n = pm10 / 50.0;
    let o3_n = o3 / 120.0;
    let no2_n = no2 / 40.0;
    let so2_n = so2 / 350.0;

    let mut best = ("pm25", pm25_n);
    for (name, val) in [("pm10", pm10_n), ("ozone", o3_n), ("no2", no2_n), ("so2", so2_n)] {
        if val > best.1 {
            best = (name, val);
        }
    }
    best.0.to_string()
}

fn parse_local_iso(s: &str, utc_offset_seconds: i64) -> i64 {
    chrono::NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M")
        .map(|dt| dt.and_utc().timestamp() - utc_offset_seconds)
        .unwrap_or(0)
}
