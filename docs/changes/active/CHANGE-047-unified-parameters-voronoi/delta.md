# Spec Delta

## ADDED Requirements

### UI-025 数値入力範囲と既定値の共有

共通レジストリのキーを持つ数値入力は、そのキーに登録された範囲、step、整数指定、角度単位、既定値を使います。対応する保存データは同じ範囲へ正規化され、各数値入力のリセット値も登録済みの既定値を使います。パラメータの保存キーと型は維持します。旧Presetに範囲外の数値がある場合は読込時に登録範囲へ正規化します。

### UI-026 Postprocess Voronoiの入力

PostprocessのVoronoiではCell Scale、Randomness、Distance Metric（Euclidean／Manhattan／Chebyshev／Minkowski）、Minkowski選択時のExponent、Feature（F1／F2／Edge）、Angle、Seedを編集できます。Distance MetricとFeatureの選択肢・既定値はNoiseのVoronoiと共通です。Gradient Scaleと旧Edge Widthの入力は表示せず、旧Presetに保存された値は読込互換のため保持します。

### EFFECT-028 Postprocess Voronoiのセル内テクスチャ変形

PostprocessのVoronoiは、NoiseのVoronoiと同じ距離計量とFeatureを選びます。各Voronoiセルは直前のEffect Stack出力テクスチャを入力としてセル内へ再配置します。Gradient Rampを別に重ねず、Feature値はセル内テクスチャの向きと倍率へ使います。Gradient ScaleとEdge Widthによる暗い境界線は描画しません。旧PresetのGradient ScaleとEdge Widthは保存データに保持しますが、描画には影響しません。

## MODIFIED Requirements

### UI-023 Noise共通プロパティとType順序

Noise Type候補の内部値と保存・描画上の意味は維持します。登録済み数値コントロールの範囲、step、既定値はUI-025の共通レジストリに従います。

### UI-024 GlassTileの操作パネル

数値範囲と既定値は共通レジストリを使い、Edge Modeの選択肢と既定値も選択値レジストリで管理します。

### EFFECT-027 GlassTileのタイル表面光学

GlassTileの数値範囲と既定値は共通数値レジストリ、Edge Modeの選択肢と既定値は選択値レジストリを参照します。GlassTileのPresetキー、選択肢、描画上の意味は維持します。

## REMOVED Requirements

なし。旧VoronoiのGradient ScaleとEdge WidthはPreset互換の保存フィールドとして残ります。