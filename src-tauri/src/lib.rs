use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            encode_qtrle_mov,
            encode_h264_rgb_mp4,
            load_presets_file,
            save_presets_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running KAGARIBI Grad");
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
            if parsed.is_array() {
                Ok(parsed)
            } else {
                Err("プリセットファイルの形式が不正です。".to_string())
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
    if !presets.is_array() {
        return Err("プリセットデータの形式が不正です。".to_string());
    }

    let path = presets_file_path(&app)?;
    let text = serde_json::to_string_pretty(&presets)
        .map_err(|err| format!("プリセットデータの変換に失敗しました: {err}"))?;
    replace_presets_file(&path, &text)
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

#[cfg(test)]
mod tests {
    use super::{
        backup_path, migrate_legacy_presets, recover_interrupted_write, replace_presets_file,
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
