---
type: change
id: CHANGE-013
title: Effect Stack GlassをGLASS V2へ統合
status: archived
change_kind: F
owners: [maintainer]
created: 2026-08-02
updated: 2026-08-11
current_specs: [CURRENT-EFFECT-STACK, CURRENT-PRESET, CURRENT-UI-CONTROLS]
related_adrs: [ADR-0004, ADR-0005]
related_code: [src/types/distortion.ts, src/lib/effectPipeline.ts, src/lib/postprocessStack.ts, src/lib/glass.ts, src/lib/webgl.ts, src/components/PostprocessStackPanel.tsx, src/components/PostprocessPanel.tsx, src/store/gradientStore.ts, src/shaders/postprocess/glass-optics.glsl, src/shaders/postprocess/main.glsl]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/postprocessStack.test.ts, src/lib/glass.test.ts, src/lib/effectShaderParity.test.ts, src/store/gradientStore.glass.test.ts, src/store/gradientStore.postprocessStack.test.ts]
human_review: completed
---

# CHANGE-013 Effect Stack GlassをGLASS V2へ統合

実装と自動検証は完了している。ブラウザーCDPの制約によりInputColor幅の修正後実測が未確認のため、受け入れ確認完了までactiveに保持する。

## 背景・問題

Effect Stackには旧GLASSとGLASS V2が別レイヤーとして存在する。旧GLASSの描画が安定せず、2種類を併用できる現在の構成は、描画経路・program準備・Presetの状態を複雑にしている。

## 変更理由

安定性を優先し、Effect Stackで利用するGlassの実装をGLASS V2へ統一する。利用者には一つの`Glass`として見せ、GLASS V2の色収差調整をそのGlassへ集約する。

## ゴール・成功条件

- Effect Stackには`Glass`が一つだけ表示され、`Glass V2`は表示されない。
- 表示上の`Glass`はGLASS V2のshader・描画経路・色調整を使用する。
- 旧Presetの`glass`／`glassV2`レイヤーは読み込み時に一つの`glass`へ決定的に統合され、Presetの読込でGlassレイヤーが増えない。
- 旧GLASSの描画経路がEffect Stackの描画へ混入しない。
- 色収差を現在より強く適用できる上限をUI・保存値の正規化・shader clamp・tile paddingで一致させる。
- Preview、thumbnail、静止画、連番、動画が同じ統合後のEffect Pipelineを使用する。
- Postprocessのプロパティモジュールにも`Glass`を一つだけ表示し、その実体をGLASS V2へ統一する。
- `Transmission Tint`と`Highlight Tint`はTweeqの`InputColor`で編集でき、変更を即時に描画へ反映する。
- `Transmission Tint`と`Highlight Tint`のInputColor表示幅は共通の幅で揃える。

## 対象

- Unified Effect Stack V2のGlassレイヤー、型、既定順、正規化、選択状態、ドラッグ対象。
- GLASS／GLASS V2を含む既存Presetの読み込み互換と重複統合。
- GLASS V2を`Glass`として表示・編集するUIと、GLASS V2専用色調整の表示。
- Effect StackのWebGL program選択、描画、診断、export、tile padding。
- 色収差強度の上限変更と、それに対応する回帰テスト・利用者向け説明。

## 対象外

- GLASS V2の表面形状、屈折モデル、波長サンプル数、色収差計算式の変更。
- PostprocessのGlass以外の効果、Preset全体の保存形式、export codecの変更。
- 色収差設定のキーフレーム／自動アニメーション対応。
- CHANGE-011で扱う書き出し決定性修正の範囲変更。

## 互換性方針（案）

旧Effect Pipelineの`glass`と`glassV2`は正規化時に`glass`へ写像する。両方が存在する場合は最初に現れた位置を維持し、`enabled`は論理和とする。`selectedKind: glassV2`は`glass`へ写像する。新規保存値には`glassV2`を出力しない。

旧Legacy V1の`effectMode: glass`とpostprocess stackの`kind: glass`は、読み込み時に`glassV2`へ写像する読み込み互換だけを維持する。正規化後のUI状態と新規保存値には旧`glass`を残さず、PostprocessのGlassは常にGLASS V2 programを使用する。

## 主なリスク

- 旧GLASSのPresetはGLASS V2で描画されるため、意図した見た目が変わる。
- 色収差上限を広げるとサンプリング半径とtile paddingが増え、GPU負荷・出力端の依存領域が増える。
- `glass`と`glassV2`の統合順を誤ると、Preset読込時にレイヤー順や有効状態が変わる。

## 受け入れ条件

- AC-009: PostprocessのプロパティモジュールにGlassが一つだけ表示され、表示名は`Glass`、旧`Glass`と`Glass V2`の二重表示はない。
- AC-010: 旧`effectMode: glass`および旧stack `kind: glass`は読み込み時に`glassV2`へ正規化され、`glass`と`glassV2`の重複は一つへ統合される。
- AC-011: Postprocess GlassのTransmission TintとHighlight TintはTweeqの`InputColor`を使用し、nativeの`input[type=color]`を使用しない。値変更は既存の大文字HEX保存形式と描画経路を維持する。
- AC-012: 旧Glassのプロパティ分岐は通常のUI状態から到達できず、正規化後のPostprocess GlassはGLASS V2の色調整を表示・適用する。
- AC-013: Transmission TintとHighlight TintのInputColorコンテナおよび入力表示幅が同一である。

## 未決定事項

- `Chromatic Aberration`の上限を`40px→80px`へ広げる。`Chromatic Saturation`の上限`200%`は変更しない。
- 旧`glass`を保存値に残さず、読み込み時だけ`glassV2`へ写像する互換方針を採用する。
