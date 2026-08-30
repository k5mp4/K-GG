# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit / manual | `src/lib/webglPerformance.test.ts`、Development起動後のDebug UI | partial |
| AC-002 | unit / manual | `src/lib/webglPerformance.test.ts`、Performanceタブ内のstats-glドック | partial |
| AC-003 | unit / manual | `src/lib/webglPerformance.test.ts`、GPU Profiler tab | partial |
| AC-004 | unit / manual | `src/lib/webglPerformance.test.ts`、Performance tab | partial |
| AC-005 | manual | Resources tab、webgl-memory extension | manual |
| AC-006 | manual | WebGL Validation toggle、Benchmark中の自動OFF | manual |
| AC-007 | manual | Capture Frame操作とSpector.js UI | browser visual pass / Tauri visual not-run |
| AC-008 | unit / manual | `src/lib/webglPerformanceBenchmark.test.ts`、Benchmark JSON | partial |
| AC-009 | existing tests / manual | `src/lib/webglExportPrograms.test.ts`、Preview/Export操作 | partial |
| AC-010 | manual | 開発ガイドのGLASS/Diffuse/Prism/Distortion比較手順 | not-run |
| AC-011 | regression unit / manual | `src/lib/webglPerformance.test.ts`、`src/lib/webglCompilePolicy.test.ts`、`src/lib/webglShaderSources.test.ts`、`npm run tauri:dev`のCanvas描画継続 | unit pass / Glass-only browser visual pass / all-stack browser visual pass / Tauri起動 pass / Tauri visual not-run |

## Commands

- `npm exec vitest run src/lib/webglPerformance.test.ts src/lib/webglPerformanceBenchmark.test.ts --reporter=verbose` — pass (2 files, 15 tests).
- `npm exec vitest run src/lib/webglCompilePolicy.test.ts` — pass (1 file, 10 tests).
- `npm exec vitest run src/lib/webglShaderSources.test.ts src/lib/webglCompilePolicy.test.ts --reporter=dot` — pass (2 files, 20 tests); dedicated Glass source is kept below the full Noise compiler boundary.
- `npm exec vitest run src/lib/webglPerformance.test.ts --reporter=dot` — pass (1 file, 13 tests).
- `npm exec vitest run src/lib/videoExportFrames.test.ts --reporter=dot` — pass (1 file, 6 tests).
- `npm test -- --reporter=dot` — pass (60 files, 345 tests).
- `npm run lint` — pass with 21 existing warnings and 0 errors.
- `npm exec tsc -- -b` — pass after the current Spector/Noise changes.
- `npm run build` — pass; existing Tauri dynamic-import and chunk-size warnings remain.
- `npm run docs:check` — pass (41 legacy specs, 6 current specs, 18 changes, 15 ADRs).
- `npm run docs:build` — pass (VitePress 1.6.4; dead links and page rendering passed).
- `npm run tauri:dev` — Tauri process and WebView/GPU processes launched before the 30-second command timeout; no attached browser console or manual visual confirmation was available in this environment.

## 追加検証（2026-08-24）

- `npm test -- --run src/lib/webglCompilePolicy.test.ts` — pass（1 file、11 tests）。通常起動時は`validationAvailable`ではなく、実際にValidationを有効化した状態を同期コンパイルの条件にする回帰テストを追加した。
- `npm test -- --reporter=dot` — pass（69 files、407 tests）。
- `npm run lint` — pass（0 errors、21 existing warnings）。
- `npm run build` — pass。既存のTauri dynamic-import、500KB超chunk警告は残る。
- `npm run docs:check` — pass（41 legacy specs、7 current specs、23 changes、17 ADRs）。
- `npm run docs:build` — pass（VitePress 1.6.4）。
- `npm run tauri:dev` — pass（単独のTauriプロセスで起動）。起動直後にDiffuseが`APPLIED`となりCanvasへ粒状効果が描画され、`PROFILER`を開くとPerformanceタブのFPS、CPU/GPU frame、Draw calls、Render passes、Timer queryが表示された。
- 起動ログに残る`vendor/tweeq/index.es.js.map`の`ENOENT`とBabelの500KB超コード生成メモは警告であり、Tauri起動・Diffuse描画・Profiler表示を妨げないことを確認した。

### Noise Shader watchdog

- `npm test -- --run src/lib/webglCompilePolicy.test.ts` — pass（1 file、11 tests）。`KHR_parallel_shader_compile`の完了通知が30秒以内に返らない場合、Programを破棄せずcompile/link status確認へ同期フォールバックする回帰テストを追加した。
- `npm test -- --reporter=dot` — pass（69 files、407 tests）。
- `npm run tauri:dev` — pass（Vite/Rust/WebViewプロセスの起動を確認）。今回の環境ではTauri WebViewのNoise操作とブラウザ自動化を同じGPUコンテキストへ接続できず、実GPUで30秒watchdogから同期確認へ入る経路は未確認。回帰テストと既存のTauri起動/Diffuse/Profiler確認で検証した。

### Noise lazy shader serialization (2026-08-30)

- `npm test -- --run src/lib/webglCompilePolicy.test.ts` — pass（1 file、13 tests）。同一WebGL context内のlazy Shader要求を直列化し、`generator`と`stackCore`のcompile/linkが重ならない回帰テストを追加した。
- `npm run lint` — pass（0 errors、21 existing warnings）。
- `npm run build` — pass。既存のTauri dynamic-import、500KB超chunk警告は残る。
- `npm run docs:check` — pass（41 legacy specs、7 current specs、23 changes、17 ADRs）。
- `npm run docs:build` — not completed。VitePress 1.6.4のclient/server bundle工程がエラーを出さず長時間停止したため、検証プロセスを中断した。文書の内容エラーは出力されていない。
- `npm test` — partial（68 files、407 tests pass、`tools/mcp-server/src/runtimeBridge.test.ts`の2 testsが既定5秒timeout）。WebGL関連テストの失敗はなく、runtimeBridgeは変更範囲外。
- `npm run dev`相当のローカルブラウザ確認 — pass。1920×1080でNoiseを有効化し、`generator`完了後に`stackCore`が要求されること、Noiseがオン状態で描画されること、`error`ログ0件・`context lost`なしを確認した。遅いドライバによる30秒watchdog警告はstatus確認への既存フォールバックである。

### Review残留リスク

- Validationを有効化する操作が、並列lazy Shaderのコンパイル完了前に行われた場合のwebgl-lint再有効化順序は未確認。今回の起動経路の修正対象外として、別途イベント順序の回帰テストを追加する。
- 並列完了通知が30秒以上遅れるドライバでは、最後の同期status確認時に一時的なメインスレッド待機が発生し得る。タイムアウトで有効なProgramを破棄してNoise全体を失敗扱いにするより、実際のcompile/link結果を確認して適用を継続するための互換性フォールバックである。

## 手動確認

- `npm run dev`で起動し、ブラウザ上でCanvas描画、ProfilerのPerformance/GPU Profiler/Resourcesタブを確認 — pass。stats-glはPerformanceタブ内へドック表示され、GPU/Resourcesの説明文表示中もCanvasが継続描画された。Profiler外のCanvas領域とエディタ操作を覆う独立overlayは表示されなかった。
- `npm run dev`でGlassだけを有効化し、その後Noise、Slit、Stretch、Distort、Mirror、Kaleidoscope、Voronoiを順に有効化 — pass。各行が`APPLIED`となり、Glass専用Shaderのリンク失敗、`context lost`、Canvas停止は発生しなかった。
- `npm run dev`でProfiler > `Capture Frame` > `Capture WebGL Frame`を実行 — partial/deferred。UIが`Spector capture started.`へ更新され、Spector.jsの`Choose Canvas...` UIが表示され、静止Previewでも`no frames with gl commands detected`は表示されなかった。Canvas描画は継続したが、Capture結果表示時に次のエラーが残った: `TypeError: Cannot read properties of undefined (reading 'get')` (`recordSamplerValues` at `webgl-lint.js:2278` → `markUniformSetAndRecordSamplerValue` → `__SPECTOR_Origin_uniform1i` → `spectorjs.js:9180` → `render` at `src/lib/webgl.ts`)。Capture結果表示までの受入は次回対応へ保留する。
- `npm run dev`でCapture開始後に`Cancel Spector Capture`を実行 — partial。キャンセル表示、Capture状態の解放、Profilerドックの優先表示、Canvas描画継続は確認した。Spectorの既存UIはランタイム実装により残る場合がある。Capture結果表示時の`undefined.get`が残るため、キャンセル後の完全なCapture再試行とEffect Stack操作の無エラー確認は次回の根本修正後に再実施する。
- `npm run dev`でCapture開始後にPerformanceタブへ移動し、Canvas上部のフローティング`Cancel Spector Capture`を実行 — pass。Captureタブを離れてもボタンが表示され、キャンセル後にボタンが消え、ProfilerとCanvas描画が継続した。Profilerを閉じた状態でも同じボタンでキャンセルでき、Canvasが残ることを確認した。
- Spectorの`Choose Canvas...`を開き、`Id: kgg-preview-canvas - Size: 1920*1080`を選択 — pass。小さい`Id: -`のUI用Canvasと区別できることを確認した。
- 静止Preview（Animation OFF）で`Capture WebGL Frame`を実行 — partial/deferred。5秒待機後に`no frames with gl commands detected`は表示されず、Capture開始用の1回描画が実行されたことを確認した。一方、Spector UIには`webgl-lint`連携由来の`recordSamplerValues`内`TypeError ... reading 'get'`が残る。sampler uniformのnullガードは追加して自動検証済みだが、wrapper間の根本原因は未解決。次回はwebgl-lint/Spector.jsの片側ずつの無効化、named canvas直接指定とChoose Canvas指定、`uniform1i` locationとprogram metadataの比較を行う。Tauri WebViewでの実キャプチャは未確認。

## 未確認事項

- Tauri WebView上のProfilerドックの視覚確認とwebgl-memoryの実値は未確認。Spector.js CaptureはDevelopmentブラウザで確認済み。
- Tauri WebView上でSpectorのprivate runtime cleanupが同じ挙動になること、Noise専用Shaderが失敗して一般postprocess fallbackへ移る実GPU経路は未確認。ブラウザでは専用Noiseが`Applied`へ遷移する経路を確認済み。ブラウザの既存デバッグログにあるTauri system-font `invoke` TypeErrorは本変更のWebGL経路とは別で、対象エラー判定から除外した。
- Before/Afterの実測値は、同一GPU・Preset・Resolution・SeedでProfiler UIから取得して記録する。コード変更だけでは数値を推測しない。
