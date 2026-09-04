# 残りの出力検証子Issue実装計画

```yaml
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
```

## 目的

Issue #46 の残りの子Issue #49〜#53を、通常のMerge Gateで実行できる検証、固定GPUでのみ成立するRelease Gate、ネイティブ実行環境を必要とするObservationに分けて整備する。RGBA画像の破損・再現性をバイト列で検証し、WebGLリソースのライフサイクルをK-GG側の台帳で診断し、CIと手動workflowから同じ証拠を保存できる状態にする。

## 対象と完了条件

- #49: CanvasのWebGL RGBAを取得し、capture manifestとbase/head・同一commit再現性比較を生成できる。比較条件不一致や未実行はpassにしない。
- #50: WebGLリソースの作成・解放をK-GG側で追跡し、context loss/restoreと解放後のactive countをE2E診断できる。外部拡張は補助Observationに留める。
- #51: 変更パスに応じてBrowser E2EをCI Merge Gateとして実行し、失敗時のtrace/screenshot/video/diagnosticsを保存する。
- #52: 固定GPU・同一runnerでの再現性とbase/head比較を手動Release Gateとして実行できる。固定GPU未接続時は未実行と記録する。
- #53: Rust/Adapterの自動テストに加え、実FFmpegのqtrle/libx264rgb smokeとメタデータ検証を実行できる。Tauri UI自動化の方式・範囲・未導入理由を明文化する。

## 実装単位

### U6 — RGBA captureと比較

1. E2E bridgeにWebGL `readPixels`由来のtop-to-bottom RGBA captureを追加する。
2. PNGのRGBAデコード、raw RGBAのSHA-256、manifest比較をテスト可能なNode toolとして追加する。
3. Playwright capture commandと同一commit再現性/base-head比較commandを追加する。
4. 代表条件（Kagaribi_15、800×800、t=0/0.5/1、指定seed）とrunner/browser/canvas条件をmanifestに固定する。

### U7 — WebGL resource lifecycle

1. WebGL resource create/deleteを追跡する開発用K-GG resource ledgerを実装する。
2. renderer diagnosticsへactive/created/deleted/peak/context stateを追加し、dispose後active=0を記録する。
3. effect・解像度変更とcontext loss/restoreを行うE2E lifecycle検証を追加する。

### U8 — CI Browser Merge Gate

1. path-aware `changes` outputにE2E対象を追加する。
2. Windows CIでPlaywright Chromiumをinstallして`npm run check:e2e`を実行するjobを追加する。
3. 失敗証跡を常時artifact uploadし、validation docsを同期する。

### U9 — 固定GPU Release Gate

1. SwiftShader通常E2Eと固定GPUcaptureを設定で分離する。
2. manual-only self-hosted fixed-GPU workflowで同一runnerのA/B再現性、base checkout、head checkout、RGBA比較を順に実行する。
3. GPU/driver/OS/browser/WebGL/effect stack/commitをmanifestとartifactに残す。runner不在・software rendererはpassにしない。

### U10 — FFmpeg/Rust/Tauri native gate

1. RustのFFmpeg argument builderを抽出し、codec/pix_fmt/fps/pathのunit testを追加する。
2. 実FFmpeg/ffprobeで小さなPNG sequenceからMOV/MP4を生成し、codec/pix_fmt/size/frame count/file sizeとtemp cleanupを検証するcommandを追加する。
3. Rust/Adapter、FFmpeg smoke、Tauri build/UIのMerge/Release/Observation境界と、Tauri v2 WebDriver方式の採否・範囲を文書化する。

### U11 — 統合検証

1. targeted unit/tool tests、typecheck、lint、build、Browser E2Eを実行する。
2. native/FFmpeg/fixed-GPUは実行できたものだけpassとし、環境依存の未確認事項をRelease Gate/Observationとして記録する。
3. `npm run change:check`、`npm run check:merge`、必要に応じて`npm run check:native`を実行し、docsとworkflowの参照を確認する。

## 非対象

- 固定GPU runnerの新設、GPUドライバの変更、外部サービスへの登録。
- FFmpegバイナリの自動ダウンロードやアプリへの同梱。
- 利用者向け描画結果、Preset形式、保存形式そのものの変更。
- 未接続のTauri UI自動化環境を、実行済みの成功として扱うこと。

## 検証証拠

- `npm run test -- --run` / targeted tests
- `npm run check:e2e`
- `npm run capture:render:rgba` と `npm run compare:render:rgba`
- `npm run check:ffmpeg`（FFmpeg/ffprobeが存在する環境のみ）
- `npm run check:merge`、`npm run change:check`
- 固定GPU・Tauri native項目はworkflow artifactまたは未実行理由

## 実装状況（2026-09-04）

- U6: `readPixels`由来のRGBA8 capture、PNG RGBA復号、SHA-256付きmanifest、同一commit再現性比較、適格性確認済みbase/head比較を実装済み。
- U7: Development専用のK-GG WebGL resource ledger、render diagnostics、effect/解像度/context loss/restoreのE2Eを実装済み。
- U8: 変更パスを判定するCI `e2e-check`、Playwright Chromium install、失敗artifact保持を実装済み。
- U9: 固定GPU self-hosted runner向けmanual-only Release Gate workflowを実装済み。固定GPU runnerでの実行は未確認。
- U10: Rust FFmpeg引数テスト、実FFmpeg/ffprobe smoke、native Release Gate workflow、Tauri v2 WebDriver方式の文書化を実装済み。Tauri UIのdriver接続・操作は未確認。

### 実行済みのローカル証拠

- `npm run check:fast`: 成功（Docs、単体1,004件、lintエラー0、production build、E2E bridge除去確認）。既存lint warningと既存Vite sourcemap/chunk warningは残る。
- `npm run check:e2e`: 成功（4/4）。PNG、PNG ZIP/Preview復帰、resource ledger/context restore、Preview checkpointを確認。
- `npm run check:native`: 成功（Rust 23 tests、`cargo check`）。
- `npm run check:ffmpeg`: 成功（qtrle/rgb24 MOV、libx264rgb/gbrp MP4、各16×16・4 frames、非空、cleanup）。
- SwiftShaderで代表条件を2回captureし、t=0/0.5/1のraw RGBAを完全一致比較: 成功。これは固定GPUの証拠ではない。

固定GPU、Tauri UI、実機の長時間・driver差は、対応runner未接続のため未実行（not-run）として扱う。
