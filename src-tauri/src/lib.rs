mod air_quality;
mod alerts;
mod commands;
mod db;
mod error;
mod models;
mod scheduler;
mod tray;
mod weather_fetcher;

use db::Database;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            tray::show_main(app);
        }))
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let db_path = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data directory")
                .join("zweather.db");

            std::fs::create_dir_all(db_path.parent().unwrap())?;

            let database = Database::open(&db_path).expect("failed to open database");
            app.manage(database);

            tray::setup_tray(app.handle())?;

            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                scheduler::run(app_handle).await;
            });

            if let Some(win) = app.get_webview_window("main") {
                tray::init_main_window(&win);
            }

            if let Some(win) = app.get_webview_window("tray") {
                let _ = win.hide();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_locations,
            commands::add_location,
            commands::remove_location,
            commands::set_primary_location,
            commands::reorder_locations,
            commands::get_current_weather,
            commands::get_hourly_forecast,
            commands::get_daily_forecast,
            commands::get_alerts,
            commands::get_air_quality,
            commands::refresh_location,
            commands::get_settings,
            commands::update_settings,
            commands::search_locations,
            commands::refresh_location_names,
            commands::set_tray_tooltip,
            commands::set_tray_icon,
            commands::open_dashboard,
        ])
        .build(tauri::generate_context!())
        .expect("error while building ZWeather")
        .run(|_app, event| {


            if let tauri::RunEvent::ExitRequested { code: None, api, .. } = event {
                api.prevent_exit();
            }
        });
}
