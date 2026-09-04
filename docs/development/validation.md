---
title: ValidationとCI
---

# ValidationとCI

検証は、mainへ統合できるか、正式にリリースできるか、追加観察が必要かを分けて判定します。手動確認の有無を自動検証の成功と混ぜません。

## 3つの階層

| Gate | 目的 | 例 | 未達時の扱い |
| --- | --- | --- | --- |
| Merge Gate | mainへ統合してよいことを機械的に判定 | typecheck、lint、unit/component、build、docs、Browser E2E、対象Rust | PRをmergeしない |
| Release Gate | 正式リリース前に環境依存の品質を確認 | 実GPU WebGL、Tauri実機、FFmpeg MOV/MP4、After Effects、installer/updater | mergeは可能。Issueで追跡し、releaseを保留 |
| Observation | 追加の品質・互換性を観察 | 特殊GPU、長時間動作、狭幅UI、全パラメータ操作 | 原則blockしない。結果をPR/Issueへ記録 |

## ローカルコマンド

各コマンドはCIと同じ責務をローカルで実行するための入口です。

| 目的 | コマンド |
| --- | --- |
| 文書構造・参照 | `npm run docs:check` |
| 文書サイト | `npm run docs:build` |
| TypeScript型 | `npm run typecheck` |
| Fast / Merge Gate | `npm run check:fast` または `npm run check:merge` |
| Browser Canvas / PNG / PNG ZIP E2E | `npm run check:e2e` |
| Shader / Render Plan focused | `npm run check:render` |
| Tauri / Rust | `npm run check:native` |
| Release設定 | `npm run release:check` または `npm run check:release` |
| Change Capsule | `npm run change:check` |

`check:fast`にはfrontendのunit/component testが含まれます。描画変更では`check:render`を追加し、Tauri/Rust変更では`check:native`を追加します。`npm run verify`は互換性のために、release設定・fast・nativeをまとめて実行する入口として残します。

`check:e2e`はBrowser Canvas/Exportを必要とする変更向けの独立した追加Merge Gateです。現時点では実行時間とpath-aware CI導入段階を分けるため、`check:fast`/`check:merge`からは自動連鎖させず、対象変更の検証時に明示的に実行します。CI jobへの条件付き統合はIssue #51で扱います。

### Browser E2E Merge Gate

`npm run check:e2e`は、固定viewport・`deviceScaleFactor: 1`・ChromiumのソフトウェアWebGL条件でVite開発サーバーを起動し、実ブラウザの`kgg-preview-canvas`とBrowser Export Adapterを検証します。初回実行前にPlaywright Chromiumが必要です（環境に応じて`npx playwright install chromium`を実行します）。

このチェックは次を機械的に確認します。

- Previewを起動し、0、0.5、1の正規化時刻でCanvas PNGを取得できること
- PNGのsignature/IHDR寸法が有効でCanvas寸法と一致すること
- PNG ZIPの全フレームが連番で存在し、各PNGのsignature/IHDR寸法が一致すること
- Export完了後に同じPreview Canvasが再び描画できること
- `pageerror`、unexpected `console.error`、`unhandledrejection`を成功扱いにしないこと

失敗時はPlaywrightのtrace・screenshot・videoと、Browser/OS/Canvas/WebGL/Export状態の診断JSONを証拠として扱います。Google Fontsなど外部リソースはE2E fixture内で空の成功応答に置き換え、ネットワーク揺らぎでHTML moduleの起動が止まらないようにしています。アプリ本体のUI・描画・Export実装をテスト専用経路へ切り替えるものではありません。

Browser E2Eのpassは、再現可能なソフトウェアWebGLによるMerge Gateの証拠です。固定GPUでのRGBA base/head比較、実FFmpeg MOV/MP4、Tauri UI、WebGL profiler/extension、長時間resource lifecycleはRelease GateまたはObservationであり、このコマンドのpassから推論しません。

## Path-aware CI

Fast checkは全PRで実行します。次の変更がある場合だけ追加jobを実行します。

| 変更パス | 追加検証 |
| --- | --- |
| `src/shaders/**`、`src/lib/webgl*`、`src/lib/effect*`、`src/lib/render*`、`src/lib/export*` | render-check |
| `src-tauri/**`、`Cargo.toml`、`Cargo.lock`、Tauri設定 | native-check |
| `docs/**`、`AGENTS.md`、テンプレート、workflow | fast-check内のdocs check/build。`change:check`も実行 |
| tag `v*.*.*` | release workflowのversion、署名、bundle |

PlaywrightのローカルBrowser E2E入口は整備済みですが、path-aware GitHub Actions jobとartifact retentionはIssue #51の対象として未統合です。CIで実行したことのないE2E結果をpassとして記録しません。実GPU、FFmpeg、AEは引き続きRelease Gateまたは手動チェックリストの対象です。

## 記録の境界

CIが判定できる結果をMarkdownへ重複転記しません。PRには実行したコマンド、CI job、警告、未確認事項を要約し、Change `validation.md`にはChange固有のACとGateの判断だけを残します。`partial`、`manual`、`not-run`は失敗と同じ意味ではありませんが、正式Releaseの前に必要な確認はIssueへ移します。
