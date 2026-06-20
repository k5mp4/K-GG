#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            encode_qtrle_mov,
            encode_h264_rgb_mp4,
            load_presets_file,
            save_presets_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running KAGARIBI Grad");
}

fn presets_file_path() -> Result<std::path::PathBuf, String> {
    let exe_path = std::env::current_exe()
        .map_err(|err| format!("実行ファイルの場所を取得できませんでした: {err}"))?;
    let exe_dir = exe_path
        .parent()
        .ok_or_else(|| "実行ファイルの親ディレクトリを取得できませんでした。".to_string())?;
    Ok(exe_dir.join("presets").join("presets.json"))
}

#[tauri::command]
fn load_presets_file() -> Result<serde_json::Value, String> {
    let path = presets_file_path()?;
    match std::fs::read_to_string(&path) {
        Ok(text) => {
            let parsed: serde_json::Value = serde_json::from_str(&text)
                .map_err(|err| format!("プリセットファイルの読み込みに失敗しました: {err}"))?;
            if parsed.is_array() {
                Ok(parsed)
            } else {
                Err("プリセットファイルの形式が不正です。".to_string())
            }
        }
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(serde_json::Value::Array(vec![])),
        Err(err) => Err(format!("プリセットファイルの読み込みに失敗しました: {err}")),
    }
}

#[tauri::command]
fn save_presets_file(presets: serde_json::Value) -> Result<(), String> {
    if !presets.is_array() {
        return Err("プリセットデータの形式が不正です。".to_string());
    }

    let path = presets_file_path()?;
    let dir = path
        .parent()
        .ok_or_else(|| "プリセットディレクトリの場所を取得できませんでした。".to_string())?;
    std::fs::create_dir_all(dir)
        .map_err(|err| format!("プリセットディレクトリの作成に失敗しました: {err}"))?;
    let text = serde_json::to_string_pretty(&presets)
        .map_err(|err| format!("プリセットデータの変換に失敗しました: {err}"))?;
    std::fs::write(&path, text)
        .map_err(|err| format!("プリセットファイルの保存に失敗しました: {err}"))
}

#[tauri::command]
fn encode_qtrle_mov(
    ffmpeg_path: String,
    input_pattern: String,
    output_path: String,
    fps: u32,
) -> Result<(), String> {
    let output = std::process::Command::new(&ffmpeg_path)
        .args([
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-framerate",
            &fps.to_string(),
            "-start_number",
            "0",
            "-i",
            &input_pattern,
            "-c:v",
            "qtrle",
            "-pix_fmt",
            "rgb24",
            &output_path,
        ])
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

#[tauri::command]
fn encode_h264_rgb_mp4(
    ffmpeg_path: String,
    input_pattern: String,
    output_path: String,
    fps: u32,
) -> Result<(), String> {
    let fps_string = fps.to_string();
    let output = std::process::Command::new(&ffmpeg_path)
        .args([
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-framerate",
            &fps_string,
            "-start_number",
            "0",
            "-i",
            &input_pattern,
            "-c:v",
            "libx264rgb",
            "-crf",
            "0",
            "-preset",
            "slow",
            "-pix_fmt",
            "rgb24",
            "-movflags",
            "+faststart",
            &output_path,
        ])
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
