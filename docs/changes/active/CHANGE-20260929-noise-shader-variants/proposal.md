---
type: change
id: CHANGE-20260929-noise-shader-variants
title: Noise種別ごとのShader特殊化と起動・Effect反映の高速化
status: draft
change_kind: F
owners: [maintainer]
created: 2026-09-29
updated: 2026-09-29
current_specs: [CURRENT-WEBGL-PERFORMANCE, CURRENT-APP-STARTUP]
related_adrs: [ADR-0022, ADR-20260929-noise-shader-variants]
related_code: [src/shaders/noise.glsl, src/shaders/gradient.frag.glsl, src/shaders/postprocess/stack.glsl, src/lib/webglShaderSources.ts, src/lib/sceneRenderPlan.ts, src/lib/effectPipeline.ts, src/lib/webgl.ts, src/lib/shaderWarmup.ts, src/lib/shaderWarmupHost.ts]
related_tests: [src/lib/webglShaderSources.test.ts, src/lib/webglExportPrograms.test.ts, src/lib/webgl.lifecycle.test.ts, tests/e2e/shaders.spec.ts]
human_review: required
---

# Noise種別ごとのShader特殊化と起動・Effect反映の高速化

## 背景・問題

Request source: Direct request（「WebView2のメモリ使用量が多い」「スプラッシュスクリーンが閉じたあとでEffectStackの各種エフェクトをONにしても、すぐに反映されない」）。

Windows（ANGLE/Direct3D11、RTX 3060 Ti）での実測では、全Noise種別を含む`generator`のコンパイルに約98〜126秒、`noiseStack`に約44秒かかっていた。Shaderの直列キューは実行中のコンパイルを中断しないため、スプラッシュ（最大4秒）が閉じた後、最初のGPU描画まで約11秒、Effect Stackの有効化は数十秒〜数分反映されなかった。KHR並列コンパイルのwatchdog（30秒）超過後は同期のstatus参照になり、残りのコンパイル中はメインスレッドも止まる。

## 変更理由

利用者が有効にしたEffectをすぐに確認できるようにし、起動直後の操作不能な時間と、巨大Shaderのコンパイル中のGPUプロセスの負荷を減らすため。

## ゴール・成功条件

- 最初のGPU描画が、スプラッシュを閉じる前後（数秒以内）に表示される。
- スプラッシュを閉じた後、Effect StackのNoise／Slit／Mirror／Voronoi／Kaleidoscope／Glass／Textureを有効にすると、数秒以内に反映される。
- 同じシーンの描画結果が変更前と一致する（丸め誤差の範囲）。

## 対象

- Noise依存Program（`generator`、`noiseStack`、`noiseDiffuseStack`）のNoise種別ごとのvariant化と、variantの保持上限。
- Noiseを評価しないGeneratorをbootstrap Programで代替すること。bootstrapからManual Distortを除外すること。
- analytic prefixのGenerator variant準備中に、NoiseをStack passで表示する代替描画。
- 起動時の必須Shader、prefetch、warmupの対象と順序。
- Slitの区間テーブル参照の書き換え（`stack.glsl`、`gradient.frag.glsl`）。

## 対象外

- Legacy pipelineの汎用`postprocess` Program（計測で約4.5〜8分）の分割。Legacy Presetでpostprocessを使う場合の待ち時間は残る。別Issueで扱う。
- Preset形式、保存、Export結果、UIの変更。
- WebView2のブラウザ引数、Tauri／Rust側の変更。

## 影響を受ける現行仕様

- [WebGL Performance Debug / Profiler](../../../specs/current/webgl-performance.md)（PERF-010、PERF-011）
- [起動とスプラッシュスクリーン](../../../specs/current/app-startup.md)（STARTUP-003）

## 関連ADR

- [ADR-0022](../../../adr/0022-startup-splash-and-shader-warmup.md)
- [ADR-20260929-noise-shader-variants](../../../adr/20260929-noise-shader-variants.md)

## 主なリスク

- Noise種別の追加時に`NOISE_TYPE_MAP`とShaderの`#if`ガードがずれると、そのvariantでNoiseが無効になる。単体テストで対応を検査し、E2Eで全variantを実コンパイルする。
- Generator variant準備中の代替描画は、準備後のanalytic描画と厳密な画素値が異なる場合がある（一時的）。
- 実機WebView2（Tauri）での計測は未実施。Playwright Chromium（ANGLE D3D11）で計測した。

## 未決定事項

- なし
