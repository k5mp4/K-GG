# Design

## 表示stateの分離

GradientRampはColor Mode／Interp用の`showRampOptionPreviews`を保持し、Color Palette GeneratorはHarmonyルール用の`showHarmonyPreviews`を自身で保持します。親から同じbooleanを渡さず、HarmonyのCustomSelectだけがHarmony用stateを参照します。プレビューの表示stateは既存CHANGE-006と同じく永続化しません。

## 配色補助のレイアウト

基準色のInputColorとHarmonyルールのCustomSelectを`grid-cols-1`相当の縦レイアウトへ変更します。DOM順を基準色→ルールとし、候補グリッドや生成パレットの既存表示はその下に残します。セクション見出し・説明・Apply操作の階層は維持します。

## Variable入力

GradientRampへ`InputNumber`をimportし、Variable表示を既存SliderFieldの数値部分と同じTweeq shellへ置き換えます。`min=-1`、`max=1`、`step=0.001`、`precision=3`、`clampMin`、`clampMax`を設定し、onChangeで有限値をGradient storeへ渡します。描画側の`rampVariable`と既存のホイール／キーフレーム以外の計算経路は変更しません。

## Harmonyのローカライズ

Harmony optionの内部valueは既存の英語識別子を維持し、labelは英語を辞書の基準値とします。`uiLabels.ts`へ8ルールの英日対応を追加し、CustomSelectの既存localize処理で表示言語を切り替えます。保存値・色生成関数は変更しません。
