

use std::time::Duration;
use serde_json::json;
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::sleep;

use crate::air_quality::AirQualityFetcher;
use crate::alerts::AlertFetcher;
use crate::db::Database;
use crate::weather_fetcher::WeatherFetcher;


const MIN_INTERVAL_MINUTES: u64 = 5;


const LOCATION_SPACING_MS: u64 = 600;

pub async fn run(app: AppHandle) {
    let weather = WeatherFetcher::new();
    let air = AirQualityFetcher::new();
    let alerts = AlertFetcher::new();

    loop {

        let interval = read_interval_minutes(&app).max(MIN_INTERVAL_MINUTES);
        sleep(Duration::from_secs(interval * 60)).await;

        let locations = read_locations(&app);
        let mut any_refreshed = false;
        for (id, lat, lon) in locations {
            if let Ok(cw) = weather.fetch_current(lat, lon, &id).await {
                let _ = cache_put(&app, &id, "current", &cw);
                any_refreshed = true;
            }
            if let Ok(aq) = air.fetch(lat, lon, &id).await {
                let _ = cache_put(&app, &id, "air_quality", &aq);
            }
            if let Ok(al) = alerts.fetch_alerts(lat, lon, &id).await {
                let _ = cache_put(&app, &id, "alerts", &al);
            }
            sleep(Duration::from_millis(LOCATION_SPACING_MS)).await;
        }

        if any_refreshed {
            let _ = app.emit(
                "zw://weather-refreshed",
                json!({ "at": chrono::Utc::now().timestamp() }),
            );
        }
    }
}

fn read_interval_minutes(app: &AppHandle) -> u64 {
    let Some(db) = app.try_state::<Database>() else { return 15 };
    let conn = db.conn();
    conn.query_row(
        "SELECT value FROM settings WHERE key = 'refresh_interval_minutes'",
        [],
        |r| r.get::<_, String>(0),
    )
    .ok()
    .and_then(|v| v.parse().ok())
    .unwrap_or(15)
}

fn read_locations(app: &AppHandle) -> Vec<(String, f64, f64)> {
    let Some(db) = app.try_state::<Database>() else { return vec![] };
    let conn = db.conn();
    let Ok(mut stmt) = conn.prepare(
        "SELECT id, latitude, longitude FROM locations ORDER BY sort_order ASC",
    ) else {
        return vec![];
    };
    let rows = stmt.query_map([], |r| {
        Ok((r.get::<_, String>(0)?, r.get::<_, f64>(1)?, r.get::<_, f64>(2)?))
    });
    match rows {
        Ok(iter) => iter.filter_map(|r| r.ok()).collect(),
        Err(_) => vec![],
    }
}

fn cache_put<T: serde::Serialize>(
    app: &AppHandle,
    location_id: &str,
    cache_type: &str,
    payload: &T,
) -> Result<(), ()> {
    let json = serde_json::to_string(payload).map_err(|_| ())?;
    let db = app.try_state::<Database>().ok_or(())?;
    let conn = db.conn();
    conn.execute(
        "INSERT INTO weather_cache (location_id, cache_type, data, fetched_at)
         VALUES (?1, ?2, ?3, unixepoch())
         ON CONFLICT(location_id, cache_type) DO UPDATE SET
           data = excluded.data,
           fetched_at = excluded.fetched_at",
        rusqlite::params![location_id, cache_type, json],
    )
    .map_err(|_| ())?;
    Ok(())
}
