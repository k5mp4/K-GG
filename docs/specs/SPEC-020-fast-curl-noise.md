---
id: SPEC-020
title: Fast Curl Noiseの追加と軽量化
status: approved
owners: [maintainer]
created: 2026-07-19
updated: 2026-07-19
depends_on: [SPEC-001, SPEC-013, SPEC-014]
related_adrs: [ADR-0005]
related_code: [src/types/distortion.ts, src/store/gradientStore.ts, src/components/NoiseDistortionPanel.tsx, src/lib/webgl.ts, src/shaders/noise.glsl, src/shaders/gradient.frag.glsl, src/shaders/postprocess.frag.glsl]
related_tests: [src/store/gradientStore.effectPipeline.test.ts, src/lib/effectShaderParity.test.ts]
human_review: completed
---

# SPEC-020: Fast Curl Noiseの追加と軽量化

## 背景・問題

既存Curlは、各移流ステップで3D fBMを4回評価する有限差分から流れ場を作る。Seamless Loopの補間区間では同じ処理をcurrent/wrappedの2経路で評価するため、解像度とオクターブ数が高い設定で負荷が急増する。

## ゴール・成功条件

- 既存Curlと既存プリセットの見た目を維持したまま、Fast Curlを別のNoise種別として追加する。
- Fast Curlは解析的偏微分を使い、有限差分と3D fBMを使わずに発散のない2D流れ場を作る。
- Fast CurlはSeamless Loop時にcurrent/wrappedの二重評価を行わず、LegacyとV2 Stackで同じ座標変換結果を持つ。

## スコープ

### 対象

- `fast_curl`の型、プリセット、UI、WebGL uniform mapping、GLSL実装。
- 解析的微分を返す回転勾配Simplexと、その勾配を90度回転したcurl field。
- LegacyとV2のshader parity、型切替とGPU tier制限のテスト。

### 対象外

- 既存Curlの式、保存済みプリセット、`curlEps`の意味の変更。
- Flow Noise、Perlin Noise、Value Noiseの追加。
- GPU固有のフレーム時間をアプリ内へ計測・保存する機構。

## 方針

`fast_curl`は、2D Simplex値と解析的偏微分を同時に返す関数をオクターブ合成する。合成勾配`(dx, dy)`から`(dy, -dx)`を作り、`curlSteps`回だけUVを移流する。各オクターブは回転勾配の角度を時間に対して周期進行させるため、Seamless Loopでは同一fieldのcurrent/wrappedを混合しない。

Fast Curlの初期値はAmount 0.30、Scale 0.5、Octaves 3、Flow Steps 2、Flow Strength 0.5とする。`curlSteps`、`curlSpeed`、`curlSeed`はFast Curlでも共有するが、Fast Curlの`curlSpeed`は流れの強さであり、Legacy Curlの時間速度とは異なる。`curlEps`はLegacy Curlだけに表示する。

## エラー・境界条件

- `curlSteps`と`octaves`は既存の1〜8範囲とGPU tierの上限を適用する。
- Loop periodが0以下でも既存の最小値clampを使い、NaNを作らない。
- 既存プリセットの`type: "curl"`は自動変換せず、Legacy Curlを選択したまま読み込む。

## 受け入れ条件

- AC-001: Noiseパネルで`Curl (Legacy)`と`Fast Curl`を個別に選べ、Fast Curlの型別初期値が適用される。
- AC-002: Fast Curlは解析的微分を使い、Fast Curl経路に`fbm3D`、有限差分、current/wrappedの二重評価を含まない。
- AC-003: Fast CurlのLegacyとV2 Stackの座標変換関数は同じアルゴリズムである。
- AC-004: `curl`を含む既存設定とプリセットの型および既存CurlのGLSL経路は変わらない。
- AC-005: Fast Curlも低・中GPU tierで既存のNoise octaves/Curl stepsの上限を受ける。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-004, AC-005 | store unit test | `src/store/gradientStore.effectPipeline.test.ts` |
| AC-002, AC-003 | shader source/parity test | `src/lib/effectShaderParity.test.ts` |
| 全体 | docs、unit、lint、build | `npm run docs:check`、`npm run docs:build`、`npm test`、`npm run lint`、`npm run build` |

## 移行・互換性

保存形式はNoise種別の値を1つ追加するだけである。旧プリセットは`fast_curl`を持たないため既存の挙動を維持し、`curl`はLegacy Curlとして継続する。

## 未決定事項

なし。
