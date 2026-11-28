# Delta

## ADDED Requirements

### SHAPES-001 SANDBOX Shapes最終段

Shapesは完成した描画全体（Seamlessを含む）の後に適用するSANDBOXの固定段で、描画面をコピーして専用program（`shapes`）で描き直す。有効時だけ遅延コンパイルし、Export準備で待つ。グローバル座標で評価し、タイル書き出しはフル描画と一致する。

### SHAPES-002 形状ソースとマスク

`circle`／`star`／`text`は内蔵のパスデータ、`custom`は読み込んだSVG。SVGは無害化し、アルファだけを長辺30%の余白付きマスク（mipmap付き）として使う。読み込んだSVGはセッション内だけで保持し、未読込の`custom`は`star`で描画する。

### SHAPES-003 輝度の場とGradient Ramp

なめらかな輪郭（`softness`）、3スケールのぼかし平均によるインナーシャドウの奥行き（`innerShadow`／`innerShadowSize`／`shadowOffset`／`lightAngle`）、動くFill（`flow`／`ripple`／`stripes`／`render`、整数`fillCycles`でループ）、外側へ続くオーラ（`glowRadius`／`glowIntensity`）から0..1の輝度の場を作り、ソフトニー・`contrast`・`grain`を経てGradient Rampで着色する。長さは形状の短辺に対する比。背景はRampの左端、`transparentBackground`で透明にできる。

### SHAPES-004 表示・非表示ループ

`fadeGlow`／`wipe`／`flicker`／`none`。Animation 1ループに`revealCycles`回、各サイクルは表示保持→消える→非表示→現れる。ループ位相を使い、時刻0と1が一致する。Animation OFFでは常に表示する。

### PRESET-021 Shapes設定の保存互換

`shapes`を正規化して保存・復元し、旧Presetは無効の既定値で補完する。読み込んだSVGは保存しない。

### UI-031 SANDBOX Shapes

SANDBOXの`Edit Layer`に`Shapes`を加え、Shape／Edge／Fill／Gradient／Show / Hide Loopの設定を表示する。

## MODIFIED Requirements

### EFFECT-003 固定段と描画順

変更前: `Base → Surface → Main Stack → Prism → Flow Gradient → Particles`。変更後: 同じ順序の描画が終わった後に、有効時はShapesを最終段として適用する。

### SANDBOX-001 SANDBOX パネルモジュールの拡張

変更前: 6モジュール、`/6`。変更後: `Shapes`を加えた7モジュール、`/7`。

### PRESET-002／PRESET-017

保存しない外部入力に、Shapesで読み込んだSVGを加える。SANDBOX設定の完全保存に`shapes`を加える。

### UI-010 トップバーとSANDBOXのモジュール入口

SANDBOXの選択肢に`Shapes`を加える。

## REMOVED Requirements

なし。
