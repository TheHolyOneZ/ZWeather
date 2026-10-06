# Changelog

All notable changes to ZWeather are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] — 2026-10-06

A tray bug-fix release, prompted by the report in
[#2](https://github.com/TheHolyOneZ/ZWeather/issues/2). No data-format changes —
upgrading in place keeps every location and preference.

### Fixed

- **The tray icon never showed the weather.** Two tray icons were being created
  (one from the config, one from code), both with the app logo, and the
  *Tray content* setting only ever changed the tooltip. There is now a single tray
  icon that renders the current condition and/or temperature according to that
  setting, and refreshes whenever the weather, unit or setting changes.
- **The tray popover opened in the top-left corner of the screen.** It is now
  placed next to the tray icon, on the monitor the icon is on, kept inside that
  monitor's work area (never over the taskbar), and sized correctly on setups
  that mix different display scales — e.g. a 1080p screen next to an ultrawide.
- **Clicking outside the tray popover did not close it.** It now hides when it
  loses focus; clicking the tray icon while it is open closes it instead of
  re-opening it.
- **"Open full dashboard" in the popover did nothing.** It only hid the popover;
  it now opens (or re-creates) the dashboard.
- **The tray popover could stay on loading placeholders forever.** It loaded its
  data once at startup and never noticed locations added later in the dashboard
  — which is exactly what happens on a fresh install. It now refreshes when opened
  and whenever the dashboard changes locations or settings, and shows a clear
  "no location yet" or "couldn't load — retry" state instead of endless skeletons.
- **The tray popover ignored the °C / °F setting.**
- **High CPU usage while ZWeather sat in the tray (Windows).** Closing the
  dashboard only hid it, and WebView2 keeps rendering a hidden window, so every
  background animation kept running. Closing the dashboard now destroys it
  completely (it is rebuilt — without the intro — when reopened), and the
  popover renders nothing while it is hidden.

### Changed

- Severe-weather notifications now come from the always-running tray process and
  follow your **primary** location, so they keep working while the dashboard is
  closed.
- The *System tray* settings section is now shown on Linux too, since the tray
  icon itself now reflects the setting there.

## [0.1.1] — 2026-08-10

A bug-fix release. No new features, no settings changes, no data-format changes —
upgrading in place keeps every location and preference.

### Fixed

- **Suitability card showed contradictory verdicts.** An activity could display a
  "Poor" badge next to the reason "Ideal" (most visibly on **Swimming** between
  20–21 °C). The badge and the reason line were computed by two independent
  branch chains that could disagree; they are now derived together, so the two
  can never contradict each other again. The same fault also affected **Running**,
  **Cycling** and **Hiking** in the 25–28 °C range.
- **Suitability reasons now describe borderline conditions honestly.** Cases that
  previously fell through to "Ideal" despite a Fair or Poor rating now report what
  is actually marginal — a cool water temperature, a stiff breeze, partial cloud.
- **Windows: stray white square in the dashboard.** The scroll container's corner
  was left unstyled and painted with the browser default white.
- **Windows: white wedge in the top-left window corner.**
- **Windows: location tabs rendered twice**, with the outline and the filled
  content offset from one another by roughly 15 px.
- **Windows: horizontal scrollbar could appear** in the main and sidebar columns
  when content was only marginally too wide.

### Changed

- Windows now uses an opaque window surface with square corners instead of a
  transparent rounded one. This is what removes the corner and duplicate-tab
  artifacts above; WebView2's compositor mishandles transparent undecorated
  windows. macOS and Linux are unchanged and keep the rounded translucent window.
- Release builds for Windows and macOS now publish to a **draft** GitHub release,
  so nothing becomes public until it is explicitly published. Linux packages are
  built separately (see `RELEASES.md`).

### Added

- Four new suitability phrasings — cool, too cold, breeze, some clouds —
  translated across all five shipped languages (English, German, French, Spanish,
  Italian).

### Known issues

- The Linux packages for this release require **glibc 2.39 or newer** (Ubuntu
  24.04, Fedora 40, Debian 13 and later). Ubuntu 22.04 and Debian 12 are **not**
  supported by the 0.1.1 Linux builds; 0.1.0 remains available for those systems.
  See `RELEASES.md`.
- The light theme is still deliberately unpolished and warns on selection.

## [0.1.0] — 2026-06-27

Initial public release.

### Added

- Weather dashboard with current conditions, a 24-hour strip and a 10-day
  forecast, plus a per-day detail view with hourly curves.
- Animated radar map with precipitation, cloud, wind and temperature layers.
- Severe-weather alerts for the United States and Europe, with desktop
  notifications.
- Air-quality card with European and US AQI and dominant-pollutant reporting.
- Multi-location support with a reorderable location strip.
- Sun and moon detail: sunrise/sunset, day length, golden hours, moon phase,
  illumination, and rise and set times.
- Activity suitability ratings for eight activities.
- System-tray popover with live temperature and a scheduled background refresh.
- Settings for units, language, theme, animation, notification thresholds,
  refresh interval and tray icon style.
- Five languages: English, German, French, Spanish, Italian.
- Fully local storage — no account, no telemetry, no cloud sync.

[0.1.2]: https://github.com/TheHolyOneZ/ZWeather/releases/tag/v0.1.2
[0.1.1]: https://github.com/TheHolyOneZ/ZWeather/releases/tag/v0.1.1
[0.1.0]: https://github.com/TheHolyOneZ/ZWeather/releases/tag/v0.1.0
