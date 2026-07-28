# Delta

## ADDED Requirements

なし。既存のUI要件を修正し、選択コントロールの実装を置き換える変更です。

## MODIFIED Requirements

### UI-001 InputAngleの表示

InputAngleの測定幅がTweeqの数値入力表示閾値を確実に超えるよう、必要最小限の幅を入力コントロールの境界で確保する。コンパクトなSliderFieldとAnimationタイムラインのAngle表示は、親ラベルの高さと中央揃えを一致させる。表示幅を超えて横方向へ押し出さず、ダイヤルと数値入力を同時に表示する。

### UI-002 Seedのシャッフル

Noise、Slit、StretchのSeed行にあるInputShuffleの追加上マージン相当を削除し、スライダー入力欄の下端へ揃える。Seedの値域、丸め、保存値、シャッフルの操作は変更しない。

### UI-003 Slitの選択コントロール

SlitのMode選択を独自ボタン列からTweeq InputDrumへ変更し、既存の4値とWave切替時の方向・幅の既定値補正を維持する。Auto Modifier選択を独自ボタン列からTweeq InputRadioへ変更し、既存の2値と表示ラベルを維持する。

### UI-004 Animationの名称

日本語カタログの`animation.title`を`ANIMATION`へ変更する。英語カタログ、アニメーションの保存・再生・書き出し動作は変更しない。

## REMOVED Requirements

なし。独自ボタンの見た目は置き換えるが、選択可能なModeとAuto Modifierの契約は廃止しない。
