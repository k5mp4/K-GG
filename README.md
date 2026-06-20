# K-GG

K-GG is a gradient generator for KAGARIBI visual production. It supports still-image export, slit-scan style output, animation preview, PNG sequence export, and Tauri desktop video encoding.

K-GG は KAGARIBI 関連のビジュアル制作向けグラデーション生成ツールです。静止画書き出し、スリットスキャン風の出力、アニメーションプレビュー、PNG 連番書き出し、Tauri デスクトップ版での動画エンコードに対応しています。

## Requirements / 必要環境

- Node.js 22.12.0 or later / Node.js 22.12.0 以上
- npm 10.9.0 or later / npm 10.9.0 以上
- Rust toolchain, only when building the Tauri desktop app / Tauri デスクトップ版をビルドする場合のみ Rust toolchain
- FFmpeg, required for MOV/MP4 video export in the Tauri desktop app / Tauri デスクトップ版で MOV/MP4 動画を書き出す場合は FFmpeg

FFmpeg must be available as the `ffmpeg` command in your PATH. PNG sequence ZIP export does not require FFmpeg.

FFmpeg は `ffmpeg` コマンドとして PATH から実行できる状態にしてください。PNG 連番 ZIP 書き出しには FFmpeg は不要です。

Example install commands / インストール例:

```sh
# Windows
winget install Gyan.FFmpeg

# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt install ffmpeg
```

Verify FFmpeg / FFmpeg の確認:

```sh
ffmpeg -version
```

## Development / 開発

```sh
npm install
npm run dev
```

For local-only Vite access / ローカルホスト限定で起動する場合:

```sh
npm run dev:local
```

## Build / ビルド

```sh
npm run build
```

For the desktop app / デスクトップアプリをビルドする場合:

```sh
npm run tauri:build
```

## Documentation / ドキュメント

```sh
npm run docs:dev
npm run docs:build
```

## Public Repository Notes / 公開リポジトリ向けメモ

This repository intentionally excludes local AI/tooling settings, dependency folders, build outputs, logs, and VitePress caches through `.gitignore`.

このリポジトリでは、ローカルの AI/ツール設定、依存関係フォルダ、ビルド成果物、ログ、VitePress キャッシュを `.gitignore` で除外しています。

K-GG is distributed under the Apache License 2.0. See `LICENSE`.

K-GG は Apache License 2.0 の下で配布されています。詳細は `LICENSE` を参照してください。
