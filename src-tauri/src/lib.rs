use serde::Serialize;
use std::ffi::OsStr;
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};
use tauri::Manager;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

const FFMPEG_CHECK_TIMEOUT: Duration = Duration::from_secs(5);
const FFMPEG_BUILDS_URL: &str = "https://www.gyan.dev/ffmpeg/builds/#release-builds";
const VIDEO_EXPORT_TEMP_DIR: &str = "kagaribi-grad";

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            if cfg!(all(target_os = "windows", target_arch = "x86_64")) {
                if let Err(err) = ensure_ffmpeg_dir(app.handle()) {
                    eprintln!("K-GG専用FFmpegフォルダを作成できませんでした: {err}");
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            encode_qtrle_mov,
            encode_h264_rgb_mp4,
            get_native_ffmpeg_status,
            open_native_ffmpeg_folder,
            open_ffmpeg_builds_page,
            load_presets_file,
            save_presets_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running KAGARIBI Grad");
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeFfmpegStatus {
    supported: bool,
    available: bool,
    source: Option<String>,
    path: Option<String>,
    version: Option<String>,
    error: Option<String>,
    warning: Option<String>,
    folder_path: Option<String>,
}

#[derive(Debug)]
struct CommandResult {
    success: bool,
    stdout: String,
    stderr: String,
}

#[derive(Debug)]
struct ValidatedFfmpeg {
    path: PathBuf,
    version: String,
}

struct CandidateSelection<T> {
    selected: Option<(T, &'static str)>,
    warning: Option<String>,
    errors: Vec<String>,
}

fn choose_candidate<T, F>(
    local: Option<Result<T, String>>,
    system_candidates: F,
) -> CandidateSelection<T>
where
    F: FnOnce() -> Vec<(String, Result<T, String>)>,
{
    match local {
        Some(Ok(candidate)) => CandidateSelection {
            selected: Some((candidate, "app-data-folder")),
            warning: None,
            errors: Vec::new(),
        },
        local => {
            let warning = local.and_then(Result::err);
            let mut errors = Vec::new();
            for (label, result) in system_candidates() {
                match result {
                    Ok(candidate) => {
                        return CandidateSelection {
                            selected: Some((candidate, "system-path")),
                            warning,
                            errors,
                        };
                    }
                    Err(err) => errors.push(format!("{label}: {err}")),
                }
            }
            CandidateSelection {
                selected: None,
                warning,
                errors,
            }
        }
    }
}

fn ffmpeg_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_local_data_dir()
        .map(|dir| dir.join("ffmpeg"))
        .map_err(|err| format!("アプリデータの場所を取得できませんでした: {err}"))
}

fn ensure_ffmpeg_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = ffmpeg_dir(app)?;
    std::fs::create_dir_all(&dir)
        .map_err(|err| format!("K-GG専用FFmpegフォルダを作成できませんでした: {err}"))?;
    Ok(dir)
}

fn configure_hidden_command(command: &mut Command) {
    #[cfg(windows)]
    command.creation_flags(CREATE_NO_WINDOW);
}

fn run_command_with_timeout(
    executable: &Path,
    args: &[&str],
    timeout: Duration,
) -> Result<CommandResult, String> {
    let mut command = Command::new(executable);
    command
        .args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    configure_hidden_command(&mut command);
    let mut child = command
        .spawn()
        .map_err(|err| format!("起動できませんでした: {err}"))?;

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "標準出力を取得できませんでした。".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "標準エラー出力を取得できませんでした。".to_string())?;
    let stdout_reader = thread::spawn(move || {
        let mut bytes = Vec::new();
        let mut reader = stdout;
        let _ = reader.read_to_end(&mut bytes);
        bytes
    });
    let stderr_reader = thread::spawn(move || {
        let mut bytes = Vec::new();
        let mut reader = stderr;
        let _ = reader.read_to_end(&mut bytes);
        bytes
    });

    let started = Instant::now();
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) if started.elapsed() < timeout => {
                thread::sleep(Duration::from_millis(40));
            }
            Ok(None) => {
                let _ = child.kill();
                let _ = child.wait();
                let _ = stdout_reader.join();
                let _ = stderr_reader.join();
                return Err(format!("{}秒以内に応答しませんでした。", timeout.as_secs()));
            }
            Err(err) => {
                let _ = child.kill();
                let _ = child.wait();
                let _ = stdout_reader.join();
                let _ = stderr_reader.join();
                return Err(format!("実行状態を確認できませんでした: {err}"));
            }
        }
    };

    let stdout = stdout_reader
        .join()
        .map_err(|_| "標準出力の読み取りに失敗しました。".to_string())?;
    let stderr = stderr_reader
        .join()
        .map_err(|_| "標準エラー出力の読み取りに失敗しました。".to_string())?;

    Ok(CommandResult {
        success: status.success(),
        stdout: String::from_utf8_lossy(&stdout).into_owned(),
        stderr: String::from_utf8_lossy(&stderr).into_owned(),
    })
}

#[cfg(windows)]
fn is_windows_x64_executable(path: &Path) -> Result<bool, String> {
    let mut file = std::fs::File::open(path)
        .map_err(|err| format!("実行ファイルを読み込めませんでした: {err}"))?;
    let mut dos_header = [0_u8; 64];
    file.read_exact(&mut dos_header)
        .map_err(|err| format!("実行ファイルの形式を確認できませんでした: {err}"))?;
    if &dos_header[0..2] != b"MZ" {
        return Ok(false);
    }
    let pe_offset = u32::from_le_bytes(
        dos_header[60..64]
            .try_into()
            .map_err(|_| "PEヘッダーを読み取れませんでした。".to_string())?,
    ) as u64;
    file.seek(SeekFrom::Start(pe_offset))
        .map_err(|err| format!("PEヘッダーへ移動できませんでした: {err}"))?;
    let mut pe_header = [0_u8; 6];
    file.read_exact(&mut pe_header)
        .map_err(|err| format!("PEヘッダーを読み取れませんでした: {err}"))?;
    Ok(&pe_header[0..4] == b"PE\0\0" && u16::from_le_bytes([pe_header[4], pe_header[5]]) == 0x8664)
}

#[cfg(not(windows))]
fn is_windows_x64_executable(_path: &Path) -> Result<bool, String> {
    Ok(false)
}

fn encoder_list_has(output: &str, encoder: &str) -> bool {
    output
        .lines()
        .any(|line| line.split_whitespace().nth(1) == Some(encoder))
}

fn mp4_crf_for_quality(quality: &str) -> Result<u8, String> {
    match quality {
        "high" => Ok(18),
        "balanced" => Ok(22),
        "small" => Ok(27),
        _ => Err(format!("MP4品質設定が不正です: {quality}")),
    }
}

fn validate_ffmpeg(path: &Path) -> Result<ValidatedFfmpeg, String> {
    if !path.is_file() {
        return Err("ファイルが見つかりません。".to_string());
    }
    if !is_windows_x64_executable(path)? {
        return Err("Windows x64実行ファイルではありません。".to_string());
    }

    let version_output = run_command_with_timeout(path, &["-version"], FFMPEG_CHECK_TIMEOUT)?;
    if !version_output.success {
        let detail = version_output.stderr.trim();
        return Err(if detail.is_empty() {
            "`ffmpeg -version`が失敗しました。".to_string()
        } else {
            format!("`ffmpeg -version`が失敗しました: {detail}")
        });
    }
    let version = version_output
        .stdout
        .lines()
        .find(|line| line.trim_start().starts_with("ffmpeg version "))
        .map(str::trim)
        .ok_or_else(|| "FFmpegのバージョン情報を確認できませんでした。".to_string())?
        .to_string();

    let encoders_output =
        run_command_with_timeout(path, &["-hide_banner", "-encoders"], FFMPEG_CHECK_TIMEOUT)?;
    if !encoders_output.success {
        return Err("FFmpegのエンコーダー一覧を取得できませんでした。".to_string());
    }
    let encoders = format!("{}\n{}", encoders_output.stdout, encoders_output.stderr);
    let mut missing = Vec::new();
    if !encoder_list_has(&encoders, "qtrle") {
        missing.push("qtrle");
    }
    if !encoder_list_has(&encoders, "libx264rgb") {
        missing.push("libx264rgb");
    }
    if !missing.is_empty() {
        return Err(format!(
            "必要なエンコーダーがありません: {}",
            missing.join(", ")
        ));
    }

    Ok(ValidatedFfmpeg {
        path: path.to_path_buf(),
        version,
    })
}

fn push_unique_candidate(candidates: &mut Vec<PathBuf>, candidate: PathBuf) {
    if !candidate.is_file() {
        return;
    }
    let candidate_key = candidate.to_string_lossy().to_ascii_lowercase();
    let already_seen = candidates
        .iter()
        .any(|existing| existing.to_string_lossy().to_ascii_lowercase() == candidate_key);
    if !already_seen {
        candidates.push(candidate);
    }
}

fn append_ffmpeg_candidates_from_path_value(candidates: &mut Vec<PathBuf>, path_value: &OsStr) {
    for directory in std::env::split_paths(path_value) {
        push_unique_candidate(candidates, directory.join("ffmpeg.exe"));
    }
}

#[cfg(windows)]
fn windows_system_executable(name: &str) -> Option<PathBuf> {
    std::env::var_os("SystemRoot")
        .map(PathBuf::from)
        .map(|root| root.join("System32").join(name))
        .filter(|path| path.is_file())
        .or_else(|| {
            let fallback = PathBuf::from(r"C:\Windows\System32").join(name);
            fallback.is_file().then_some(fallback)
        })
}

#[cfg(windows)]
fn parse_windows_registry_path_value(output: &str) -> Option<String> {
    output.lines().find_map(|line| {
        for value_type in ["REG_EXPAND_SZ", "REG_SZ"] {
            if let Some(index) = line.find(value_type) {
                let value = line[index + value_type.len()..].trim();
                if !value.is_empty() {
                    return Some(value.to_string());
                }
            }
        }
        None
    })
}

#[cfg(windows)]
fn expand_windows_env_vars(value: &str) -> String {
    let mut expanded = String::new();
    let mut remaining = value;

    while let Some(start) = remaining.find('%') {
        expanded.push_str(&remaining[..start]);
        let after_start = &remaining[start + 1..];
        if let Some(end) = after_start.find('%') {
            let name = &after_start[..end];
            if name.is_empty() {
                expanded.push('%');
            } else if let Some(replacement) = std::env::var_os(name) {
                expanded.push_str(&replacement.to_string_lossy());
            } else {
                expanded.push('%');
                expanded.push_str(name);
                expanded.push('%');
            }
            remaining = &after_start[end + 1..];
        } else {
            expanded.push('%');
            expanded.push_str(after_start);
            remaining = "";
        }
    }

    expanded.push_str(remaining);
    expanded
}

#[cfg(windows)]
fn windows_registry_path_values() -> Vec<String> {
    let Some(reg) = windows_system_executable("reg.exe") else {
        return Vec::new();
    };
    [
        (r"HKCU\Environment", "Path"),
        (
            r"HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment",
            "Path",
        ),
    ]
    .into_iter()
    .filter_map(|(key, value_name)| {
        let mut command = Command::new(&reg);
        command
            .args(["query", key, "/v", value_name])
            .stdin(Stdio::null());
        configure_hidden_command(&mut command);
        let output = command.output().ok()?;
        if !output.status.success() {
            return None;
        }
        let text = String::from_utf8_lossy(&output.stdout);
        parse_windows_registry_path_value(&text).map(|value| expand_windows_env_vars(&value))
    })
    .collect()
}

fn path_ffmpeg_candidates() -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    if let Some(path) = std::env::var_os("PATH") {
        append_ffmpeg_candidates_from_path_value(&mut candidates, &path);
    }
    #[cfg(windows)]
    {
        for path in windows_registry_path_values() {
            append_ffmpeg_candidates_from_path_value(&mut candidates, OsStr::new(&path));
        }
    }
    candidates
}

fn status_from_validated(
    validated: ValidatedFfmpeg,
    source: &str,
    folder_path: Option<String>,
    warning: Option<String>,
) -> NativeFfmpegStatus {
    NativeFfmpegStatus {
        supported: true,
        available: true,
        source: Some(source.to_string()),
        path: Some(validated.path.to_string_lossy().into_owned()),
        version: Some(validated.version),
        error: None,
        warning,
        folder_path,
    }
}

fn native_ffmpeg_status(app: &tauri::AppHandle) -> NativeFfmpegStatus {
    if !cfg!(all(target_os = "windows", target_arch = "x86_64")) {
        return NativeFfmpegStatus {
            supported: false,
            available: false,
            source: None,
            path: None,
            version: None,
            error: Some(
                "FFmpeg動画出力はWindows x64デスクトップ版でのみ利用できます。".to_string(),
            ),
            warning: None,
            folder_path: None,
        };
    }

    let (folder, folder_error) = match ensure_ffmpeg_dir(app) {
        Ok(dir) => (Some(dir), None),
        Err(err) => (ffmpeg_dir(app).ok(), Some(err)),
    };
    let folder_path = folder
        .as_ref()
        .map(|path| path.to_string_lossy().into_owned());
    let local_path = folder.as_ref().map(|dir| dir.join("ffmpeg.exe"));
    let local_result = local_path.as_ref().and_then(|path| {
        if !path.exists() {
            None
        } else {
            match validate_ffmpeg(path) {
                Ok(validated) => {
                    return Some(Ok(validated));
                }
                Err(err) => Some(Err(format!(
                    "K-GG専用フォルダのffmpeg.exeを利用できません: {err}"
                ))),
            }
        }
    });

    let selection = choose_candidate(local_result, || {
        path_ffmpeg_candidates()
            .into_iter()
            .map(|candidate| {
                let label = candidate.display().to_string();
                let result = validate_ffmpeg(&candidate);
                (label, result)
            })
            .collect()
    });
    let warning = selection.warning.or(folder_error);
    if let Some((validated, source)) = selection.selected {
        return status_from_validated(validated, source, folder_path, warning);
    }

    let error = if !selection.errors.is_empty() {
        format!(
            "PATH上のFFmpegを利用できません: {}",
            selection.errors.join(" / ")
        )
    } else {
        "K-GG専用フォルダとシステムPATHに利用可能なFFmpegが見つかりません。".to_string()
    };
    NativeFfmpegStatus {
        supported: true,
        available: false,
        source: None,
        path: None,
        version: None,
        error: Some(error),
        warning,
        folder_path,
    }
}

#[tauri::command]
fn get_native_ffmpeg_status(app: tauri::AppHandle) -> NativeFfmpegStatus {
    native_ffmpeg_status(&app)
}

#[tauri::command]
fn open_native_ffmpeg_folder(app: tauri::AppHandle) -> Result<(), String> {
    let directory = ensure_ffmpeg_dir(&app)?;
    #[cfg(windows)]
    {
        let explorer = windows_system_executable("explorer.exe")
            .or_else(|| {
                let fallback = PathBuf::from(r"C:\Windows\explorer.exe");
                fallback.is_file().then_some(fallback)
            })
            .ok_or_else(|| "Windows Explorerを見つけられませんでした。".to_string())?;
        if !explorer.is_file() {
            return Err("Windows Explorerを見つけられませんでした。".to_string());
        }
        Command::new(explorer)
            .arg(&directory)
            .spawn()
            .map(|_| ())
            .map_err(|err| format!("FFmpegフォルダを開けませんでした: {err}"))
    }
    #[cfg(not(windows))]
    {
        let _ = directory;
        Err("この環境ではFFmpegフォルダを開けません。".to_string())
    }
}

#[tauri::command]
fn open_ffmpeg_builds_page() -> Result<(), String> {
    #[cfg(windows)]
    {
        let explorer = windows_system_executable("explorer.exe")
            .or_else(|| {
                let fallback = PathBuf::from(r"C:\Windows\explorer.exe");
                fallback.is_file().then_some(fallback)
            })
            .ok_or_else(|| "Windows Explorerを見つけられませんでした。".to_string())?;
        Command::new(explorer)
            .arg(FFMPEG_BUILDS_URL)
            .spawn()
            .map(|_| ())
            .map_err(|err| format!("gyan.devを開けませんでした: {err}"))
    }
    #[cfg(not(windows))]
    {
        Err("この環境ではgyan.devを開けません。".to_string())
    }
}

fn presets_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|dir| dir.join("presets").join("presets.json"))
        .map_err(|err| format!("アプリデータの場所を取得できませんでした: {err}"))
}

fn legacy_presets_file_path() -> Result<PathBuf, String> {
    let exe_path = std::env::current_exe()
        .map_err(|err| format!("実行ファイルの場所を取得できませんでした: {err}"))?;
    let exe_dir = exe_path
        .parent()
        .ok_or_else(|| "実行ファイルの親ディレクトリを取得できませんでした。".to_string())?;
    Ok(exe_dir.join("presets").join("presets.json"))
}

fn temporary_path(path: &Path) -> PathBuf {
    path.with_extension("json.tmp")
}

fn backup_path(path: &Path) -> PathBuf {
    path.with_extension("json.bak")
}

fn recover_interrupted_write(path: &Path) -> Result<(), String> {
    if path.exists() {
        let _ = std::fs::remove_file(temporary_path(path));
        let _ = std::fs::remove_file(backup_path(path));
        return Ok(());
    }

    let backup = backup_path(path);
    if backup.exists() {
        std::fs::rename(&backup, path)
            .map_err(|err| format!("プリセットのバックアップ復旧に失敗しました: {err}"))?;
        let _ = std::fs::remove_file(temporary_path(path));
        return Ok(());
    }

    let temporary = temporary_path(path);
    if temporary.exists() {
        let text = std::fs::read_to_string(&temporary)
            .map_err(|err| format!("一時プリセットファイルの読み込みに失敗しました: {err}"))?;
        let parsed: serde_json::Value = serde_json::from_str(&text)
            .map_err(|err| format!("一時プリセットファイルが破損しています: {err}"))?;
        if !parsed.is_array() {
            return Err("一時プリセットファイルの形式が不正です。".to_string());
        }
        std::fs::rename(&temporary, path)
            .map_err(|err| format!("一時プリセットファイルの復旧に失敗しました: {err}"))?;
    }

    Ok(())
}

fn replace_presets_file(path: &Path, text: &str) -> Result<(), String> {
    let dir = path
        .parent()
        .ok_or_else(|| "プリセットディレクトリの場所を取得できませんでした。".to_string())?;
    std::fs::create_dir_all(dir)
        .map_err(|err| format!("プリセットディレクトリの作成に失敗しました: {err}"))?;
    recover_interrupted_write(path)?;

    let temporary = temporary_path(path);
    let backup = backup_path(path);
    let mut file = std::fs::File::create(&temporary)
        .map_err(|err| format!("一時プリセットファイルの作成に失敗しました: {err}"))?;
    file.write_all(text.as_bytes())
        .and_then(|_| file.sync_all())
        .map_err(|err| format!("一時プリセットファイルの保存に失敗しました: {err}"))?;

    let had_current = path.exists();
    if had_current {
        let _ = std::fs::remove_file(&backup);
        std::fs::rename(path, &backup)
            .map_err(|err| format!("既存プリセットの退避に失敗しました: {err}"))?;
    }

    if let Err(err) = std::fs::rename(&temporary, path) {
        if had_current {
            let _ = std::fs::rename(&backup, path);
        }
        return Err(format!("プリセットファイルの置き換えに失敗しました: {err}"));
    }

    if had_current {
        let _ = std::fs::remove_file(backup);
    }
    Ok(())
}

fn is_supported_preset_document(value: &serde_json::Value) -> bool {
    if value.is_array() {
        return true;
    }
    value.get("format").and_then(serde_json::Value::as_str) == Some("kgg-preset-library")
        && value.get("version").and_then(serde_json::Value::as_u64) == Some(2)
        && value
            .get("folders")
            .is_some_and(serde_json::Value::is_array)
        && value
            .get("presets")
            .is_some_and(serde_json::Value::is_array)
}

fn migrate_legacy_presets(path: &Path, legacy_path: &Path) -> Result<(), String> {
    if path.exists() || !legacy_path.exists() {
        return Ok(());
    }

    let text = std::fs::read_to_string(legacy_path)
        .map_err(|err| format!("旧プリセットファイルの読み込みに失敗しました: {err}"))?;
    let parsed: serde_json::Value = serde_json::from_str(&text)
        .map_err(|err| format!("旧プリセットファイルが破損しています: {err}"))?;
    if !parsed.is_array() {
        return Err("旧プリセットファイルの形式が不正です。".to_string());
    }
    replace_presets_file(path, &text)
}

#[tauri::command]
fn load_presets_file(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let path = presets_file_path(&app)?;
    recover_interrupted_write(&path)?;
    migrate_legacy_presets(&path, &legacy_presets_file_path()?)?;

    match std::fs::read_to_string(&path) {
        Ok(text) => {
            let parsed: serde_json::Value = serde_json::from_str(&text)
                .map_err(|err| format!("プリセットファイルの読み込みに失敗しました: {err}"))?;
            if is_supported_preset_document(&parsed) {
                Ok(parsed)
            } else {
                Err("プリセットファイルの形式またはバージョンが不正です。".to_string())
            }
        }
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
            Ok(serde_json::Value::Array(vec![]))
        }
        Err(err) => Err(format!("プリセットファイルの読み込みに失敗しました: {err}")),
    }
}

#[tauri::command]
fn save_presets_file(app: tauri::AppHandle, presets: serde_json::Value) -> Result<(), String> {
    if !is_supported_preset_document(&presets) {
        return Err("プリセットデータの形式またはバージョンが不正です。".to_string());
    }

    let path = presets_file_path(&app)?;
    let text = serde_json::to_string_pretty(&presets)
        .map_err(|err| format!("プリセットデータの変換に失敗しました: {err}"))?;
    replace_presets_file(&path, &text)
}

fn canonical_video_export_root() -> Result<PathBuf, String> {
    let root = std::env::temp_dir().join(VIDEO_EXPORT_TEMP_DIR);
    std::fs::canonicalize(&root)
        .map_err(|err| format!("動画書き出し用一時フォルダを確認できませんでした: {err}"))
}

fn validate_video_export_path(
    value: &str,
    expected_filename: &str,
    label: &str,
) -> Result<PathBuf, String> {
    let path = PathBuf::from(value);
    if !path.is_absolute() {
        return Err(format!("{label}は絶対パスである必要があります。"));
    }
    if path.file_name() != Some(OsStr::new(expected_filename)) {
        return Err(format!("{label}のファイル名が不正です。"));
    }
    let parent = path
        .parent()
        .ok_or_else(|| format!("{label}の親フォルダを確認できませんでした。"))?;
    let parent = std::fs::canonicalize(parent)
        .map_err(|err| format!("{label}の親フォルダを確認できませんでした: {err}"))?;
    let root = canonical_video_export_root()?;
    if !parent.starts_with(&root) {
        return Err(format!(
            "{label}はK-GGの動画書き出し用一時フォルダ内にある必要があります。"
        ));
    }
    Ok(path)
}

fn encode_qtrle_mov_blocking(
    app: tauri::AppHandle,
    input_pattern: String,
    output_path: String,
    fps: u32,
) -> Result<(), String> {
    let ffmpeg_path = native_ffmpeg_status(&app)
        .path
        .ok_or_else(|| "利用可能なFFmpegが見つかりません。".to_string())?;
    let input_pattern =
        validate_video_export_path(&input_pattern, "frame_%04d.png", "入力パターン")?;
    let output_path = validate_video_export_path(&output_path, "output.mov", "出力ファイル")?;
    let fps_string = fps.to_string();
    let mut command = Command::new(&ffmpeg_path);
    command
        .arg("-y")
        .arg("-hide_banner")
        .arg("-loglevel")
        .arg("error")
        .arg("-framerate")
        .arg(&fps_string)
        .arg("-start_number")
        .arg("0")
        .arg("-i")
        .arg(&input_pattern)
        .arg("-c:v")
        .arg("qtrle")
        .arg("-pix_fmt")
        .arg("rgb24")
        .arg(&output_path);
    configure_hidden_command(&mut command);
    let output = command
        .output()
        .map_err(|err| format!("FFmpeg の起動に失敗しました: {err}"))?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr);
    Err(if stderr.trim().is_empty() {
        "FFmpeg エンコードに失敗しました。".to_string()
    } else {
        stderr.trim().to_string()
    })
}

fn encode_h264_rgb_mp4_blocking(
    app: tauri::AppHandle,
    input_pattern: String,
    output_path: String,
    fps: u32,
    quality: String,
) -> Result<(), String> {
    let ffmpeg_path = native_ffmpeg_status(&app)
        .path
        .ok_or_else(|| "利用可能なFFmpegが見つかりません。".to_string())?;
    let input_pattern =
        validate_video_export_path(&input_pattern, "frame_%04d.png", "入力パターン")?;
    let output_path = validate_video_export_path(&output_path, "output.mp4", "出力ファイル")?;
    let crf_string = mp4_crf_for_quality(&quality)?.to_string();
    let fps_string = fps.to_string();
    let mut command = Command::new(&ffmpeg_path);
    command
        .arg("-y")
        .arg("-hide_banner")
        .arg("-loglevel")
        .arg("error")
        .arg("-framerate")
        .arg(&fps_string)
        .arg("-start_number")
        .arg("0")
        .arg("-i")
        .arg(&input_pattern)
        .arg("-c:v")
        .arg("libx264rgb")
        .arg("-crf")
        .arg(&crf_string)
        .arg("-preset")
        .arg("slow")
        .arg("-pix_fmt")
        .arg("rgb24")
        .arg("-movflags")
        .arg("+faststart")
        .arg(&output_path);
    configure_hidden_command(&mut command);
    let output = command
        .output()
        .map_err(|err| format!("FFmpeg の起動に失敗しました: {err}"))?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr);
    Err(if stderr.trim().is_empty() {
        "FFmpeg MP4 エンコードに失敗しました。".to_string()
    } else {
        stderr.trim().to_string()
    })
}

#[tauri::command]
async fn encode_qtrle_mov(
    app: tauri::AppHandle,
    input_pattern: String,
    output_path: String,
    fps: u32,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        encode_qtrle_mov_blocking(app, input_pattern, output_path, fps)
    })
    .await
    .map_err(|err| format!("FFmpeg処理スレッドが終了しました: {err}"))?
}

#[tauri::command]
async fn encode_h264_rgb_mp4(
    app: tauri::AppHandle,
    input_pattern: String,
    output_path: String,
    fps: u32,
    quality: String,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        encode_h264_rgb_mp4_blocking(app, input_pattern, output_path, fps, quality)
    })
    .await
    .map_err(|err| format!("FFmpeg処理スレッドが終了しました: {err}"))?
}

#[cfg(test)]
mod tests {
    use super::{
        append_ffmpeg_candidates_from_path_value, backup_path, choose_candidate, encoder_list_has,
        migrate_legacy_presets, mp4_crf_for_quality, recover_interrupted_write,
        replace_presets_file, validate_video_export_path, VIDEO_EXPORT_TEMP_DIR,
    };
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn test_dir(name: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after the Unix epoch")
            .as_nanos();
        std::env::temp_dir().join(format!("kgg-{name}-{}-{nonce}", std::process::id()))
    }

    #[test]
    fn prefers_the_app_data_ffmpeg_without_checking_path() {
        let selection = choose_candidate(Some(Ok("local")), || {
            panic!("PATH candidates must not be checked when the local candidate is valid")
        });

        assert_eq!(selection.selected, Some(("local", "app-data-folder")));
        assert!(selection.warning.is_none());
    }

    #[test]
    fn falls_back_to_path_when_the_app_data_ffmpeg_is_invalid() {
        let selection = choose_candidate(Some(Err("local is invalid".to_string())), || {
            vec![("C:\\tools\\ffmpeg.exe".to_string(), Ok("path"))]
        });

        assert_eq!(selection.selected, Some(("path", "system-path")));
        assert_eq!(selection.warning.as_deref(), Some("local is invalid"));
    }

    #[test]
    fn matches_required_encoder_names_as_tokens() {
        let output = " V....D qtrle               QuickTime Animation\n V....D libx264rgb           libx264 RGB";
        assert!(encoder_list_has(output, "qtrle"));
        assert!(encoder_list_has(output, "libx264rgb"));
        assert!(!encoder_list_has(output, "libx264"));
    }

    #[test]
    fn maps_mp4_quality_presets_to_crf_values() {
        assert_eq!(mp4_crf_for_quality("high").unwrap(), 18);
        assert_eq!(mp4_crf_for_quality("balanced").unwrap(), 22);
        assert_eq!(mp4_crf_for_quality("small").unwrap(), 27);
        assert!(mp4_crf_for_quality("unknown").is_err());
    }

    #[test]
    fn extracts_ffmpeg_candidates_from_path_values_without_duplicates() {
        let root = test_dir("path-candidates");
        let bin = root.join("bin");
        std::fs::create_dir_all(&bin).expect("create bin dir");
        let ffmpeg = bin.join("ffmpeg.exe");
        std::fs::write(&ffmpeg, b"fixture").expect("write ffmpeg fixture");

        let path_value =
            std::env::join_paths([bin.as_os_str(), bin.as_os_str()]).expect("join test PATH");
        let mut candidates = Vec::new();
        append_ffmpeg_candidates_from_path_value(&mut candidates, path_value.as_os_str());

        assert_eq!(candidates, vec![ffmpeg]);
        let _ = std::fs::remove_dir_all(root);
    }

    #[cfg(windows)]
    #[test]
    fn parses_windows_registry_path_value_with_spaces() {
        use super::parse_windows_registry_path_value;

        let output = r#"
HKEY_CURRENT_USER\Environment
    Path    REG_EXPAND_SZ    C:\tools\ffmpeg bin;C:\other
"#;

        assert_eq!(
            parse_windows_registry_path_value(output).as_deref(),
            Some(r"C:\tools\ffmpeg bin;C:\other")
        );
    }

    #[cfg(windows)]
    #[test]
    fn expands_windows_environment_variables_in_path_values() {
        use super::expand_windows_env_vars;

        let root = std::env::var("SystemRoot").expect("SystemRoot should exist on Windows");
        assert_eq!(
            expand_windows_env_vars(r"%SystemRoot%\System32;C:\ffmpeg\bin"),
            format!(r"{root}\System32;C:\ffmpeg\bin")
        );
        assert_eq!(
            expand_windows_env_vars(r"%KGG_UNKNOWN_VAR%\ffmpeg"),
            r"%KGG_UNKNOWN_VAR%\ffmpeg"
        );
    }

    #[test]
    fn accepts_video_export_paths_under_the_kgg_temp_root() {
        let export_dir = std::env::temp_dir()
            .join(VIDEO_EXPORT_TEMP_DIR)
            .join(format!("mov-test-{}-ok", std::process::id()));
        std::fs::create_dir_all(&export_dir).expect("create export temp dir");

        let input = export_dir.join("frame_%04d.png");
        let output = export_dir.join("output.mov");

        assert_eq!(
            validate_video_export_path(
                input.to_str().expect("input path should be utf-8"),
                "frame_%04d.png",
                "入力パターン",
            )
            .expect("input pattern should be accepted"),
            input
        );
        assert_eq!(
            validate_video_export_path(
                output.to_str().expect("output path should be utf-8"),
                "output.mov",
                "出力ファイル",
            )
            .expect("output file should be accepted"),
            output
        );

        let _ = std::fs::remove_dir_all(export_dir);
    }

    #[test]
    fn rejects_video_export_paths_outside_the_kgg_temp_root() {
        let outside = test_dir("video-export-outside");
        std::fs::create_dir_all(&outside).expect("create outside dir");
        let output = outside.join("output.mov");

        let error = validate_video_export_path(
            output.to_str().expect("outside path should be utf-8"),
            "output.mov",
            "出力ファイル",
        )
        .expect_err("outside output must be rejected");

        assert!(
            error.contains("K-GGの動画書き出し用一時フォルダ内"),
            "unexpected error: {error}"
        );
        let _ = std::fs::remove_dir_all(outside);
    }

    #[cfg(windows)]
    #[test]
    fn recognizes_a_windows_x64_pe_header() {
        use super::is_windows_x64_executable;

        let root = test_dir("ffmpeg-pe");
        let path = root.join("ffmpeg.exe");
        std::fs::create_dir_all(&root).expect("create PE test dir");
        let mut bytes = vec![0_u8; 70];
        bytes[0..2].copy_from_slice(b"MZ");
        bytes[60..64].copy_from_slice(&64_u32.to_le_bytes());
        bytes[64..68].copy_from_slice(b"PE\0\0");
        bytes[68..70].copy_from_slice(&0x8664_u16.to_le_bytes());
        std::fs::write(&path, bytes).expect("write PE fixture");

        assert!(is_windows_x64_executable(&path).expect("inspect PE fixture"));
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn migrates_legacy_presets_without_removing_the_source() {
        let root = test_dir("preset-migration");
        let current = root.join("app-data").join("presets.json");
        let legacy = root.join("legacy").join("presets.json");
        std::fs::create_dir_all(legacy.parent().expect("legacy parent"))
            .expect("create legacy dir");
        std::fs::write(&legacy, r#"[{"id":"legacy"}]"#).expect("write legacy preset");

        migrate_legacy_presets(&current, &legacy).expect("migrate legacy preset");

        assert_eq!(
            std::fs::read_to_string(&current).expect("read migrated preset"),
            r#"[{"id":"legacy"}]"#
        );
        assert!(
            legacy.exists(),
            "legacy preset must remain available for rollback"
        );
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn replaces_an_existing_preset_file_and_cleans_the_backup() {
        let root = test_dir("preset-replace");
        let path = root.join("presets.json");

        replace_presets_file(&path, "[]").expect("write initial presets");
        replace_presets_file(&path, r#"[{"id":"new"}]"#).expect("replace presets");

        assert_eq!(
            std::fs::read_to_string(&path).expect("read replaced preset"),
            r#"[{"id":"new"}]"#
        );
        assert!(!backup_path(&path).exists());
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn restores_a_backup_after_an_interrupted_replace() {
        let root = test_dir("preset-recovery");
        let path = root.join("presets.json");
        std::fs::create_dir_all(&root).expect("create test dir");
        std::fs::write(backup_path(&path), r#"[{"id":"safe"}]"#).expect("write backup");

        recover_interrupted_write(&path).expect("recover backup");

        assert_eq!(
            std::fs::read_to_string(&path).expect("read recovered preset"),
            r#"[{"id":"safe"}]"#
        );
        let _ = std::fs::remove_dir_all(root);
    }
}
