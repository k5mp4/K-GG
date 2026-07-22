---
id: SPEC-027
title: Diffuse輝度カーブ制御
status: implemented
owners: [maintainer]
created: 2026-07-21
updated: 2026-07-22
depends_on: [SPEC-015, SPEC-021]
related_adrs: [ADR-0009]
related_code: [src/types/distortion.ts, src/components/BlockNoisePanel.tsx, src/components/DiffuseCurveEditor.tsx, src/components/ColorHistogram.tsx, src/components/PresetPanel.tsx, src/lib/diffuseCurve.ts, src/lib/diffuseCurveEditorGeometry.ts, src/lib/webgl.ts, src/shaders/gradient.frag.glsl, src/shaders/postprocess/diffuse.glsl]
related_tests: [src/lib/diffuseCurve.test.ts, src/lib/diffuseCurveEditorGeometry.test.ts, 'manual: Diffuse panel histogram and curve editor']
human_review: completed
---

# SPEC-027: Diffuse輝度カーブ制御

## 背景・問題

Diffuseの拡散量は現在、全画素へ同じ`scatter`を適用している。入力の明るい部分・暗い部分に応じて拡散量を変え、既存の一律動作も維持する必要がある。

## ゴール・成功条件

- Diffuse直前の輝度ヒストグラムを見ながら、輝度から拡散係数への単調な三次Bezierカーブを編集できる。
- 既存の一律Diffuseは既定状態で変化しない。
- Block/Smoothの変位量とDitherの混合量へ同じカーブ係数を適用する。

## 方針

`DiffuseConfig`へ後方互換の`adaptiveEnabled`と`luminanceCurve`を追加する。カーブは`{x,y}`配列で表し、端点`(0,0)`・`(1,1)`を固定する。中間点は最大16点、xは単調増加、x/yは`[0,1]`とする。単調補間の256段階LUTをCPUで生成し、Legacy/V2/WebGL出力で共有する。

Diffuseパネル内のグラフは入力輝度ヒストグラムを背景に描画する。グラフ端点はプロット内側に余白を持たせ、制御点が枠やUIに隠れないようにする。制御点から生成したBezier補間を表示し、描画用LUTにも同じ補間を使用する。`adaptiveEnabled`は既定OFFとし、旧プリセットには恒等カーブを補完する。

## エラー・境界条件

- 不正な点、非有限値、範囲外値は正規化し、端点を再構成する。
- カーブOFF時は既存の一律Diffuseと同じ係数を使用する。
- ヒストグラム入力が取得できない場合はカーブ編集を止めず、直近のデータを表示する。

## 受け入れ条件

- AC-001: 既定状態のプレビューとプリセット結果が既存Diffuseと一致する。
- AC-002: 中間点を動かすと、対応する輝度帯の拡散量だけが変化する。
- AC-003: 端点を動かせず、範囲外の点を保存・描画へ渡さない。
- AC-004: Block、Smooth、Ditherの全モードでカーブ係数が適用される。
- AC-005: 旧プリセット読込時に新項目を安全に補完する。
- AC-006: グラフの両端制御点が常に表示され、制御点を移動するとBezier曲線と描画用LUTが同じ形で更新される。
- AC-007: 左サイドバーの幅を変更してもグラフのプロット領域は正方形を保ち、制御点のヒット領域と座標変換が表示サイズに追従する。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-003, AC-005 | unit | `diffuseCurve.test.ts`, store/preset normalization |
| AC-002, AC-004, AC-006 | shader contract / manual | Diffuse panel, WebGL preview/export |
| AC-007 | geometry unit test、ブラウザでサイドバー幅変更と制御点ドラッグを確認 | `src/lib/diffuseCurveEditorGeometry.test.ts`, Diffuse panel |

## 移行・互換性

既存プリセットの保存形式を壊さず、新項目がない場合は`adaptiveEnabled=false`と恒等カーブを使用する。

## 未決定事項

なし。
