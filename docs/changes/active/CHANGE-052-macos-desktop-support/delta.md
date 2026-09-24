# Spec Delta

## ADDED Requirements

### EXPORT-010 desktop platform support

Tauri desktop video export is available for Windows x64 and macOS arm64/Intel. Windows keeps NSIS and signed updater artifacts. macOS produces an experimental unsigned and/notarized DMG without automatic updater artifacts.

### EXPORT-011 external FFmpeg detection

Windows keeps the app-local `ffmpeg.exe` first and PATH/registry fallback. macOS validates `ffmpeg` and detects `ffprobe` from PATH; FFmpeg must provide `qtrle` and `libx264`, while `ffprobe` validates CI output. K-GG does not bundle, download, or modify PATH for FFmpeg.

### AE-007 platform boundary

After Effects automation remains Windows x64 only. macOS displays the integration as unavailable until a separate request defines and validates a macOS mechanism.

### CONN-007 cross-platform connector opener

Figma loopback direct send remains available on desktop targets. Opening the bundled connector folder and external guidance URLs delegates to the OS through Tauri Opener.

## MODIFIED Requirements

The desktop distribution scope now includes macOS arm64 and Intel DMGs while preserving the existing Windows NSIS/updater flow. macOS is explicitly experimental and manual-update-only.

## REMOVED Requirements

None.
