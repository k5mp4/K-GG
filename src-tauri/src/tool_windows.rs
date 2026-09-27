//! Native tool windows (Gradient Ramp editor, Effect Stack).
//!
//! Each tool window runs as a second webview of the same app origin. WebView2
//! can only share one browser environment (user data folder) between webviews
//! created with identical browser arguments; a webview created with different
//! `additionalBrowserArgs` fails to initialize and leaves an empty, tiny
//! window. Tool windows therefore reuse the main window's arguments verbatim.
//! Window creation happens in an async command because synchronous commands
//! deadlock on Windows while a new webview is created.

use serde::Deserialize;
use tauri::{AppHandle, Emitter, Manager, Runtime, WebviewUrl, WebviewWindowBuilder};

pub const MAIN_WINDOW_LABEL: &str = "main";
/// Tells the main window (payload: label) to stop mirroring state to a closed tool window.
const TOOL_WINDOW_CLOSED_EVENT: &str = "tool-window://closed";

/// The only windows the frontend may open; the label doubles as the webview label.
#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ToolWindow {
    GradientRampEditor,
    EffectStack,
}

struct ToolWindowSpec {
    label: &'static str,
    title: &'static str,
    size: (f64, f64),
    min_size: (f64, f64),
}

impl ToolWindow {
    const ALL: [ToolWindow; 2] = [ToolWindow::GradientRampEditor, ToolWindow::EffectStack];

    fn spec(self) -> ToolWindowSpec {
        match self {
            ToolWindow::GradientRampEditor => ToolWindowSpec {
                label: "gradient-ramp-editor",
                title: "Gradient Ramp - KAGARIBI Grad",
                size: (760.0, 600.0),
                min_size: (460.0, 360.0),
            },
            ToolWindow::EffectStack => ToolWindowSpec {
                label: "effect-stack",
                title: "Effect Stack - KAGARIBI Grad",
                // Header (32) + 12 rows (38 each) fit without scrolling; smaller heights scroll the rows.
                size: (220.0, 490.0),
                min_size: (200.0, 120.0),
            },
        }
    }

    fn from_label(label: &str) -> Option<Self> {
        Self::ALL.into_iter().find(|window| window.spec().label == label)
    }
}

fn main_window_browser_args<R: Runtime>(app: &AppHandle<R>) -> Option<String> {
    app.config()
        .app
        .windows
        .iter()
        .find(|window| window.label == MAIN_WINDOW_LABEL)
        .and_then(|window| window.additional_browser_args.clone())
}

/// Opens a tool window, or focuses it when it already exists.
#[tauri::command]
pub async fn open_tool_window<R: Runtime>(app: AppHandle<R>, window: ToolWindow) -> Result<(), String> {
    let spec = window.spec();
    if let Some(existing) = app.get_webview_window(spec.label) {
        let _ = existing.unminimize();
        existing.show().map_err(|err| err.to_string())?;
        existing.set_focus().map_err(|err| err.to_string())?;
        return Ok(());
    }

    let mut builder = WebviewWindowBuilder::new(&app, spec.label, WebviewUrl::App("index.html".into()))
        .title(spec.title)
        .inner_size(spec.size.0, spec.size.1)
        .min_inner_size(spec.min_size.0, spec.min_size.1)
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

/// Closes tool windows together with the main window so the app does not keep
/// running with only orphaned tools, and reports tool window closure to the
/// main window (a webview cannot reliably emit while unloading).
pub fn handle_window_event<R: Runtime>(window: &tauri::Window<R>, event: &tauri::WindowEvent) {
    if !matches!(event, tauri::WindowEvent::Destroyed) {
        return;
    }
    let app = window.app_handle();
    if window.label() == MAIN_WINDOW_LABEL {
        for tool in ToolWindow::ALL {
            if let Some(webview) = app.get_webview_window(tool.spec().label) {
                let _ = webview.close();
            }
        }
    } else if let Some(tool) = ToolWindow::from_label(window.label()) {
        let _ = app.emit_to(MAIN_WINDOW_LABEL, TOOL_WINDOW_CLOSED_EVENT, tool.spec().label);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tool_window_labels_round_trip() {
        for tool in ToolWindow::ALL {
            assert_eq!(ToolWindow::from_label(tool.spec().label), Some(tool));
        }
        assert_eq!(ToolWindow::from_label(MAIN_WINDOW_LABEL), None);
    }

    #[test]
    fn deserializes_only_known_windows() {
        let tool: ToolWindow = serde_json::from_str("\"effect-stack\"").unwrap();
        assert_eq!(tool, ToolWindow::EffectStack);
        assert!(serde_json::from_str::<ToolWindow>("\"main\"").is_err());
    }
}
