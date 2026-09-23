use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::{LazyLock, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri_plugin_fs::FsExt;
use uuid::Uuid;

#[cfg(windows)]
use std::os::windows::fs::MetadataExt;

const TEMP_ROOT_DIR: &str = "kagaribi-grad";
const REQUEST_ROOT_DIR: &str = "after-effects-requests";
const ASSET_ROOT_DIR: &str = "after-effects-assets";
const MAX_ASSET_BYTES: u64 = 2 * 1024 * 1024 * 1024;
const MAX_RESULT_BYTES: u64 = 256 * 1024;
const AE_OPERATION_TIMEOUT: Duration = Duration::from_secs(120);
const POLL_INTERVAL: Duration = Duration::from_millis(50);
const PROCESS_KILL_GRACE: Duration = Duration::from_secs(2);
const COMPLETION_REAP_TIMEOUT: Duration = Duration::from_secs(2);
const COMPLETION_SCHEMA_VERSION: u8 = 1;
const MAX_AUTHORIZED_EXPORT_PATHS: usize = 256;
/// プロジェクト場所の問い合わせなど、ロック保持中に実行する補助JSXの短い上限。
const PROJECT_DIRECTORY_TIMEOUT: Duration = Duration::from_secs(5);

static AE_OPERATION_LOCK: Mutex<()> = Mutex::new(());
static AUTHORIZED_EXPORT_PATHS: LazyLock<Mutex<HashSet<PathBuf>>> =
    LazyLock::new(|| Mutex::new(HashSet::new()));

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
    /// 通常Exportが確定したファイルをAEが直接参照する場合は再コピーしない。
    #[serde(default)]
    reuse_source: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeVideoSaveRequest {
    input_path: String,
    output_path: String,
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
pub async fn save_native_video_artifact(
    app: tauri::AppHandle,
    request: NativeVideoSaveRequest,
) -> Result<String, String> {
    let scope = app.fs_scope();
    tauri::async_runtime::spawn_blocking(move || {
        save_native_video_artifact_sync(request, |path| scope.is_allowed(path))
    })
    .await
    .map_err(|err| format!("Exportファイルの保存に失敗しました: {err}"))?
}

/// AfterFX.exeの準備から完了待ちまでをblocking poolで直列実行する。
/// Mutexの待機、PowerShell、ファイルコピー、AfterFX.exeのポーリングをasync
/// executor上で行わないため、長い送信でもTauriのUIイベントループを塞がない。
async fn run_after_effects_script<F>(
    prepare: F,
    failure_context: &'static str,
) -> Result<AfterEffectsTransferResult, String>
where
    F: FnOnce() -> Result<PreparedOperation, String> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = AE_OPERATION_LOCK
            .lock()
            .map_err(|_| "After Effects操作のキューが利用できません。".to_string())?;
        let prepared = prepare()?;
        start_prepared_operation(prepared)
    })
    .await
    .map_err(|err| format!("{failure_context}: {err}"))?
}

#[tauri::command]
pub async fn ping_after_effects() -> Result<AfterEffectsTransferResult, String> {
    run_after_effects_script(
        prepare_ping_operation,
        "After Effects接続テストに失敗しました",
    )
    .await
}

#[tauri::command]
pub async fn send_after_effects_asset(
    request: AfterEffectsAssetRequest,
) -> Result<AfterEffectsTransferResult, String> {
    run_after_effects_script(
        move || prepare_asset_transfer(request),
        "After Effects送信に失敗しました",
    )
    .await
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

fn validate_input_path(
    path: &Path,
    extension: &str,
    allow_authorized_export: bool,
) -> Result<(PathBuf, u64), String> {
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
    let authorized_export = allow_authorized_export
        && AUTHORIZED_EXPORT_PATHS
            .lock()
            .map_err(|_| "Exportファイルの許可一覧を確認できませんでした。".to_string())?
            .contains(&canonical);
    if !is_within(&allowed_root, &canonical) && !authorized_export {
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

fn validate_native_video_output_path(path: &Path, extension: &str) -> Result<PathBuf, String> {
    let extension = extension.to_ascii_lowercase();
    if !matches!(extension.as_str(), "mov" | "mp4") {
        return Err("MOVまたはMP4の保存先だけを指定できます。".to_string());
    }
    let file_name = path
        .file_name()
        .and_then(|value| value.to_str())
        .filter(|value| !value.is_empty() && *value != "." && *value != "..")
        .ok_or_else(|| "Exportファイル名が不正です。".to_string())?;
    let actual_extension = Path::new(file_name)
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_ascii_lowercase)
        .ok_or_else(|| "Exportファイルの拡張子がありません。".to_string())?;
    if actual_extension != extension {
        return Err("Exportファイルの拡張子が入力形式と一致しません。".to_string());
    }
    let parent = path
        .parent()
        .ok_or_else(|| "Export先フォルダーがありません。".to_string())?;
    let parent = existing_plain_directory(parent)
        .ok_or_else(|| "Export先フォルダーを確認できませんでした。".to_string())?;
    let target = parent.join(file_name);
    if target.exists() && is_link_or_reparse_point(&target)? {
        return Err("Export先ファイルがリンクまたは再解析ポイントです。".to_string());
    }
    Ok(target)
}

fn save_native_video_artifact_sync(
    request: NativeVideoSaveRequest,
    is_allowed: impl Fn(&Path) -> bool,
) -> Result<String, String> {
    let input_path = Path::new(&request.input_path);
    let extension = Path::new(&request.output_path)
        .extension()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "Exportファイルの拡張子がありません。".to_string())?;
    let (source, source_size) = validate_input_path(input_path, extension, false)?;
    let target = validate_native_video_output_path(Path::new(&request.output_path), extension)?;
    let target = fs::canonicalize(target.parent().expect("validated parent"))
        .map_err(|err| format!("Export先フォルダーを正規化できませんでした: {err}"))?
        .join(target.file_name().expect("validated file name"));

    if !is_allowed(&target) {
        return Err("保存先が許可されていません。保存ダイアログで選択してください。".to_string());
    }

    if source != target {
        fs::copy(&source, &target)
            .map_err(|err| format!("Exportファイルを保存できませんでした: {err}"))?;
    }
    let copied_size = fs::metadata(&target)
        .map_err(|err| format!("保存したExportファイルを確認できませんでした: {err}"))?
        .len();
    if copied_size != source_size {
        return Err("保存したExportファイルのサイズが一致しません。".to_string());
    }

    let canonical_target = fs::canonicalize(&target)
        .map_err(|err| format!("保存したExportファイルを正規化できませんでした: {err}"))?;
    let mut authorized_paths = AUTHORIZED_EXPORT_PATHS
        .lock()
        .map_err(|_| "Exportファイルの許可一覧を更新できませんでした。".to_string())?;
    if authorized_paths.len() >= MAX_AUTHORIZED_EXPORT_PATHS {
        if let Some(evicted) = authorized_paths.iter().next().cloned() {
            authorized_paths.remove(&evicted);
        }
    }
    authorized_paths.insert(canonical_target.clone());
    Ok(canonical_target.to_string_lossy().to_string())
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

/// 完了JSON待ちとAfterFX.exeのreapで共有するdeadlineを使う。
/// 完了マーカーが遅い場合でも、待機とreapがそれぞれ120秒ずつ延長されない。
fn reap_after_effects_child_until(
    child: &mut std::process::Child,
    deadline: Instant,
) -> Result<(), String> {
    loop {
        match child.try_wait() {
            Ok(Some(status)) if status.success() => return Ok(()),
            Ok(Some(status)) => {
                return Err(format!("After Effectsのスクリプトが失敗しました: {status}"));
            }
            Ok(None) if Instant::now() < deadline => {
                thread::sleep(POLL_INTERVAL);
            }
            Ok(None) => {
                let kill_error = child.kill().err();
                let kill_deadline = Instant::now() + PROCESS_KILL_GRACE;
                loop {
                    match child.try_wait() {
                        Ok(Some(_)) => {
                            return Err(
                                "AfterFX.exeがタイムアウト以内に終了しませんでした。".to_string()
                            );
                        }
                        Ok(None) if Instant::now() < kill_deadline => {
                            thread::sleep(POLL_INTERVAL);
                        }
                        Ok(None) => {
                            return if let Some(error) = kill_error {
                                Err(format!("AfterFX.exeを終了できませんでした: {error}"))
                            } else {
                                Err("AfterFX.exeを停止できず、終了を確認できませんでした。"
                                    .to_string())
                            };
                        }
                        Err(error) => {
                            return Err(format!(
                                "AfterFX.exeの終了を確認できませんでした: {error}"
                            ));
                        }
                    }
                }
            }
            Err(err) => return Err(format!("AfterFX.exeの終了を確認できませんでした: {err}")),
        }
    }
}

#[cfg(test)]
fn reap_after_effects_child_with_timeout(
    child: &mut std::process::Child,
    timeout: Duration,
) -> Result<(), String> {
    reap_after_effects_child_until(child, Instant::now() + timeout)
}

fn wait_for_completion_json(
    completion_path: &Path,
    request_id: &str,
    operation: &str,
    child: &mut std::process::Child,
    deadline: Instant,
) -> Result<CompletionPayload, String> {
    wait_for_completion_json_until(
        completion_path,
        request_id,
        operation,
        Some(child),
        deadline,
    )
}

#[cfg(test)]
fn wait_for_completion_json_with_timeout(
    completion_path: &Path,
    request_id: &str,
    operation: &str,
    timeout: Duration,
) -> Result<CompletionPayload, String> {
    wait_for_completion_json_until(
        completion_path,
        request_id,
        operation,
        None,
        Instant::now() + timeout,
    )
}

fn wait_for_completion_json_until(
    completion_path: &Path,
    request_id: &str,
    operation: &str,
    mut child: Option<&mut std::process::Child>,
    deadline: Instant,
) -> Result<CompletionPayload, String> {
    let mut last_error: Option<String> = None;
    loop {
        if completion_path.is_file() {
            match read_bounded_text(completion_path, MAX_RESULT_BYTES)
                .and_then(|text| parse_completion_result(&text, request_id, operation))
            {
                Ok(payload) => return Ok(payload),
                Err(err) => last_error = Some(err),
            }
        }

        if let Some(child) = child.as_deref_mut() {
            match child.try_wait() {
                Ok(Some(status)) if !status.success() => {
                    return Err(format!("After Effectsのスクリプトが失敗しました: {status}"));
                }
                // AfterFX.exe -rのランチャーは、実行中のAfter Effectsへ
                // スクリプトを渡した後に先に終了することがある。終了コード0は
                // 操作完了を意味しないため、完了JSONを期限まで待ち続ける。
                Ok(Some(_)) => {}
                Ok(None) => {}
                Err(error) => {
                    return Err(format!("AfterFX.exeの状態を確認できませんでした: {error}"));
                }
            }
        }

        if Instant::now() >= deadline {
            return Err(last_error.unwrap_or_else(|| {
                "After Effectsから完了結果を受信できませんでした。".to_string()
            }));
        }
        thread::sleep(POLL_INTERVAL);
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum AfterEffectsOperation {
    Ping,
    ImportAsset,
}

impl AfterEffectsOperation {
    fn as_str(self) -> &'static str {
        match self {
            Self::Ping => "ping",
            Self::ImportAsset => "import-asset",
        }
    }
}

enum PreparedOperation {
    Terminal {
        result: AfterEffectsTransferResult,
        workspace: Option<PathBuf>,
    },
    Execute {
        executable: PathBuf,
        script_path: PathBuf,
        workspace: PathBuf,
        result_path: PathBuf,
        request_id: String,
        operation: AfterEffectsOperation,
        destination_kind: Option<String>,
    },
}

impl PreparedOperation {
    fn terminal(result: AfterEffectsTransferResult, workspace: Option<PathBuf>) -> Self {
        Self::Terminal { result, workspace }
    }
}

/// AfterFX.exeを検出し、起動確認できない場合は終端結果へ変換する。
/// 成功時は実行ファイルのパスを返す。
fn require_after_effects_process() -> Result<PathBuf, AfterEffectsTransferResult> {
    let status = detect_after_effects();
    if !status.supported {
        return Err(status_result(
            "unsupported",
            status.error.unwrap_or_default(),
        ));
    }
    if !status.running {
        return Err(status_result(
            "not-running",
            "After Effectsが起動していません。",
        ));
    }
    status
        .executable_path
        .map(PathBuf::from)
        .ok_or_else(|| status_result("error", "AfterFX.exeの場所を取得できませんでした。"))
}

fn operation_failure(
    operation: AfterEffectsOperation,
    destination_kind: Option<&str>,
    message: impl Into<String>,
) -> Result<AfterEffectsTransferResult, String> {
    let message = message.into();
    if operation == AfterEffectsOperation::ImportAsset {
        Ok(destination_result("jsx-failed", destination_kind, message))
    } else {
        Err(message)
    }
}

/// プロジェクトの場所を問い合わせる軽量JSXを実行し、AfterFX.exeをreapする。
fn wait_for_text_marker(
    marker_path: &Path,
    child: &mut std::process::Child,
    deadline: Instant,
) -> Result<String, String> {
    loop {
        if marker_path.is_file() {
            let text = read_bounded_text(marker_path, 8 * 1024)?;
            let trimmed = text.trim();
            if !trimmed.is_empty() {
                return Ok(trimmed.to_string());
            }
        }

        match child.try_wait() {
            Ok(Some(status)) if !status.success() => {
                return Err(format!("After Effectsのスクリプトが失敗しました: {status}"));
            }
            // AfterFX.exe -rのランチャーは、実行中のAfter Effectsへ
            // スクリプトを渡した後に先に終了することがある。終了コード0は
            // マーカー出力完了を意味しないため、期限まで待ち続ける。
            Ok(Some(_)) => {}
            Ok(None) => {}
            Err(error) => {
                return Err(format!("AfterFX.exeの状態を確認できませんでした: {error}"));
            }
        }

        if Instant::now() >= deadline {
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
    let mut command = Command::new(executable);
    command
        .arg("-r")
        .arg(&script_path)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    super::configure_hidden_command(&mut command);
    let mut child = command.spawn().ok()?;
    let deadline = Instant::now() + PROJECT_DIRECTORY_TIMEOUT;
    let value = wait_for_text_marker(&marker_path, &mut child, deadline).ok()?;
    let _ = reap_after_effects_child_until(&mut child, Instant::now() + COMPLETION_REAP_TIMEOUT);
    existing_plain_directory(Path::new(value.trim()))
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

fn start_prepared_operation(
    prepared: PreparedOperation,
) -> Result<AfterEffectsTransferResult, String> {
    match prepared {
        PreparedOperation::Terminal { result, workspace } => {
            if let Some(workspace) = workspace {
                let _ = fs::remove_dir_all(workspace);
            }
            Ok(result)
        }
        PreparedOperation::Execute {
            executable,
            script_path,
            workspace,
            result_path,
            request_id,
            operation,
            destination_kind,
        } => {
            let _workspace_guard = WorkspaceGuard(workspace);
            let mut command = Command::new(&executable);
            command
                .arg("-r")
                .arg(&script_path)
                .stdin(Stdio::null())
                .stdout(Stdio::null())
                .stderr(Stdio::null());
            super::configure_hidden_command(&mut command);
            let mut child = match command.spawn() {
                Ok(child) => child,
                Err(error) => {
                    return operation_failure(
                        operation,
                        destination_kind.as_deref(),
                        format!("After Effectsスクリプトを起動できませんでした: {error}"),
                    )
                }
            };
            let deadline = Instant::now() + AE_OPERATION_TIMEOUT;
            let outcome = wait_for_completion_json(
                &result_path,
                &request_id,
                operation.as_str(),
                &mut child,
                deadline,
            );
            let payload = match outcome {
                Ok(payload) => {
                    // 完了JSONはAfter Effects側の操作結果を表す。ランチャーの
                    // 終了コードが不安定でも、成功結果を後から失敗へ反転させない。
                    if let Err(reap_error) = reap_after_effects_child_until(
                        &mut child,
                        Instant::now() + COMPLETION_REAP_TIMEOUT,
                    ) {
                        eprintln!(
                            "After Effects完了後のランチャー回収に失敗しました。結果JSONを採用します: {reap_error}"
                        );
                    }
                    payload
                }
                Err(error) => {
                    let reaped = reap_after_effects_child_until(&mut child, deadline);
                    let message = match reaped {
                        Ok(()) => error,
                        Err(reap_error) => format!("{error}: {reap_error}"),
                    };
                    return operation_failure(operation, destination_kind.as_deref(), message);
                }
            };
            if payload.status == "ok" {
                if operation == AfterEffectsOperation::ImportAsset {
                    Ok(success_result(destination_kind.as_deref()))
                } else {
                    Ok(success_result(None))
                }
            } else if operation == AfterEffectsOperation::ImportAsset {
                Ok(destination_result(
                    &payload.status,
                    destination_kind.as_deref(),
                    payload.message,
                ))
            } else {
                Ok(status_result(&payload.status, payload.message))
            }
        }
    }
}

fn prepare_ping_operation() -> Result<PreparedOperation, String> {
    let executable = match require_after_effects_process() {
        Ok(executable) => executable,
        Err(result) => return Ok(PreparedOperation::terminal(result, None)),
    };
    let (workspace, request_id) = create_request_workspace()?;
    let script_path = workspace.join("ping.jsx");
    let result_path = workspace.join("result.json");
    if let Err(error) = create_new_file(
        &script_path,
        build_ping_script(&result_path, &request_id).as_bytes(),
    ) {
        let _ = fs::remove_dir_all(&workspace);
        return Err(error);
    }
    Ok(PreparedOperation::Execute {
        executable,
        script_path,
        workspace,
        result_path,
        request_id,
        operation: AfterEffectsOperation::Ping,
        destination_kind: None,
    })
}

fn prepare_asset_transfer(request: AfterEffectsAssetRequest) -> Result<PreparedOperation, String> {
    let executable = match require_after_effects_process() {
        Ok(executable) => executable,
        Err(result) => return Ok(PreparedOperation::terminal(result, None)),
    };
    let (source, source_size) = match validate_input_path(
        Path::new(&request.input_path),
        &request.extension,
        request.reuse_source,
    ) {
        Ok(value) => value,
        Err(err) => {
            return Ok(PreparedOperation::terminal(
                status_result("save-failed", err),
                None,
            ))
        }
    };
    let extension = request.extension.to_ascii_lowercase();
    let (workspace, request_id) = match create_request_workspace() {
        Ok(value) => value,
        Err(err) => {
            return Ok(PreparedOperation::terminal(
                status_result("save-failed", err),
                None,
            ))
        }
    };

    let (asset_path, destination_kind, owns_asset) = if request.reuse_source {
        // `validate_input_path`で正規化・サイズ・リンクを確認済みのため、
        // ユーザーが通常Exportで確定したファイルをそのままAEへ渡す。
        (source, "export", false)
    } else {
        let custom_destination = canonical_destination(request.save_dir.as_deref());
        let (destination, destination_kind) = if let Some(path) = custom_destination {
            (path, "custom")
        } else if let Some(path) = resolve_project_directory(&executable, &workspace) {
            (path, "project")
        } else {
            match asset_directory() {
                Ok(path) => (path, "temp"),
                Err(err) => {
                    return Ok(PreparedOperation::terminal(
                        status_result("save-failed", err),
                        Some(workspace),
                    ))
                }
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
                return Ok(PreparedOperation::terminal(
                    destination_result("save-failed", Some(destination_kind), err),
                    Some(workspace),
                ))
            }
        };
        (asset_path, destination_kind, true)
    };
    let script_path = workspace.join("import-asset.jsx");
    let result_path = workspace.join("result.json");
    if let Err(err) = create_new_file(
        &script_path,
        build_import_script(&result_path, &asset_path, &request_id).as_bytes(),
    ) {
        if owns_asset {
            let _ = fs::remove_file(&asset_path);
        }
        return Ok(PreparedOperation::terminal(
            destination_result("save-failed", Some(destination_kind), err),
            Some(workspace),
        ));
    }
    Ok(PreparedOperation::Execute {
        executable,
        script_path,
        workspace,
        result_path,
        request_id,
        operation: AfterEffectsOperation::ImportAsset,
        destination_kind: Some(destination_kind.to_string()),
    })
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

    fn test_workspace(name: &str) -> PathBuf {
        let nonce = std::process::id();
        let dir = std::env::temp_dir().join(format!("kgg-{name}-{nonce}"));
        std::fs::create_dir_all(&dir).expect("create test workspace");
        dir
    }

    fn result_path_of(workspace: &Path) -> PathBuf {
        workspace.join("result.json")
    }

    fn write_ok_completion(workspace: &Path, request_id: &str, operation: &str) {
        let text = format!(
            r#"{{"schemaVersion":1,"requestId":"{request_id}","operation":"{operation}","status":"ok","message":""}}"#
        );
        std::fs::write(result_path_of(workspace), text).expect("write ok completion");
    }

    #[test]
    fn completion_wait_returns_a_valid_payload_when_the_marker_arrives() {
        let workspace = test_workspace("ae-completion-wait");
        write_ok_completion(&workspace, "wait-test", "import-asset");

        let payload = wait_for_completion_json_with_timeout(
            &result_path_of(&workspace),
            "wait-test",
            "import-asset",
            Duration::from_secs(5),
        )
        .expect("valid completion should be returned");
        assert_eq!(payload.status, "ok");

        let _ = std::fs::remove_dir_all(&workspace);
    }

    #[test]
    fn completion_wait_accepts_marker_after_successful_launcher_exit() {
        let workspace = test_workspace("ae-completion-after-launcher-exit");
        let result_path = result_path_of(&workspace);
        let mut command = Command::new(if cfg!(windows) {
            "powershell.exe"
        } else {
            "true"
        });
        #[cfg(windows)]
        command.args(["-NoProfile", "-NonInteractive", "-Command", "exit 0"]);
        command
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        let mut child = command.spawn().expect("spawn successful launcher");
        let status = child.wait().expect("wait for successful launcher");
        assert!(status.success(), "launcher fixture must exit successfully");

        let writer_workspace = workspace.clone();
        let writer = thread::spawn(move || {
            thread::sleep(Duration::from_millis(150));
            write_ok_completion(&writer_workspace, "delayed-test", "ping");
        });
        let result = wait_for_completion_json(
            &result_path,
            "delayed-test",
            "ping",
            &mut child,
            Instant::now() + Duration::from_secs(2),
        );
        writer.join().expect("completion writer should finish");

        let payload = result.expect(
            "a successful launcher must not end the wait before After Effects writes completion",
        );
        assert_eq!(payload.status, "ok");
        let _ = std::fs::remove_dir_all(&workspace);
    }

    #[test]
    fn completion_wait_reports_the_last_validation_error_on_timeout() {
        let workspace = test_workspace("ae-completion-invalid");
        // 要求ID不一致の完了JSONだけが存在する状態で待つと、検証エラーが
        // 最後のエラーとして残り、タイムアウト時にその内容が返る。
        std::fs::write(
            result_path_of(&workspace),
            r#"{"schemaVersion":1,"requestId":"other","operation":"import-asset","status":"ok","message":""}"#,
        )
        .expect("write mismatched completion");

        let error = wait_for_completion_json_with_timeout(
            &result_path_of(&workspace),
            "expected-request",
            "import-asset",
            Duration::from_millis(300),
        )
        .expect_err("mismatched completion must not be accepted");
        assert!(
            error.contains("要求ID"),
            "timeout should surface the parse validation error: {error}"
        );

        let _ = std::fs::remove_dir_all(&workspace);
    }

    #[test]
    fn project_directory_wait_accepts_marker_after_successful_launcher_exit() {
        let workspace = test_workspace("ae-project-dir-after-launcher-exit");
        let marker_path = workspace.join("project-dir.txt");
        let mut command = Command::new(if cfg!(windows) {
            "powershell.exe"
        } else {
            "true"
        });
        #[cfg(windows)]
        command.args(["-NoProfile", "-NonInteractive", "-Command", "exit 0"]);
        command
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        let mut child = command.spawn().expect("spawn successful launcher");
        let status = child.wait().expect("wait for successful launcher");
        assert!(status.success(), "launcher fixture must exit successfully");

        let writer_marker = marker_path.clone();
        let writer = thread::spawn(move || {
            thread::sleep(Duration::from_millis(150));
            std::fs::write(writer_marker, r#"C:\\AE Project"#)
                .expect("write delayed project marker");
        });
        let result = wait_for_text_marker(
            &marker_path,
            &mut child,
            Instant::now() + Duration::from_secs(2),
        );
        writer.join().expect("project marker writer should finish");

        assert_eq!(
            result.expect("a successful launcher must not end the marker wait"),
            r#"C:\\AE Project"#
        );
        let _ = std::fs::remove_dir_all(&workspace);
    }

    #[test]
    fn reap_returns_ok_when_the_child_exits_promptly() {
        let mut child = Command::new(if cfg!(windows) { "cmd.exe" } else { "true" });
        #[cfg(windows)]
        child.args(["/D", "/C", "exit 0"]);
        child
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        let mut child = child.spawn().expect("spawn quick child");

        let result = reap_after_effects_child_with_timeout(&mut child, Duration::from_secs(5));
        assert!(result.is_ok(), "a quick child should be reaped cleanly");
    }

    #[test]
    fn reap_reports_a_child_that_exits_with_failure() {
        let mut child = Command::new(if cfg!(windows) { "cmd.exe" } else { "sh" });
        #[cfg(windows)]
        child.args(["/D", "/C", "exit 1"]);
        #[cfg(not(windows))]
        child.args(["-c", "exit 1"]);
        child
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        let mut child = child.spawn().expect("spawn failing child");

        let error = reap_after_effects_child_with_timeout(&mut child, Duration::from_secs(5))
            .expect_err("a failed child must be reported");
        assert!(error.contains("スクリプトが失敗"));
    }

    #[test]
    fn reap_kills_a_child_that_outlives_its_timeout() {
        let mut command = Command::new(if cfg!(windows) {
            "powershell.exe"
        } else {
            "sleep"
        });
        #[cfg(windows)]
        command.args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "Start-Sleep 60",
        ]);
        #[cfg(not(windows))]
        command.arg("60");
        command
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        let mut child = command.spawn().expect("spawn slow child");

        let started = Instant::now();
        let result = reap_after_effects_child_with_timeout(&mut child, Duration::from_millis(200));
        assert!(
            result.is_err(),
            "a child that outlives the timeout must be killed, not awaited"
        );
        assert!(
            started.elapsed() < Duration::from_secs(10),
            "kill path must not wait for the child's full lifetime"
        );
        assert!(
            child.try_wait().ok().flatten().is_some(),
            "the child must be reaped after the timeout kill"
        );
    }

    #[test]
    fn terminal_prepared_operations_return_without_spawning() {
        let prepared = PreparedOperation::terminal(
            status_result("not-running", "After Effectsが起動していません。"),
            None,
        );
        let result = start_prepared_operation(prepared).expect("terminal result returns Ok");
        assert_eq!(result.status, "not-running");
    }

    #[test]
    fn terminal_prepared_operations_clean_request_workspaces() {
        let workspace = test_workspace("ae-terminal-cleanup");
        let prepared = PreparedOperation::terminal(
            status_result("save-failed", "test failure"),
            Some(workspace.clone()),
        );

        start_prepared_operation(prepared).expect("terminal result returns Ok");

        assert!(
            !workspace.exists(),
            "terminal paths must clean their workspace"
        );
    }

    #[test]
    fn successful_ping_result_is_not_rejected_by_launcher_exit_status() {
        let workspace = test_workspace("ae-success-before-launcher-exit");
        write_ok_completion(&workspace, "ping-test", "ping");
        let prepared = PreparedOperation::Execute {
            executable: PathBuf::from(if cfg!(windows) { "where.exe" } else { "false" }),
            script_path: workspace.join("ping.jsx"),
            workspace: workspace.clone(),
            result_path: result_path_of(&workspace),
            request_id: "ping-test".to_string(),
            operation: AfterEffectsOperation::Ping,
            destination_kind: None,
        };

        let result = start_prepared_operation(prepared)
            .expect("a valid success result must win over launcher cleanup status");
        assert_eq!(result.status, "ok");
        assert!(
            !workspace.exists(),
            "the workspace guard must still clean up"
        );
    }

    #[test]
    fn direct_export_reuse_requires_a_path_registered_by_native_export() {
        let workspace = test_workspace("ae-authorized-export");
        let path = workspace.join("gradient.mov");
        std::fs::write(&path, b"video").expect("write export fixture");

        let error = validate_input_path(&path, "mov", true)
            .expect_err("an unregistered external export path must be rejected");
        assert!(error.contains("一時領域外"));

        let canonical = std::fs::canonicalize(&path).expect("canonicalize export fixture");
        AUTHORIZED_EXPORT_PATHS
            .lock()
            .expect("lock authorized export paths")
            .insert(canonical.clone());

        let (validated, size) = validate_input_path(&path, "mov", true)
            .expect("a path registered by native export should be accepted");
        assert_eq!(validated, canonical);
        assert_eq!(size, 5);

        AUTHORIZED_EXPORT_PATHS
            .lock()
            .expect("lock authorized export paths")
            .remove(&canonical);
        let _ = std::fs::remove_dir_all(&workspace);
    }

    #[test]
    fn native_video_save_registers_the_completed_export_path() {
        let workspace = temp_root().join(format!("test-native-save-{}", Uuid::new_v4()));
        let output_dir = workspace.join("exports");
        std::fs::create_dir_all(&output_dir).expect("create native save fixture");
        let source = workspace.join("source.mov");
        let target = output_dir.join("gradient.mov");
        std::fs::write(&source, b"video").expect("write native video fixture");

        std::fs::write(&target, b"original").expect("write existing destination");
        let denied = save_native_video_artifact_sync(
            NativeVideoSaveRequest {
                input_path: source.to_string_lossy().to_string(),
                output_path: target.to_string_lossy().to_string(),
            },
            |_| false,
        );
        assert!(denied.is_err());
        assert_eq!(std::fs::read(&target).unwrap(), b"original");
        let saved = save_native_video_artifact_sync(
            NativeVideoSaveRequest {
                input_path: source.to_string_lossy().to_string(),
                output_path: target.to_string_lossy().to_string(),
            },
            |path| path == std::fs::canonicalize(&target).unwrap(),
        )
        .expect("native video save should succeed");
        let canonical_target = std::fs::canonicalize(&target).expect("canonicalize saved export");

        assert_eq!(PathBuf::from(saved), canonical_target);
        assert_eq!(std::fs::read(&target).expect("read saved export"), b"video");
        assert!(AUTHORIZED_EXPORT_PATHS
            .lock()
            .expect("lock authorized export paths")
            .contains(&canonical_target));

        AUTHORIZED_EXPORT_PATHS
            .lock()
            .expect("lock authorized export paths")
            .remove(&canonical_target);
        let _ = std::fs::remove_dir_all(&workspace);
    }
}
