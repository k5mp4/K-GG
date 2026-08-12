# Delta

## ADDED Requirements

### PERF-001 開発専用Profilerモード

Developmentビルドでは、既存のWebGL Canvas上に小型のPerformance Debug UIを表示できる。UIはPerformance、GPU Profiler、Resources、WebGL Validation、Capture Frame、Benchmarkの操作を持つ。ProductionビルドではProfiler依存のロード、計測、Validation、UI表示を行わない。

### PERF-002 フレーム指標

Performance表示はFPS、CPU frame time、GPU frame timeを表示する。GPU frame timeはK-GGのGPU timer queryを優先し、Timer Query非対応時はstats-glの値を利用する。同じ`TIME_ELAPSED_EXT`ターゲットのqueryを重ねて開始しない。未対応時はUnavailableとする。Draw Calls、Render Passes、Texture数、Framebuffer数も表示する。

### PERF-003 Effect単位GPU計測

現在のEffect Stackの各Effectを固定列挙せず、描画時に渡されたEffect名で計測する。WebGL2 `EXT_disjoint_timer_query_webgl2`を使うGPU queryは非同期に読み出し、`gl.finish()`や同期的な結果待ちを行わない。各EffectについてCurrent、直近60サンプルのMoving Average、Peak、Total GPU Timeに対するRatioを保持する。Timer Query非対応またはGPU disjoint時はサンプルを破棄し、描画を継続する。

### PERF-004 Draw Call / Render Pass計測

既存のFullscreen pass・固定段・主Effect Stack境界を観測し、Effect名ごとのDraw CallsとRender Passesを集計する。計測は既存描画呼び出しを置き換えず、観測用カウンターを加えるだけとする。

### PERF-005 WebGL Resource監視

Developmentビルドでは`webgl-memory`の`GMAN_webgl_memory`拡張が利用できる場合にTexture、Buffer、Renderbuffer、Framebuffer、Shader、Program、VertexArrayの概算リソース情報をResources表示へ出す。未対応時はUnavailableとする。

### PERF-006 WebGL Validation切替

Developmentビルドでは`webgl-lint`をWebGL context生成前にロードし、Validationを独立してON/OFFできる。Validationのエラーは描画エラーと区別して表示する。Benchmark実行中はValidationを無効化する。

### PERF-007 Capture Frame

Capture Frame操作時だけSpector.jsへ既存Canvasを渡し、現在のWebGL contextのcommand、Draw Call、Shader、Uniform、Texture、Framebuffer、State、Render順をCaptureする。Profiler用の二重Canvasや二重render loopは作らない。Capture開始中はK-GGのValidation wrapperとGPU timer queryを停止し、終了・キャンセル時に開始前のValidation状態を復元する。`Cancel Spector Capture`はSpector.js 0.9.xの空フレーム再試行も停止し、キャンセル後のPreviewとEffect Stack操作を可能にする。

### PERF-008 Benchmark

Benchmark操作は現在のPreview状態を基準に、Seed、Time、Frame Index、Effect Stack、Resolutionを変更せず、300フレームを収集する。結果は平均FPS、平均CPU/GPU、Peak frame time、1% Low相当のframe time、Effect別Average GPU、Draw Calls、Render Passes、Texture/FBO数を含むJSONとしてダウンロードできる。計測中はValidationとDebug loggingを無効化し、完了後に元の設定へ戻す。

### PERF-009 描画・Export非干渉

Profilerは観測層としてのみ動作し、Effect Stack、SANDBOX、Preview、Animation、PNG Export、Sequential Frame Exportの画像結果・保存値・時間評価・Framebuffer/Texture stateを変更しない。Exportの既存GPU完了待ちだけは維持する。

### PERF-010 操作手順と結果記録

開発者向け文書は、同一Preset、Resolution、Seed、300フレーム条件でGLASS、glassv2（現行正規化後のGlass V2経路）、Diffuse、Prism、Distortion系を比較する手順と、Before/After表の記録項目を定義する。

## MODIFIED Requirements

なし。

## REMOVED Requirements

なし。
