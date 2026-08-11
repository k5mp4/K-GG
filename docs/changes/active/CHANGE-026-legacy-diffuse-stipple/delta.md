# Delta

## ADDED Requirements

### EFFECT-022 Diffuseの旧方式Stippleモード

Diffuseは既存のBlock、Smooth、Dither、Halftone、ASCIIに加えて、旧版Block相当の `Stipple` モードを提供する。保存値は内部的に `legacy` とする。`Stipple` は入力画像または前段Effect Stackテクスチャの色を塗り替えず、現在のフラグメント座標をセル化したseed付きハッシュで局所変位させ、その変位量へ `scatter` を乗算してサンプリングする。提示された旧Diffuseパネルの出力を作ったDirect Generatorと同じp3ハッシュ、`max(grain, 0.01)`、および`mediump`精度を、Direct GeneratorとEffect Stack V2の両方で使う。`grain` は小数値を保持し、`scatter`、`grain`、`seed`、`seedAnimEnabled`を入力とする。

`Stipple` はHalftone／ASCIIのセル形状、背景色、文字アトラス、Ditherの階調量子化を適用しない。Effect Stack V2で変位後の入力テクスチャを読む場合は、隣接画素を線形補間して中間色を作らず、変位先の入力画素色を保持する。これにより、形状のコントラストと境界のシャープさを維持し、色差の大きい境界周辺で微細な粒子状の乱れとして観測できる。

### EFFECT-023 旧方式のEffect Stack挿入

Effect Stack V2のDiffuseレイヤーが `Stipple` を選択している場合、Diffuseは主スタック内の保存済み位置で一度だけ評価され、直前レイヤーの出力テクスチャを入力にする。`Stipple` が唯一の有効レイヤーでもGenerator直結最適化を使わず、テクスチャスタックを確保して旧Generator方式の粒子場を適用する。DiffuseがStackの前後へ移動しても、既存のping-pong FBOと同じレイヤー順序契約を維持する。Direct描画、Effect Stack／Preview／Thumbnail／静止画・連番・動画書き出しは同じ旧Generator式を同じ保存設定で使う。

### UI-015 旧方式モードの選択

Diffuseパネルは表示名 `Stipple` のモードを既存モードと同じ選択コントロールへ追加する。選択時にはScatter、Grain、Seed、Seed Per Frameだけを表示し、Halftone／ASCII固有の設定や適応カーブを旧方式へ適用しない。

### PRESET-014 旧方式モードの保存互換

`Stipple` はDiffuseの既存 `mode` 保存値としてPresetへ保存・読込する。既存Presetにこの値がない場合の既定値は変更せず、既存モードの保存値も変換しない。

## MODIFIED Requirements

### EFFECT-001 主スタックの効果

主スタックの種類・重複禁止・順序モデルは変更しない。Diffuseレイヤーが参照できるモードだけを6種類へ拡張する。

### EFFECT-015 Diffuseの描画モード

Diffuseの描画モード一覧へ `Stipple` を追加する。ただし、既存5モードの表示・保存・描画契約は変更しない。

## REMOVED Requirements

なし。
