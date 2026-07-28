# Delta

## ADDED Requirements

### GRAD-014 プレビュー表示stateの独立性

GradientRampのColor Mode／Interp候補プレビューとColor Palette GeneratorのHarmonyルール候補プレビューは、それぞれ独立した表示stateと切替操作を持ちます。一方を展開・収納しても、もう一方の表示状態は変更しません。どちらの表示stateもGradientやPresetへ保存しません。

### UI-006 VariableのTweeq入力

GradientRampでInterpがVariableの場合、VariableはTweeqのInputNumberとして表示します。入力値は`-1`〜`1`、stepは`0.001`とし、変更時は既存の`rampVariable`へ有限値を反映します。native range inputは使用しません。

## MODIFIED Requirements

### GRAD-011 配色補助パレット

配色補助の基準色と配色ルールは横2列ではなく、基準色を上段、配色ルールを下段とする1列2段で表示します。基準色を先に入力・確認し、その下でルール候補を選択できる順序を維持します。Harmony候補の色、計算、Gradientへの適用操作は変更しません。

### UI-005 プレビュー付き選択肢のラベル

Color Palette GeneratorのHarmonyルール名は型付きUI用語辞書を通じて表示し、英語UIでは`Analogous`、`Complementary`、`Split-Complementary`、`Triad`、`Square`、`Compound`、`Shades`、`Monochromatic`、日本語UIでは対応する日本語名を表示します。既存のColor Mode／Interp候補表示と通常のCustomSelect操作は維持します。

## REMOVED Requirements

なし。
