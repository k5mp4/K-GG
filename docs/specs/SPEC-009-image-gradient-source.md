---
id: SPEC-009
title: 画像グラデーション入力
status: implemented
owners: [maintainer]
created: 2026-07-10
updated: 2026-07-21
depends_on: [SPEC-000]
related_adrs: [ADR-0001, ADR-0003, ADR-0010]
related_code: [src/components/ImageGradientSourcePanel.tsx, src/components/PresetPanel.tsx, src/types/imageGradient.ts, src/lib/imageGradient.ts, src/lib/webgl.ts, src/shaders/gradient.frag.glsl]
related_tests: [src/lib/imageGradient.test.ts, src/lib/effectShaderParity.test.ts, 'manual: Image Gradient protected V2 path']
human_review: completed
---

# SPEC-009: 画像グラデーション入力

## 背景・問題

現在の画像入力はSlit Scan用のRaw Source Imageだけであり、画像を現在のグラデーションランプで再配色しながら、既存の歪みや後処理を通すことができない。

## ゴール・成功条件

- ラスタ画像を現在のGradient Rampで再配色し、プレビューと全出力経路で同じ結果を得る。
- 画像本体を固定したまま、Noise、Diffuse、手描き歪み、Iridescence、Radon、Slitをアンカー配色フィールドへ適用する。
- 画像本体をプリセットへ保存せず、設定だけを安全に再利用できる。

## スコープ

### 対象

- 右サイドバーのImage Overlay/Mask直後に置くImage Gradient Sourceパネル
- 輝度、Red、Green、Blueによるランプ入力値の選択
- 画像チャンネル値とアンカー配色値の混合率（Anchor Influence）の調整
- 中央基準Cover、入力アルファの維持、プリセット互換性
- WebGL、プレビュー、タイル書出し、静止画・連番・動画出力の共有描画経路

### 対象外

- 元画像色とのブレンド
- 画像データまたはファイルパスのプリセット保存
- SVGなどブラウザでラスタとしてデコードできない入力の保証

## 方針

`ImageGradientConfig`は`enabled`、`channel`、`anchorInfluence`を持つ永続設定とし、画像Canvasと表示名はAppのローカル状態に置く。`anchorInfluence`は0〜1で、新規設定・新規画像読込時は0.5とする。画像がないときは設定が有効でも通常グラデーションへ安全にフォールバックし、再読込を案内する。

レンダラーはRaw Source Imageとは別テクスチャを使用する。画像グラデーションでは、変形前の出力座標を`imageUV`としてCover座標の画像サンプル、チャンネル値、入力アルファに使用する。手描き歪み、Iridescence、Radon、Slit、Noise、Diffuse、パターンDitherによる座標変形は`gradientUV`だけに適用し、既存アンカー計算の入力にする。V2では元画像テクスチャと色場バッファを分離し、Stretch、Distort、Mirror、Kaleidoscope、Voronoi、Glass、Glass V2の再サンプリングを元画像へ適用しない。ランプ入力値は`mix(imageT, anchorT, anchorInfluence)`とし、Rampの補間、カラー方式、繰返し、ミラーは混合後の値で既存実装を共有する。画像とランプのアルファは乗算する。

## エラー・境界条件

- 読込に失敗した画像は現在の入力と描画を変更せず、エラーを表示する。
- 設定を含む旧・新プリセットを読込んだ後に画像がない場合、通常グラデーションを表示する。
- 画像とキャンバスの縦横比が異なる場合は中央基準Coverで余白を作らない。
- `anchorInfluence`がない旧プリセットは0として移行し、従来の画像再配色の見た目を維持する。

## 受け入れ条件

- AC-001: 画像の読込、削除、有効切替、4チャンネル選択、0〜100%のAnchor Influenceを操作できる。
- AC-002: 各チャンネル値とアンカー値をAnchor Influenceで混合して現在のランプへ再配色し、入力画像の透明度を維持する。
- AC-003: 各対象UV歪みを有効にすると、画像の形・明暗・アルファ・Cover配置は維持したまま、アンカー配色だけが変化する。
- AC-004: Preview、通常・タイル書出し、連番・動画出力で同じ描画経路を使用する。
- AC-005: 設定だけを保存・再読込し、画像がない状態では安全にフォールバックする。
- AC-006: V2の形状変形系レイヤーを有効にしても、元画像の形状・アルファ・Cover配置を変えず、色場だけを処理する。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-005 | unit / manual | 設定正規化、Image Gradient Sourceパネル |
| AC-002 | unit / manual | `src/lib/imageGradient.test.ts`、プレビュー |
| AC-003, AC-004 | manual | Preview、通常・タイル書出し、短い連番または動画 |

## 移行・互換性

`imageGradient`自体がない旧プリセットは新規既定値で補完する。`imageGradient`はあるが`anchorInfluence`がない旧プリセットは0へ移行する。画像本体は保存しないため、再起動または他環境では利用者が再読込する。

## 未決定事項

なし。
