# Delta

## ADDED Requirements

### EFFECT-009 GLASS V2の色調整

GLASS V2は、既存の表面形状、屈折、波長依存分散を維持したまま、色収差成分のHueとSaturation、透過光のTint、ハイライトのTintを個別に調整できる。

Hueの既定値は`0°`、Saturationの既定値は`100%`、Tintの既定値は`#FFFFFF`とし、すべて既定値の場合は変更前のRGBA結果と一致する。色収差Hue／Saturationは色収差残差だけへ作用し、入力Gradient全体の色を一括変換しない。

これらのコントロールはGLASS V2選択時だけ表示・適用し、GLASSの色収差方式と外観へ影響しない。

### PRESET-009 GLASS V2色設定の互換保存

PresetはGLASS V2の色収差Hue、色収差Saturation、Transmission Tint、Highlight TintをPostprocess設定として保存・復元する。新規値を持たない旧Presetはidentityとなる既定値を補完し、無効な色文字列、非有限値、範囲外の数値を安全に正規化する。

### UI-007 GLASS V2専用色コントロール

Postprocessの編集対象がGLASS V2の場合だけ、Chromatic Hue、Chromatic Saturation、Transmission Tint、Highlight Tintを表示する。GLASSの編集画面にはこれらを表示せず、初回変更ではキーフレーム／自動アニメーション操作を提供しない。

## MODIFIED Requirements

### EFFECT-007 Preview、Thumbnail、Export

Preview、Preset thumbnail、静止画・連番・動画は、GLASS V2の新しい色設定を含む同じ正規化済みEffect Pipelineとscene evaluationを共有する。出力形式ごとに別のHue、Saturation、Tint計算を持たない。

## REMOVED Requirements

なし。
