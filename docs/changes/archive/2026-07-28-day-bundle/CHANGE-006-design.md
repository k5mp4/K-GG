# Design

## 表示構造

GradientRampのDOM順序を次の流れへ整理します。

```text
Gradient Type
  ↓
Stop editor（不透明度ランプ、色ランプ、ストップ操作）
  ↓
Color Mode / Interp
  └─ SHOW PREVIEWS: 背景付き候補グリッドを直接選択
  ↓
Variable / Repeat / Mirror / 編集説明
  ↓
Color Palette Generator
```

ストップ編集をプレビュー候補より前に置くことで、候補グリッドの展開がストップ編集の座標を変えません。カラーモードと補間の変更は既存どおりRamp設定へ反映し、ストップ操作と同じGradient storeを使います。

## CustomSelect

既存の`alwaysShowPreviews`に加えて、対象箇所だけで使う`previewOnly`相当の明示propを追加します。プレビュー専用時はラベルと候補グリッドを残し、トリガー、ドロップダウン、ホバーによる開閉処理を描画・操作対象から外します。通常時は現在のトリガーとドロップダウンをそのまま使います。

## 配色ルールの候補プレビュー

ColorPaletteGeneratorへプレビュー表示フラグと候補描画関数を渡します。各候補は現在のInputColor値とHarmonyTypeから既存の`generateHarmonyPalette`で生成し、色チップを横並びにしたボタンとして表示します。候補を押した場合はHarmonyTypeだけを更新し、Gradientへの適用は既存のApply操作に限定します。

## 互換性

プレビューの表示状態は保存しません。Gradientの`rampColorMode`、`rampInterpolation`、Ramp stop、HarmonyTypeの計算結果、PresetのJSON形状は変更しません。英語の補間候補名は保存値と既存の表示契約を維持するため、ローカライズ追加の対象にしません。
