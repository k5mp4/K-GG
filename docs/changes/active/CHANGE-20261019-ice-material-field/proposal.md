---
type: change
id: CHANGE-20261019-ice-material-field
title: 共有Material Fieldによる配色とIceレイヤー
status: review
change_kind: F
owners: [maintainer]
created: 2026-10-19
updated: 2026-10-20
current_specs: [CURRENT-GRADIENT, CURRENT-PRESET, CURRENT-UI-CONTROLS, CURRENT-WEBGL-PERFORMANCE, CURRENT-EFFECT-STACK, CURRENT-VIDEO-EXPORT, CURRENT-VJ-PERFORMANCE]
related_adrs: [ADR-20261019-ice-material-field]
related_code: [src/types/materialField.ts, src/lib/materialField.ts, src/shaders/material-field.glsl, src/shaders/gradient.frag.glsl, src/types/ice.ts, src/lib/ice.ts, src/shaders/ice.frag.glsl, src/lib/webglShaderSources.ts, src/lib/sceneRenderPlan.ts, src/lib/effectPipeline.ts, src/lib/meshGradientField.ts, src/lib/webgl.ts, src/lib/sceneEvaluation.ts, src/lib/tileRender.ts, src/lib/renderBridge.ts, src/hooks/useWebGL.ts, src/components/MaterialFieldControls.tsx, src/components/IcePanel.tsx]
related_tests: [src/types/materialField.test.ts, src/lib/materialField.test.ts, src/lib/presetModel.materialField.test.ts, src/store/gradientStore.materialField.test.ts, src/lib/sceneRenderPlan.materialField.test.ts, src/lib/meshCoordinateField.test.ts, src/lib/webglMaterialField.test.ts, src/components/MaterialFieldControls.test.tsx, src/types/ice.test.ts, src/lib/ice.test.ts, src/lib/presetModel.ice.test.ts, src/lib/sceneEvaluation.ice.test.ts, src/components/IcePanel.test.tsx, tests/e2e/ice.spec.ts, tests/e2e/shaders.spec.ts]
human_review: required
---

# 共有Material Fieldによる配色とIceレイヤー

Request source: Direct request。[Ice Material Field - Plan](../../../plans/2026-10-18-0201-feat-ice-material-field-plan.md)に沿った実装依頼。計画の二つの提供単位、U1〜U3（共通場を厚み・亀裂の配色へ使う機能）とU4〜U6（同じ場を使うIce効果、その編集・外部操作、出力）を対象にする。

## 背景・問題

既存Glassは氷内部の厚みや白濁を持たず、その構造をGradientの配色へ使えない。模様をIce shaderに閉じ込めると、同じ厚みや亀裂を配色へ使うたびに別実装が必要になる。

## 変更理由

画面全体の氷（厚み、亀裂、霜、気泡、反射）を外部素材なしで作り、その構造を抽象的なグラデーションにも再利用する。構造は一つの保存値として持ち、GradientとIceが同じ値を参照する。どちらも指定時刻を直接評価でき、Preview・Thumbnail・書き出し・タイルで同じ規則を使う。

## ゴール・成功条件

計画のR1〜R14。とくに次を自動検証で確認する。

- R1・R3: 透明な氷、亀裂、霜で白濁した氷を作れ、吸収を弱めても白濁は残る（AE1）。
- R2・R10・R11: Iceは通常のMain Stackレイヤーで、元座標のalphaを保持し、Image Gradient Sourceの保護中は適用しない（AE6）。
- R4・R5・R13: 場はRampの色に依存せず、Iceと独立して配色に使える（AE2）。
- R6・R7・R9: 順序・タイル・時刻0と1で同じ結果（AE3・AE5）。
- R12・R14: 新設定を使わない旧Presetは同じ描画で、新しい資源はRender Planと所有・解放境界に入る（AE7）。

## 対象

- 保存と編集: `materialField`、`gradient.fieldInput`、`ice`、Effect Stackの`ice`レイヤー、正規化、command、Undo/Redo、Preset、Thumbnail、共有パラメータ（UI・kgg-control/MCP）、VJの値の取得・復元。
- 時間評価: 場とIceの位相、キー評価。
- 描画: 場のGLSL、場付きGenerator variant、Ice program、Render Plan、Meshの`v` lookup、Thumbnail・Export・VJ事前ロードのprogram準備、タイル余白と失敗条件。
- UI: Gradient Rampの構造入力と共通の構造、Edit LayerのIce。
- 文書: Current Spec（GRAD-028、PRESET-024・025、UI-032・033、ICE-001〜003、EXPORT-005、VJ-007、PERF-011）とADR。

## 対象外

- 代表Preset（Clear／Cracked／Frosted Ice、Crack Ramp）の登録と1080pの性能計測（計画U7の一部）。Release Gateとして扱う。
- 3D氷塊、体積レイマーチ、多重屈折、汎用ノードエディター、複数の共有場、任意Stackやキーの強制ループ化。
- 遠隔参照するレイヤー（Mirror／Kaleidoscope）とIceを同時に使うタイル出力。
- commit・push・Issue・PR作成。

## 影響を受ける現行仕様

- [Gradient System](../../../specs/current/gradient-system.md) GRAD-028
- [Effect Stack](../../../specs/current/effect-stack.md) ICE-001〜003、EFFECT-001・002、Analytic Prefixの条件
- [Preset System](../../../specs/current/preset-system.md) PRESET-024・025
- [UI Controls](../../../specs/current/ui-controls.md) UI-032・033
- [Video Export](../../../specs/current/video-export.md) EXPORT-005
- [VJ Performance](../../../specs/current/vj-performance.md) VJ-007
- [WebGL Performance](../../../specs/current/webgl-performance.md) PERF-011

## 関連ADR

- [共有Material FieldとIce](../../../adr/20261019-ice-material-field.md)

## 主なリスク

- 場の入力中はanalytic prefixを使わないため、Noise／Diffuseを含む構成の負荷が増える。
- 場付きvariantとIce programは初回コンパイル待ちがある（ANGLEで約8秒と約3秒を観測）。
- Iceは1画素あたり最大28回のsource読み出しと、場の評価（Voronoi 2スケール、fbm数回）を行う。1080pの描画時間は未計測。
- 厚みの固定値域0〜4により、既定値では構造入力がRampの0.125〜0.375だけを使う。
- 氷らしさ（亀裂がセル線に見えないか、白濁で平坦にならないか）は目視確認が必要。

## 未決定事項

- 実GPUでの画質・性能（16.7ms/frameの暫定目標）とNative出力（Tauri／FFmpeg／After Effects）はRelease Gate。Browserの自動検証から合格を推測しない。
