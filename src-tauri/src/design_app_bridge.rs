use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::PathBuf;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::State;
use uuid::Uuid;

const BRIDGE_IPV4_ADDRESS: &str = "127.0.0.1:43127";
const BRIDGE_IPV6_ADDRESS: &str = "[::1]:43127";
const BRIDGE_URL: &str = "http://localhost:43127";
const AFFINITY_CONNECTOR_PAUSED_MESSAGE: &str =
    "Affinity連携はAffinity公式のスクリプト登録手順を確認後に再開します。";
const ALLOWED_HOSTS: [&str; 3] = ["localhost:43127", BRIDGE_IPV4_ADDRESS, BRIDGE_IPV6_ADDRESS];
/// ブラウザからの要求はOriginで送信元を限定する。Figma PluginのUI iframeは
/// `null` originで動作し、K-GG本体はTauriのアプリoriginまたはdev serverで動作する。
/// Originを持たない要求は同じPC上のブラウザ外プロセスとして扱う。
const ALLOWED_ORIGINS: [&str; 6] = [
    "null",
    "tauri://localhost",
    "http://tauri.localhost",
    "https://tauri.localhost",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
];
const MAX_ACTIVE_CONNECTIONS: usize = 32;
const MAX_PNG_BYTES: usize = 20 * 1024 * 1024;
const MAX_DIMENSION: u32 = 4096;
const MAX_PIXELS: u64 = 16_777_216;
const MAX_HEADER_BYTES: usize = 16 * 1024;
const CLIENT_TTL: Duration = Duration::from_secs(7);
const CONNECTION_REQUEST_TTL: Duration = Duration::from_secs(120);
const CONNECTION_GRANT_TTL: Duration = Duration::from_secs(30);
const TRANSFER_LEASE: Duration = Duration::from_secs(30);
const FIGMA_TRANSFER_TIMEOUT: Duration = Duration::from_secs(45);
const AFFINITY_TRANSFER_TIMEOUT: Duration = Duration::from_secs(120);

#[derive(Clone)]
pub struct DesignAppConnectorBridge {
    inner: Arc<Mutex<BridgeState>>,
}

struct BridgeState {
    available: bool,
    start_error: Option<String>,
    app_token: String,
    figma_connection_request: Option<ConnectionRequest>,
    affinity_connection_request: Option<ConnectionRequest>,
    figma: Option<ClientSession>,
    affinity: Option<ClientSession>,
    figma_transfer: Option<Transfer>,
    affinity_transfer: Option<Transfer>,
    figma_last_transfer: Option<TransferResult>,
    affinity_last_transfer: Option<TransferResult>,
}

struct ClientSession {
    token: String,
    display_name: String,
    last_seen: Instant,
}

struct ConnectionRequest {
    id: String,
    display_name: String,
    verification_code: String,
    created_at: Instant,
    approved_at: Option<Instant>,
    token: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ConnectionRequestStatus {
    id: String,
    display_name: String,
    verification_code: String,
}

struct Transfer {
    id: String,
    name: String,
    width: u32,
    height: u32,
    png: Vec<u8>,
    affinity_path: Option<PathBuf>,
    lease_until: Option<Instant>,
    created_at: Instant,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TransferResult {
    id: String,
    status: String,
    message: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectorStatus {
    connected: bool,
    display_name: Option<String>,
    pending: bool,
    connection_request: Option<ConnectionRequestStatus>,
    last_transfer: Option<TransferResult>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BridgeInfo {
    available: bool,
    endpoint: String,
    app_token: String,
    figma: ConnectorStatus,
    affinity: ConnectorStatus,
    error: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FigmaConnectionRequest {
    display_name: Option<String>,
}

struct HttpRequest {
    method: String,
    path_and_query: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
}

struct HttpRequestError {
    status: u16,
    message: &'static str,
}

struct HttpResponse {
    status: u16,
    content_type: &'static str,
    body: Vec<u8>,
    headers: Vec<(String, String)>,
}

impl BridgeState {
    fn new() -> Self {
        Self {
            available: false,
            start_error: None,
            app_token: new_secret(),
            figma_connection_request: None,
            affinity_connection_request: None,
            figma: None,
            affinity: None,
            figma_transfer: None,
            affinity_transfer: None,
            figma_last_transfer: None,
            affinity_last_transfer: None,
        }
    }

    fn info(&mut self) -> BridgeInfo {
        self.expire_transfers();
        self.expire_connection_requests();
        BridgeInfo {
            available: self.available,
            endpoint: BRIDGE_URL.to_string(),
            app_token: self.app_token.clone(),
            figma: connector_status(
                &self.figma,
                self.figma_transfer.is_some(),
                &self.figma_connection_request,
                &self.figma_last_transfer,
            ),
            affinity: connector_status(
                &self.affinity,
                self.affinity_transfer.is_some(),
                &self.affinity_connection_request,
                &self.affinity_last_transfer,
            ),
            error: self.start_error.clone(),
        }
    }

    fn expire_connection_requests(&mut self) {
        expire_connection_request(&mut self.figma_connection_request);
        expire_connection_request(&mut self.affinity_connection_request);
    }

    fn expire_transfers(&mut self) {
        if self
            .figma_transfer
            .as_ref()
            .is_some_and(|transfer| transfer.created_at.elapsed() >= FIGMA_TRANSFER_TIMEOUT)
        {
            if let Some(transfer) = self.figma_transfer.take() {
                self.figma_last_transfer = Some(TransferResult {
                    id: transfer.id,
                    status: "failed".to_string(),
                    message: Some("Figmaから45秒以内に配置結果が返りませんでした。".to_string()),
                });
            }
        }
        if self
            .affinity_transfer
            .as_ref()
            .is_some_and(|transfer| transfer.created_at.elapsed() >= AFFINITY_TRANSFER_TIMEOUT)
        {
            if let Some(transfer) = self.affinity_transfer.take() {
                if let Some(path) = transfer.affinity_path {
                    let _ = fs::remove_file(path);
                }
                self.affinity_last_transfer = Some(TransferResult {
                    id: transfer.id,
                    status: "failed".to_string(),
                    message: Some("Affinityから2分以内に受信結果が返りませんでした。".to_string()),
                });
            }
        }
    }
}

fn new_secret() -> String {
    Uuid::new_v4().to_string()
}

/// 受信アプリとK-GGの許可画面に同じ値を表示し、利用者が接続元を照合できるようにする。
fn new_verification_code() -> String {
    format!("{:06}", Uuid::new_v4().as_u128() % 1_000_000)
}

fn expire_connection_request(request: &mut Option<ConnectionRequest>) {
    if request.as_ref().is_some_and(|request| {
        request.approved_at.map_or_else(
            || request.created_at.elapsed() >= CONNECTION_REQUEST_TTL,
            |approved_at| approved_at.elapsed() >= CONNECTION_GRANT_TTL,
        )
    }) {
        *request = None;
    }
}

fn connector_status(
    session: &Option<ClientSession>,
    pending: bool,
    connection_request: &Option<ConnectionRequest>,
    last_transfer: &Option<TransferResult>,
) -> ConnectorStatus {
    let connected_session = session
        .as_ref()
        .filter(|client| client.last_seen.elapsed() <= CLIENT_TTL);
    ConnectorStatus {
        connected: connected_session.is_some(),
        display_name: connected_session.map(|client| client.display_name.clone()),
        pending,
        connection_request: connection_request.as_ref().and_then(|request| {
            request.token.is_none().then(|| ConnectionRequestStatus {
                id: request.id.clone(),
                display_name: request.display_name.clone(),
                verification_code: request.verification_code.clone(),
            })
        }),
        last_transfer: last_transfer.clone(),
    }
}

impl DesignAppConnectorBridge {
    pub fn start() -> Self {
        let bridge = Self {
            inner: Arc::new(Mutex::new(BridgeState::new())),
        };

        let listeners = TcpListener::bind(BRIDGE_IPV4_ADDRESS)
            .and_then(|ipv4| TcpListener::bind(BRIDGE_IPV6_ADDRESS).map(|ipv6| (ipv4, ipv6)));
        match listeners {
            Ok((ipv4_listener, ipv6_listener)) => {
                let _ = cleanup_old_transfers();
                let ipv4_inner = Arc::clone(&bridge.inner);
                let ipv4_result = thread::Builder::new()
                    .name("kgg-design-app-bridge-ipv4".to_string())
                    .spawn(move || serve(ipv4_listener, ipv4_inner));
                let start_result = ipv4_result.and_then(|_| {
                    let ipv6_inner = Arc::clone(&bridge.inner);
                    thread::Builder::new()
                        .name("kgg-design-app-bridge-ipv6".to_string())
                        .spawn(move || serve(ipv6_listener, ipv6_inner))
                        .map(|_| ())
                });
                if let Ok(mut state) = bridge.inner.lock() {
                    match start_result {
                        Ok(()) => state.available = true,
                        Err(error) => {
                            state.start_error =
                                Some(format!("ローカル接続を開始できませんでした: {error}"));
                        }
                    }
                }
            }
            Err(error) => {
                if let Ok(mut state) = bridge.inner.lock() {
                    state.start_error = Some(format!("{BRIDGE_URL} を使用できません: {error}"));
                }
            }
        }

        bridge
    }

    fn info(&self) -> Result<BridgeInfo, String> {
        let mut state = self
            .inner
            .lock()
            .map_err(|_| "デザインアプリ接続の状態を取得できませんでした。".to_string())?;
        Ok(state.info())
    }

    fn disconnect(&self, target: &str) -> Result<(), String> {
        let target = ConnectorTarget::parse(target)?;
        let mut state = self
            .inner
            .lock()
            .map_err(|_| "デザインアプリ接続を解除できませんでした。".to_string())?;
        match target {
            ConnectorTarget::Figma => {
                state.figma = None;
                state.figma_connection_request = None;
                clear_transfer(&mut state.figma_transfer);
            }
            ConnectorTarget::Affinity => {
                state.affinity = None;
                state.affinity_connection_request = None;
                clear_transfer(&mut state.affinity_transfer);
            }
        }
        Ok(())
    }

    fn approve_connection(&self, target: &str, request_id: &str) -> Result<(), String> {
        let target = ConnectorTarget::parse(target)?;
        if matches!(target, ConnectorTarget::Affinity) {
            return Err(AFFINITY_CONNECTOR_PAUSED_MESSAGE.to_string());
        }
        let mut state = self
            .inner
            .lock()
            .map_err(|_| "デザインアプリ接続を許可できませんでした。".to_string())?;
        state.expire_connection_requests();

        let pending = match target {
            ConnectorTarget::Figma => state.figma_connection_request.as_ref(),
            ConnectorTarget::Affinity => state.affinity_connection_request.as_ref(),
        }
        .filter(|request| request.id == request_id && request.token.is_none())
        .ok_or_else(|| {
            "接続リクエストの有効期限が切れました。受信アプリから再度接続してください。".to_string()
        })?;
        let display_name = pending.display_name.clone();
        let token = new_secret();
        let now = Instant::now();
        let session = ClientSession {
            token: token.clone(),
            display_name,
            last_seen: now,
        };

        match target {
            ConnectorTarget::Figma => {
                state.figma = Some(session);
                clear_transfer(&mut state.figma_transfer);
                state.figma_last_transfer = None;
                if let Some(request) = state.figma_connection_request.as_mut() {
                    request.token = Some(token);
                    request.approved_at = Some(now);
                }
            }
            ConnectorTarget::Affinity => {
                state.affinity = Some(session);
                clear_transfer(&mut state.affinity_transfer);
                state.affinity_last_transfer = None;
                if let Some(request) = state.affinity_connection_request.as_mut() {
                    request.token = Some(token);
                    request.approved_at = Some(now);
                }
            }
        }
        Ok(())
    }

    fn dismiss_connection(&self, target: &str, request_id: &str) -> Result<(), String> {
        let target = ConnectorTarget::parse(target)?;
        let mut state = self
            .inner
            .lock()
            .map_err(|_| "接続リクエストを閉じられませんでした。".to_string())?;
        let request = match target {
            ConnectorTarget::Figma => &mut state.figma_connection_request,
            ConnectorTarget::Affinity => &mut state.affinity_connection_request,
        };
        if request
            .as_ref()
            .is_some_and(|request| request.id == request_id)
        {
            *request = None;
        }
        Ok(())
    }
}

#[derive(Clone, Copy)]
enum ConnectorTarget {
    Figma,
    Affinity,
}

impl ConnectorTarget {
    fn parse(value: &str) -> Result<Self, String> {
        match value {
            "figma" => Ok(Self::Figma),
            "affinity" => Ok(Self::Affinity),
            _ => Err("送信先アプリを判定できませんでした。".to_string()),
        }
    }
}

#[tauri::command]
pub fn get_design_app_connector_state(
    state: State<'_, DesignAppConnectorBridge>,
) -> Result<BridgeInfo, String> {
    state.info()
}

#[tauri::command]
pub fn disconnect_design_app_connector(
    target: String,
    state: State<'_, DesignAppConnectorBridge>,
) -> Result<(), String> {
    state.disconnect(&target)
}

#[tauri::command]
pub fn approve_design_app_connection(
    target: String,
    request_id: String,
    state: State<'_, DesignAppConnectorBridge>,
) -> Result<(), String> {
    state.approve_connection(&target, &request_id)
}

#[tauri::command]
pub fn dismiss_design_app_connection_request(
    target: String,
    request_id: String,
    state: State<'_, DesignAppConnectorBridge>,
) -> Result<(), String> {
    state.dismiss_connection(&target, &request_id)
}

static ACTIVE_CONNECTIONS: AtomicUsize = AtomicUsize::new(0);

struct ConnectionSlot;

impl ConnectionSlot {
    fn acquire() -> Option<Self> {
        ACTIVE_CONNECTIONS
            .fetch_update(Ordering::AcqRel, Ordering::Acquire, |active| {
                (active < MAX_ACTIVE_CONNECTIONS).then_some(active + 1)
            })
            .ok()
            .map(|_| Self)
    }
}

impl Drop for ConnectionSlot {
    fn drop(&mut self) {
        ACTIVE_CONNECTIONS.fetch_sub(1, Ordering::AcqRel);
    }
}

fn serve(listener: TcpListener, state: Arc<Mutex<BridgeState>>) {
    for connection in listener.incoming() {
        match connection {
            Ok(mut stream) => {
                // 同時接続数を制限し、大量接続でスレッドとメモリを使い切られないようにする。
                let Some(slot) = ConnectionSlot::acquire() else {
                    let _ = write_response(
                        &mut stream,
                        json_response(
                            429,
                            &serde_json::json!({ "error": "Too many connections." }),
                        ),
                        None,
                    );
                    continue;
                };
                let state = Arc::clone(&state);
                let _ = thread::Builder::new()
                    .name("kgg-design-app-request".to_string())
                    .spawn(move || {
                        let _slot = slot;
                        handle_connection(stream, state);
                    });
            }
            Err(_) => thread::sleep(Duration::from_millis(20)),
        }
    }
}

fn handle_connection(mut stream: TcpStream, state: Arc<Mutex<BridgeState>>) {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(10)));

    let request = match read_request(&mut stream) {
        Ok(request) => request,
        Err(error) => {
            let _ = write_response(
                &mut stream,
                json_response(error.status, &serde_json::json!({ "error": error.message })),
                None,
            );
            return;
        }
    };

    if !valid_host(&request) {
        let _ = write_response(
            &mut stream,
            json_response(
                403,
                &serde_json::json!({ "error": "Local host is not allowed." }),
            ),
            None,
        );
        return;
    }

    let cors_origin = match request_origin(&request) {
        Ok(origin) => origin,
        Err(()) => {
            let _ = write_response(
                &mut stream,
                json_response(
                    403,
                    &serde_json::json!({ "error": "Request origin is not allowed." }),
                ),
                None,
            );
            return;
        }
    };

    if request.method == "OPTIONS" {
        let _ = write_response(&mut stream, empty_response(204), cors_origin.as_deref());
        return;
    }

    let response = route_request(request, &state);
    let _ = write_response(&mut stream, response, cors_origin.as_deref());
}

fn read_request(stream: &mut TcpStream) -> Result<HttpRequest, HttpRequestError> {
    let mut bytes = Vec::with_capacity(4096);
    let mut chunk = [0u8; 4096];
    let header_end = loop {
        if let Some(position) = bytes.windows(4).position(|window| window == b"\r\n\r\n") {
            break position;
        }
        if bytes.len() > MAX_HEADER_BYTES {
            return Err(HttpRequestError {
                status: 431,
                message: "Request headers exceed the size limit.",
            });
        }
        let read = stream.read(&mut chunk).map_err(|_| HttpRequestError {
            status: 400,
            message: "Could not read the request.",
        })?;
        if read == 0 {
            return Err(HttpRequestError {
                status: 400,
                message: "Request ended before its headers were complete.",
            });
        }
        bytes.extend_from_slice(&chunk[..read]);
    };

    if header_end > MAX_HEADER_BYTES {
        return Err(HttpRequestError {
            status: 431,
            message: "Request headers exceed the size limit.",
        });
    }
    let header_text = String::from_utf8_lossy(&bytes[..header_end]);
    let mut lines = header_text.split("\r\n");
    let request_line = lines.next().ok_or(HttpRequestError {
        status: 400,
        message: "Request line is missing.",
    })?;
    let mut parts = request_line.split_whitespace();
    let method = parts.next().unwrap_or_default().to_ascii_uppercase();
    let path_and_query = parts.next().unwrap_or_default().to_string();
    if method.is_empty() || !path_and_query.starts_with('/') {
        return Err(HttpRequestError {
            status: 400,
            message: "Request line is invalid.",
        });
    }

    let mut headers = HashMap::new();
    for line in lines {
        let Some((key, value)) = line.split_once(':') else {
            continue;
        };
        headers.insert(key.trim().to_ascii_lowercase(), value.trim().to_string());
    }
    if headers.get("transfer-encoding").is_some() {
        return Err(HttpRequestError {
            status: 501,
            message: "Chunked request bodies are not supported.",
        });
    }

    let content_length = headers
        .get("content-length")
        .map(|value| {
            value.parse::<usize>().map_err(|_| HttpRequestError {
                status: 400,
                message: "Content-Length is invalid.",
            })
        })
        .transpose()?
        .unwrap_or(0);
    if content_length > MAX_PNG_BYTES {
        return Err(HttpRequestError {
            status: 413,
            message: "Request body exceeds the image size limit.",
        });
    }

    let body_start = header_end + 4;
    let required_length = body_start + content_length;
    while bytes.len() < required_length {
        let read = stream.read(&mut chunk).map_err(|_| HttpRequestError {
            status: 400,
            message: "Could not read the request body.",
        })?;
        if read == 0 {
            return Err(HttpRequestError {
                status: 400,
                message: "Request body ended before Content-Length.",
            });
        }
        bytes.extend_from_slice(&chunk[..read]);
    }

    Ok(HttpRequest {
        method,
        path_and_query,
        headers,
        body: bytes[body_start..required_length].to_vec(),
    })
}

/// 許可済みOriginならCORS応答に返すOriginを返す。Originなしは`Ok(None)`、
/// 許可外のブラウザOriginは`Err(())`として状態変更前に拒否する。
fn request_origin(request: &HttpRequest) -> Result<Option<String>, ()> {
    match request.headers.get("origin") {
        None => Ok(None),
        Some(origin) if ALLOWED_ORIGINS.contains(&origin.as_str()) => Ok(Some(origin.clone())),
        Some(_) => Err(()),
    }
}

fn valid_host(request: &HttpRequest) -> bool {
    request.headers.get("host").is_some_and(|host| {
        ALLOWED_HOSTS
            .iter()
            .any(|allowed_host| host.eq_ignore_ascii_case(allowed_host))
    })
}

fn route_request(request: HttpRequest, shared: &Arc<Mutex<BridgeState>>) -> HttpResponse {
    let (path, query) = split_path_query(&request.path_and_query);
    let path = path.to_string();
    let method = request.method.clone();
    if path == "/api/health" && request.method == "GET" {
        return json_response(200, &serde_json::json!({ "ok": true }));
    }

    if matches!(
        path.as_str(),
        "/api/connect/affinity"
            | "/api/connect/affinity/status"
            | "/api/send/affinity"
            | "/api/poll/affinity"
            | "/api/ack/affinity"
    ) {
        return json_response(
            503,
            &serde_json::json!({ "error": AFFINITY_CONNECTOR_PAUSED_MESSAGE }),
        );
    }

    match (method.as_str(), path.as_str()) {
        ("POST", "/api/connect/figma") => request_figma_connection(request, shared),
        ("GET", "/api/connect/affinity") => {
            request_connection("Affinity", ConnectorTarget::Affinity, shared)
        }
        ("GET", "/api/connect/figma/status") => {
            connection_status(&query, ConnectorTarget::Figma, shared)
        }
        ("GET", "/api/connect/affinity/status") => {
            connection_status(&query, ConnectorTarget::Affinity, shared)
        }
        ("POST", "/api/send/figma") => send_image(request, &query, ConnectorTarget::Figma, shared),
        ("POST", "/api/send/affinity") => {
            send_image(request, &query, ConnectorTarget::Affinity, shared)
        }
        ("GET", "/api/poll/figma") => poll_image(&request, ConnectorTarget::Figma, shared),
        ("GET", "/api/poll/affinity") => poll_image(&request, ConnectorTarget::Affinity, shared),
        ("GET", "/api/ack/figma") => acknowledge(&request, &query, ConnectorTarget::Figma, shared),
        ("GET", "/api/ack/affinity") => {
            acknowledge(&request, &query, ConnectorTarget::Affinity, shared)
        }
        _ => json_response(
            404,
            &serde_json::json!({ "error": "Connector route was not found." }),
        ),
    }
}

fn request_figma_connection(
    request: HttpRequest,
    shared: &Arc<Mutex<BridgeState>>,
) -> HttpResponse {
    if request.body.len() > 4096 {
        return json_response(
            413,
            &serde_json::json!({ "error": "Connection request is too large." }),
        );
    }
    let payload: FigmaConnectionRequest = match serde_json::from_slice(&request.body) {
        Ok(payload) => payload,
        Err(_) => {
            return json_response(
                400,
                &serde_json::json!({ "error": "Connection request is invalid." }),
            )
        }
    };
    let display_name = sanitize_display_name(payload.display_name.as_deref().unwrap_or("Figma"));
    request_connection(&display_name, ConnectorTarget::Figma, shared)
}

fn request_connection(
    display_name: &str,
    target: ConnectorTarget,
    shared: &Arc<Mutex<BridgeState>>,
) -> HttpResponse {
    let Ok(mut state) = shared.lock() else {
        return json_response(
            500,
            &serde_json::json!({ "error": "Connector state is unavailable." }),
        );
    };
    state.expire_connection_requests();
    let slot = match target {
        ConnectorTarget::Figma => &mut state.figma_connection_request,
        ConnectorTarget::Affinity => &mut state.affinity_connection_request,
    };
    // 許可済みでsession token受け取り待ちの要求は、別の要求で置き換えない。
    if slot.as_ref().is_some_and(|request| request.token.is_some()) {
        return json_response(
            409,
            &serde_json::json!({ "error": "Another connection is being completed. Retry shortly." }),
        );
    }
    // 要求IDはtoken取得に使う秘密値なので、既存要求のIDを別の要求元へ返さない。
    // 未許可の要求は新しい要求で置き換え、許可画面には最新の要求だけを表示する。
    let request = ConnectionRequest {
        id: new_secret(),
        display_name: display_name.to_string(),
        verification_code: new_verification_code(),
        created_at: Instant::now(),
        approved_at: None,
        token: None,
    };
    let response = serde_json::json!({
        "id": request.id,
        "verificationCode": request.verification_code,
        "status": "approval-required",
    });
    *slot = Some(request);
    json_response(202, &response)
}

fn connection_status(
    query: &HashMap<String, String>,
    target: ConnectorTarget,
    shared: &Arc<Mutex<BridgeState>>,
) -> HttpResponse {
    let Ok(mut state) = shared.lock() else {
        return json_response(
            500,
            &serde_json::json!({ "error": "Connector state is unavailable." }),
        );
    };
    state.expire_connection_requests();
    let id = query.get("id").map(String::as_str).unwrap_or_default();
    let request = match target {
        ConnectorTarget::Figma => state.figma_connection_request.as_ref(),
        ConnectorTarget::Affinity => state.affinity_connection_request.as_ref(),
    }
    .filter(|request| !id.is_empty() && request.id == id);
    let Some(request) = request else {
        return json_response(
            404,
            &serde_json::json!({ "error": "Connection request was not found." }),
        );
    };
    match request.token.as_deref() {
        Some(token) => json_response(200, &serde_json::json!({ "token": token })),
        None => json_response(
            202,
            &serde_json::json!({ "status": "waiting-for-approval" }),
        ),
    }
}

fn send_image(
    request: HttpRequest,
    query: &HashMap<String, String>,
    target: ConnectorTarget,
    shared: &Arc<Mutex<BridgeState>>,
) -> HttpResponse {
    let Ok(mut state) = shared.lock() else {
        return json_response(
            500,
            &serde_json::json!({ "error": "Connector state is unavailable." }),
        );
    };
    state.expire_transfers();
    if !authorized(&request, &state.app_token) {
        return json_response(
            401,
            &serde_json::json!({ "error": "K-GG session is not authorized." }),
        );
    }
    let connected = match target {
        ConnectorTarget::Figma => client_connected(&state.figma),
        ConnectorTarget::Affinity => client_connected(&state.affinity),
    };
    if !connected {
        return json_response(
            409,
            &serde_json::json!({ "error": "Open and connect the receiving app first." }),
        );
    }

    let pending = match target {
        ConnectorTarget::Figma => state.figma_transfer.is_some(),
        ConnectorTarget::Affinity => state.affinity_transfer.is_some(),
    };
    if pending {
        return json_response(
            409,
            &serde_json::json!({ "error": "The previous image is still waiting for the connected app." }),
        );
    }

    let dimensions = match inspect_png_header(&request.body) {
        Ok(dimensions) => dimensions,
        Err(message) => return json_response(400, &serde_json::json!({ "error": message })),
    };
    let id = new_secret();
    let name = sanitize_display_name(
        query
            .get("name")
            .map(String::as_str)
            .unwrap_or("K-GG image"),
    );
    let affinity_path = if matches!(target, ConnectorTarget::Affinity) {
        match write_affinity_transfer(&id, &name, &request.body) {
            Ok(path) => Some(path),
            Err(error) => return json_response(500, &serde_json::json!({ "error": error })),
        }
    } else {
        None
    };
    let transfer = Transfer {
        id: id.clone(),
        name,
        width: dimensions.0,
        height: dimensions.1,
        png: request.body,
        affinity_path,
        lease_until: None,
        created_at: Instant::now(),
    };
    match target {
        ConnectorTarget::Figma => {
            state.figma_transfer = Some(transfer);
            state.figma_last_transfer = Some(TransferResult {
                id: id.clone(),
                status: "queued".to_string(),
                message: None,
            });
        }
        ConnectorTarget::Affinity => {
            state.affinity_transfer = Some(transfer);
            state.affinity_last_transfer = Some(TransferResult {
                id: id.clone(),
                status: "queued".to_string(),
                message: None,
            });
        }
    }
    json_response(202, &serde_json::json!({ "id": id, "status": "queued" }))
}

fn poll_image(
    request: &HttpRequest,
    target: ConnectorTarget,
    shared: &Arc<Mutex<BridgeState>>,
) -> HttpResponse {
    let Ok(mut state) = shared.lock() else {
        return json_response(
            500,
            &serde_json::json!({ "error": "Connector state is unavailable." }),
        );
    };
    state.expire_transfers();
    let token = bearer_token(request);
    let session = match target {
        ConnectorTarget::Figma => state.figma.as_mut(),
        ConnectorTarget::Affinity => state.affinity.as_mut(),
    };
    let Some(session) = session else {
        return json_response(
            401,
            &serde_json::json!({ "error": reconnect_message(target) }),
        );
    };
    if !token.is_some_and(|token| constant_time_eq(token.as_bytes(), session.token.as_bytes())) {
        return json_response(
            401,
            &serde_json::json!({ "error": reconnect_message(target) }),
        );
    }
    session.last_seen = Instant::now();

    let transfer = match target {
        ConnectorTarget::Figma => state.figma_transfer.as_mut(),
        ConnectorTarget::Affinity => state.affinity_transfer.as_mut(),
    };
    let Some(transfer) = transfer else {
        return empty_response(204);
    };
    if transfer
        .lease_until
        .is_some_and(|until| until > Instant::now())
    {
        return empty_response(204);
    }
    transfer.lease_until = Some(Instant::now() + TRANSFER_LEASE);

    match target {
        ConnectorTarget::Figma => {
            let headers = vec![
                ("X-KGG-Transfer-Id".to_string(), transfer.id.clone()),
                (
                    "X-KGG-Transfer-Name".to_string(),
                    encode_header_value(&transfer.name),
                ),
                ("X-KGG-Image-Width".to_string(), transfer.width.to_string()),
                (
                    "X-KGG-Image-Height".to_string(),
                    transfer.height.to_string(),
                ),
            ];
            HttpResponse {
                status: 200,
                content_type: "image/png",
                body: transfer.png.clone(),
                headers,
            }
        }
        ConnectorTarget::Affinity => {
            let Some(path) = transfer.affinity_path.as_ref() else {
                return json_response(
                    500,
                    &serde_json::json!({ "error": "Temporary PNG path is unavailable." }),
                );
            };
            json_response(
                200,
                &serde_json::json!({ "id": transfer.id, "name": transfer.name, "filePath": path.to_string_lossy() }),
            )
        }
    }
}

fn acknowledge(
    request: &HttpRequest,
    query: &HashMap<String, String>,
    target: ConnectorTarget,
    shared: &Arc<Mutex<BridgeState>>,
) -> HttpResponse {
    let Ok(mut state) = shared.lock() else {
        return json_response(
            500,
            &serde_json::json!({ "error": "Connector state is unavailable." }),
        );
    };
    let session = match target {
        ConnectorTarget::Figma => state.figma.as_ref(),
        ConnectorTarget::Affinity => state.affinity.as_ref(),
    };
    if !session.is_some_and(|session| {
        bearer_token(request)
            .is_some_and(|token| constant_time_eq(token.as_bytes(), session.token.as_bytes()))
    }) {
        return json_response(
            401,
            &serde_json::json!({ "error": reconnect_message(target) }),
        );
    }

    let id = query.get("id").map(String::as_str).unwrap_or_default();
    let status = if query.get("result").map(String::as_str) == Some("failed") {
        "failed"
    } else {
        "delivered"
    };
    let message = query
        .get("message")
        .map(|message| sanitize_display_name(message));
    let pending_id = match target {
        ConnectorTarget::Figma => state
            .figma_transfer
            .as_ref()
            .map(|transfer| transfer.id.as_str()),
        ConnectorTarget::Affinity => state
            .affinity_transfer
            .as_ref()
            .map(|transfer| transfer.id.as_str()),
    };
    if pending_id != Some(id) || id.is_empty() {
        let latest = match target {
            ConnectorTarget::Figma => state.figma_last_transfer.as_mut(),
            ConnectorTarget::Affinity => state.affinity_last_transfer.as_mut(),
        };
        if let Some(latest) = latest.filter(|transfer| transfer.id == id) {
            if latest.status == "failed" && status == "delivered" {
                latest.status = status.to_string();
                latest.message = message;
            }
            return json_response(200, &serde_json::json!({ "ok": true }));
        }
        return json_response(
            404,
            &serde_json::json!({ "error": "Image transfer was not found." }),
        );
    }

    let transfer = match target {
        ConnectorTarget::Figma => state.figma_transfer.take(),
        ConnectorTarget::Affinity => state.affinity_transfer.take(),
    };
    if let Some(path) = transfer.and_then(|transfer| transfer.affinity_path) {
        let _ = fs::remove_file(path);
    }
    let result = TransferResult {
        id: id.to_string(),
        status: status.to_string(),
        message,
    };
    match target {
        ConnectorTarget::Figma => state.figma_last_transfer = Some(result),
        ConnectorTarget::Affinity => state.affinity_last_transfer = Some(result),
    }
    json_response(200, &serde_json::json!({ "ok": true }))
}

fn client_connected(client: &Option<ClientSession>) -> bool {
    client
        .as_ref()
        .is_some_and(|client| client.last_seen.elapsed() <= CLIENT_TTL)
}

fn authorized(request: &HttpRequest, expected: &str) -> bool {
    bearer_token(request)
        .is_some_and(|token| constant_time_eq(token.as_bytes(), expected.as_bytes()))
}

fn reconnect_message(target: ConnectorTarget) -> &'static str {
    match target {
        ConnectorTarget::Figma => "Figma Connectorから接続をリクエストし、K-GGで許可してください。",
        ConnectorTarget::Affinity => {
            "Affinity Connectorから接続をリクエストし、K-GGで許可してください。"
        }
    }
}

fn bearer_token(request: &HttpRequest) -> Option<&str> {
    request
        .headers
        .get("authorization")?
        .strip_prefix("Bearer ")
}

fn constant_time_eq(left: &[u8], right: &[u8]) -> bool {
    if left.len() != right.len() {
        return false;
    }
    left.iter()
        .zip(right)
        .fold(0u8, |difference, (a, b)| difference | (a ^ b))
        == 0
}

fn inspect_png_header(bytes: &[u8]) -> Result<(u32, u32), &'static str> {
    const SIGNATURE: [u8; 8] = [137, 80, 78, 71, 13, 10, 26, 10];
    if bytes.len() < 45
        || bytes.len() > MAX_PNG_BYTES
        || bytes[..8] != SIGNATURE
        || bytes[8..12] != [0, 0, 0, 13]
        || &bytes[12..16] != b"IHDR"
    {
        return Err("送信データがPNG画像として認識できませんでした。");
    }
    let width = u32::from_be_bytes(
        bytes[16..20]
            .try_into()
            .map_err(|_| "PNGの幅を読み取れませんでした。")?,
    );
    let height = u32::from_be_bytes(
        bytes[20..24]
            .try_into()
            .map_err(|_| "PNGの高さを読み取れませんでした。")?,
    );
    if width == 0
        || height == 0
        || width > MAX_DIMENSION
        || height > MAX_DIMENSION
        || u64::from(width) * u64::from(height) > MAX_PIXELS
    {
        return Err("PNG画像の寸法が上限を超えています。");
    }
    Ok((width, height))
}

fn write_affinity_transfer(id: &str, name: &str, bytes: &[u8]) -> Result<PathBuf, String> {
    let directory = std::env::temp_dir().join("kgg-design-app-transfers");
    fs::create_dir_all(&directory)
        .map_err(|error| format!("一時画像の保存先を準備できませんでした: {error}"))?;
    let file_stem = name
        .chars()
        .map(|character| {
            if character.is_control()
                || matches!(
                    character,
                    '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|'
                )
            {
                '_'
            } else {
                character
            }
        })
        .take(80)
        .collect::<String>()
        .trim()
        .to_string();
    let path = directory.join(format!(
        "{id}-{}.png",
        if file_stem.is_empty() {
            "K-GG image"
        } else {
            &file_stem
        }
    ));
    fs::write(&path, bytes)
        .map_err(|error| format!("Affinityへ渡す一時画像を作成できませんでした: {error}"))?;
    Ok(path)
}

fn cleanup_old_transfers() -> std::io::Result<()> {
    let directory = std::env::temp_dir().join("kgg-design-app-transfers");
    if !directory.exists() {
        return Ok(());
    }
    let cutoff = Duration::from_secs(24 * 60 * 60);
    for entry in fs::read_dir(directory)? {
        let entry = entry?;
        let metadata = entry.metadata()?;
        let expired = metadata
            .modified()
            .ok()
            .and_then(|modified| modified.elapsed().ok())
            .is_some_and(|age| age > cutoff);
        if expired && metadata.is_file() {
            let _ = fs::remove_file(entry.path());
        }
    }
    Ok(())
}

fn clear_transfer(transfer: &mut Option<Transfer>) {
    if let Some(path) = transfer.take().and_then(|transfer| transfer.affinity_path) {
        let _ = fs::remove_file(path);
    }
}

fn sanitize_display_name(value: &str) -> String {
    let name = value
        .chars()
        .filter(|character| !character.is_control() && !matches!(character, '/' | '\\'))
        .take(100)
        .collect::<String>()
        .trim()
        .to_string();
    if name.is_empty() {
        "K-GG image".to_string()
    } else {
        name
    }
}

fn split_path_query(value: &str) -> (&str, HashMap<String, String>) {
    let Some((path, query)) = value.split_once('?') else {
        return (value, HashMap::new());
    };
    let values = query
        .split('&')
        .filter_map(|pair| {
            let (key, value) = pair.split_once('=').unwrap_or((pair, ""));
            Some((percent_decode(key)?, percent_decode(value)?))
        })
        .collect();
    (path, values)
}

fn percent_decode(value: &str) -> Option<String> {
    let bytes = value.as_bytes();
    let mut decoded = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        match bytes[index] {
            b'+' => {
                decoded.push(b' ');
                index += 1;
            }
            b'%' if index + 2 < bytes.len() => {
                let high = (bytes[index + 1] as char).to_digit(16)? as u8;
                let low = (bytes[index + 2] as char).to_digit(16)? as u8;
                decoded.push((high << 4) | low);
                index += 3;
            }
            b'%' => return None,
            byte => {
                decoded.push(byte);
                index += 1;
            }
        }
    }
    String::from_utf8(decoded).ok()
}

fn encode_header_value(value: &str) -> String {
    let mut encoded = String::new();
    for byte in value.as_bytes() {
        if byte.is_ascii_alphanumeric() || matches!(*byte, b'-' | b'_' | b'.' | b'~' | b' ') {
            encoded.push(*byte as char);
        } else {
            encoded.push_str(&format!("%{byte:02X}"));
        }
    }
    encoded
}

fn json_response<T: Serialize>(status: u16, value: &T) -> HttpResponse {
    HttpResponse {
        status,
        content_type: "application/json; charset=utf-8",
        body: serde_json::to_vec(value).unwrap_or_else(|_| b"{}".to_vec()),
        headers: Vec::new(),
    }
}

fn empty_response(status: u16) -> HttpResponse {
    HttpResponse {
        status,
        content_type: "application/json; charset=utf-8",
        body: Vec::new(),
        headers: Vec::new(),
    }
}

fn status_text(status: u16) -> &'static str {
    match status {
        200 => "OK",
        202 => "Accepted",
        204 => "No Content",
        400 => "Bad Request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not Found",
        409 => "Conflict",
        413 => "Payload Too Large",
        429 => "Too Many Requests",
        431 => "Request Header Fields Too Large",
        503 => "Service Unavailable",
        501 => "Not Implemented",
        _ => "Internal Server Error",
    }
}

fn write_response(
    stream: &mut TcpStream,
    response: HttpResponse,
    cors_origin: Option<&str>,
) -> std::io::Result<()> {
    write!(
        stream,
        "HTTP/1.1 {} {}\r\n",
        response.status,
        status_text(response.status)
    )?;
    write!(stream, "Content-Type: {}\r\n", response.content_type)?;
    write!(stream, "Content-Length: {}\r\n", response.body.len())?;
    write!(stream, "Connection: close\r\n")?;
    write!(stream, "Cache-Control: no-store\r\n")?;
    write!(stream, "Vary: Origin\r\n")?;
    if let Some(origin) = cors_origin {
        write!(stream, "Access-Control-Allow-Origin: {origin}\r\n")?;
    }
    write!(
        stream,
        "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
    )?;
    write!(
        stream,
        "Access-Control-Allow-Headers: Authorization, Content-Type\r\n"
    )?;
    write!(stream, "Access-Control-Max-Age: 600\r\n")?;
    write!(stream, "Access-Control-Allow-Private-Network: true\r\n")?;
    write!(stream, "Access-Control-Expose-Headers: X-KGG-Transfer-Id, X-KGG-Transfer-Name, X-KGG-Image-Width, X-KGG-Image-Height\r\n")?;
    for (name, value) in response.headers {
        write!(stream, "{name}: {value}\r\n")?;
    }
    write!(stream, "\r\n")?;
    stream.write_all(&response.body)?;
    stream.flush()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn shared_state() -> Arc<Mutex<BridgeState>> {
        Arc::new(Mutex::new(BridgeState::new()))
    }

    fn body_json(response: &HttpResponse) -> serde_json::Value {
        serde_json::from_slice(&response.body).expect("response body should be JSON")
    }

    fn request_with_origin(origin: Option<&str>) -> HttpRequest {
        let mut headers = HashMap::new();
        headers.insert("host".to_string(), "localhost:43127".to_string());
        if let Some(origin) = origin {
            headers.insert("origin".to_string(), origin.to_string());
        }
        HttpRequest {
            method: "POST".to_string(),
            path_and_query: "/api/connect/figma".to_string(),
            headers,
            body: Vec::new(),
        }
    }

    #[test]
    fn accepts_only_allowed_browser_origins() {
        assert_eq!(request_origin(&request_with_origin(None)), Ok(None));
        assert_eq!(
            request_origin(&request_with_origin(Some("null"))),
            Ok(Some("null".to_string()))
        );
        assert_eq!(
            request_origin(&request_with_origin(Some("http://tauri.localhost"))),
            Ok(Some("http://tauri.localhost".to_string()))
        );
        assert_eq!(
            request_origin(&request_with_origin(Some("https://example.com"))),
            Err(())
        );
    }

    #[test]
    fn issues_a_new_request_id_to_each_requester() {
        let shared = shared_state();
        let first = body_json(&request_connection(
            "Figma",
            ConnectorTarget::Figma,
            &shared,
        ));
        let second = body_json(&request_connection(
            "Figma",
            ConnectorTarget::Figma,
            &shared,
        ));
        let first_id = first["id"].as_str().expect("first id");
        let second_id = second["id"].as_str().expect("second id");

        assert_ne!(first_id, second_id);
        let code = second["verificationCode"]
            .as_str()
            .expect("verification code");
        assert_eq!(code.len(), 6);
        assert!(code.chars().all(|character| character.is_ascii_digit()));

        let mut query = HashMap::new();
        query.insert("id".to_string(), first_id.to_string());
        let replaced = connection_status(&query, ConnectorTarget::Figma, &shared);
        assert_eq!(
            replaced.status, 404,
            "a replaced request id must not stay valid"
        );
    }

    #[test]
    fn returns_the_session_token_only_to_the_approved_request_id() {
        let shared = shared_state();
        let bridge = DesignAppConnectorBridge {
            inner: Arc::clone(&shared),
        };
        let created = body_json(&request_connection(
            "Figma",
            ConnectorTarget::Figma,
            &shared,
        ));
        let id = created["id"].as_str().expect("request id").to_string();
        bridge
            .approve_connection("figma", &id)
            .expect("approve pending request");

        let late = request_connection("Figma", ConnectorTarget::Figma, &shared);
        assert_eq!(
            late.status, 409,
            "an approved request waiting for token pickup must not be replaced"
        );

        let mut query = HashMap::new();
        query.insert("id".to_string(), id);
        let status = connection_status(&query, ConnectorTarget::Figma, &shared);
        assert_eq!(status.status, 200);
        assert!(body_json(&status)["token"].is_string());
    }
}
