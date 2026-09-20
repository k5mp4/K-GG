---
type: change
id: CHANGE-047
title: 共通パラメータ定義とPostprocess Voronoi改善
status: draft
change_kind: F
owners: [maintainer]
created: 2026-09-20
updated: 2026-09-20
current_specs: [CURRENT-UI-CONTROLS, CURRENT-EFFECT-STACK]
related_adrs: [ADR-0009]
related_code: [packages/kgg-control/src/parameterLimits.ts, packages/kgg-control/src/parameters.ts, src/lib/parameterLimits.ts, src/lib/voronoi.ts, src/components/SliderField.tsx, src/components/NoiseDistortionPanel.tsx, src/components/PostprocessPanel.tsx, src/store/documentModel.ts, src/store/documentActions.ts, src/types/distortion.ts, src/lib/glass.ts, src/lib/glassTile.ts, src/lib/webgl.ts, src/shaders/postprocess/stack.glsl, src/shaders/postprocess/uniforms.glsl]
related_tests: [src/lib/parameterLimits.test.ts, src/lib/effectShaderParity.test.ts, src/lib/webglShaderSources.test.ts]
human_review: required
---

# CHANGE-047 共通パラメータ定義とPostprocess Voronoi改善

## 背景・問題

数値入力UI、ストアの既定値、プリセット読込時の正規化、描画側の制約が別々に定義されているパラメータがあり、同じ値の範囲・既定値がずれる余地があります。PostprocessのVoronoiはNoiseのVoronoiと距離計量・Feature選択を共有しておらず、セル内へ直前のEffect Stack入力を再配置する操作も不足しています。

## 変更理由

利用者がUI、Preset、Animation、描画経路をまたいで同じパラメータを編集するとき、ひとつの定義から範囲と既定値を適用できるようにします。Postprocess VoronoiではNoise Voronoiと同じ距離計量とFeatureを選び、直前の描画結果をセル状に変形できるようにします。

## ゴール・成功条件

- 登録済み数値パラメータの範囲、step、既定値、整数・角度の扱いが共通レジストリを基準にUI、保存値の正規化、描画制約で一致する。
- NoiseとPostprocessのVoronoiでDistance MetricとFeatureの選択肢・既定値を共有する。Minkowskiを選んだときだけExponentを編集できる。
- Postprocess Voronoiは直前のEffect Stack入力をセル内へ再配置し、追加のGradient Rampや暗いEdge陰影を重ねない。
- パラメータ統一とVoronoi改善を別コミットにし、mainから作成した独立ブランチのドラフトPRに含める。

## 対象

- 共通数値パラメータ定義と、対応するUI、ストア初期値、読込・描画正規化の統一。
- NoiseとPostprocess VoronoiのDistance Metric／Feature選択肢の共通化。
- Postprocess VoronoiのDistance Metric、Feature、Minkowski Exponent入力とセル内テクスチャ変形。
- Current Spec、Spec Delta、Validationの同期。
- GitHub PR作成はDirect requestに基づく。Issueは作成しない。

## 対象外

- Video Motion、WebGL性能計測、Tweeq Hue Wheelなど別変更に属するコードと文書。
- 既存のPresetキーの削除や形式移行。
- Postprocess StackへのVoronoi以外の効果追加、主スタック種類・順序の変更。
- GPU実機の見た目や性能に関する数値保証。

## 影響を受ける現行仕様

- [UI入力コントロール](../../../specs/current/ui-controls)
- [Effect Stack](../../../specs/current/effect-stack)

## 関連ADR

- [ADR-0009 パラメータ範囲と正規化の共有](../../../adr/0009-unified-parameter-limits)

## 主なリスク

共通レジストリへ寄せることで、従来のUI範囲と保存値・描画側の範囲が異なっていた項目では編集可能範囲が変わります。範囲を広げる項目は既存の正規化・描画側上限に合わせ、Presetキーと通常の既定値を維持します。Postprocess VoronoiのFeatureはセル境界の色線ではなく、セル内テクスチャの向き・倍率へ反映します。

## 未決定事項

なし。GPUを使った最終的な見た目確認はRelease Gateとして別途記録します。
