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
