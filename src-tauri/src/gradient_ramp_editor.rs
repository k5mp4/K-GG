//! Native window hosting the Gradient Ramp editor.
//!
//! The editor runs as a second webview of the same app origin. WebView2 can
//! only share one browser environment (user data folder) between webviews
//! created with identical browser arguments; a webview created with different
//! `additionalBrowserArgs` fails to initialize and leaves an empty, tiny
//! window. The editor therefore reuses the main window's arguments verbatim.
//! Window creation happens in an async command because synchronous commands
//! deadlock on Windows while a new webview is created.

use tauri::{AppHandle, Emitter, Manager, Runtime, WebviewUrl, WebviewWindowBuilder};

pub const MAIN_WINDOW_LABEL: &str = "main";
pub const EDITOR_WINDOW_LABEL: &str = "gradient-ramp-editor";
const EDITOR_WINDOW_TITLE: &str = "Gradient Ramp - KAGARIBI Grad";
/// Tells the main window to stop mirroring state to a closed editor.
const EDITOR_CLOSED_EVENT: &str = "gradient-ramp-editor://closed";

const EDITOR_WIDTH: f64 = 760.0;
const EDITOR_HEIGHT: f64 = 600.0;
const EDITOR_MIN_WIDTH: f64 = 460.0;
const EDITOR_MIN_HEIGHT: f64 = 360.0;

fn main_window_browser_args<R: Runtime>(app: &AppHandle<R>) -> Option<String> {
    app.config()
        .app
        .windows
        .iter()
        .find(|window| window.label == MAIN_WINDOW_LABEL)
        .and_then(|window| window.additional_browser_args.clone())
}

/// Opens the editor window, or focuses it when it already exists.
#[tauri::command]
pub async fn open_gradient_ramp_editor_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    if let Some(existing) = app.get_webview_window(EDITOR_WINDOW_LABEL) {
        let _ = existing.unminimize();
        existing.show().map_err(|err| err.to_string())?;
        existing.set_focus().map_err(|err| err.to_string())?;
        return Ok(());
    }

    let mut builder = WebviewWindowBuilder::new(
        &app,
        EDITOR_WINDOW_LABEL,
        WebviewUrl::App("index.html".into()),
    )
    .title(EDITOR_WINDOW_TITLE)
    .inner_size(EDITOR_WIDTH, EDITOR_HEIGHT)
    .min_inner_size(EDITOR_MIN_WIDTH, EDITOR_MIN_HEIGHT)
    .resizable(true)
    .focused(true);

    if let Some(main) = app.get_webview_window(MAIN_WINDOW_LABEL) {
        builder = builder.parent(&main).map_err(|err| err.to_string())?;
    }
    if let Some(args) = main_window_browser_args(&app) {
        builder = builder.additional_browser_args(&args);
    }

    builder.build().map_err(|err| err.to_string())?;
    Ok(())
}

/// Closes the editor together with the main window so the app does not keep
/// running with only an orphaned editor, and reports editor closure to the
/// main window (the editor webview cannot reliably emit while unloading).
pub fn handle_window_event<R: Runtime>(window: &tauri::Window<R>, event: &tauri::WindowEvent) {
    if !matches!(event, tauri::WindowEvent::Destroyed) {
        return;
    }
    let app = window.app_handle();
    match window.label() {
        MAIN_WINDOW_LABEL => {
            if let Some(editor) = app.get_webview_window(EDITOR_WINDOW_LABEL) {
                let _ = editor.close();
            }
        }
        EDITOR_WINDOW_LABEL => {
            let _ = app.emit_to(MAIN_WINDOW_LABEL, EDITOR_CLOSED_EVENT, ());
        }
        _ => {}
    }
}
