# Delta

## ADDED Requirements

なし。既存のUI-001を明確化します。

## MODIFIED Requirements

### UI-001 InputAngleの表示

InputAngleは、Tweeqのロータリーボタン（`data-tq-component="input-rotary"`）と数値入力を同じ行のInputAngle境界内へ配置する。アプリCSSは存在しない`button[tweak-mode]`ではなく、Tweeqの実コンポーネント属性を対象にする。ロータリーボタンのpadding、幅、高さ、SVGサイズを入力コントロールの寸法に合わせ、ボタンやSVGを右端からオーバーフローさせない。SlitのAngle／Offset Angle、SliderFieldのAngle、Animation方向でこの契約を満たし、値変換と操作イベントは既存の契約を維持する。

## REMOVED Requirements

なし。
