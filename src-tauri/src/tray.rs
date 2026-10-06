use std::sync::atomic::{AtomicBool, Ordering};
#[cfg(windows)]
use std::sync::atomic::AtomicU64;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::{
    AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, Rect, WebviewWindow,
    WebviewWindowBuilder, WindowEvent,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};
use crate::error::Result;

pub const TRAY_ID: &str = "main-tray";

const POPOVER_W: f64 = 360.0;
const POPOVER_H: f64 = 440.0;
const POPOVER_MARGIN: f64 = 8.0;


const BLUR_REOPEN_GUARD: Duration = Duration::from_millis(300);

#[derive(Default)]
pub struct PopoverState {
    last_blur_hide: Mutex<Option<Instant>>,
    #[cfg(windows)]
    session: AtomicU64,
    creating_main: AtomicBool,
}

fn mark_blur_hide(app: &AppHandle) {
    if let Some(state) = app.try_state::<PopoverState>() {
        *state.last_blur_hide.lock().unwrap() = Some(Instant::now());
    }
}

pub fn setup_tray(app: &AppHandle) -> Result<()> {
    app.manage(PopoverState::default());

    let open_i = MenuItem::with_id(app, "open", "Open Dashboard", true, None::<&str>)?;
    let quit_i  = MenuItem::with_id(app, "quit",  "Quit ZWeather", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open_i, &quit_i])?;

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("ZWeather")
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                rect,
                position,
                ..
            } = event
            {
                toggle_tray_popover(tray.app_handle(), rect, position);
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;

    if let Some(pop) = app.get_webview_window("tray") {
        let pop_clone = pop.clone();
        let app_clone = app.clone();
        pop.on_window_event(move |event| {
            if let WindowEvent::Focused(false) = event {
                if pop_clone.is_visible().unwrap_or(false) {
                    mark_blur_hide(&app_clone);
                    hide_popover(&pop_clone);
                }
            }
        });
    }

    Ok(())
}

fn toggle_tray_popover(app: &AppHandle, tray_rect: Rect, cursor: PhysicalPosition<f64>) {
    let Some(win) = app.get_webview_window("tray") else { return };

    if win.is_visible().unwrap_or(false) {
        hide_popover(&win);
        return;
    }

    if let Some(state) = app.try_state::<PopoverState>() {
        if let Some(at) = state.last_blur_hide.lock().unwrap().take() {
            if at.elapsed() < BLUR_REOPEN_GUARD {
                return;
            }
        }
    }

    position_popover(app, &win, tray_rect, cursor);
    let _ = win.show();
    let _ = win.set_focus();
    let _ = win.emit_to("tray", "zw://tray-visibility", true);

    #[cfg(windows)]
    watch_click_away(app, &win);
}

#[cfg(windows)]
mod foreground {
    #[link(name = "user32")]
    extern "system" {
        fn GetForegroundWindow() -> *mut core::ffi::c_void;
    }

    pub fn is_foreground(win: &tauri::WebviewWindow) -> bool {
        let Ok(hwnd) = win.hwnd() else { return false };
        unsafe { GetForegroundWindow() as usize == hwnd.0 as usize }
    }
}


#[cfg(windows)]
fn watch_click_away(app: &AppHandle, win: &WebviewWindow) {
    let Some(state) = app.try_state::<PopoverState>() else { return };
    let session = state.session.fetch_add(1, Ordering::SeqCst) + 1;
    let app = app.clone();
    let win = win.clone();

    std::thread::spawn(move || {
        let started = Instant::now();
        let mut was_foreground = false;
        let mut refocused = false;
        loop {
            std::thread::sleep(Duration::from_millis(80));
            let Some(state) = app.try_state::<PopoverState>() else { return };
            if state.session.load(Ordering::SeqCst) != session {
                return;
            }
            if !win.is_visible().unwrap_or(false) {
                return;
            }
            if foreground::is_foreground(&win) {
                was_foreground = true;
            } else if was_foreground {
                mark_blur_hide(&app);
                hide_popover(&win);
                return;
            } else if !refocused && started.elapsed() > Duration::from_millis(250) {
                refocused = true;
                let _ = win.set_focus();
            }
        }
    });
}

pub fn hide_popover(win: &WebviewWindow) {
    let _ = win.hide();
    let _ = win.emit_to("tray", "zw://tray-visibility", false);
}


fn position_popover(app: &AppHandle, win: &WebviewWindow, tray_rect: Rect, cursor: PhysicalPosition<f64>) {
    let Some(monitor) = win.primary_monitor().ok().flatten() else { return };
    let scale_hint = monitor.scale_factor();

    let mut tray_pos = tray_rect.position.to_physical::<f64>(scale_hint);
    let mut tray_size = tray_rect.size.to_physical::<f64>(scale_hint);


    if tray_size.width < 1.0 || tray_size.height < 1.0 {
        tray_pos = cursor;
        tray_size = tauri::PhysicalSize::new(1.0, 1.0);
    }
    let anchor_x = tray_pos.x + tray_size.width / 2.0;
    let anchor_y = tray_pos.y + tray_size.height / 2.0;

    let monitor = app
        .monitor_from_point(anchor_x, anchor_y)
        .ok()
        .flatten()
        .unwrap_or(monitor);
    let scale = monitor.scale_factor();
    let work = monitor.work_area();
    let mon_pos = monitor.position();
    let mon_size = monitor.size();

    let w = POPOVER_W * scale;
    let h = POPOVER_H * scale;
    let margin = POPOVER_MARGIN * scale;

    let work_left = work.position.x as f64;
    let work_top = work.position.y as f64;
    let work_right = work_left + work.size.width as f64;
    let work_bottom = work_top + work.size.height as f64;

    let x = (anchor_x - w / 2.0)
        .min(work_right - w - margin)
        .max(work_left + margin);


    let mon_mid_y = mon_pos.y as f64 + mon_size.height as f64 / 2.0;
    let y = if anchor_y >= mon_mid_y {
        tray_pos.y.min(work_bottom) - h - margin
    } else {
        (tray_pos.y + tray_size.height).max(work_top) + margin
    };
    let y = y.min(work_bottom - h - margin).max(work_top + margin);


    let _ = win.set_size(LogicalSize::new(POPOVER_W, POPOVER_H));
    let _ = win.set_position(PhysicalPosition::new(x.round() as i32, y.round() as i32));
    let _ = win.set_size(LogicalSize::new(POPOVER_W, POPOVER_H));
}


pub fn show_main(app: &AppHandle) {
    if let Some(pop) = app.get_webview_window("tray") {
        hide_popover(&pop);
    }

    if let Some(win) = app.get_webview_window("main") {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
        return;
    }

    let Some(state) = app.try_state::<PopoverState>() else { return };
    if state.creating_main.swap(true, Ordering::SeqCst) {
        return;
    }

    let app = app.clone();
    std::thread::spawn(move || {
        create_main(&app);
        if let Some(state) = app.try_state::<PopoverState>() {
            state.creating_main.store(false, Ordering::SeqCst);
        }
    });
}

fn create_main(app: &AppHandle) {
    let Some(config) = app
        .config()
        .app
        .windows
        .iter()
        .find(|w| w.label == "main")
        .cloned()
    else {
        return;
    };


    let built = WebviewWindowBuilder::from_config(app, &config)
        .map(|b| b.initialization_script("window.__ZW_REOPENED__ = true;"))
        .and_then(|b| b.build());

    match built {
        Ok(win) => init_main_window(&win),
        Err(e) => tracing::error!("failed to recreate main window: {e}"),
    }
}

pub fn init_main_window(win: &WebviewWindow) {
    let _ = win.set_decorations(false);
    let _ = win.show();
    let _ = win.set_focus();

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
