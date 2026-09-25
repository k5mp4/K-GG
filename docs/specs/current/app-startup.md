---
type: current
id: CURRENT-APP-STARTUP
title: 起動とスプラッシュスクリーン
status: current
owners: [maintainer]
created: 2026-09-25
updated: 2026-09-25
requirement_ids: [STARTUP-001, STARTUP-002, STARTUP-003, STARTUP-004, STARTUP-005, STARTUP-006]
related_adrs: [ADR-0015, ADR-0022]
related_changes: [CHANGE-054]
related_code: [index.html, src/main.tsx, src/branding/brand.ts, src/features/splash/SplashScreen.tsx, src/features/splash/SplashScreen.css, src/features/splash/splashPolicy.ts, src/features/splash/splashVisual.ts, src/features/splash/staticSplashVisual.ts, src/lib/shaderWarmup.ts, src/hooks/useWebGL.ts, src/i18n/messages.ts]
related_tests: [src/features/splash/splash.test.ts, src/lib/shaderWarmup.test.ts, 'manual: Browser / Tauri startup splash check']
---

# 起動とスプラッシュスクリーン

## 目的

起動直後にブランドのスプラッシュを表示し、その裏で本体のWebGL contextと現在のシーンに必要なShaderを準備してから、操作可能な状態の画面を表示する。スプラッシュは待ち時間を隠す表示層であり、描画結果、Preset、出力を変更しない。

## 現在の要件

### STARTUP-001 起動直後の表示

JavaScriptの読み込み前から、背景色・マーク・製品名だけの静的なスプラッシュを表示する。React起動後は同じ表示を引き継ぎ、見た目を切り替えずに進捗表示を加える。JavaScriptの読み込みに失敗した場合でも、静的スプラッシュは一定時間後に自動で非表示になり、画面を覆い続けない。

### STARTUP-002 裏での準備

アプリ本体とPreview Canvasはスプラッシュの下で最初から起動する。Shaderはスプラッシュ用に別contextでは準備せず、PreviewのWebGL contextで準備する。スプラッシュ用の演出はCSS／SVG、またはPreviewと別のWebGL contextを使わない描画方式で行う。

### STARTUP-003 表示終了の条件

スプラッシュは次のいずれかで閉じる。

- WebGLが初期化され、現在のシーンに必要なShaderがすべて準備完了または失敗し、最低表示時間（既定600ms）を経過した。
- WebGL2が使えない、または初期化に失敗した（CPU Previewを表示する）。
- 最大表示時間（既定4秒）を経過した。
- 利用者がクリック、Esc、Enter、Spaceでスキップした。

Shaderの失敗や遅延でスプラッシュが閉じなくなることはない。閉じた後も残りのShader準備は裏で継続する（PERF-011）。

### STARTUP-004 スプラッシュ演出の差し替え

スプラッシュの演出は静的ポスター、Lottie、Riveのいずれかを設定で選べる構造にする。Lottie／Riveのランタイムは必要時だけ読み込み、初期bundleやWebGL初期化を遅らせない。ランタイムが未登録、読み込み失敗、読み込みが上限時間（既定1.5秒）を超えた場合は静的ポスターで表示を続ける。退場アニメーションの待ち時間にも上限（既定1.2秒）を設ける。現時点で登録されている演出は静的ポスターだけである。

### STARTUP-005 アクセシビリティと環境

スプラッシュは起動中であることを支援技術へ伝え、進捗を0〜100で公開する。`prefers-reduced-motion`が有効な環境ではマークのアニメーションと進捗の遷移を止める。文言は英語・日本語の言語設定に従う。

### STARTUP-006 自動テストとの分離

E2E用のDevelopment起動（`VITE_KGG_E2E=1`）ではスプラッシュを表示せず、静的ポスターも直ちに取り除く。Productionビルドではこの分岐を利用者向けに公開しない。

## 境界と互換性

スプラッシュはPreset、保存形式、Export、描画結果、Tauri／Rust境界を変更しない。ブランド名、表示時間、演出の種類は`src/branding/brand.ts`、色は`design-tokens.css`の既存トークンを一次情報とし、JavaScript読み込み前の静的ポスターは同じ値をHTML内に持つ。
