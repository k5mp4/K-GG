---
type: change
id: CHANGE-012
title: GLASS V2色調整コントロール
status: archived
change_kind: F
owners: [maintainer]
created: 2026-08-01
updated: 2026-08-01
current_specs: [CURRENT-EFFECT-STACK, CURRENT-PRESET, CURRENT-UI-CONTROLS]
related_adrs: [ADR-0004, ADR-0005]
related_code: [src/types/distortion.ts, src/store/gradientStore.ts, src/lib/glass.ts, src/lib/webgl.ts, src/components/PostprocessPanel.tsx, src/shaders/postprocess/glass-optics.glsl]
related_tests: [src/lib/glass.test.ts, src/lib/effectShaderParity.test.ts, src/store/gradientStore.glass.test.ts]
human_review: completed
---

# GLASS V2色調整コントロール

## 背景・問題

GLASS V2は屈折、色収差、粗さ、ハイライトを調整できるが、色収差の色相・彩度や透過色、ハイライト色は固定されている。屈折形状が安定しても、作品のパレットへ合わせた色収差や微妙な色味を作るには他の効果へ依存する必要がある。

一方、従来のGLASSは現在の色収差表現が意図した外観として評価されているため、この変更でGLASSの色計算や既定外観は変更しない。

## 変更理由

GLASS V2固有の色調整を追加し、屈折形状や色収差量を変えずに、色収差の色方向、彩度、透過色、ハイライト色を作品単位で微調整できるようにする。

## ゴール・成功条件

- GLASS V2選択時だけ、色収差Hue、色収差Saturation、Transmission Tint、Highlight Tintを編集できる。
- 全コントロールの既定値は現在のGLASS V2出力と画素単位で同じ結果を返す。
- 色収差Hue／Saturationは色収差成分だけへ作用し、基になるGradient全体の色相を不必要に回転しない。
- TintはGLASS V2の透過光とハイライトへ個別に作用する。
- 新しい値はPresetへ保存され、値を持たない旧Presetは既定値で従来外観を維持する。
- GLASSのshader、UI、Preset外観は変更しない。

## 対象

- GLASS V2専用の次のコントロール
  - Chromatic Hue: `-180°..180°`、既定値`0°`
  - Chromatic Saturation: `0..200%`、既定値`100%`
  - Transmission Tint: `#RRGGBB`、既定値`#FFFFFF`
  - Highlight Tint: `#RRGGBB`、既定値`#FFFFFF`
- Postprocess設定、Preset保存・読込・正規化
- GLASS V2 shader uniformと色計算
- Preview、Thumbnail、静止画、連番、動画での描画一致
- 既定値互換、破損値、旧Preset、GLASS非影響のテスト

## 対象外

- GLASSの色収差方式や既定外観の変更
- GLASS V2の表面形状、屈折方向、Cauchy分散、波長サンプル数の変更
- 色調整値のキーフレーム／自動アニメーション対応
- グローバルなカラーグレーディング、LUT、色空間変更
- Effect Stackへ同種GLASS V2を複数追加する機能
- GLASS書き出し決定性修正（CHANGE-011で扱う）

## 受け入れ条件

- AC-001: GLASS V2選択時だけ4つの色調整が表示され、GLASS選択時には表示されない。
- AC-002: Hue=`0°`、Saturation=`100%`、両Tint=`#FFFFFF`で、変更前GLASS V2と同じRGBA結果を返す。
- AC-003: Hue変更は色収差成分の色方向を変更し、屈折位置、表面形状、色収差量を変更しない。
- AC-004: Saturation=`0%`で色収差成分を無彩色化し、`100%`で既定、`200%`で強調する。出力は有限値かつ表示可能範囲へ収まる。
- AC-005: Transmission TintとHighlight Tintは互いに独立し、白ではidentityとなる。
- AC-006: 新規値をPresetへ保存・再読込でき、欠落、無効なHEX、非有限、範囲外の値は安全な既定値または上限へ正規化される。
- AC-007: GLASS単体のshader source、uniform、既定RGBA結果は変更しない。
- AC-008: Preview、Thumbnail、PNG、PNG連番、MOV、MP4は同じ正規化値とGLASS V2色計算を使用する。
- AC-009: unit test、shader parity、Preset互換テスト、実機目視確認、必須検証コマンドの結果をvalidationへ記録する。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack)
- [Preset System](../../../specs/current/preset-system)
- [UI Controls](../../../specs/current/ui-controls)

## 関連ADR

- [ADR-0004 Postprocess Stack Rendering](../../../adr/0004-postprocess-stack-rendering)
- [ADR-0005 Unified Effect Stack V2](../../../adr/0005-unified-effect-stack-v2)

## 主なリスク

- 色収差後の全画像へHueを適用するとGradient本体まで変色するため、色収差残差だけを変換する必要がある。
- sRGB／linear RGBの扱いを変更すると既定値互換を壊すため、この変更では既存shaderのscreen RGB計算へidentity-preservingな変換だけを追加する。
- HEX文字列の破損値がNaN uniformへ伝播しないよう、保存読込時とuniform変換時の両方で防御する。
- GLASSとGLASS V2が共有している既存パラメータへ新規値を混入させない。

## 未決定事項

なし。4コントロール、範囲、既定値、GLASS非影響、初回は非アニメーションという境界を人間レビュー対象とする。
