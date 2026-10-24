# Delta

本文はCurrent Specへ統合済み。ここでは追加・変更した要件だけを示す。

## ADDED Requirements

### GRAD-028 共有Material Fieldによる配色入力

`gradient.fieldInput`（`none`／`thickness`／`cracks`、影響量0〜1）とrootの`materialField`を追加。通常6方式は`mix(g, f, s)`を既存Repeat・Rampへ渡し、Meshのランプ対応モードは`mix(Mesh従来色, Ramp(mix(v, f, s)), s)`で合成する。場は全出力座標・Seed・設定・位相だけで決まり、Ramp色に依存しない。Image Gradient Source保護中、Mesh直接色、Legacy V1では設定を保持して実効無効。位相は`autoTime`から一度だけ作り、整数周期で時刻0と1が一致する。

### PRESET-024 Material Fieldと構造入力の保存互換

`materialField`と`gradient.fieldInput`をPreset、Undo/Redo、Thumbnail、Export snapshot、共有パラメータの対象にする。旧Presetは既定の構造と`source: none`で読み込み、開いている文書の値を引き継がない。

### UI-032 Gradientの構造入力と共通の構造

Gradient Rampに構造入力・影響量・無効理由と、「GradientとIceで共有」と明示した共通の構造の編集を追加する。

### ICE-001〜003 Ice Effect Stackレイヤー

主スタックに`ice`レイヤーを追加（既定は無効、既定順の最後）。Ice自身のノイズテクスチャーから作るバンプマップ（部分的な隆起・面取り・微細なざらつき）と粗さマップ（ツヤと曇りの混在）を表面とし、共有Material Fieldの内部構造と合わせて、前段textureを屈折・吸収・散乱・逆光・反射・ハイライトで処理する1 pass。線形光で合成し、出力alphaは元座標のalpha。Mix 0は恒等でprogramも要求しない。Image Gradient Source保護中は適用しない。光は整数周期で巡り、構造は動かさない。タイル出力は上限から求めた余白を固定し、確保できない場合とMirror／Kaleidoscopeとの併用は描画前に失敗する。

### PRESET-025 Ice設定の保存互換

rootの`ice`と`ice`レイヤーを保存。旧Presetは無効の既定値で読み込み、旧stackの順序を保ってIceを末尾へ補う。

### UI-033 Effect Stack Ice

Edit LayerにIceを追加。「表面」（バンプマップと粗さマップ）、「光学」、「内部の構造（共有）」（Gradientと同じ編集UI、亀裂は表示しない）、「動き」（表面ノイズの展開・流れ・隆起の成長と光の回転）に分けて表示する。

## MODIFIED Requirements

### EFFECT-001・002 主スタックの種類と既定順

変更前: 14種類、既定順の最後は`Distort Chroma`。

変更後: `Ice`を加えた15種類、既定順の最後は`Ice`。

### EXPORT-005 GLASS系とタイル出力

変更前: Glass系の余白だけを確保し、タイル寸法に収まらない余白は丸める。

変更後: Iceの余白を加え、Iceの余白を確保できない場合と遠隔参照レイヤーとの併用では描画前に失敗する。

### VJ-007 演奏操作の復帰と保持

変更前: 効果ごとの値を戻す。

変更後: Iceの値と一緒に共有Material Fieldの構造も戻す。

### PERF-011 Shaderの事前準備と優先順位

変更前: Generatorは、Noiseを評価しない場合にbootstrap Programを使う。

変更後: 加えて、Material Fieldの入力が実効有効な場合は場付きのGenerator variant（`generator:-2`）を使い、analytic prefixはNoise／Diffuseを取り込まない。variantは場の入力が有効になったときだけ準備し、Export・Thumbnail・VJ事前ロードは描画前に準備する。

### Effect Stack Analytic Prefix（EFFECT-026近傍の記述）

変更前: Analytic Prefixの条件はGradient種別、画像入力、固定段、Noise／Diffuseの条件で決まる。

変更後: Material Fieldの入力が実効有効な間はAnalytic PrefixでNoise／Diffuseを取り込まない。場の入力が無効な場合は従来どおり。

## REMOVED Requirements

なし。
