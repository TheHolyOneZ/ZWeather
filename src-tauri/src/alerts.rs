use crate::models::WeatherAlert;
use crate::error::Result;
use quick_xml::events::Event;
use quick_xml::Reader;

pub struct AlertFetcher {
    client: reqwest::Client,
}

fn in_us_bbox(lat: f64, lon: f64) -> bool {
    (24.0..=72.0).contains(&lat) && (-179.0..=-66.0).contains(&lon)
}

fn in_eu_bbox(lat: f64, lon: f64) -> bool {
    (34.0..=72.0).contains(&lat) && (-28.0..=45.0).contains(&lon)
}

fn meteoalarm_severity(level: &str) -> &'static str {
    match level.trim() {
        "4" | "Red"    | "red"    => "extreme",
        "3" | "Orange" | "orange" => "severe",
        "2" | "Yellow" | "yellow" => "moderate",
        _                          => "minor",
    }
}

impl AlertFetcher {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .user_agent("ZWeather/0.1.0 (https://github.com/TheHolyOneZ/ZWeather)")
            .build()
            .expect("failed to build HTTP client");
        Self { client }
    }

    pub async fn fetch_alerts(
        &self,
        lat: f64,
        lon: f64,
        location_id: &str,
    ) -> Result<Vec<WeatherAlert>> {
        if in_us_bbox(lat, lon) {
            return Ok(self.fetch_weather_gov(lat, lon, location_id).await);
        }
        if in_eu_bbox(lat, lon) {
            if let Some(cc) = self.reverse_country(lat, lon).await {
                return Ok(self.fetch_meteoalarm(&cc, location_id).await);
            }
        }
        Ok(vec![])
    }

    async fn fetch_weather_gov(
        &self,
        lat: f64,
        lon: f64,
        location_id: &str,
    ) -> Vec<WeatherAlert> {
        let url = format!(
            "https://api.weather.gov/alerts/active?point={lat},{lon}&status=actual"
        );
        let resp = match self.client.get(&url)
            .header("Accept", "application/geo+json")
            .send().await {
            Ok(r) => r,
            Err(_) => return vec![],
        };
        let json: serde_json::Value = match resp.json().await {
            Ok(j) => j,
            Err(_) => return vec![],
        };
        let features = match json["features"].as_array() {
            Some(f) => f,
            None => return vec![],
        };
        features.iter().filter_map(|f| {
            let props = &f["properties"];
            let severity = props["severity"].as_str()?;
            Some(WeatherAlert {
                id: props["id"].as_str().unwrap_or("").to_string(),
                location_id: location_id.to_string(),
                title: props["headline"].as_str().unwrap_or("").to_string(),
                severity: severity.to_lowercase(),
                description: props["description"].as_str().unwrap_or("").to_string(),
                issued: 0,
                expires: 0,
                areas: vec![props["areaDesc"].as_str().unwrap_or("").to_string()],
            })
        }).collect()
    }

    async fn reverse_country(&self, lat: f64, lon: f64) -> Option<String> {
        let url = format!(
            "https://geocoding-api.open-meteo.com/v1/reverse?latitude={lat}&longitude={lon}&count=1"
        );
        let resp: serde_json::Value = self.client.get(&url).send().await.ok()?.json().await.ok()?;
        let cc = resp["results"][0]["country_code"].as_str()?.to_lowercase();
        Some(cc)
    }

    async fn fetch_meteoalarm(&self, country_code: &str, location_id: &str) -> Vec<WeatherAlert> {
        let url = format!(
            "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-{country_code}"
        );
        let body = match self.client.get(&url).send().await {
            Ok(r) => match r.text().await { Ok(b) => b, Err(_) => return vec![] },
            Err(_) => return vec![],
        };
        parse_meteoalarm_atom(&body, location_id)
    }
}


fn local_name(qname: &str) -> &str {
    qname.rsplit(':').next().unwrap_or(qname)
}

fn stable_id(title: &str, summary: &str, location_id: &str) -> String {

    let mut hash: u64 = 0xcbf29ce484222325;
    for b in title.as_bytes().iter().chain(b"\x1f".iter()).chain(summary.as_bytes().iter()) {
        hash ^= *b as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("ma-{}-{:016x}", location_id, hash)
}

fn parse_meteoalarm_atom(body: &str, location_id: &str) -> Vec<WeatherAlert> {
    let mut reader = Reader::from_str(body);
    reader.config_mut().trim_text(true);
    let mut alerts: Vec<WeatherAlert> = Vec::new();
    let mut buf = Vec::new();
    let mut in_entry = false;
    let mut cur_id = String::new();
    let mut cur_title = String::new();
    let mut cur_summary = String::new();
    let mut cur_severity_hint = String::new();
    let mut cur_path: Vec<String> = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(e)) => {
                let qname = String::from_utf8_lossy(e.name().as_ref()).to_string();
                let name = local_name(&qname).to_string();
                if name == "entry" {
                    in_entry = true;
                    cur_id.clear();
                    cur_title.clear();
                    cur_summary.clear();
                    cur_severity_hint.clear();
                }
                cur_path.push(name);
            }
            Ok(Event::End(e)) => {
                let qname = String::from_utf8_lossy(e.name().as_ref()).to_string();
                let name = local_name(&qname).to_string();
                if name == "entry" && in_entry {
                    in_entry = false;
                    let severity = detect_meteoalarm_severity(&cur_severity_hint, &cur_title, &cur_summary);
                    let id_raw = if cur_id.trim().is_empty() {
                        stable_id(cur_title.trim(), cur_summary.trim(), location_id)
                    } else {
                        cur_id.trim().to_string()
                    };
                    alerts.push(WeatherAlert {
                        id: id_raw,
                        location_id: location_id.to_string(),
                        title: cur_title.trim().to_string(),
                        severity: severity.to_string(),
                        description: cur_summary.trim().to_string(),
                        issued: 0,
                        expires: 0,
                        areas: vec![],
                    });
                }
                cur_path.pop();
            }
            Ok(Event::Text(t)) => {
                if in_entry {
                    let txt = t.unescape().unwrap_or_default().to_string();
                    match cur_path.last().map(|s| s.as_str()) {
                        Some("id")               => cur_id.push_str(&txt),
                        Some("title")            => cur_title.push_str(&txt),
                        Some("summary")          => cur_summary.push_str(&txt),
                        Some("value")
                          | Some("awareness_level")
                          | Some("awareness_type")
                          | Some("severity")     => {
                            cur_severity_hint.push(' ');
                            cur_severity_hint.push_str(&txt);
                          }
                        _ => {}
                    }
                }
            }
            Ok(Event::CData(c)) => {
                if in_entry {
                    let txt = String::from_utf8_lossy(c.as_ref()).to_string();
                    match cur_path.last().map(|s| s.as_str()) {
                        Some("summary") => cur_summary.push_str(&txt),
                        Some("title")   => cur_title.push_str(&txt),
                        _ => {}
                    }
                }
            }
            Ok(Event::Eof) => break,
            Err(_) => break,
            _ => {}
        }
        buf.clear();
    }
    alerts
}

fn detect_meteoalarm_severity(hint: &str, title: &str, summary: &str) -> &'static str {
    let hay = format!("{} {} {}", hint, title, summary).to_lowercase();

    if hay.contains("red")
        || hay.contains("awareness level: 4")
        || hay.contains("\"4; ")
        || hay.contains("level: 4")
        || hay.contains("extreme")
    {
        meteoalarm_severity("4")
    } else if hay.contains("orange")
        || hay.contains("awareness level: 3")
        || hay.contains("level: 3")
        || hay.contains("severe")
    {
        meteoalarm_severity("3")
    } else if hay.contains("yellow")
        || hay.contains("awareness level: 2")
        || hay.contains("level: 2")
        || hay.contains("moderate")
    {
        meteoalarm_severity("2")
    } else {
        "minor"
    }
}
