# Spec Delta

## ADDED Requirements

### EXPORT-012 書き出し形式の選択

静止画と動画の書き出し形式は形式ごとのボタンではなく`CustomSelect`で選択し、単一の保存／書き出しボタンで選択形式を出力する。静止画はPNG／JPG／WebP、動画はFFmpegで利用可能なネイティブ形式とPNG連番（ZIP）を選択肢とする。

### EXPORT-013 FFmpeg動画形式の登録

Tauri版のネイティブ動画形式はRustの形式登録表でFFmpeg引数・出力ファイル名・必要エンコーダーを定義し、単一のencode commandで生成する。MOV（qtrle）、MP4（libx264）、WebM（libvpx-vp9）、GIF（gif・256色パレット・無限ループ）を提供し、検出したFFmpegにエンコーダーがある形式だけを選択肢に出す。

## MODIFIED Requirements

- EXPORT-002: 共通フレーム生成の対象をMOV／MP4からMOV／MP4／WebM／GIFへ広げる。
- EXPORT-009: ネイティブ成果物の保存対象をMOV／MP4／WebM／GIFへ広げる。After Effects送信はMOV・MP4だけを対象とする。

## REMOVED Requirements

None.
