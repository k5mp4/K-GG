---
type: change
id: CHANGE-20260927-sandbox-datamosh
title: Datamosh エフェクトと Video Motion の統合
status: review
change_kind: F
owners: [maintainer]
created: 2026-09-27
updated: 2026-09-27
current_specs: [CURRENT-EFFECT-STACK, CURRENT-PRESET, CURRENT-UI-CONTROLS, CURRENT-WEBGL-PERFORMANCE]
related_adrs: [ADR-20260927-datamosh-feedback-layer]
related_code: [src/types/datamosh.ts, src/shaders/datamosh/uniforms.glsl, src/shaders/datamosh/motion-field.glsl, src/shaders/datamosh/main.glsl, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/lib/effectPipeline.ts, src/lib/sceneRenderPlan.ts, src/components/DatamoshPanel.tsx, src/components/PostprocessPanel.tsx, src/components/EffectStackPanelView.tsx, src/lib/presetModel.ts, src/components/PresetPanel.tsx, src/store/documentActions.ts, src/components/GradientCanvas.tsx, src/lib/videoExportFrames.ts, packages/kgg-control/src/types.ts]
related_tests: [src/types/datamosh.test.ts, src/lib/effectPipeline.test.ts, src/lib/webglExportPrograms.test.ts, src/store/gradientStore.effectPipeline.test.ts, src/components/PostprocessPanel.test.tsx, tests/e2e/shaders.spec.ts]
human_review: required
---

# Datamosh エフェクトと Video Motion の統合

Request source: Direct request（AIへの直接指示）。

## 背景・問題

K-GGには動画のmotion fieldで前フレームを移流する`Video Motion`がEffect Stackのレイヤーとして存在する。一方、動画コーデックのIフレーム欠落による「データモッシュ」のような、マクロブロック単位でずれて残り続ける表現はない。Video Motionは停止中の再描画でも履歴が進み、描画後に履歴をコピーしていた。

## 変更理由

GLSLとフレームフィードバックだけで、動画を解析しなくてもリアルタイムにDatamosh風の破綻を作れるようにする。また前フレームを使う効果を一つにまとめ、Video MotionをDatamoshエフェクトのmotion sourceとして統合する。当初はSANDBOXの固定段として実装したが、レビュー中の要望で並べ替え可能なEffect Stackレイヤーへ変更した。

## ゴール・成功条件

- Effect Stackに`Datamosh`レイヤーがあり、ON／OFF・並べ替えができ、PostprocessのEdit Layerからパラメータを操作できる。
- 前フレームの履歴を不規則なマクロブロックのmotionでずらし、輝度・彩度ごとに引き伸ばし長を変えられる。Refreshを下げると履歴が引きずられ、破損パラメータでブロックごとのズレ・停止・参照乱れを起こせる。
- motion sourceとしてProcedural（GLSLのcurl noise）とVideo Motion（既存の動画motion field）を切り替えられる。
- 独立した`Video Motion`レイヤーがなくなり、旧Presetのレイヤーと設定はDatamoshへ移行する。
- typecheck、unit/component test、lint、build、WebGL2 shader compileが通る。

## 対象

- `datamosh`設定（型、正規化、Preset保存、旧`videoMotion`の移行）。
- WebGLのDatamoshレイヤー（ping-pong履歴、motion field chunk、不規則パーティション、輝度・彩度stretch、合成shader）とRender Plan。
- PostprocessのDatamosh設定UI。Video Motionの動画UIをDatamoshパネルへ移設。
- Effect Stack、MCPの`EffectKind`の`videoMotion`を`datamosh`へ置換。
- Current Spec（Effect Stack、Preset、UI Controls、WebGL Performance）、ヘルプ、ADRの同期。
- 開発補助: 新しいcloneやworktreeでも`npm run tauri:dev`が起動できるよう、Tauri resourceのFigma connectorが未ビルドなら起動前にビルドする（`tools/tauri-dev.mjs`）。

## 対象外

- 実際の動画コーデックの解析、FFmpeg依存、codec motion vectorの抽出。
- タイル書き出しでのDatamosh再現（ADRの決定5）。
- Datamosh以外の時間フィードバック効果の追加。
- motion fieldの低解像度pre-passによる最適化。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack.md)
- [Preset System](../../../specs/current/preset-system.md)
- [UI Controls](../../../specs/current/ui-controls.md)
- [WebGL Performance](../../../specs/current/webgl-performance.md)

## 関連ADR

- [ADR-20260927-datamosh-feedback-layer](../../../adr/20260927-datamosh-feedback-layer.md)

## 主なリスク

- 互換性: 旧Video MotionのPresetは同じ位置のDatamoshレイヤーになる。移行値は旧Motion Feedbackの履歴重みを近似するが、Stabilizationは再現しない。
- 外部連携: MCP scenarioで`videoMotion`レイヤーを指定していた場合は無効な種類になる（`datamosh`を使う）。
- 性能: Datamosh有効時にフルサイズtargetが2枚増え、procedural motionを画素ごとに評価する。実GPUでのフレーム時間は未測定。

## 未決定事項

- なし（human reviewで、移行後の見た目の差を確認する）。
