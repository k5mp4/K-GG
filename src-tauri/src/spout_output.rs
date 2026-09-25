//! Spout output: publishes the processed preview canvas as a Spout sender.
//!
//! The renderer produces tightly packed 8-bit RGBA frames in WebGL
//! `readPixels` order (bottom row first). Normally they live in WebView2
//! shared memory (`spout_shared_frames.rs`) and only a slot reference crosses
//! IPC; `send_spout_output_frame` is the fallback that takes the frame as a raw
//! IPC body with width/height headers. No frame data is ever JSON-encoded. The
//! native backend converts the frame to top-down BGRA and calls Spout2
//! `SpoutDX::SendImage`.
//!
//! Spout is Windows-only. Other targets compile an unsupported backend so
//! `cargo check` and the frontend keep working everywhere.

use serde::Serialize;
use std::sync::{Mutex, MutexGuard};
use tauri::ipc::{InvokeBody, Request};
use tauri::State;

/// Spout keeps sender names in 256-byte buffers and appends "_N" when a name
/// is already registered, so leave room for that suffix.
pub const MAX_SENDER_NAME_BYTES: usize = 200;
/// Largest Direct3D 11 texture dimension (feature level 11_0).
pub const MAX_FRAME_DIMENSION: u32 = 16_384;
pub const FRAME_WIDTH_HEADER: &str = "x-kgg-frame-width";
pub const FRAME_HEIGHT_HEADER: &str = "x-kgg-frame-height";

const UNSUPPORTED_MESSAGE: &str = "Spout output is available in the Windows desktop app.";

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpoutOutputStatus {
    supported: bool,
    active: bool,
    requested_name: Option<String>,
    sender_name: Option<String>,
    width: u32,
    height: u32,
    frames_sent: u64,
    last_error: Option<String>,
}

/// Creates native senders. Implemented by the Spout2 FFI on Windows and by
/// test fakes; a future `SendTexture` backend would implement the same trait.
pub trait SpoutBackend: Send {
    fn supported(&self) -> bool;
    fn create(&self, name: &str) -> Result<Box<dyn SpoutSenderHandle>, String>;
}

/// One registered sender. Dropping the handle must unregister the sender.
pub trait SpoutSenderHandle: Send {
    /// Name registered with Spout (may carry a "_N" suffix after a collision).
    fn sender_name(&self) -> &str;
    fn send_rgba_bottom_up(&mut self, rgba: &[u8], width: u32, height: u32) -> Result<(), String>;
}

struct Session {
    sender: Box<dyn SpoutSenderHandle>,
    requested_name: String,
    width: u32,
    height: u32,
    frames_sent: u64,
}

pub struct SpoutOutputController {
    backend: Box<dyn SpoutBackend>,
    session: Option<Session>,
    last_error: Option<String>,
}

impl SpoutOutputController {
    pub fn new(backend: Box<dyn SpoutBackend>) -> Self {
        Self { backend, session: None, last_error: None }
    }

    pub fn status(&self) -> SpoutOutputStatus {
        let session = self.session.as_ref();
        SpoutOutputStatus {
            supported: self.backend.supported(),
            active: session.is_some(),
            requested_name: session.map(|value| value.requested_name.clone()),
            sender_name: session.map(|value| value.sender.sender_name().to_owned()),
            width: session.map_or(0, |value| value.width),
            height: session.map_or(0, |value| value.height),
            frames_sent: session.map_or(0, |value| value.frames_sent),
            last_error: self.last_error.clone(),
        }
    }

    /// Starts a sender, or keeps the current one when the name is unchanged.
    /// A different name releases the previous sender before creating the next.
    pub fn start(&mut self, sender_name: &str) -> Result<SpoutOutputStatus, String> {
        if !self.backend.supported() {
            return Err(UNSUPPORTED_MESSAGE.to_owned());
        }
        let name = validate_sender_name(sender_name)?;
        if self.session.as_ref().is_some_and(|session| session.requested_name == name) {
            return Ok(self.status());
        }
        self.session = None;
        match self.backend.create(&name) {
            Ok(sender) => {
                self.session = Some(Session { sender, requested_name: name, width: 0, height: 0, frames_sent: 0 });
                self.last_error = None;
                Ok(self.status())
            }
            Err(error) => {
                self.last_error = Some(error.clone());
                Err(error)
            }
        }
    }

    /// Sends one frame. A native send failure is treated as fatal for the
    /// sender: it is released so receivers do not keep a frozen sender.
    pub fn send(&mut self, rgba: &[u8], width: u32, height: u32) -> Result<(), String> {
        validate_frame(rgba.len(), width, height)?;
        let Some(session) = self.session.as_mut() else {
            return Err("Spout output is not started.".to_owned());
        };
        match session.sender.send_rgba_bottom_up(rgba, width, height) {
            Ok(()) => {
                session.width = width;
                session.height = height;
                session.frames_sent += 1;
                Ok(())
            }
            Err(error) => {
                self.session = None;
                self.last_error = Some(error.clone());
                Err(error)
            }
        }
    }

    pub fn stop(&mut self) -> SpoutOutputStatus {
        self.session = None;
        self.last_error = None;
        self.status()
    }
}

pub fn validate_sender_name(value: &str) -> Result<String, String> {
    let name = value.trim();
    if name.is_empty() {
        return Err("Sender name is empty.".to_owned());
    }
    if name.len() > MAX_SENDER_NAME_BYTES {
        return Err(format!("Sender name must be at most {MAX_SENDER_NAME_BYTES} characters."));
    }
    // Spout names are ANSI C strings shown by receivers in their own code
    // page; printable ASCII is the only range that displays consistently.
    if !name.bytes().all(|byte| (0x20..=0x7e).contains(&byte)) {
        return Err("Sender name must use printable ASCII characters.".to_owned());
    }
    Ok(name.to_owned())
}

pub fn validate_frame(length: usize, width: u32, height: u32) -> Result<(), String> {
    if width == 0 || height == 0 || width > MAX_FRAME_DIMENSION || height > MAX_FRAME_DIMENSION {
        return Err(format!("Invalid Spout frame size {width}x{height}."));
    }
    let expected = width as usize * height as usize * 4;
    if length != expected {
        return Err(format!("Invalid Spout frame length {length}; expected {expected} bytes for {width}x{height} RGBA."));
    }
    Ok(())
}

fn parse_dimension_header(request: &Request<'_>, name: &str) -> Result<u32, String> {
    request
        .headers()
        .get(name)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.trim().parse::<u32>().ok())
        .ok_or_else(|| format!("Missing or invalid {name} header."))
}

pub struct SpoutOutputState(Mutex<SpoutOutputController>);

impl SpoutOutputState {
    pub fn new() -> Self {
        Self(Mutex::new(SpoutOutputController::new(platform_backend())))
    }

    fn lock(&self) -> MutexGuard<'_, SpoutOutputController> {
        // A panic while sending must not disable cleanup at exit.
        self.0.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
    }

    /// Releases the sender when the app exits.
    pub fn shutdown(&self) {
        self.lock().stop();
    }

    /// Sends a frame that is not owned by an IPC request (shared memory path).
    pub fn send(&self, rgba: &[u8], width: u32, height: u32) -> Result<(), String> {
        self.lock().send(rgba, width, height)
    }
}

#[tauri::command]
pub async fn get_spout_output_status(state: State<'_, SpoutOutputState>) -> Result<SpoutOutputStatus, String> {
    Ok(state.lock().status())
}

#[tauri::command]
pub async fn start_spout_output(
    state: State<'_, SpoutOutputState>,
    sender_name: String,
) -> Result<SpoutOutputStatus, String> {
    state.lock().start(&sender_name)
}

/// Raw-body command: the body is the RGBA frame, dimensions are headers.
/// It is async so the conversion and SendImage never run on the UI thread.
#[tauri::command]
pub async fn send_spout_output_frame(
    state: State<'_, SpoutOutputState>,
    request: Request<'_>,
) -> Result<(), String> {
    let InvokeBody::Raw(rgba) = request.body() else {
        return Err("Spout frames must be sent as a raw binary body.".to_owned());
    };
    let width = parse_dimension_header(&request, FRAME_WIDTH_HEADER)?;
    let height = parse_dimension_header(&request, FRAME_HEIGHT_HEADER)?;
    state.lock().send(rgba, width, height)
}

#[tauri::command]
pub async fn stop_spout_output(state: State<'_, SpoutOutputState>) -> Result<SpoutOutputStatus, String> {
    Ok(state.lock().stop())
}

#[cfg(all(target_os = "windows", target_env = "msvc"))]
fn platform_backend() -> Box<dyn SpoutBackend> {
    Box::new(native::Spout2Backend)
}

#[cfg(not(all(target_os = "windows", target_env = "msvc")))]
fn platform_backend() -> Box<dyn SpoutBackend> {
    Box::new(UnsupportedBackend)
}

#[cfg_attr(all(target_os = "windows", target_env = "msvc"), allow(dead_code))]
struct UnsupportedBackend;

impl SpoutBackend for UnsupportedBackend {
    fn supported(&self) -> bool {
        false
    }

    fn create(&self, _name: &str) -> Result<Box<dyn SpoutSenderHandle>, String> {
        Err(UNSUPPORTED_MESSAGE.to_owned())
    }
}

#[cfg(all(target_os = "windows", target_env = "msvc"))]
mod native {
    use super::{SpoutBackend, SpoutSenderHandle};
    use std::ffi::{c_char, c_int, CStr, CString};
    use std::ptr::NonNull;

    #[repr(C)]
    pub(super) struct RawSender {
        _private: [u8; 0],
    }

    const KGG_SPOUT_OK: c_int = 0;
    const KGG_SPOUT_INVALID_ARGUMENT: c_int = 1;
    const KGG_SPOUT_DIRECTX_UNAVAILABLE: c_int = 2;
    const KGG_SPOUT_SEND_FAILED: c_int = 3;
    const NAME_CAPACITY: usize = 256;

    extern "C" {
        fn kgg_spout_create(
            name: *const c_char,
            out_sender: *mut *mut RawSender,
            actual_name: *mut c_char,
            actual_name_capacity: u32,
        ) -> c_int;
        fn kgg_spout_send_rgba(
            sender: *mut RawSender,
            rgba: *const u8,
            length: usize,
            width: u32,
            height: u32,
            bottom_up: c_int,
        ) -> c_int;
        fn kgg_spout_release(sender: *mut RawSender);
    }

    #[cfg(test)]
    extern "C" {
        pub(super) fn kgg_spout_probe_read_sender(
            name: *const c_char,
            out_bgra: *mut u8,
            length: usize,
            out_width: *mut u32,
            out_height: *mut u32,
            out_format: *mut u32,
        ) -> c_int;
    }

    fn describe(code: c_int, action: &str) -> String {
        match code {
            KGG_SPOUT_INVALID_ARGUMENT => format!("Spout {action} rejected invalid arguments."),
            KGG_SPOUT_DIRECTX_UNAVAILABLE => "DirectX 11 is unavailable, so Spout output cannot start.".to_owned(),
            KGG_SPOUT_SEND_FAILED => format!("Spout {action} failed."),
            _ => format!("Spout {action} failed with an internal error ({code})."),
        }
    }

    pub(super) struct Spout2Backend;

    impl SpoutBackend for Spout2Backend {
        fn supported(&self) -> bool {
            true
        }

        fn create(&self, name: &str) -> Result<Box<dyn SpoutSenderHandle>, String> {
            let c_name = CString::new(name).map_err(|_| "Sender name contains NUL.".to_owned())?;
            let mut raw: *mut RawSender = std::ptr::null_mut();
            let mut actual = [0 as c_char; NAME_CAPACITY];
            // SAFETY: all pointers are valid for the duration of the call and
            // `actual` has the declared capacity.
            let code = unsafe { kgg_spout_create(c_name.as_ptr(), &mut raw, actual.as_mut_ptr(), NAME_CAPACITY as u32) };
            if code != KGG_SPOUT_OK {
                return Err(describe(code, "sender creation"));
            }
            let raw = NonNull::new(raw).ok_or_else(|| describe(-1, "sender creation"))?;
            // SAFETY: the wrapper always NUL-terminates `actual`.
            let sender_name = unsafe { CStr::from_ptr(actual.as_ptr()) }.to_string_lossy().into_owned();
            Ok(Box::new(Spout2Sender { raw, sender_name }))
        }
    }

    pub(super) struct Spout2Sender {
        raw: NonNull<RawSender>,
        sender_name: String,
    }

    // SAFETY: the SpoutDX object is only used through `&mut self` (behind the
    // controller mutex), so it is never accessed from two threads at once.
    unsafe impl Send for Spout2Sender {}

    impl SpoutSenderHandle for Spout2Sender {
        fn sender_name(&self) -> &str {
            &self.sender_name
        }

        fn send_rgba_bottom_up(&mut self, rgba: &[u8], width: u32, height: u32) -> Result<(), String> {
            // SAFETY: `raw` is live until drop; `rgba` is valid for `len` bytes.
            let code = unsafe { kgg_spout_send_rgba(self.raw.as_ptr(), rgba.as_ptr(), rgba.len(), width, height, 1) };
            if code == KGG_SPOUT_OK {
                Ok(())
            } else {
                Err(describe(code, "frame send"))
            }
        }
    }

    impl Drop for Spout2Sender {
        fn drop(&mut self) {
            // SAFETY: `raw` came from kgg_spout_create and is released once.
            unsafe { kgg_spout_release(self.raw.as_ptr()) };
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::sync::{Arc, Mutex as StdMutex};

    #[derive(Default)]
    struct Counters {
        created: AtomicUsize,
        released: AtomicUsize,
        frames: AtomicUsize,
        fail_next_send: StdMutex<bool>,
        fail_create: StdMutex<bool>,
    }

    struct FakeBackend(Arc<Counters>);
    struct FakeSender {
        name: String,
        counters: Arc<Counters>,
    }

    impl SpoutBackend for FakeBackend {
        fn supported(&self) -> bool {
            true
        }

        fn create(&self, name: &str) -> Result<Box<dyn SpoutSenderHandle>, String> {
            if *self.0.fail_create.lock().unwrap() {
                return Err("DirectX 11 is unavailable, so Spout output cannot start.".to_owned());
            }
            self.0.created.fetch_add(1, Ordering::SeqCst);
            Ok(Box::new(FakeSender { name: name.to_owned(), counters: self.0.clone() }))
        }
    }

    impl SpoutSenderHandle for FakeSender {
        fn sender_name(&self) -> &str {
            &self.name
        }

        fn send_rgba_bottom_up(&mut self, _rgba: &[u8], _width: u32, _height: u32) -> Result<(), String> {
            let mut fail = self.counters.fail_next_send.lock().unwrap();
            if *fail {
                *fail = false;
                return Err("Spout frame send failed.".to_owned());
            }
            self.counters.frames.fetch_add(1, Ordering::SeqCst);
            Ok(())
        }
    }

    impl Drop for FakeSender {
        fn drop(&mut self) {
            self.counters.released.fetch_add(1, Ordering::SeqCst);
        }
    }

    fn controller() -> (SpoutOutputController, Arc<Counters>) {
        let counters = Arc::new(Counters::default());
        (SpoutOutputController::new(Box::new(FakeBackend(counters.clone()))), counters)
    }

    fn frame(width: u32, height: u32) -> Vec<u8> {
        vec![0; width as usize * height as usize * 4]
    }

    #[test]
    fn starts_sends_and_stops_a_sender() {
        let (mut output, counters) = controller();
        let status = output.start("  KAGARIBI Grad ").unwrap();
        assert!(status.active);
        assert_eq!(status.sender_name.as_deref(), Some("KAGARIBI Grad"));

        output.send(&frame(4, 2), 4, 2).unwrap();
        output.send(&frame(4, 2), 4, 2).unwrap();
        let status = output.status();
        assert_eq!((status.width, status.height, status.frames_sent), (4, 2, 2));

        let status = output.stop();
        assert!(!status.active);
        assert_eq!(counters.created.load(Ordering::SeqCst), 1);
        assert_eq!(counters.released.load(Ordering::SeqCst), 1);
        // Stopping twice is harmless.
        output.stop();
        assert_eq!(counters.released.load(Ordering::SeqCst), 1);
    }

    #[test]
    fn restarting_with_the_same_name_keeps_the_sender() {
        let (mut output, counters) = controller();
        output.start("KAGARIBI Grad").unwrap();
        output.start("KAGARIBI Grad").unwrap();
        assert_eq!(counters.created.load(Ordering::SeqCst), 1);
        assert_eq!(counters.released.load(Ordering::SeqCst), 0);
    }

    #[test]
    fn renaming_releases_the_previous_sender_first() {
        let (mut output, counters) = controller();
        output.start("KAGARIBI Grad").unwrap();
        let status = output.start("Stage Left").unwrap();
        assert_eq!(status.sender_name.as_deref(), Some("Stage Left"));
        assert_eq!(counters.created.load(Ordering::SeqCst), 2);
        assert_eq!(counters.released.load(Ordering::SeqCst), 1);
    }

    #[test]
    fn rejects_invalid_sender_names() {
        let (mut output, counters) = controller();
        for name in ["", "   ", "tab\tname", "日本語", &"a".repeat(MAX_SENDER_NAME_BYTES + 1)] {
            assert!(output.start(name).is_err(), "{name:?} should be rejected");
        }
        assert_eq!(counters.created.load(Ordering::SeqCst), 0);
        assert!(validate_sender_name(&"a".repeat(MAX_SENDER_NAME_BYTES)).is_ok());
    }

    #[test]
    fn rejects_invalid_dimensions_and_buffer_lengths() {
        let (mut output, counters) = controller();
        output.start("KAGARIBI Grad").unwrap();
        assert!(output.send(&[], 0, 0).is_err());
        assert!(output.send(&frame(1, 1), 0, 1).is_err());
        assert!(output.send(&[0; 4], MAX_FRAME_DIMENSION + 1, 1).is_err());
        assert!(output.send(&frame(4, 2)[..31], 4, 2).is_err());
        assert!(output.send(&[0; 33], 4, 2).is_err());
        // Validation errors are caller errors; the sender stays alive.
        assert!(output.status().active);
        assert_eq!(counters.frames.load(Ordering::SeqCst), 0);
        assert!(validate_frame(4 * MAX_FRAME_DIMENSION as usize, MAX_FRAME_DIMENSION, 1).is_ok());
    }

    #[test]
    fn sending_without_a_sender_is_an_error() {
        let (mut output, _) = controller();
        assert!(output.send(&frame(2, 2), 2, 2).is_err());
    }

    #[test]
    fn a_native_send_failure_releases_the_sender() {
        let (mut output, counters) = controller();
        output.start("KAGARIBI Grad").unwrap();
        *counters.fail_next_send.lock().unwrap() = true;
        assert!(output.send(&frame(2, 2), 2, 2).is_err());
        let status = output.status();
        assert!(!status.active);
        assert_eq!(status.last_error.as_deref(), Some("Spout frame send failed."));
        assert_eq!(counters.released.load(Ordering::SeqCst), 1);
        // A later start recovers and clears the error.
        let status = output.start("KAGARIBI Grad").unwrap();
        assert!(status.active);
        assert_eq!(status.last_error, None);
    }

    #[test]
    fn creation_failure_is_reported_without_a_session() {
        let (mut output, counters) = controller();
        *counters.fail_create.lock().unwrap() = true;
        assert!(output.start("KAGARIBI Grad").is_err());
        let status = output.status();
        assert!(!status.active);
        assert!(status.last_error.is_some());
    }

    #[test]
    fn unsupported_platforms_report_a_clear_error() {
        let mut output = SpoutOutputController::new(Box::new(UnsupportedBackend));
        let error = output.start("KAGARIBI Grad").unwrap_err();
        assert_eq!(error, UNSUPPORTED_MESSAGE);
        assert!(!output.status().supported);
        assert!(output.send(&frame(1, 1), 1, 1).is_err());
    }

    #[test]
    fn shutdown_releases_the_active_sender() {
        let counters = Arc::new(Counters::default());
        let state = SpoutOutputState(Mutex::new(SpoutOutputController::new(Box::new(FakeBackend(counters.clone())))));
        state.lock().start("KAGARIBI Grad").unwrap();
        state.shutdown();
        assert_eq!(counters.released.load(Ordering::SeqCst), 1);
        assert!(!state.lock().status().active);
    }

    /// Real Spout2 round trip on Windows. Needs a DirectX 11 device, so it is
    /// opt-in: `cargo test --manifest-path src-tauri/Cargo.toml spout -- --ignored`.
    #[cfg(all(target_os = "windows", target_env = "msvc"))]
    #[test]
    #[ignore = "requires a Windows DirectX 11 device"]
    fn spout2_sender_round_trip_keeps_orientation_and_channel_order() {
        use std::ffi::CString;

        fn read_sender(name: &str, width: u32, height: u32) -> Result<(Vec<u8>, u32, u32, u32), i32> {
            let c_name = CString::new(name).unwrap();
            let mut pixels = vec![0u8; width as usize * height as usize * 4];
            let (mut w, mut h, mut format) = (0u32, 0u32, 0u32);
            // SAFETY: buffers are valid for the declared sizes.
            let code = unsafe {
                native::kgg_spout_probe_read_sender(c_name.as_ptr(), pixels.as_mut_ptr(), pixels.len(), &mut w, &mut h, &mut format)
            };
            if code == 0 { Ok((pixels, w, h, format)) } else { Err(code) }
        }

        let name = format!("KGG Spout Test {}", std::process::id());
        let mut output = SpoutOutputController::new(platform_backend());
        output.start(&name).unwrap();
        let registered = output.status().sender_name.unwrap();

        // 2x2 RGBA in readPixels order: first row is the bottom of the image.
        // bottom-left red, bottom-right green, top-left blue, top-right white(alpha 128).
        let rgba: Vec<u8> = vec![
            255, 0, 0, 255, 0, 255, 0, 255, //
            0, 0, 255, 255, 255, 255, 255, 128,
        ];
        output.send(&rgba, 2, 2).unwrap();
        let (bgra, width, height, format) = read_sender(&registered, 2, 2).unwrap();
        assert_eq!((width, height), (2, 2));
        assert_eq!(format, 87, "DXGI_FORMAT_B8G8R8A8_UNORM");
        // Top-down BGRA: top-left blue, top-right white, bottom-left red, bottom-right green.
        assert_eq!(bgra, vec![
            255, 0, 0, 255, 255, 255, 255, 128, //
            0, 0, 255, 255, 0, 255, 0, 255,
        ]);

        // A size change updates the same sender.
        output.send(&vec![7u8; 4 * 3 * 4], 4, 3).unwrap();
        let (_, width, height, _) = read_sender(&registered, 4, 3).unwrap();
        assert_eq!((width, height), (4, 3));

        // A second sender asking for the same name receives a suffixed name.
        let mut second = SpoutOutputController::new(platform_backend());
        let second_name = second.start(&name).unwrap().sender_name.unwrap();
        assert_ne!(second_name, registered);
        second.stop();

        output.stop();
        assert!(read_sender(&registered, 4, 3).is_err(), "released sender must disappear");
    }

    /// Measures the native cost per 1080p frame (RGBA→BGRA flip + SendImage).
    /// `cargo test --manifest-path src-tauri/Cargo.toml spout2_1080p -- --ignored --nocapture`
    #[cfg(all(target_os = "windows", target_env = "msvc"))]
    #[test]
    #[ignore = "requires a Windows DirectX 11 device"]
    fn spout2_1080p_native_send_cost() {
        let (width, height) = (1920u32, 1080u32);
        let frame: Vec<u8> = (0..width as usize * height as usize * 4).map(|index| (index % 251) as u8).collect();
        let mut output = SpoutOutputController::new(platform_backend());
        output.start(&format!("KGG Spout Bench {}", std::process::id())).unwrap();
        output.send(&frame, width, height).unwrap();
        let frames = 120;
        let started = std::time::Instant::now();
        for _ in 0..frames {
            output.send(&frame, width, height).unwrap();
        }
        let per_frame = started.elapsed().as_secs_f64() * 1000.0 / frames as f64;
        println!("spout 1080p native send: {per_frame:.2} ms/frame ({:.0} fps max)", 1000.0 / per_frame);
        output.stop();
    }
}
