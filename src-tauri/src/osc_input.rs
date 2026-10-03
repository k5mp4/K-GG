//! OSC入力: ローカルのUDPポートでOSCメッセージを受信し、Rendererへイベントとして転送する。
//!
//! ブラウザはUDPを受信できないため、受信はRust側だけで行う。有効/無効とポートは
//! Rendererの設定（Controller）から切り替える。外部入力は信頼せず、
//! ループバックにだけバインドし、メッセージ数・引数数・アドレス長を制限して数値だけを渡す。

use serde::Serialize;
use std::io::ErrorKind;
use std::net::{Ipv4Addr, SocketAddr, UdpSocket};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

/// 1024未満の特権ポートは受け付けない。
const MIN_OSC_INPUT_PORT: u16 = 1024;
pub const OSC_INPUT_EVENT: &str = "kgg-osc";

const MAX_PACKET_BYTES: usize = 8192;
const MAX_ADDRESS_BYTES: usize = 128;
const MAX_ARGS_PER_MESSAGE: usize = 8;
const MAX_BUNDLE_DEPTH: usize = 4;
const MAX_MESSAGES_PER_EVENT: usize = 256;
const FLUSH_INTERVAL: Duration = Duration::from_millis(16);

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct OscMessage {
    pub address: String,
    pub args: Vec<f64>,
}

/// 4バイト境界の終端付き文字列を読み、次の読み取り位置を返す。
fn read_padded_str(data: &[u8], start: usize) -> Option<(&str, usize)> {
    let rest = data.get(start..)?;
    let len = rest.iter().position(|&byte| byte == 0)?;
    let text = std::str::from_utf8(&rest[..len]).ok()?;
    let end = start + (len + 4) / 4 * 4;
    if end > data.len() {
        return None;
    }
    Some((text, end))
}

fn read_bytes<const N: usize>(data: &[u8], start: usize) -> Option<([u8; N], usize)> {
    let bytes = data.get(start..start + N)?;
    Some((bytes.try_into().ok()?, start + N))
}

fn parse_message(data: &[u8]) -> Option<OscMessage> {
    let (address, mut cursor) = read_padded_str(data, 0)?;
    if !address.starts_with('/') || address.len() > MAX_ADDRESS_BYTES {
        return None;
    }
    // 型タグを省略した古いOSCは対象外にする。
    let (tags, next) = read_padded_str(data, cursor)?;
    cursor = next;
    let tags = tags.strip_prefix(',')?;
    let mut args = Vec::new();
    for tag in tags.chars() {
        if args.len() >= MAX_ARGS_PER_MESSAGE {
            break;
        }
        match tag {
            'i' => {
                let (bytes, next) = read_bytes::<4>(data, cursor)?;
                cursor = next;
                args.push(i32::from_be_bytes(bytes) as f64);
            }
            'f' => {
                let (bytes, next) = read_bytes::<4>(data, cursor)?;
                cursor = next;
                let value = f32::from_be_bytes(bytes) as f64;
                if !value.is_finite() {
                    return None;
                }
                args.push(value);
            }
            'd' => {
                let (bytes, next) = read_bytes::<8>(data, cursor)?;
                cursor = next;
                let value = f64::from_be_bytes(bytes);
                if !value.is_finite() {
                    return None;
                }
                args.push(value);
            }
            'h' => {
                let (bytes, next) = read_bytes::<8>(data, cursor)?;
                cursor = next;
                args.push(i64::from_be_bytes(bytes) as f64);
            }
            'T' => args.push(1.0),
            'F' => args.push(0.0),
            // 文字列などの値は使わない。後続の引数位置を決められないためここで打ち切る。
            _ => break,
        }
    }
    Some(OscMessage { address: address.to_string(), args })
}

fn parse_packet(data: &[u8], depth: usize, out: &mut Vec<OscMessage>) {
    if data.starts_with(b"#bundle\0") {
        if depth >= MAX_BUNDLE_DEPTH {
            return;
        }
        let mut cursor = 16; // "#bundle\0" と timetag
        while let Some((size_bytes, next)) = read_bytes::<4>(data, cursor) {
            let size = i32::from_be_bytes(size_bytes);
            let Ok(size) = usize::try_from(size) else { return };
            let Some(element) = data.get(next..next.saturating_add(size)) else { return };
            parse_packet(element, depth + 1, out);
            cursor = next + size;
        }
    } else if let Some(message) = parse_message(data) {
        out.push(message);
    }
}

#[cfg(test)]
fn parse_osc_packet(data: &[u8]) -> Vec<OscMessage> {
    let mut messages = Vec::new();
    parse_packet(data, 0, &mut messages);
    messages
}

fn flush(app: &AppHandle, pending: &mut Vec<OscMessage>) {
    if pending.is_empty() {
        return;
    }
    let _ = app.emit(OSC_INPUT_EVENT, std::mem::take(pending));
}

fn receive_loop(app: AppHandle, socket: UdpSocket, stop: Arc<AtomicBool>) {
    let mut buffer = [0u8; MAX_PACKET_BYTES];
    let mut pending: Vec<OscMessage> = Vec::new();
    let mut last_flush = Instant::now();
    while !stop.load(Ordering::Relaxed) {
        match socket.recv_from(&mut buffer) {
            Ok((length, _)) => {
                if pending.len() < MAX_MESSAGES_PER_EVENT {
                    parse_packet(&buffer[..length], 0, &mut pending);
                    pending.truncate(MAX_MESSAGES_PER_EVENT);
                }
            }
            Err(error) if matches!(error.kind(), ErrorKind::WouldBlock | ErrorKind::TimedOut) => {}
            Err(error) => {
                eprintln!("OSC入力の受信に失敗しました: {error}");
                thread::sleep(Duration::from_millis(100));
            }
        }
        // 連続する入力は約16msごとにまとめて送り、IPC回数を抑える。
        if last_flush.elapsed() >= FLUSH_INTERVAL {
            flush(&app, &mut pending);
            last_flush = Instant::now();
        }
    }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OscInputStatus {
    pub listening: bool,
    pub port: Option<u16>,
    pub error: Option<String>,
}

struct Receiver {
    port: u16,
    stop: Arc<AtomicBool>,
    thread: Option<thread::JoinHandle<()>>,
}

impl Receiver {
    /// 受信スレッドを止め、ソケットが閉じるまで待つ（同じポートへ再バインドできるようにする）。
    fn shutdown(mut self) {
        self.stop.store(true, Ordering::Relaxed);
        if let Some(handle) = self.thread.take() {
            let _ = handle.join();
        }
    }
}

#[derive(Default)]
pub struct OscInputState {
    receiver: Mutex<Option<Receiver>>,
}

impl OscInputState {
    fn status(receiver: &Option<Receiver>, error: Option<String>) -> OscInputStatus {
        OscInputStatus {
            listening: receiver.is_some(),
            port: receiver.as_ref().map(|receiver| receiver.port),
            error,
        }
    }

    fn start_receiver(app: &AppHandle, port: u16) -> Result<Receiver, String> {
        let address = SocketAddr::from((Ipv4Addr::LOCALHOST, port));
        let socket = UdpSocket::bind(address)
            .map_err(|error| format!("{address} を使用できません: {error}"))?;
        socket
            .set_read_timeout(Some(FLUSH_INTERVAL))
            .map_err(|error| format!("受信設定に失敗しました: {error}"))?;
        let stop = Arc::new(AtomicBool::new(false));
        let thread_stop = Arc::clone(&stop);
        let app = app.clone();
        let thread = thread::Builder::new()
            .name("kgg-osc-input".to_string())
            .spawn(move || receive_loop(app, socket, thread_stop))
            .map_err(|error| format!("受信スレッドを開始できませんでした: {error}"))?;
        Ok(Receiver { port, stop, thread: Some(thread) })
    }

    /// 受信の有効/無効とポートを反映する。同じ設定なら何もしない。
    fn configure(&self, app: &AppHandle, enabled: bool, port: u16) -> OscInputStatus {
        let mut guard = match self.receiver.lock() {
            Ok(guard) => guard,
            Err(poisoned) => poisoned.into_inner(),
        };
        if enabled && guard.as_ref().is_some_and(|receiver| receiver.port == port) {
            return Self::status(&guard, None);
        }
        if let Some(receiver) = guard.take() {
            receiver.shutdown();
        }
        if !enabled {
            return Self::status(&guard, None);
        }
        if port < MIN_OSC_INPUT_PORT {
            return Self::status(&guard, Some(format!("ポートは{MIN_OSC_INPUT_PORT}以上を指定してください")));
        }
        match Self::start_receiver(app, port) {
            Ok(receiver) => {
                *guard = Some(receiver);
                Self::status(&guard, None)
            }
            Err(error) => Self::status(&guard, Some(error)),
        }
    }

    pub fn shutdown(&self) {
        if let Ok(mut guard) = self.receiver.lock() {
            if let Some(receiver) = guard.take() {
                receiver.shutdown();
            }
        }
    }
}

/// OSC入力の有効/無効とUDPポートを設定する。ポート使用中などの失敗は状態として返す。
#[tauri::command]
pub fn configure_osc_input(
    app: AppHandle,
    state: tauri::State<'_, OscInputState>,
    enabled: bool,
    port: u16,
) -> OscInputStatus {
    state.configure(&app, enabled, port)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn padded(text: &str) -> Vec<u8> {
        let mut bytes = text.as_bytes().to_vec();
        bytes.push(0);
        while bytes.len() % 4 != 0 {
            bytes.push(0);
        }
        bytes
    }

    fn message(address: &str, tags: &str, payload: &[u8]) -> Vec<u8> {
        let mut bytes = padded(address);
        bytes.extend(padded(tags));
        bytes.extend_from_slice(payload);
        bytes
    }

    #[test]
    fn parses_float_and_int_arguments() {
        let mut payload = 0.5f32.to_be_bytes().to_vec();
        payload.extend(1i32.to_be_bytes());
        let parsed = parse_osc_packet(&message("/gc/1/stick/x", ",fi", &payload));
        assert_eq!(parsed, vec![OscMessage { address: "/gc/1/stick/x".into(), args: vec![0.5, 1.0] }]);
    }

    #[test]
    fn parses_bundle_elements() {
        let first = message("/gc/1/z", ",i", &1i32.to_be_bytes());
        let second = message("/gc/1/a", ",i", &0i32.to_be_bytes());
        let mut bundle = b"#bundle\0".to_vec();
        bundle.extend([0u8; 8]);
        for element in [&first, &second] {
            bundle.extend((element.len() as i32).to_be_bytes());
            bundle.extend(element);
        }
        let parsed = parse_osc_packet(&bundle);
        assert_eq!(parsed.len(), 2);
        assert_eq!(parsed[1].address, "/gc/1/a");
    }

    #[test]
    fn rejects_malformed_input() {
        assert!(parse_osc_packet(b"").is_empty());
        assert!(parse_osc_packet(b"not osc").is_empty());
        // 引数が足りない
        assert!(parse_osc_packet(&message("/gc/1/z", ",i", &[0, 0])).is_empty());
        // 非有限のfloat
        assert!(parse_osc_packet(&message("/x", ",f", &f32::NAN.to_be_bytes())).is_empty());
        // 負のbundleサイズ
        let mut bundle = b"#bundle\0".to_vec();
        bundle.extend([0u8; 8]);
        bundle.extend((-1i32).to_be_bytes());
        assert!(parse_osc_packet(&bundle).is_empty());
    }
}
