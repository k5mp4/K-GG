//! Shared-memory frame slots for Spout output (WebView2 SharedBuffer).
//!
//! Sending an 8 MB frame as a Tauri IPC body is slow on WebView2 (seconds per
//! 1080p frame, because the custom-protocol request body is streamed). Instead
//! the host creates a few WebView2 shared buffers, posts them to the page, and
//! the renderer writes each read-back frame directly into one of them. The
//! per-frame IPC call then only names the slot; Rust passes the mapped memory
//! straight to the Spout sender. No frame bytes cross the IPC channel.
//!
//! Slot protocol (enforced by the renderer): a slot is not written again until
//! the `send_spout_shared_frame` call that names it has resolved.

use crate::spout_output::{validate_frame, SpoutOutputState, MAX_FRAME_DIMENSION};
use std::sync::{Mutex, MutexGuard};
use tauri::{State, WebviewWindow};

pub const MAX_SHARED_FRAME_SLOTS: u32 = 3;

#[derive(Clone, Copy)]
struct MappedSlot {
    address: usize,
    length: usize,
}

#[derive(Default)]
struct SharedFramesState {
    generation: u64,
    width: u32,
    height: u32,
    slots: Vec<MappedSlot>,
    last_sequence: u64,
    /// COM objects; only created, closed and dropped on the WebView2 UI thread.
    #[cfg(windows)]
    buffers: Vec<native::UiThreadBuffer>,
}

pub struct SpoutSharedFrames(Mutex<SharedFramesState>);

impl SpoutSharedFrames {
    pub fn new() -> Self {
        Self(Mutex::new(SharedFramesState::default()))
    }

    fn lock(&self) -> MutexGuard<'_, SharedFramesState> {
        self.0.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
    }
}

/// What a send request resolved to, for unit testing the slot bookkeeping.
#[derive(Debug, PartialEq, Eq)]
enum SlotLookup {
    Send(MappedSlotView),
    Stale,
}

#[derive(Debug, PartialEq, Eq)]
struct MappedSlotView {
    address: usize,
    length: usize,
    width: u32,
    height: u32,
}

fn validate_request(width: u32, height: u32, count: u32) -> Result<u64, String> {
    if !(1..=MAX_SHARED_FRAME_SLOTS).contains(&count) {
        return Err(format!("Shared frame slot count must be 1..={MAX_SHARED_FRAME_SLOTS}."));
    }
    if width == 0 || height == 0 || width > MAX_FRAME_DIMENSION || height > MAX_FRAME_DIMENSION {
        return Err(format!("Invalid Spout frame size {width}x{height}."));
    }
    Ok(width as u64 * height as u64 * 4)
}

fn lookup_slot(state: &mut SharedFramesState, generation: u64, slot: u32, sequence: u64) -> Result<SlotLookup, String> {
    // Buffers are replaced on resize/stop while earlier sends are still in
    // flight; those frames are simply discarded.
    if state.slots.is_empty() || generation != state.generation {
        return Ok(SlotLookup::Stale);
    }
    let mapped = *state
        .slots
        .get(slot as usize)
        .ok_or_else(|| format!("Unknown Spout frame slot {slot}."))?;
    // Calls may complete out of order; never send an older frame after a newer one.
    if sequence <= state.last_sequence {
        return Ok(SlotLookup::Stale);
    }
    state.last_sequence = sequence;
    validate_frame(mapped.length, state.width, state.height)?;
    Ok(SlotLookup::Send(MappedSlotView {
        address: mapped.address,
        length: mapped.length,
        width: state.width,
        height: state.height,
    }))
}

/// Creates `count` shared buffers of `width * height * 4` bytes and posts them
/// to the calling page with `{ "kggSpoutFrame": { generation, slot, width, height } }`.
/// Returns an error when the WebView2 runtime has no SharedBuffer support; the
/// renderer then falls back to raw IPC frames.
#[tauri::command]
pub async fn create_spout_frame_buffers(
    window: WebviewWindow,
    frames: State<'_, SpoutSharedFrames>,
    generation: u64,
    width: u32,
    height: u32,
    count: u32,
) -> Result<(), String> {
    let size = validate_request(width, height, count)?;
    release_buffers(&window, &frames);
    #[cfg(windows)]
    {
        let created = native::create_and_post(&window, size, count, generation, width, height)?;
        let mut state = frames.lock();
        state.generation = generation;
        state.width = width;
        state.height = height;
        state.last_sequence = 0;
        state.slots = created.iter().map(|buffer| buffer.mapped).collect();
        state.buffers = created;
        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = (window, size, generation);
        Err("Shared frame buffers are only available on Windows.".to_owned())
    }
}

#[tauri::command]
pub async fn send_spout_shared_frame(
    frames: State<'_, SpoutSharedFrames>,
    spout: State<'_, SpoutOutputState>,
    generation: u64,
    slot: u32,
    sequence: u64,
) -> Result<(), String> {
    // Hold the slot lock while sending so the buffer cannot be closed mid-read.
    let mut state = frames.lock();
    let view = match lookup_slot(&mut state, generation, slot, sequence)? {
        SlotLookup::Stale => return Ok(()),
        SlotLookup::Send(view) => view,
    };
    // SAFETY: the address comes from ICoreWebView2SharedBuffer::Buffer and stays
    // mapped until the buffer is closed, which only happens after this lock is
    // released and the slot list is cleared. The renderer does not write the
    // slot while this call is pending; u8 has no invalid bit patterns, so a
    // misbehaving page can only change pixel values.
    let rgba = unsafe { std::slice::from_raw_parts(view.address as *const u8, view.length) };
    spout.send(rgba, view.width, view.height)
}

#[tauri::command]
pub async fn release_spout_frame_buffers(
    window: WebviewWindow,
    frames: State<'_, SpoutSharedFrames>,
) -> Result<(), String> {
    release_buffers(&window, &frames);
    Ok(())
}

fn release_buffers(window: &WebviewWindow, frames: &SpoutSharedFrames) {
    let mut state = frames.lock();
    state.slots.clear();
    state.generation = 0;
    #[cfg(windows)]
    {
        let buffers = std::mem::take(&mut state.buffers);
        drop(state);
        native::close_on_ui_thread(window, buffers);
    }
    #[cfg(not(windows))]
    let _ = window;
}

#[cfg(windows)]
mod native {
    use super::MappedSlot;
    use std::sync::mpsc;
    use std::time::Duration;
    use tauri::WebviewWindow;
    use webview2_com::Microsoft::Web::WebView2::Win32::{
        ICoreWebView2Environment12, ICoreWebView2SharedBuffer, ICoreWebView2_17,
        COREWEBVIEW2_SHARED_BUFFER_ACCESS_READ_WRITE,
    };
    use windows_core::{Interface, HSTRING, PCWSTR};

    /// A WebView2 COM object that must only be used on the UI thread. It is
    /// moved across threads solely to be handed back to that thread.
    pub(super) struct UiThreadBuffer {
        buffer: ICoreWebView2SharedBuffer,
        pub(super) mapped: MappedSlot,
    }

    // SAFETY: the COM object is created on the UI thread and only closed and
    // released inside `with_webview` callbacks, which run on that thread.
    unsafe impl Send for UiThreadBuffer {}

    const UI_THREAD_TIMEOUT: Duration = Duration::from_secs(5);

    pub(super) fn create_and_post(
        window: &WebviewWindow,
        size: u64,
        count: u32,
        generation: u64,
        width: u32,
        height: u32,
    ) -> Result<Vec<UiThreadBuffer>, String> {
        let (sender, receiver) = mpsc::channel();
        window
            .with_webview(move |webview| {
                let result = (|| -> Result<Vec<UiThreadBuffer>, String> {
                    let unsupported = |error: windows_core::Error| {
                        format!("WebView2 SharedBuffer is unavailable ({error}); update the WebView2 Runtime.")
                    };
                    let environment: ICoreWebView2Environment12 = webview.environment().cast().map_err(unsupported)?;
                    // SAFETY: COM calls on the UI thread with valid interfaces.
                    let core = unsafe { webview.controller().CoreWebView2() }.map_err(|error| error.to_string())?;
                    let core: ICoreWebView2_17 = core.cast().map_err(unsupported)?;
                    let mut created = Vec::with_capacity(count as usize);
                    for slot in 0..count {
                        let buffer = unsafe { environment.CreateSharedBuffer(size) }.map_err(|error| error.to_string())?;
                        let mut address = std::ptr::null_mut::<u8>();
                        unsafe { buffer.Buffer(&mut address) }.map_err(|error| error.to_string())?;
                        let data = HSTRING::from(format!(
                            r#"{{"kggSpoutFrame":{{"generation":{generation},"slot":{slot},"width":{width},"height":{height}}}}}"#
                        ));
                        unsafe {
                            core.PostSharedBufferToScript(
                                &buffer,
                                COREWEBVIEW2_SHARED_BUFFER_ACCESS_READ_WRITE,
                                PCWSTR::from_raw(data.as_ptr()),
                            )
                        }
                        .map_err(|error| error.to_string())?;
                        created.push(UiThreadBuffer {
                            buffer,
                            mapped: MappedSlot { address: address as usize, length: size as usize },
                        });
                    }
                    Ok(created)
                })();
                if let Err(unsent) = sender.send(result) {
                    // The command timed out; close what was created here.
                    if let Ok(buffers) = unsent.0 {
                        close_now(buffers);
                    }
                }
            })
            .map_err(|error| error.to_string())?;
        receiver
            .recv_timeout(UI_THREAD_TIMEOUT)
            .map_err(|_| "Timed out while creating Spout frame buffers.".to_owned())?
    }

    pub(super) fn close_on_ui_thread(window: &WebviewWindow, buffers: Vec<UiThreadBuffer>) {
        if buffers.is_empty() {
            return;
        }
        if let Err(error) = window.with_webview(move |_| close_now(buffers)) {
            eprintln!("Spout frame buffers could not be closed: {error}");
        }
    }

    fn close_now(buffers: Vec<UiThreadBuffer>) {
        for entry in buffers {
            // SAFETY: called on the UI thread; Close unmaps the shared memory.
            let _ = unsafe { entry.buffer.Close() };
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn state_with_slots(generation: u64, width: u32, height: u32, count: usize) -> SharedFramesState {
        let length = width as usize * height as usize * 4;
        SharedFramesState {
            generation,
            width,
            height,
            slots: (0..count).map(|index| MappedSlot { address: 0x1000 * (index + 1), length }).collect(),
            ..Default::default()
        }
    }

    #[test]
    fn validates_slot_requests() {
        assert_eq!(validate_request(1920, 1080, 3).unwrap(), 1920 * 1080 * 4);
        assert!(validate_request(1920, 1080, 0).is_err());
        assert!(validate_request(1920, 1080, MAX_SHARED_FRAME_SLOTS + 1).is_err());
        assert!(validate_request(0, 1080, 3).is_err());
        assert!(validate_request(MAX_FRAME_DIMENSION + 1, 1, 3).is_err());
    }

    #[test]
    fn resolves_the_requested_slot_of_the_current_generation() {
        let mut state = state_with_slots(7, 4, 2, 3);
        let SlotLookup::Send(view) = lookup_slot(&mut state, 7, 2, 1).unwrap() else { panic!("expected a send") };
        assert_eq!(view, MappedSlotView { address: 0x3000, length: 32, width: 4, height: 2 });
    }

    #[test]
    fn discards_replaced_generations_and_rejects_unknown_slots() {
        let mut state = state_with_slots(7, 4, 2, 3);
        assert_eq!(lookup_slot(&mut state, 6, 0, 1).unwrap(), SlotLookup::Stale);
        assert!(lookup_slot(&mut state, 7, 3, 1).is_err());
        let mut released = SharedFramesState::default();
        assert_eq!(lookup_slot(&mut released, 7, 0, 1).unwrap(), SlotLookup::Stale);
    }

    #[test]
    fn drops_frames_that_arrive_after_a_newer_one() {
        let mut state = state_with_slots(7, 4, 2, 3);
        assert!(matches!(lookup_slot(&mut state, 7, 0, 5).unwrap(), SlotLookup::Send(_)));
        assert_eq!(lookup_slot(&mut state, 7, 1, 4).unwrap(), SlotLookup::Stale);
        assert_eq!(lookup_slot(&mut state, 7, 1, 5).unwrap(), SlotLookup::Stale);
        assert!(matches!(lookup_slot(&mut state, 7, 1, 6).unwrap(), SlotLookup::Send(_)));
    }
}
