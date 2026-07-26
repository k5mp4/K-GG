---
id: SPEC-040
title: Mesh Gradation（単一Coons Patch）
status: implemented
owners: [maintainer]
created: 2026-07-26
updated: 2026-07-26
depends_on: [SPEC-032]
related_adrs: [ADR-0013]
related_code: [src/types/gradient.ts, src/store/gradientStore.ts, src/lib/sceneEvaluation.ts, src/lib/webgl.ts, src/lib/meshGradientField.ts, src/shaders/gradient.frag.glsl, src/components/GradientTypeSelector.tsx, src/components/GradientAnchorEditor.tsx, src/components/MeshGradientEditor.tsx, src/lib/presetPreview.ts, src/lib/presetModel.ts, src/lib/presetThumbnail.ts]
related_tests: [src/types/gradient.test.ts, src/lib/meshGradient.test.ts, src/lib/webglShaderSources.test.ts]
human_review: completed
---

# SPEC-040: Mesh Gradation（単一Coons Patch）

## 背景・問題

K-GGの`fourcolor`は4アンカーへの逆距離加重で色を求めるため、境界曲線を持つ2次元の色場を編集できない。4つのコーナー色とBezier境界を持つ単一パッチを追加し、既存のGradient Ramp、エフェクト、preset、exportへ統合する。

## ゴール・成功条件

- `GradientType`に`mesh`を追加し、UI表示名を`Mesh Gradation`に統一する。
- 4コーナー、8制御ハンドル、4本の三次Bezier境界を持つ2×2 Coons Patchを編集できる。
- Coons Patchを前方向に細分化した三角形フィールドへ変換し、頂点色をbilinear補間する。Fragment Shaderはそのフィールドをサンプリングする。
- preview、preset thumbnail、静止画、動画、tiled exportが同一のWebGL生成経路を使い、既存のエフェクト順序を維持する。
- 旧presetに`gradient.mesh`がなくても読み込め、mesh presetは保存・再読込で形状と色位置を復元できる。

## スコープ

### 対象

- `GradientType = 'mesh'`、`MeshGradientConfig`、既定値、破損データの正規化。
- `u_gradientType = 6`、4コーナー、8制御点、4色位置のuniform伝達。
- Coons Patchの評価、前方向テッセレーション、三角形ラスタライズ、有限値保護。
- Mesh専用アンカー／制御点UI、Reset Mesh、Straighten Handles、既存履歴との統合。
- Meshコーナーのkeyframe評価、preset保存・読込・thumbnail preview、利用者向け説明。

### 対象外

- NxM複数セル、三角メッシュ、自動テセレーション、内部制御点、パッチ間連続性。
- 自己交差を完全に解決する逆写像、HDR／広色域の独立保持、Bezierハンドルと色位置のkeyframe。

## 方針

`gradient.mesh`は`rows`、`columns`、4コーナー、辺ごとの2制御点、4つのRamp位置、`bilinear`補間方式を保持する。保存上の辺方向はbottom: BL→BR、right: BR→TR、top: TR→TL、left: TL→BLとし、Coons評価時にtopとleftをu／v方向へ反転する。

Shaderは既存のUV distortion、Noise、Diffuse、Image Gradient、Ramp、source image、slit、radon、manual distortion、postprocessの順序を迂回しない。Mesh以外の数値mappingは変更しない。Ramp repeat／mirrorは既存Ramp texture生成へ任せ、Mesh側では二重適用しない。

コーナーkeyframeは`mesh.corner.{0..3}.{x|y}`で評価する。ハンドルのkeyframe UIは本仕様では提供せず、ハンドルは静的編集とpreset保存に限定する。

## エラー・境界条件

- meshが`undefined`、`null`、部分的、不正な場合は各フィールドを既定値で補完する。
- 座標はキャンバス外編集を許可し、NaN／Infinityのみ既定値へ戻す。色位置は0〜1へclampする。
- 退化、極端、自己交差パッチでも三角形の面積が0に近い場合はスキップし、未被覆部分は安定したbilinearフィールドで補完する。
- パッチ外は最近傍境界色を延長し、透明にはしない。自己交差時の形状上の一意な正解は保証しない。

## 受け入れ条件

- AC-001: Meshを選択すると初期状態は単位正方形の直線境界となり、4色bilinearの`fourcolor`相当になる。
- AC-002: 4コーナー、8ハンドル、補助線、Bezier境界がUIへ表示され、ドラッグとリセットができる。
- AC-003: `mesh`は6へ変換され、既存5種のmappingは変わらない。前方向テッセレーション済みMeshフィールドをshaderがサンプリングし、旧来の画素単位Newton逆写像を使用しない。
- AC-004: 旧presetはそのまま読め、mesh presetのcorners、handles、colorPositionsが保存・再読込される。
- AC-005: Meshコーナーのkeyframeを評価した位置がUIとshaderへ反映され、ドラッグ中の履歴は1操作としてundo／redoできる。
- AC-006: preview、preset thumbnail、静止画、動画、tiled exportで同じ生成shader結果となり、Mesh以外の描画結果へ影響しない。
- AC-007: 退化・極端・自己交差入力でshader compile error、無限ループ、未描画の透明領域、非有限色を発生させない。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-003 | unit、shader source契約、build | `src/types/gradient.test.ts`, `src/lib/webglShaderSources.test.ts` |
| AC-002, AC-005 | UI手動確認、store／scene評価unit | `GradientAnchorEditor.tsx`, `sceneEvaluation` |
| AC-004 | preset model／thumbnail unit、JSON round trip | `presetModel`, `presetThumbnail`, `presetPreview` |
| AC-006, AC-007 | field unit、`npm test`, `npm run lint`, `npm run build`、WebGL手動確認 | WebGL preview／export |

## 移行・互換性

既存presetのJSON形式は変更せず、`gradient.mesh`を持たないデータへ既定値補完を適用する。既存gradientTypeの数値mappingは固定し、meshのみ末尾の6へ追加する。

## 未決定事項

なし。
