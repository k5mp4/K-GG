use serde::{Deserialize, Serialize};
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};
use uuid::Uuid;

#[cfg(windows)]
use std::os::windows::fs::MetadataExt;

const TEMP_ROOT_DIR: &str = "kagaribi-grad";
const REQUEST_ROOT_DIR: &str = "after-effects-requests";
const ASSET_ROOT_DIR: &str = "after-effects-assets";
const MAX_ASSET_BYTES: u64 = 2 * 1024 * 1024 * 1024;
const MAX_RESULT_BYTES: u64 = 256 * 1024;
const AE_OPERATION_TIMEOUT: Duration = Duration::from_secs(120);
const PROJECT_DIRECTORY_TIMEOUT: Duration = Duration::from_secs(5);
const POLL_INTERVAL: Duration = Duration::from_millis(50);
const COMPLETION_SCHEMA_VERSION: u8 = 1;

static AE_OPERATION_LOCK: Mutex<()> = Mutex::new(());

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AfterEffectsStatus {
    supported: bool,
    running: bool,
    executable_path: Option<String>,
    error: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AfterEffectsTransferResult {
    status: String,
    destination_kind: Option<String>,
    message: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AfterEffectsAssetRequest {
    input_path: String,
    extension: String,
    name: String,
    save_dir: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CompletionPayload {
    schema_version: u8,
    request_id: String,
    operation: String,
    status: String,
    #[serde(default)]
    message: String,
}

struct WorkspaceGuard(PathBuf);

impl Drop for WorkspaceGuard {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

#[tauri::command]
pub async fn get_after_effects_status() -> Result<AfterEffectsStatus, String> {
    tauri::async_runtime::spawn_blocking(detect_after_effects)
        .await
        .map_err(|err| format!("After Effectsの状態確認に失敗しました: {err}"))
}

#[tauri::command]
pub async fn ping_after_effects() -> Result<AfterEffectsTransferResult, String> {
    tauri::async_runtime::spawn_blocking(run_ping)
        .await
        .map_err(|err| format!("After Effects接続テストに失敗しました: {err}"))?
}

#[tauri::command]
pub async fn send_after_effects_asset(
    request: AfterEffectsAssetRequest,
) -> Result<AfterEffectsTransferResult, String> {
    tauri::async_runtime::spawn_blocking(move || run_asset_transfer(request))
        .await
        .map_err(|err| format!("After Effects送信に失敗しました: {err}"))?
}

fn success_result(destination_kind: Option<&str>) -> AfterEffectsTransferResult {
    AfterEffectsTransferResult {
        status: "ok".to_string(),
        destination_kind: destination_kind.map(str::to_string),
        message: None,
    }
}

fn status_result(status: &str, message: impl Into<String>) -> AfterEffectsTransferResult {
    AfterEffectsTransferResult {
        status: status.to_string(),
        destination_kind: None,
        message: Some(message.into()),
    }
}

fn destination_result(
    status: &str,
    destination_kind: Option<&str>,
    message: impl Into<String>,
) -> AfterEffectsTransferResult {
    AfterEffectsTransferResult {
        status: status.to_string(),
        destination_kind: destination_kind.map(str::to_string),
        message: Some(message.into()),
    }
}

fn temp_root() -> PathBuf {
    std::env::temp_dir().join(TEMP_ROOT_DIR)
}

fn has_reparse_point(metadata: &fs::Metadata) -> bool {
    #[cfg(windows)]
    {
        return metadata.file_attributes() & 0x0400 != 0;
    }

    #[cfg(not(windows))]
    {
        let _ = metadata;
        false
    }
}

fn is_link_or_reparse_point(path: &Path) -> Result<bool, String> {
    let metadata = fs::symlink_metadata(path)
        .map_err(|err| format!("パスの安全性を確認できませんでした: {err}"))?;
    Ok(metadata.file_type().is_symlink() || has_reparse_point(&metadata))
}

fn ensure_plain_directory(path: &Path) -> Result<PathBuf, String> {
    if path.exists() {
        if is_link_or_reparse_point(path)? {
            return Err(format!(
                "リンクまたは再解析ポイントは保存先に使えません: {}",
                path.display()
            ));
        }
        if !fs::metadata(path)
            .map_err(|err| format!("保存先を確認できませんでした: {err}"))?
            .is_dir()
        {
            return Err(format!(
                "保存先がフォルダーではありません: {}",
                path.display()
            ));
        }
    } else {
        fs::create_dir_all(path)
            .map_err(|err| format!("フォルダーを作成できませんでした: {err}"))?;
    }

    let canonical =
        fs::canonicalize(path).map_err(|err| format!("保存先を正規化できませんでした: {err}"))?;
    if is_link_or_reparse_point(&canonical)? {
        return Err(format!(
            "リンクまたは再解析ポイントは保存先に使えません: {}",
            canonical.display()
        ));
    }
    if !fs::metadata(&canonical)
        .map_err(|err| format!("保存先を確認できませんでした: {err}"))?
        .is_dir()
    {
        return Err(format!(
            "保存先がフォルダーではありません: {}",
            canonical.display()
        ));
    }
    Ok(canonical)
}

fn existing_plain_directory(path: &Path) -> Option<PathBuf> {
    if !path.is_dir() || is_link_or_reparse_point(path).ok()? {
        return None;
    }
    let canonical = fs::canonicalize(path).ok()?;
    if is_link_or_reparse_point(&canonical).ok()? {
        return None;
    }
    fs::metadata(&canonical).ok()?.is_dir().then_some(canonical)
}

fn create_request_workspace() -> Result<(PathBuf, String), String> {
    let root = ensure_plain_directory(&temp_root().join(REQUEST_ROOT_DIR))?;
    for _ in 0..16 {
        let request_id = Uuid::new_v4().simple().to_string();
        let path = root.join(format!("request-{request_id}"));
        match fs::create_dir(&path) {
            Ok(()) => {
                if is_link_or_reparse_point(&path)? {
                    let _ = fs::remove_dir(&path);
                    return Err("要求作業領域がリンクまたは再解析ポイントです。".to_string());
                }
                return Ok((path, request_id));
            }
            Err(err) if err.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(err) => return Err(format!("要求作業領域を作成できませんでした: {err}")),
        }
    }
    Err("要求作業領域の一意な名前を確保できませんでした。".to_string())
}

fn is_within(base: &Path, candidate: &Path) -> bool {
    candidate == base || candidate.strip_prefix(base).is_ok()
}

fn validate_input_path(path: &Path, extension: &str) -> Result<(PathBuf, u64), String> {
    let extension = extension.to_ascii_lowercase();
    if !matches!(extension.as_str(), "png" | "mov" | "mp4") {
        return Err("PNG、MOV、MP4以外の送信形式は許可されていません。".to_string());
    }
    if is_link_or_reparse_point(path)? {
        return Err("リンクまたは再解析ポイントの入力は許可されていません。".to_string());
    }
    let canonical = fs::canonicalize(path)
        .map_err(|err| format!("送信元ファイルを確認できませんでした: {err}"))?;
    let allowed_root = ensure_plain_directory(&temp_root())?;
    if !is_within(&allowed_root, &canonical) {
        return Err("送信元ファイルがK-GGの一時領域外です。".to_string());
    }
    let metadata = fs::metadata(&canonical)
        .map_err(|err| format!("送信元ファイルを読み取れませんでした: {err}"))?;
    if !metadata.is_file() {
        return Err("送信元がファイルではありません。".to_string());
    }
    if metadata.len() > MAX_ASSET_BYTES {
        return Err(format!(
            "送信ファイルが上限（{} GiB）を超えています。",
            MAX_ASSET_BYTES / (1024 * 1024 * 1024)
        ));
    }
    Ok((canonical, metadata.len()))
}

fn normalize_asset_stem(value: &str) -> String {
    let mut stem = String::new();
    for ch in value.trim().chars() {
        if stem.chars().count() >= 60 {
            break;
        }
        if ch.is_alphanumeric() || ch == '-' || ch == '_' || ch == ' ' {
            stem.push(ch);
        } else {
            stem.push('_');
        }
    }
    let stem = stem.trim().replace(' ', "_");
    if stem.is_empty() {
        "kagaribi".to_string()
    } else {
        stem
    }
}

fn canonical_destination(value: Option<&str>) -> Option<PathBuf> {
    let value = value?.trim();
    if value.is_empty() {
        return None;
    }
    existing_plain_directory(Path::new(value))
}

fn asset_directory() -> Result<PathBuf, String> {
    ensure_plain_directory(&temp_root().join(ASSET_ROOT_DIR))
}

fn create_new_file(path: &Path, contents: &[u8]) -> Result<(), String> {
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)
        .map_err(|err| format!("ファイルを作成できませんでした: {err}"))?;
    file.write_all(contents)
        .map_err(|err| format!("ファイルを書き込めませんでした: {err}"))?;
    file.sync_all()
        .map_err(|err| format!("ファイルを同期できませんでした: {err}"))
}

fn copy_asset(
    source: &Path,
    source_size: u64,
    destination: &Path,
    stem: &str,
    extension: &str,
    request_id: &str,
) -> Result<PathBuf, String> {
    let destination = ensure_plain_directory(destination)?;
    let filename = format!(
        "{}_{}.{}",
        normalize_asset_stem(stem),
        request_id,
        extension
    );
    let target = destination.join(filename);
    if target.parent() != Some(destination.as_path()) {
        return Err("送信先ファイルの親フォルダーが不正です。".to_string());
    }

    let mut input =
        File::open(source).map_err(|err| format!("送信元ファイルを開けませんでした: {err}"))?;
    let mut output = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&target)
        .map_err(|err| format!("送信先ファイルを作成できませんでした: {err}"))?;
    let copied = match std::io::copy(&mut input, &mut output) {
        Ok(copied) => copied,
        Err(err) => {
            drop(output);
            let _ = fs::remove_file(&target);
            return Err(format!("送信ファイルをコピーできませんでした: {err}"));
        }
    };
    if copied > MAX_ASSET_BYTES || copied != source_size {
        drop(output);
        let _ = fs::remove_file(&target);
        return Err("送信元ファイルのサイズが検証結果と一致しません。".to_string());
    }
    if let Err(err) = output.sync_all() {
        drop(output);
        let _ = fs::remove_file(&target);
        return Err(format!("送信先ファイルを同期できませんでした: {err}"));
    }
    Ok(target)
}

fn jsx_string_literal(value: &str) -> String {
    let escaped = value
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\r', "\\r")
        .replace('\n', "\\n");
    format!("\"{escaped}\"")
}

fn build_result_script(
    result_path: &Path,
    request_id: &str,
    operation: &str,
    body: &str,
) -> String {
    let mut script = String::new();
    script.push_str("(function(){\n");
    script.push_str("function escapeJson(value){return String(value).replace(/\\\\/g, \"\\\\\\\\\").replace(/\"/g, '\\\\\"').replace(/\\r/g, \"\\\\r\").replace(/\\n/g, \"\\\\n\");}\n");
    script.push_str(&format!(
        "var resultFile = new File({});\n",
        jsx_string_literal(&result_path.to_string_lossy())
    ));
    script.push_str("function writeResult(status,message){\n");
    script
        .push_str("if(!resultFile.open('w')){throw new Error('Cannot open completion file.');}\n");
    script.push_str("resultFile.encoding='UTF-8';\n");
    script.push_str("resultFile.write('");
    script.push_str(&format!(
        "{{\"schemaVersion\":{},\"requestId\":\"{}\",\"operation\":\"{}\",\"status\":\"",
        COMPLETION_SCHEMA_VERSION, request_id, operation
    ));
    script.push_str(
        "' + escapeJson(status) + '\",\"message\":\"' + escapeJson(message || '') + '\"}');\n",
    );
    script.push_str("resultFile.close();}\n");
    script.push_str(body);
    script.push_str("\n})();\n");
    script
}

fn build_import_script(result_path: &Path, asset_path: &Path, request_id: &str) -> String {
    let body = format!(
        "try {{\nvar comp=null;\nif(app.activeViewer && app.activeViewer.comp){{comp=app.activeViewer.comp;}}\nif(!comp && app.project.activeItem && app.project.activeItem instanceof CompItem){{comp=app.project.activeItem;}}\nif(!comp){{writeResult('composition-unavailable','Activate an After Effects composition and retry.');return;}}\nvar assetFile=new File({});\nif(!assetFile.exists){{throw new Error('Asset file is missing.');}}\nvar footage=app.project.importFile(new ImportOptions(assetFile));\ncomp.layers.add(footage);\nwriteResult('ok','');\n}} catch(error) {{ try {{ writeResult('jsx-failed',String(error)); }} catch(ignored) {{}} }}",
        jsx_string_literal(&asset_path.to_string_lossy())
    );
    build_result_script(result_path, request_id, "import-asset", &body)
}

fn build_ping_script(result_path: &Path, request_id: &str) -> String {
    let body = "try { alert('K-GG connected to After Effects.'); writeResult('ok',''); } catch(error) { try { writeResult('jsx-failed',String(error)); } catch(ignored) {} }";
    build_result_script(result_path, request_id, "ping", body)
}

fn build_project_directory_script(marker_path: &Path) -> String {
    format!(
        "(function(){{var marker=new File({});var value='';try{{if(app.project && app.project.file && app.project.file.exists){{value=app.project.file.parent.fsName;}}}}catch(error){{}}if(marker.open('w')){{marker.encoding='UTF-8';marker.write(value);marker.close();}}}})();",
        jsx_string_literal(&marker_path.to_string_lossy())
    )
}

fn read_bounded_text(path: &Path, max_bytes: u64) -> Result<String, String> {
    if is_link_or_reparse_point(path)? {
        return Err("完了ファイルがリンクまたは再解析ポイントです。".to_string());
    }
    let file = File::open(path).map_err(|err| format!("完了ファイルを開けませんでした: {err}"))?;
    let mut bytes = Vec::new();
    file.take(max_bytes + 1)
        .read_to_end(&mut bytes)
        .map_err(|err| format!("完了ファイルを読み取れませんでした: {err}"))?;
    if bytes.len() as u64 > max_bytes {
        return Err("完了ファイルがサイズ上限を超えています。".to_string());
    }
    String::from_utf8(bytes).map_err(|_| "完了ファイルがUTF-8ではありません。".to_string())
}

fn parse_completion_result(
    text: &str,
    request_id: &str,
    operation: &str,
) -> Result<CompletionPayload, String> {
    let payload: CompletionPayload = serde_json::from_str(text)
        .map_err(|err| format!("完了結果JSONを解析できませんでした: {err}"))?;
    if payload.schema_version != COMPLETION_SCHEMA_VERSION {
        return Err("完了結果のバージョンが一致しません。".to_string());
    }
    if payload.request_id != request_id || payload.operation != operation {
        return Err("完了結果の要求IDまたは操作種別が一致しません。".to_string());
    }
    if !matches!(
        payload.status.as_str(),
        "ok" | "composition-unavailable" | "jsx-failed"
    ) {
        return Err("完了結果の状態が許可されていません。".to_string());
    }
    Ok(payload)
}

fn run_jsx_and_wait_for_completion(
    executable: &Path,
    script_path: &Path,
    completion_path: &Path,
    request_id: &str,
    operation: &str,
    timeout: Duration,
) -> Result<CompletionPayload, String> {
    let mut command = Command::new(executable);
    command
        .arg("-r")
        .arg(script_path)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    super::configure_hidden_command(&mut command);
    let mut child = command
        .spawn()
        .map_err(|err| format!("After Effectsスクリプトを起動できませんでした: {err}"))?;
    let started = Instant::now();
    let mut last_error: Option<String> = None;

    loop {
        if completion_path.is_file() {
            match read_bounded_text(completion_path, MAX_RESULT_BYTES)
                .and_then(|text| parse_completion_result(&text, request_id, operation))
            {
                Ok(payload) => {
                    let _ = child.try_wait();
                    return Ok(payload);
                }
                Err(err) => last_error = Some(err),
            }
        }

        if let Ok(Some(status)) = child.try_wait() {
            if !status.success() {
                return Err(format!("After Effectsのスクリプトが失敗しました: {status}"));
            }
        }
        if started.elapsed() >= timeout {
            return Err(last_error.unwrap_or_else(|| {
                "After Effectsから完了結果を受信できませんでした。".to_string()
            }));
        }
        thread::sleep(POLL_INTERVAL);
    }
}

fn run_jsx_and_wait_for_text(
    executable: &Path,
    script_path: &Path,
    marker_path: &Path,
    timeout: Duration,
) -> Result<String, String> {
    let mut command = Command::new(executable);
    command
        .arg("-r")
        .arg(script_path)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    super::configure_hidden_command(&mut command);
    let mut child = command
        .spawn()
        .map_err(|err| format!("After Effectsスクリプトを起動できませんでした: {err}"))?;
    let started = Instant::now();
    loop {
        if marker_path.is_file() {
            let text = read_bounded_text(marker_path, 8 * 1024)?;
            if !text.trim().is_empty() {
                let _ = child.try_wait();
                return Ok(text.trim().to_string());
            }
        }
        if let Ok(Some(status)) = child.try_wait() {
            if !status.success() {
                return Err(format!("After Effectsのスクリプトが失敗しました: {status}"));
            }
        }
        if started.elapsed() >= timeout {
            return Err("After Effectsプロジェクトの場所を取得できませんでした。".to_string());
        }
        thread::sleep(POLL_INTERVAL);
    }
}

fn resolve_project_directory(executable: &Path, workspace: &Path) -> Option<PathBuf> {
    let marker_path = workspace.join("project-dir.txt");
    let script_path = workspace.join("project-dir.jsx");
    let script = build_project_directory_script(&marker_path);
    if create_new_file(&script_path, script.as_bytes()).is_err() {
        return None;
    }
    let value = run_jsx_and_wait_for_text(
        executable,
        &script_path,
        &marker_path,
        PROJECT_DIRECTORY_TIMEOUT,
    )
    .ok()?;
    existing_plain_directory(Path::new(&value))
}

#[cfg(windows)]
fn detect_after_effects() -> AfterEffectsStatus {
    if !cfg!(target_arch = "x86_64") {
        return AfterEffectsStatus {
            supported: false,
            running: false,
            executable_path: None,
            error: Some("After Effects連携はWindows x64でのみ利用できます。".to_string()),
        };
    }

    let mut command = Command::new("powershell.exe");
    command
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "$p = Get-Process -Name 'AfterFX' -ErrorAction SilentlyContinue | Select-Object -First 1; if ($null -ne $p -and $null -ne $p.Path) { $p.Path }",
        ])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    super::configure_hidden_command(&mut command);
    let output = match command.output() {
        Ok(output) => output,
        Err(err) => {
            return AfterEffectsStatus {
                supported: true,
                running: false,
                executable_path: None,
                error: Some(format!("AfterFXプロセスを確認できませんでした: {err}")),
            };
        }
    };
    let path_text = String::from_utf8_lossy(&output.stdout);
    let Some(path_value) = path_text
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
    else {
        return AfterEffectsStatus {
            supported: true,
            running: false,
            executable_path: None,
            error: None,
        };
    };
    let path = PathBuf::from(path_value);
    let canonical = match fs::canonicalize(&path) {
        Ok(path) => path,
        Err(err) => {
            return AfterEffectsStatus {
                supported: true,
                running: true,
                executable_path: Some(path_value.to_string()),
                error: Some(format!("AfterFX.exeの場所を確認できませんでした: {err}")),
            };
        }
    };
    let valid_executable = canonical
        .file_name()
        .and_then(|name| name.to_str())
        .map(|name| name.eq_ignore_ascii_case("AfterFX.exe"))
        .unwrap_or(false)
        && super::is_windows_x64_executable(&canonical).unwrap_or(false);
    if !valid_executable {
        return AfterEffectsStatus {
            supported: true,
            running: true,
            executable_path: Some(canonical.to_string_lossy().into_owned()),
            error: Some("起動中のAfterFX.exeがWindows x64実行ファイルではありません。".to_string()),
        };
    }
    AfterEffectsStatus {
        supported: true,
        running: true,
        executable_path: Some(canonical.to_string_lossy().into_owned()),
        error: None,
    }
}

#[cfg(not(windows))]
fn detect_after_effects() -> AfterEffectsStatus {
    AfterEffectsStatus {
        supported: false,
        running: false,
        executable_path: None,
        error: Some("After Effects連携は現在Windows x64のみ対応しています。".to_string()),
    }
}

fn run_ping() -> Result<AfterEffectsTransferResult, String> {
    let _guard = AE_OPERATION_LOCK
        .lock()
        .map_err(|_| "After Effects操作のキューが利用できません。".to_string())?;
    let status = detect_after_effects();
    if !status.supported {
        return Ok(status_result(
            "unsupported",
            status.error.unwrap_or_default(),
        ));
    }
    if !status.running {
        return Ok(status_result(
            "not-running",
            "After Effectsが起動していません。",
        ));
    }
    let Some(executable) = status.executable_path.map(PathBuf::from) else {
        return Ok(status_result(
            "error",
            "AfterFX.exeの場所を取得できませんでした。",
        ));
    };
    let (workspace, request_id) = create_request_workspace()?;
    let _workspace_guard = WorkspaceGuard(workspace.clone());
    let result_path = workspace.join("result.json");
    let script_path = workspace.join("ping.jsx");
    create_new_file(
        &script_path,
        build_ping_script(&result_path, &request_id).as_bytes(),
    )?;
    let payload = run_jsx_and_wait_for_completion(
        &executable,
        &script_path,
        &result_path,
        &request_id,
        "ping",
        AE_OPERATION_TIMEOUT,
    )?;
    if payload.status == "ok" {
        Ok(success_result(None))
    } else {
        Ok(status_result(&payload.status, payload.message))
    }
}

fn run_asset_transfer(
    request: AfterEffectsAssetRequest,
) -> Result<AfterEffectsTransferResult, String> {
    let _guard = AE_OPERATION_LOCK
        .lock()
        .map_err(|_| "After Effects操作のキューが利用できません。".to_string())?;
    let status = detect_after_effects();
    if !status.supported {
        return Ok(status_result(
            "unsupported",
            status.error.unwrap_or_default(),
        ));
    }
    if !status.running {
        return Ok(status_result(
            "not-running",
            "After Effectsが起動していません。",
        ));
    }
    let Some(executable) = status.executable_path.map(PathBuf::from) else {
        return Ok(status_result(
            "error",
            "AfterFX.exeの場所を取得できませんでした。",
        ));
    };
    let (source, source_size) =
        match validate_input_path(Path::new(&request.input_path), &request.extension) {
            Ok(value) => value,
            Err(err) => return Ok(status_result("save-failed", err)),
        };
    let extension = request.extension.to_ascii_lowercase();
    let (workspace, request_id) = match create_request_workspace() {
        Ok(value) => value,
        Err(err) => return Ok(status_result("save-failed", err)),
    };
    let _workspace_guard = WorkspaceGuard(workspace.clone());

    let custom_destination = canonical_destination(request.save_dir.as_deref());
    let (destination, destination_kind) = if let Some(path) = custom_destination {
        (path, "custom")
    } else if let Some(path) = resolve_project_directory(&executable, &workspace) {
        (path, "project")
    } else {
        match asset_directory() {
            Ok(path) => (path, "temp"),
            Err(err) => return Ok(status_result("save-failed", err)),
        }
    };

    let asset_path = match copy_asset(
        &source,
        source_size,
        &destination,
        &request.name,
        &extension,
        &request_id,
    ) {
        Ok(path) => path,
        Err(err) => {
            return Ok(destination_result(
                "save-failed",
                Some(destination_kind),
                err,
            ))
        }
    };
    let script_path = workspace.join("import-asset.jsx");
    let result_path = workspace.join("result.json");
    if let Err(err) = create_new_file(
        &script_path,
        build_import_script(&result_path, &asset_path, &request_id).as_bytes(),
    ) {
        return Ok(destination_result(
            "save-failed",
            Some(destination_kind),
            err,
        ));
    }
    let payload = match run_jsx_and_wait_for_completion(
        &executable,
        &script_path,
        &result_path,
        &request_id,
        "import-asset",
        AE_OPERATION_TIMEOUT,
    ) {
        Ok(payload) => payload,
        Err(err) => {
            return Ok(destination_result(
                "jsx-failed",
                Some(destination_kind),
                err,
            ))
        }
    };
    if payload.status == "ok" {
        Ok(success_result(Some(destination_kind)))
    } else {
        Ok(destination_result(
            &payload.status,
            Some(destination_kind),
            payload.message,
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_asset_stems_without_path_characters() {
        assert_eq!(normalize_asset_stem("  hello/world\"  "), "hello_world_");
        assert_eq!(normalize_asset_stem(""), "kagaribi");
        assert!(normalize_asset_stem("あいうえお").starts_with("あいうえお"));
    }

    #[test]
    fn escapes_jsx_string_literals() {
        assert_eq!(
            jsx_string_literal(r#"C:\work\file"#),
            "\"C:\\\\work\\\\file\""
        );
    }

    #[test]
    fn parses_and_validates_completion_results() {
        let text = r#"{"schemaVersion":1,"requestId":"req","operation":"import-asset","status":"ok","message":""}"#;
        let result = parse_completion_result(text, "req", "import-asset").expect("valid result");
        assert_eq!(result.status, "ok");

        let mismatched = text.replace("\"req\"", "\"other\"");
        assert!(parse_completion_result(&mismatched, "req", "import-asset").is_err());
        let unsupported = text.replace("\"ok\"", "\"arbitrary\"");
        assert!(parse_completion_result(&unsupported, "req", "import-asset").is_err());
    }

    #[test]
    fn keeps_path_boundary_component_aware() {
        let base = PathBuf::from("kagaribi-grad");
        assert!(is_within(&base, &base.join("asset.png")));
        assert!(!is_within(
            &base,
            &PathBuf::from("kagaribi-gradient").join("asset.png")
        ));
    }

    #[test]
    fn builds_a_fixed_import_script_with_an_explicit_completion_contract() {
        let script = build_import_script(
            Path::new("result.json"),
            Path::new(r#"C:\work\asset.png"#),
            "req",
        );
        assert!(script.contains("composition-unavailable"));
        assert!(script.contains("app.project.importFile"));
        assert!(script.contains("requestId\":\"req\""));
        assert!(script.contains(r#"replace(/\\/g, "\\\\")"#));
        assert!(script.contains(r#"replace(/"/g, '\\"')"#));
        assert!(!script.contains("eval("));
    }
}
