---
title: Native / FFmpeg / Tauri validation
---

# Native / FFmpeg / Tauri validation

この文書はIssue #53のnative検証範囲を定義します。Rust/Adapterの境界テスト、実FFmpegプロセス、Tauri UIは同じ「native検証」として一括でpassにせず、実行できた証拠ごとに判定します。

## 自動化の境界

| 対象 | 入口 | Gate | 判定 |
| --- | --- | --- | --- |
| Rust command/path/encoder contract | `npm run check:native` | Merge Gate（対象変更時） | Rust unit testと`cargo check`の結果 |
| Browser/Tauri adapter contract | `npm run check:fast` / `npm run check:native` | Merge Gate | fake/native adapter testの結果 |
| 実FFmpeg + ffprobe | `npm run check:ffmpeg` | Native Release Gate | qtrle MOVとlibx264rgb MP4のcodec、pix_fmt、サイズ、フレーム数、非空、temp cleanup |
| Tauri binary | `npx tauri build --debug --no-bundle` | Native Release Gate | 実行環境でのbuild結果 |
| Tauri UI | WebDriver手動Release Gate | Release Gate | 起動、Preset、Preview、PNG/ZIP、native FFmpeg statusのUI証跡 |

`check:ffmpeg`は`KGG_FFMPEG_PATH` / `KGG_FFPROBE_PATH`またはPATHにある実行ファイルだけを使います。バイナリのダウンロード、同梱、バージョンの自動更新は行いません。実行ファイルやencoderが見つからない場合は`not-run`（exit code 2）で、passにはなりません。

## FFmpeg smokeの証拠

`tools/ffmpeg-native-smoke.mjs`は16×16・4フレームのPNG sequenceを一時フォルダに生成し、アプリのRust commandと同じ引数で次を実行します。

- qtrle / `rgb24` のMOV
- libx264rgb / `rgb24`入力のMP4（ffprobe上の出力は通常`gbrp`）
- `codec_name`、`pix_fmt`、width、height、frame count、file size、SHA-256
- smoke終了後の一時フォルダ削除

Rust側の引数は`src-tauri/src/lib.rs`のunit testでcodec、pixel format、sequence numbering、CRF、faststartを固定しています。これらは実FFmpegの結果を代替しないため、Release Gateでは両方を実行します。

## Tauri UI自動化の採否と範囲

採用方式はTauri v2の公式案内に沿ったWebdriverIO + `@wdio/tauri-service`です。公式の[WebDriverテストガイド](https://v2.tauri.app/develop/tests/webdriver/)では、Windows/Linuxでは外部`tauri-driver`を使う構成も案内されています。Tauriのmock runtimeはnative WebViewを実行しないため、UIのnative確認は[テスト概要](https://v2.tauri.app/develop/tests/)にあるWebDriver E2Eの責務とします。

現時点では、このリポジトリにWebdriverIO/driverの依存と組織管理runnerがまだ固定されていないため、PR Merge Gateへ未接続です。Native Release Gateでrunner provisioningを完了した後、次の最小シナリオを同じWindows runnerで追加します。

1. Tauri appを起動し、WebViewがreadyになること。
2. Preset libraryのload/saveと再起動後の復元。
3. PreviewとPNG/PNG ZIP export、export後のPreview復帰。
4. native FFmpeg statusの表示と、実MOV/MP4生成結果へのリンク。

各シナリオはrunner、Windows、WebView/driver、commit、artifact pathを記録します。driver未接続・build未実行・UI未操作は`not-run`であり、Browser E2EやRust unit testのpassから推測しません。

## 実行workflow

- `.github/workflows/native-release-gate.yml`: manual-onlyのorg-managed `kgg-native` Windows runnerでRust、実FFmpeg、unbundled Tauri buildを実行します。
- `.github/workflows/render-fixed-gpu.yml`: 固定GPUが必要なRGBA render Release Gateです。Tauri UIの判定を含めません。

このworkflowのrunner labelや環境はリポジトリ内で新設しません。runnerが存在しない場合はworkflow未実行として扱い、release判定をpassにしません。
