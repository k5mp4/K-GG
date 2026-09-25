---
type: change
id: CHANGE-055
title: 起動スプラッシュとEffect Stack Shaderの事前準備
status: review
change_kind: F
owners: [maintainer]
created: 2026-09-25
updated: 2026-09-25
current_specs: [CURRENT-APP-STARTUP, CURRENT-WEBGL-PERFORMANCE]
related_adrs: [ADR-0015, ADR-0022]
related_code: [index.html, src/main.tsx, src/branding/brand.ts, src/features/splash/SplashScreen.tsx, src/features/splash/SplashScreen.css, src/features/splash/splashPolicy.ts, src/features/splash/splashVisual.ts, src/features/splash/staticSplashVisual.ts, src/features/splash/mediaSplashVisual.ts, src/lib/shaderWarmup.ts, src/lib/shaderWarmupHost.ts, src/lib/webgl.ts, src/hooks/useWebGL.ts, src/components/PostprocessStackPanel.tsx, src/i18n/messages.ts]
related_tests: [src/lib/webglCompilePolicy.test.ts, src/lib/shaderWarmup.test.ts, src/features/splash/splash.test.ts]
human_review: required
---

# CHANGE-055 起動スプラッシュとEffect Stack Shaderの事前準備

## 背景・問題

Request sourceは利用者からの直接依頼です。Effect Stackの行を有効にしてから描画へ反映されるまで待ち時間があり、利用者の負担になっています。原因は各EffectのShaderが初回利用時にコンパイルされること、同一contextのコンパイルが直列で先着順のため起動直後の重い`generator`の後ろに並ぶことです。

あわせて、今後のブランド化に向けたスプラッシュスクリーンを用意します。演出はLottieやRiveで制作する可能性があります。

## 変更理由

スプラッシュで全Shaderの準備を待つと起動が長くなり、Glass系では閉じられなくなる可能性があります。そこで待ち時間の解消はShader準備の優先度とアイドル時間の事前準備で行い、スプラッシュは現在のシーンの準備だけを待つ表示層として分けます。演出の制作方法が決まる前に、差し替え可能な境界を用意します。追加の依頼により、同梱したAVIF、GIF、MP4（AV1を含む）などのファイルを演出に使え、形式を設定だけで差し替えられるようにします。

## ゴール・成功条件

- AC-001: 待機中のlazy Shaderはdemand、prefetch、warmupの順に開始し、直列実行を維持する。warmupで待機中のShaderを描画が要求するとdemandへ引き上がる。
- AC-002: Preview初期化後、現在のシーンのShaderをdemandで準備し、残りのEffect Stack用Shaderをアイドル時間に一つずつ準備する。Export中や並列コンパイルが使えない環境では事前準備を行わない。
- AC-003: Effect Stackの無効な行へのホバーまたはフォーカスで、その行に必要なShaderをprefetchする。
- AC-004: JavaScript読み込み前から静的スプラッシュ（黒い背景、`K-GG`表記、アプリバージョン）を表示し、React起動後に同じ表示を引き継いで中央に進捗バーを加える。
- AC-005: スプラッシュは準備完了かつ最低表示時間経過、WebGL不可、最大表示時間経過、スキップのいずれかで閉じる。閉じる前に進捗バーを100%まで伸ばす。
- AC-006: 演出はアダプターで差し替えられ、未登録・失敗・時間超過では静的ポスターへ戻る。
- AC-007: E2E起動ではスプラッシュを表示しない。
- AC-008: 同梱の画像・動画（AVIF、GIF、WebP、PNG、SVG、MP4／WebMのH.264・AV1・VP9）を演出に指定できる。候補は優先順に試し、デコードできない形式・コーデックは次の候補、最後は静止画または静的ポスターへ戻る。reduced motionでは静止画で表示する。

## 対象

lazy Shaderの優先度付きキュー、起動後の事前準備、Effect Stack行のprefetch、静的スプラッシュと演出アダプター境界、同梱の画像・動画の演出アダプター、黒い背景・`K-GG`表記・進捗バー・アプリバージョンの既定スプラッシュ、ブランド設定、関連Current Spec／ADR。

## 対象外

- Lottie／Riveのランタイム依存の追加とアダプター実装（演出アセットが決まった時点で別Requestとする）。
- Shaderソースの軽量化や分割。
- ブランド用のスプラッシュ演出（画像・動画など）の採用。仕組みだけを用意し、演出は後日`brand.ts`で設定する。
- 利用者がディスク上の任意の画像・動画を選んでスプラッシュに使う機能（asset protocol、CSP、Rustでのパス検証、設定の保存が必要になるため別Requestとする）。
- Tauriのスプラッシュ専用ウィンドウ、`index.html`の`<title>`などのブランド名統一。
- 描画結果、Preset形式、Export、Tauri／Rustの変更。
- commit、push以外の外部操作（Pull Request、Issue作成）。

## 影響を受ける現行仕様

- [起動とスプラッシュスクリーン](../../../specs/current/app-startup)
- [WebGL Performance](../../../specs/current/webgl-performance)

## 関連ADR

- [ADR-0015](../../../adr/0015-development-webgl-observability)
- [ADR-0022](../../../adr/0022-startup-splash-and-shader-warmup)

## 主なリスク

- 事前準備により起動後のGPUドライバ負荷とProgramメモリが増えます。直列実行を維持し、Export中と同期コンパイル環境では行わないことで抑えます。
- 実行中のコンパイルは中断できないため、Glass系の事前準備中に別のEffectを有効にすると、その完了まで待つ場合があります。Glass系を最後に置き、それ以前のShaderは準備済みにすることで影響を抑えます。
- 待ち時間の短縮量はGPU・ドライバに依存し、自動テストでは確認できません。Release Gateで実機確認します。

## 未決定事項

- スプラッシュの最低／最大表示時間（600ms／4秒）の妥当性。ブランド演出が決まった時点で見直します。
- Lottie／Riveのどちらを採用するか、およびCSPへ`'wasm-unsafe-eval'`を追加するか（Rive／dotLottieを採用する場合）。
