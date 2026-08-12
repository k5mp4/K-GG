---
type: current
id: CURRENT-WEBGL-PERFORMANCE
title: WebGL Performance Debug / Profiler
status: current
owners: [maintainer]
created: 2026-08-12
updated: 2026-08-12
requirement_ids: [PERF-001, PERF-002, PERF-003, PERF-004, PERF-005, PERF-006, PERF-007, PERF-008, PERF-009, PERF-010]
related_adrs: [ADR-0005, ADR-0015]
related_changes: [CHANGE-028]
related_code: [src/lib/webglPerformance.ts, src/lib/webgl.ts, src/hooks/useWebGL.ts, src/components/WebGLPerformancePanel.tsx, src/components/GradientCanvas.tsx]
related_tests: [src/lib/webglPerformance.test.ts, src/lib/webglPerformanceBenchmark.test.ts, src/lib/webglCompilePolicy.test.ts]
---

# WebGL Performance Debug / Profiler

## 目的

Developmentビルドでのみ、既存WebGL2 Canvasの描画負荷を定量化し、Effect Stackの各Effect、固定段、リソース、Validation、Frame Captureを同じ描画経路で調査できるようにする。Profilerは観測層であり、Preview・SANDBOX・Animation・Exportの描画契約を変更しない。

## 現在の要件

### PERF-001 開発専用Profilerモード

Debug UIはPerformance、GPU Profiler、Resources、WebGL Validation、Capture Frame、Benchmarkを持つ。ProductionではUIとdebug依存をロードしない。

### PERF-002 フレーム指標

FPS、CPU frame time、GPU frame time、Draw Calls、Render Passes、Texture数、Framebuffer数を確認できる。未対応のGPU/extensionはUnavailable表示になる。

### PERF-003 Effect単位GPU計測

現在のEffect Stackから得たEffect名ごとにCurrent、Moving Average（直近60サンプル）、Peak、Total GPU Time比率を保持する。GPU queryは`EXT_disjoint_timer_query_webgl2`で非同期に処理し、`gl.finish()`を使わず、GPU disjoint時は破棄する。

### PERF-004 Draw Call / Render Pass計測

Effectおよび固定段のDraw CallsとRender Passesを確認できる。

### PERF-005 WebGL Resource監視

`webgl-memory`が使用可能なとき、Texture、Buffer、Renderbuffer、Framebuffer、Shader、Program、VertexArrayの概算数/メモリ情報をResourcesへ表示する。

### PERF-006 WebGL Validation切替

`webgl-lint`によるValidationをPerformance計測とは独立に切り替えられる。Benchmark中はValidationを無効化する。Spector.js Capture中も同じWebGL contextへのValidation wrapperとK-GGのGPU timer queryを一時停止し、Capture終了またはキャンセル時に開始前のValidation状態を復元する。Effect Stackの共有uniform契約に存在しないuniformはValidationの致命的エラーにしない。

### PERF-007 Capture Frame

Capture Frame操作時だけSpector.jsで既存CanvasのWebGL frameをCaptureする。通常の操作ではK-GGが`kgg-preview-canvas`を直接Spector.jsへ渡すため、手動のCanvas選択を必要としない。Spectorの`Choose Canvas...`を使う場合は、一覧から`Id: kgg-preview-canvas`を選択する。静止PreviewでアニメーションRAFがない場合も、Capture開始時に1回のPreview再描画を行い、GLコマンドを捕捉できる状態にする。Spector.jsはUMD/CommonJS配布物のため、Viteの`default`、`SPECTOR`、および限定された入れ子export形状を解決してから既存Canvasへ渡す。Capture Frameタブの`Cancel Spector Capture`、またはCapture Frameタブを離れても表示されるフローティング`Cancel Spector Capture`で、空フレーム時の再試行を含むCaptureを停止できる。Captureに失敗またはキャンセルしてもPreviewのCanvas、render loop、Effect Stack操作は継続する。

現時点では、静止Previewの再描画後もSpector.jsのCapture結果表示時に`webgl-lint`の`recordSamplerValues`から`TypeError: Cannot read properties of undefined (reading 'get')`が発生する既知の未解決経路がある。これはPreviewやEffect Stackを停止させてよいという仕様ではなく、`CHANGE-028`の次回調査対象である。Captureの確認では、`no frames with gl commands detected`が出ないことと、Capture結果が表示されることを別の結果として記録する。

### PERF-008 Benchmark

現在のPreset・Resolution・Seed・Time条件を保った300フレームのBenchmark結果をJSONで保存できる。結果は平均FPS、平均CPU/GPU、Peak/1% Low相当、Effect別GPU、Draw Calls、Render Passes、Texture/FBO数を含む。

### PERF-009 描画・Export非干渉

Profilerは保存形式、Effect Stack順序、Seed、Time、Frame Index、Texture state、Framebuffer state、出力画像を変更しない。Exportに必要な明示的GPU完了待ちは既存どおり実行する。

### PERF-010 操作手順と比較

開発者は同一Preset、Resolution、Seed、300フレーム条件でGLASS/glassv2、Diffuse、Prism、Distortion系を比較し、Before/AfterのFPS、CPU/GPU、Draw Calls、Render Passes、Texture、Framebuffer、主要EffectのGPU時間を記録する。

Effect StackのGlass/glassv2は、汎用Noiseの全アルゴリズムを同じフラグメントShaderへ取り込まず、専用のコンパクトな高さ場・光学Shaderとしてコンパイルする。Noise Distortionは独立したStack passで処理し、Glassの任意のNoise Distortionブレンドには限定された安定ノイズを使う。この境界はANGLEなどドライバ依存のShaderコンパイラ負荷を抑えるためのものであり、Glassを有効化しただけでShader link失敗、`context lost`、Canvas停止が発生する状態は期待動作ではない。

Noise専用lazy Shaderの反射またはリンクが失敗した場合は、一般postprocess ShaderをNoise passのフォールバックとして使用し、Noise行が描画不能な`Unavailable`状態で固定されないようにする。専用Shaderが利用できる場合は専用passを優先する。

## 境界と互換性

Profiler設定は保存しない。ProfilerはCanvas領域内のドックUIとして表示し、Performanceタブのstats-glモニターもその中へマウントする。独立したstats-gl overlayは表示せず、Canvasやエディタのポインター入力を遮らない。`EXT_disjoint_timer_query_webgl2`が利用できる場合は、K-GGのEffect単位GPU queryを優先し、`stats-gl`のGPU queryを同時に有効化しない。同じ`TIME_ELAPSED_EXT`ターゲットのquery入れ子を避けるためであり、この場合もFPS/CPUはstats-gl、GPU frame/effect値はK-GGのProfilerで確認できる。`webgl-lint`のProgram情報とKHR並列Shaderコンパイルが競合する環境では、Developmentのリンクを同期経路へ切り替える。Timer Query、Spector.js、webgl-memory、webgl-lintが未対応でもPreviewとFallbackは利用でき、lazy Shaderの単独失敗でEffect Stack全体を停止させない。SpectorのUIが残る環境でもProfiler dockを優先して表示し、Captureキャンセル後の操作を可能にする。ProfilerはDevelopment専用であり、製品の画像出力やPreset互換性を保証する層ではない。
