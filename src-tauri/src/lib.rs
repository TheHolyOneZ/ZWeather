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
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }
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


                let _ = win.set_decorations(false);
                let _ = win.show();
                let _ = win.set_focus();


                let win_clone = win.clone();
                win.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = win_clone.hide();
                    }
                });

                #[cfg(target_os = "linux")]
                {
                    if let Ok(size) = win.inner_size() {
                        let _ = win.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                            width: size.width + 1,
                            height: size.height,
                        }));
                        let _ = win.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                            width: size.width,
                            height: size.height,
                        }));
                    }
                }
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running ZWeather");
}
