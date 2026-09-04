---
type: change
id: CHANGE-044
title: Noise→Diffuse旧Generator UV合成のV2フォールバック
status: review
change_kind: B
owners: [maintainer]
created: 2026-09-04
updated: 2026-09-04
current_specs: [CURRENT-EFFECT-STACK]
related_adrs: [ADR-0004, ADR-0005, ADR-0017]
related_code: [src/lib/effectPipeline.ts, src/lib/sceneRenderPlan.ts, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/shaders/postprocess/diffuse.glsl, src/shaders/postprocess/noise-diffuse-main.glsl]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/effectShaderParity.test.ts, src/lib/webglExportPrograms.test.ts, src/lib/webglShaderSources.test.ts]
human_review: required
---

# CHANGE-044 Noise→Diffuse旧Generator UV合成のV2フォールバック

## 背景・問題

[GitHub Issue #45](https://github.com/k5mp4/K-GG/issues/45) では、Effect Stack V2の`Noise → Diffuse`が旧GeneratorのUV合成と異なり、Noiseの出力textureをDiffuseの変位座標で再サンプリングするため、実質的にNoiseを二重に通す問題を扱う。旧Generatorの契約は、同じ画面座標`x`からNoiseのUV変換`N(x)`を一度行い、その座標へDiffuseのグローバル変位`D(x)`を加え、最終的に`I(N(x) + D(x))`を評価することである。

## 変更理由

解析的なprefixを利用できない順序・入力でも、`Noise → Diffuse`（Block／Smooth）の見た目を旧GeneratorのUV合成へ戻し、Preview、Thumbnail、静止画、連番、動画、Tileで同じRender Planと座標契約を使うためである。

## ゴール・成功条件

- V2の隣接する`Noise → Diffuse`（Block／Smooth）は、解析prefixで処理できない場合も一つのtexture passで`I(N(x) + D(x))`を評価する。
- NoiseのUV変換とDiffuseのグローバルセル／hash変位をそれぞれ一度だけ評価し、Noiseの出力textureをDiffuse座標で再度Noiseへ通さない。
- Scatter=0ではNoise単独と同じUV結果になり、subpixel Grain、globalCoord、Seed、Time、Tile offset、full resolutionの意味を維持する。
- 解析prefixが利用できる先頭`Noise → Diffuse`は既存Generatorで一度だけ処理し、新しいpassを追加しない。
- `Noise → Slit → Diffuse`、`Noise → Diffuse → Slit`、`Diffuse → Noise`、非隣接のNoise／Diffuseは既存のRender PlanとSlit出力座標評価を維持する。
- Dedicated shaderが利用できない場合は既存のlazy compile／separate stack fallbackで黒画面を避ける。

## 対象

- V2 Render Planでの隣接Noise／Diffuse compositionとprogram要求。
- NoiseとDiffuseを同一の入力textureから評価する専用postprocess shaderとlazy program lifecycle。
- V2 rendererとExport program preparationが同じRender Planを参照する経路。
- `CURRENT-EFFECT-STACK`への`Noise → Diffuse` UV合成契約の追加。

## 対象外

- UI、Preset schema、Effect Stackの9種類・固定順、Noise／Diffuseの各パラメータの追加や意味変更。
- `Diffuse → Noise`、非隣接融合、任意のshader fusion、Noiseの新アルゴリズム。
- Dither、Halftone、ASCII、Legacy／Stippleの合成方式変更。
- `Diffuse → Slit`の出力座標評価、Glass、Flow、Seamless、Normal、Prism、Particlesの既存契約変更。
- FBOのglobal filter変更、GPU間の画素完全一致、性能閾値の新設。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack)

## 関連ADR

- [ADR-0004 Postprocess Stackをping-pong FBOで描画する](../../../adr/0004-postprocess-stack-rendering)
- [ADR-0005 Unified Effect Stack V2を段階別ping-pong FBOで描画する](../../../adr/0005-unified-effect-stack-v2)
- [ADR-0017 V2の解析的Gradient Prefixを最初のtexture境界で固定する](../../../adr/0017-analytic-gradient-prefix)

## 主なリスク

- Render Planとrendererの隣接判定がずれると、NoiseまたはDiffuseのskip、二重適用、順序逆転が起きる。
- TileのglobalCoord、full resolution、tile-local texture変換が混ざると、PreviewとExportでセル位置がずれる。
- 専用shaderのuniform宣言がNoise／Diffuseの既存sourceと重複すると、WebGL compileまたはlinkに失敗する。

## 未決定事項

なし。Texture Stack fallbackは、既存のanalytic prefixを保持し、prefixで消費できない隣接`Noise → Diffuse`だけを専用1-passで補完する方針に確定した。
