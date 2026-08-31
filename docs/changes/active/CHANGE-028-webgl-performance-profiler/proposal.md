---
type: change
id: CHANGE-028
title: WebGL Performance Debug / Profiler基盤
status: approved
change_kind: A
owners: [maintainer]
created: 2026-08-12
updated: 2026-08-30
current_specs: [CURRENT-WEBGL-PERFORMANCE]
related_adrs: [ADR-0005, ADR-0015]
related_code: [src/lib/webgl.ts, src/lib/gpuDiagnostics.ts, src/lib/webglShaderSources.ts, src/shaders/postprocess/glass-compact.glsl, src/lib/webglPerformance.ts, src/components/WebGLPerformancePanel.tsx]
related_tests: [src/lib/webglShaderSources.test.ts, src/lib/effectShaderParity.test.ts, src/lib/webglPerformance.test.ts, src/lib/webglCompilePolicy.test.ts]
human_review: completed
---

# CHANGE-028 WebGL Performance Debug / Profiler基盤

## 背景・問題

K-GGのWebGL描画は複数のEffect、ping-pong FBO、固定段を一つのCanvasへ合成する。現在はFPS、CPU frame time、GPU frame time、Effect単位のGPU時間、Draw Call、Render Pass、WebGL resource数を同じ条件で確認する開発者向けの入口がなく、最適化の前後を定量的に比較しにくい。

## 変更理由

描画結果を変更せず、既存のCanvasとrender loopへ観測層を追加する。計測結果を根拠にボトルネックを特定できるようにし、今後Effectを追加した際も現在のEffect Stackから自動的に計測対象を得られるようにする。

## ゴール・成功条件

- 開発ビルドだけでPerformance、GPU Profiler、Resources、WebGL Validation、Capture Frame、Benchmarkを操作できる。
- `stats-gl`でFPS/CPU frame timeを表示し、GPU frame timeとEXT_disjoint_timer_query_webgl2が使える環境のEffectごとの非同期GPU時間はK-GG側のProfilerで表示する。同じWebGL timer queryを外部ツールと重ねて開始しない。
- 現在のEffect Stackから得たEffect名ごとにCurrent、Moving Average、Peak、Total GPU Time比率、Draw Calls、Render Passesを集計する。
- `webgl-memory`、`webgl-lint`、Spector.jsを開発時だけ有効化し、Productionでは読み込み・計測・Validationの実行を行わない。
- 300フレームの同一条件Benchmarkを実行し、平均FPS、平均CPU/GPU、Peak/1% Low相当、Effect別GPU時間、Draw Calls、Render Passes、Texture/FBO数をJSONとして保存できる。
- SANDBOX、Preview、Animation、PNG/連番/動画Exportの描画結果と既存の`gl.finish()`を使うExport完了処理を変更しない。

## 対象

既存WebGL2の初期化・描画境界への開発専用instrumentation、Canvas上の小型Debug UI、依存パッケージの開発時ロード、純粋な集計ロジックとテスト、開発者向け仕様・操作手順を対象とする。

## 対象外

- Profiler結果を根拠にした描画アルゴリズムや画質の最適化
- Renderer全体の再設計、Effect Stackの保存形式変更、Exportの速度保証
- ProductionユーザーへProfiler UIやValidationを公開すること
- WebGL非対応環境のFallback PreviewへGPU計測を追加すること

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack.md)
- [WebGL Performance](../../../specs/current/webgl-performance.md)

## 関連ADR

- [ADR-0015: 開発専用WebGL観測層を既存Canvasへ接続する](../../../adr/0015-development-webgl-observability.md)

## 主なリスク

GPU timer query、Spector.js、WebGL lintはブラウザやGPU依存で利用できない場合がある。未対応時はUIにUnavailableを表示し、描画を継続する。webgl-lintは既存コードのlatent errorを検出して例外化する可能性があるため、Benchmark中は無効化し、Validationは独立した明示操作とする。

## 未決定事項

なし。Captureの詳細表示はSpector.jsが提供するUIに委譲し、K-GG側はCapture操作と既存Canvasの受け渡しを担当する。
