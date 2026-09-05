---
title: Native / FFmpeg / Tauri validation
---

# Native / FFmpeg / Tauri validation

この文書はIssue #53のnative検証範囲を定義します。Rust/Adapterの境界テスト、実FFmpegプロセス、Tauri UIは同じ「native検証」として一括でpassにせず、実行できた証拠ごとに判定します。

## 自動化の境界

| 対象 | 入口 | Gate | 判定 |
| --- | --- | --- | --- |
| Rust command/path/encoder contract | `npm run check:native` | Merge Gate（対象変更時） | Rust unit testと`cargo check`の結果 |
| Browser/Tauri adapter contract | `npm run check:fast`、またはnative gateの`npm test -- src/adapters/tauri` | Merge Gate | fake/native adapter testの結果 |
| 実FFmpeg + ffprobe | `npm run check:ffmpeg` | Native Release Gate | qtrle MOVとlibx264rgb MP4のcodec、pix_fmt、サイズ、フレーム数、非空、temp cleanup |
| Tauri binary | `npx tauri build --debug --no-bundle` | Native Release Gate | 実行環境でのbuild結果 |
| Tauri UI | WebDriver手動Release Gate | Release Gate | 起動、Preset、Preview、PNG/ZIP、native FFmpeg statusのUI証跡 |

`check:ffmpeg`は`KGG_FFMPEG_PATH` / `KGG_FFPROBE_PATH`またはPATHにある実行ファイルだけを使います。バイナリのダウンロード、同梱、バージョンの自動更新は行いません。実行ファイルやencoderが見つからない場合は`not-run`（exit code 2）で、passにはなりません。

## FFmpeg smokeの証拠

`tools/ffmpeg-native-smoke.mjs`は16×16・4フレームのPNG sequenceを一時フォルダに生成し、アプリのRust commandと同じ引数で次を実行します。これは実FFmpeg processの証拠であり、Rust引数テストやmock adapter testだけでは代替できません。

- qtrle / `rgb24` のMOV
- libx264rgb / `rgb24`入力のMP4（ffprobe上の出力は通常`gbrp`）
- `codec_name`、`pix_fmt`、width、height、frame count、file size、SHA-256
- smoke終了後の一時フォルダ削除

Rust側の引数は`src-tauri/src/lib.rs`のunit testでcodec、pixel format、sequence numbering、CRF、faststartを固定しています。これらは実FFmpegの結果を代替しないため、Release Gateでは両方を実行します。

## Tauri UI自動化の採否と範囲

採用方針はTauri v2の現行公式案内に合わせ、WebdriverIO + `@wdio/tauri-service`を使う。Windowsの
最初のproviderは、外部driverの管理を増やさない`embedded` providerとする。その場合は
`tauri-plugin-wdio-webdriver`（アプリ内WebDriver server）と、必要なbackend/IPC証跡のための
`tauri-plugin-wdio`をnative test用に追加する。Windowsで組織標準のdriver provisioningを採用する場合だけ、
同じWebdriverIO設定から`external` providerと`tauri-driver`へ切り替える。公式の
[WebDriverテストガイド](https://v2.tauri.app/develop/tests/webdriver/)と
[Tauriテスト概要](https://v2.tauri.app/develop/tests/)を方式の一次情報とする。

Browser Playwright E2EへTauri native UIを混ぜず、次のNative Release Gateへ分離する。Tauriのmock runtimeは
native WebViewを実行しないため、mockの成功を実機UIのpassへ昇格させない。

現時点では、このリポジトリにWebdriverIO/tauri pluginの依存と組織管理runnerがまだ固定されていないため、
PR Merge Gateへは未接続である。これは未実施のRelease Gateであり、Browser E2E、Rust test、FFmpeg smoke、
またはTauri buildの成功から推測してpassにしない。runner provisioning後に、同じWindows runnerで次の最小
シナリオを追加する。

1. Tauri appを起動し、WebViewがreadyになること。
2. Preset libraryのload/saveと再起動後の復元。
3. PreviewとPNG/PNG ZIP export、export後のPreview復帰。
4. native FFmpeg statusの表示と、実MOV/MP4生成結果へのリンク。

各実行では、app binary、Windows/WebView、WebDriver provider、commit、runner、FFmpeg source/version、
生成物のpathとcodec metadataをartifactへ保存する。driver未接続、build未実行、UI未操作、FFmpeg未導入は
それぞれ`not-run`または`manual release gate`として記録し、別の検証結果で埋めない。

各シナリオはrunner、Windows、WebView/driver、commit、artifact pathを記録します。driver未接続・build未実行・UI未操作は`not-run`であり、Browser E2EやRust unit testのpassから推測しません。

## 実行workflow

- `.github/workflows/native-release-gate.yml`: manual-onlyのorg-managed `kgg-native` Windows runnerでRust、実FFmpeg、unbundled Tauri buildを実行します。FFmpegはrunnerの`KGG_FFMPEG_PATH` / `KGG_FFPROBE_PATH`またはPATHにある実行ファイルだけを使い、自動取得・同梱はしません。
- `.github/workflows/render-fixed-gpu.yml`: 固定GPUが必要なRGBA render Release Gateです。Tauri UIの判定を含めません。

このworkflowのrunner labelや環境はリポジトリ内で新設しません。runnerが存在しない場合はworkflow未実行として扱い、release判定をpassにしません。
