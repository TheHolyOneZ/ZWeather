use tauri::{AppHandle, State};
use uuid::Uuid;
use crate::db::Database;
use crate::error::Result;
use crate::models::*;
use crate::weather_fetcher::WeatherFetcher;
use crate::alerts::AlertFetcher;
use crate::air_quality::AirQualityFetcher;

#[tauri::command]
pub async fn get_locations(db: State<'_, Database>) -> Result<Vec<Location>> {
    let conn = db.conn();
    let mut stmt = conn.prepare(
        "SELECT id, name, display_name, latitude, longitude, is_primary, sort_order, geo_id
         FROM locations ORDER BY sort_order ASC"
    )?;
    let locations = stmt.query_map([], |row| {
        Ok(Location {
            id: row.get(0)?,
            name: row.get(1)?,
            display_name: row.get(2)?,
            latitude: row.get(3)?,
            longitude: row.get(4)?,
            is_primary: row.get::<_, i32>(5)? != 0,
            sort_order: row.get(6)?,
            geo_id: row.get(7).ok(),
        })
    })?
    .filter_map(|r| r.ok())
    .collect();
    Ok(locations)
}

#[tauri::command]
pub async fn add_location(
    db: State<'_, Database>,
    lat: f64,
    lon: f64,
    name: String,
    geo_id: Option<i64>,
) -> Result<Location> {
    let id = Uuid::new_v4().to_string();
    let conn = db.conn();

    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM locations", [], |r| r.get(0)
    ).unwrap_or(0);

    let is_primary = count == 0;

    conn.execute(
        "INSERT INTO locations (id, name, display_name, latitude, longitude, is_primary, sort_order, geo_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![id, name, name, lat, lon, is_primary as i32, count, geo_id],
    )?;

    Ok(Location {
        id,
        name: name.clone(),
        display_name: name,
        latitude: lat,
        longitude: lon,
        is_primary,
        sort_order: count,
        geo_id,
    })
}

#[tauri::command]
pub async fn remove_location(db: State<'_, Database>, id: String) -> Result<()> {
    db.conn().execute("DELETE FROM locations WHERE id = ?1", [&id])?;
    Ok(())
}

#[tauri::command]
pub async fn set_primary_location(db: State<'_, Database>, id: String) -> Result<()> {
    let conn = db.conn();
    conn.execute("UPDATE locations SET is_primary = 0", [])?;
    conn.execute(
        "UPDATE locations SET is_primary = 1 WHERE id = ?1",
        [&id],
    )?;
    Ok(())
}

#[tauri::command]
pub async fn reorder_locations(db: State<'_, Database>, ids: Vec<String>) -> Result<()> {
    let conn = db.conn();
    for (i, id) in ids.iter().enumerate() {
        conn.execute(
            "UPDATE locations SET sort_order = ?1 WHERE id = ?2",
            rusqlite::params![i as i32, id],
        )?;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_current_weather(
    db: State<'_, Database>,
    location_id: String,
) -> Result<CurrentWeather> {
    let (lat, lon) = get_location_coords(&db, &location_id)?;
    let fetcher = WeatherFetcher::new();
    fetcher.fetch_current(lat, lon, &location_id).await
}

#[tauri::command]
pub async fn get_hourly_forecast(
    db: State<'_, Database>,
    location_id: String,
) -> Result<Vec<HourlyForecast>> {
    let (lat, lon) = get_location_coords(&db, &location_id)?;
    let fetcher = WeatherFetcher::new();
    fetcher.fetch_hourly(lat, lon, &location_id).await
}

#[tauri::command]
pub async fn get_daily_forecast(
    db: State<'_, Database>,
    location_id: String,
) -> Result<Vec<DailyForecast>> {
    let (lat, lon) = get_location_coords(&db, &location_id)?;
    let fetcher = WeatherFetcher::new();
    fetcher.fetch_daily(lat, lon, &location_id).await
}

#[tauri::command]
pub async fn get_alerts(
    db: State<'_, Database>,
    location_id: String,
) -> Result<Vec<WeatherAlert>> {
    let (lat, lon) = get_location_coords(&db, &location_id)?;
    let fetcher = AlertFetcher::new();
    fetcher.fetch_alerts(lat, lon, &location_id).await
}

#[tauri::command]
pub async fn get_air_quality(
    db: State<'_, Database>,
    location_id: String,
) -> Result<AirQuality> {
    let (lat, lon) = get_location_coords(&db, &location_id)?;
    let fetcher = AirQualityFetcher::new();
    fetcher.fetch(lat, lon, &location_id).await
}

#[tauri::command]
pub async fn refresh_location(
    db: State<'_, Database>,
    location_id: String,
) -> Result<()> {
    let _coords = get_location_coords(&db, &location_id)?;
    Ok(())
}

#[tauri::command]
pub async fn get_settings(db: State<'_, Database>) -> Result<AppSettings> {
    let conn = db.conn();
    let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
    let pairs: Vec<(String, String)> = stmt
        .query_map([], |r| Ok((r.get(0)?, r.get(1)?)))?
        .filter_map(|r| r.ok())
        .collect();

    let mut settings = AppSettings::default();
    for (key, value) in pairs {
        match key.as_str() {
            "temp_unit"        => settings.temp_unit = value,
            "wind_unit"        => settings.wind_unit = value,
            "pressure_unit"    => settings.pressure_unit = value,
            "precip_unit"      => settings.precip_unit = value,
            "visibility_unit"  => settings.visibility_unit = value,
            "time_format"      => settings.time_format = value,
            "tray_icon_style"  => settings.tray_icon_style = value,
            "theme"            => settings.theme = value,
            "language"         => settings.language = value,
            "refresh_interval_minutes" => {
                settings.refresh_interval_minutes = value.parse().unwrap_or(15)
            }
            "notify_extreme"       => settings.notify_extreme       = value == "true",
            "notify_severe"        => settings.notify_severe        = value == "true",
            "notify_moderate"      => settings.notify_moderate      = value == "true",
            "notify_minor"         => settings.notify_minor         = value == "true",
            "animated_background"  => settings.animated_background  = value == "true",
            "animated_icons"       => settings.animated_icons       = value == "true",
            "time_of_day_shift"    => settings.time_of_day_shift    = value == "true",
            "setup_complete"       => settings.setup_complete       = value == "true",
            _ => {}
        }
    }
    Ok(settings)
}

#[tauri::command]
pub async fn update_settings(
    db: State<'_, Database>,
    settings: AppSettings,
) -> Result<()> {
    let conn = db.conn();
    let str_pairs: [(&str, &str); 9] = [
        ("temp_unit",        &settings.temp_unit),
        ("wind_unit",        &settings.wind_unit),
        ("pressure_unit",    &settings.pressure_unit),
        ("precip_unit",      &settings.precip_unit),
        ("visibility_unit",  &settings.visibility_unit),
        ("time_format",      &settings.time_format),
        ("tray_icon_style",  &settings.tray_icon_style),
        ("theme",            &settings.theme),
        ("language",         &settings.language),
    ];
    for (key, value) in str_pairs {
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            rusqlite::params![key, value],
        )?;
    }
    let bool_pairs: [(&str, bool); 8] = [
        ("notify_extreme",      settings.notify_extreme),
        ("notify_severe",       settings.notify_severe),
        ("notify_moderate",     settings.notify_moderate),
        ("notify_minor",        settings.notify_minor),
        ("animated_background", settings.animated_background),
        ("animated_icons",      settings.animated_icons),
        ("time_of_day_shift",   settings.time_of_day_shift),
        ("setup_complete",      settings.setup_complete),
    ];
    for (key, value) in bool_pairs {
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            rusqlite::params![key, if value { "true" } else { "false" }],
        )?;
    }
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
        rusqlite::params!["refresh_interval_minutes", settings.refresh_interval_minutes.to_string()],
    )?;
    Ok(())
}

#[tauri::command]
pub async fn search_locations(query: String, language: Option<String>) -> Result<Vec<GeocodingResult>> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }
    let lang = language.unwrap_or_else(|| "en".to_string());
    let url = format!(
        "https://geocoding-api.open-meteo.com/v1/search?name={}&count=8&language={}&format=json",
        urlencoding::encode(&query),
        urlencoding::encode(&lang),
    );
    let client = reqwest::Client::builder()
        .user_agent("ZWeather/0.1.0")
        .build()?;
    let resp: serde_json::Value = client.get(&url).send().await?.json().await?;
    let results = match resp["results"].as_array() {
        Some(r) => r,
        None => return Ok(vec![]),
    };
    let out = results.iter().filter_map(|r| {
        let geo_id = r["id"].as_i64()?;
        let name = r["name"].as_str()?.to_string();
        let country = r["country"].as_str().unwrap_or("").to_string();
        let admin1 = r["admin1"].as_str().map(|s| s.to_string());
        let display_name = match &admin1 {
            Some(a) => format!("{name}, {a}, {country}"),
            None    => format!("{name}, {country}"),
        };
        Some(GeocodingResult {
            geo_id,
            name,
            display_name,
            latitude:  r["latitude"].as_f64()?,
            longitude: r["longitude"].as_f64()?,
            country,
            admin1,
        })
    }).collect();
    Ok(out)
}

#[tauri::command]
pub fn set_tray_tooltip(app: AppHandle, tooltip: String) -> Result<()> {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let _ = tray.set_tooltip(Some(&tooltip));
    }
    Ok(())
}

async fn geocode_match(
    client: &reqwest::Client,
    query: &str,
    lang: &str,
    lat: f64,
    lon: f64,
) -> Option<serde_json::Value> {
    let url = format!(
        "https://geocoding-api.open-meteo.com/v1/search?name={}&count=10&language={}&format=json",
        urlencoding::encode(query),
        urlencoding::encode(lang),
    );
    let resp: serde_json::Value = client.get(&url).send().await.ok()?.json().await.ok()?;
    let results = resp["results"].as_array()?;
    if results.is_empty() {
        return None;
    }
    let best = results.iter().min_by(|a, b| {
        let da = (a["latitude"].as_f64().unwrap_or(999.0) - lat).powi(2)
            + (a["longitude"].as_f64().unwrap_or(999.0) - lon).powi(2);
        let dbb = (b["latitude"].as_f64().unwrap_or(999.0) - lat).powi(2)
            + (b["longitude"].as_f64().unwrap_or(999.0) - lon).powi(2);
        da.partial_cmp(&dbb).unwrap_or(std::cmp::Ordering::Equal)
    })?;
    let r_lat = best["latitude"].as_f64().unwrap_or(0.0);
    let r_lon = best["longitude"].as_f64().unwrap_or(0.0);
    let dist_sq = (r_lat - lat).powi(2) + (r_lon - lon).powi(2);
    if dist_sq > 0.25 {
        return None;
    }
    Some(best.clone())
}

async fn fetch_by_geo_id(
    client: &reqwest::Client,
    geo_id: i64,
    lang: &str,
) -> Option<serde_json::Value> {
    let url = format!(
        "https://geocoding-api.open-meteo.com/v1/get?id={}&language={}&format=json",
        geo_id,
        urlencoding::encode(lang),
    );
    let resp: serde_json::Value = client.get(&url).send().await.ok()?.json().await.ok()?;
    if resp["id"].as_i64().is_some() {
        Some(resp)
    } else {
        None
    }
}

fn build_display(r: &serde_json::Value, fallback_city: &str) -> String {
    let new_city = r["name"].as_str().unwrap_or(fallback_city).to_string();
    let country = r["country"].as_str().unwrap_or("").to_string();
    let admin1 = r["admin1"].as_str();
    match admin1 {
        Some(a) if !a.is_empty() && !country.is_empty() => format!("{new_city}, {a}, {country}"),
        Some(a) if !a.is_empty() => format!("{new_city}, {a}"),
        _ if !country.is_empty() => format!("{new_city}, {country}"),
        _ => new_city,
    }
}

#[tauri::command]
pub async fn refresh_location_names(
    db: State<'_, Database>,
    language: String,
) -> Result<()> {
    let locations: Vec<(String, String, f64, f64, Option<i64>)> = {
        let conn = db.conn();
        let mut stmt = conn.prepare(
            "SELECT id, name, latitude, longitude, geo_id FROM locations"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, f64>(2)?,
                row.get::<_, f64>(3)?,
                row.get::<_, Option<i64>>(4)?,
            ))
        })?;
        rows.filter_map(|r| r.ok()).collect()
    };

    let client = reqwest::Client::builder()
        .user_agent("ZWeather/0.1.0")
        .build()?;

    for (id, stored_name, lat, lon, geo_id) in locations {

        if let Some(gid) = geo_id {
            if let Some(r) = fetch_by_geo_id(&client, gid, &language).await {
                let new_display = build_display(&r, &stored_name);
                let conn = db.conn();
                let _ = conn.execute(
                    "UPDATE locations SET name = ?1, display_name = ?2 WHERE id = ?3",
                    rusqlite::params![new_display, new_display, id],
                );
                continue;
            }

            continue;
        }


        let city = stored_name.split(',').next().unwrap_or(&stored_name).trim().to_string();
        if city.is_empty() {
            continue;
        }


        let mut terms: Vec<String> = vec![city.clone()];
        for word in city.split(|c: char| c.is_whitespace() || c == '-' || c == '/' || c == '_') {
            let w = word.trim().to_string();
            if w.chars().count() >= 4 && !terms.iter().any(|t| t.eq_ignore_ascii_case(&w)) {
                terms.push(w);
            }
        }

        let langs = ["en", "de", "fr", "es", "it"];
        let mut matched: Option<serde_json::Value> = None;
        'search: for term in &terms {
            if let Some(found) = geocode_match(&client, term, &language, lat, lon).await {
                matched = Some(found);
                break 'search;
            }
            for fallback in &langs {
                if *fallback == language.as_str() {
                    continue;
                }
                if let Some(found) = geocode_match(&client, term, fallback, lat, lon).await {
                    matched = Some(found);
                    break 'search;
                }
            }
        }

        let Some(r) = matched else { continue };
        let discovered_id = r["id"].as_i64();


        let final_r = if let Some(gid) = discovered_id {
            fetch_by_geo_id(&client, gid, &language).await.unwrap_or(r)
        } else {
            r
        };
        let new_display = build_display(&final_r, &city);

        let conn = db.conn();
        let _ = conn.execute(
            "UPDATE locations SET name = ?1, display_name = ?2, geo_id = ?3 WHERE id = ?4",
            rusqlite::params![new_display, new_display, discovered_id, id],
        );
    }
    Ok(())
}

fn get_location_coords(db: &Database, location_id: &str) -> Result<(f64, f64)> {
    let conn = db.conn();
    conn.query_row(
        "SELECT latitude, longitude FROM locations WHERE id = ?1",
        [location_id],
        |r| Ok((r.get(0)?, r.get(1)?)),
    )
    .map_err(|_| crate::error::Error::Custom(format!("Location '{location_id}' not found")))
}
