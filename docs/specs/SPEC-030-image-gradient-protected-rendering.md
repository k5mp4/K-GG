---
id: SPEC-030
title: Image Gradient Sourceの保護描画
status: implemented
owners: [maintainer]
created: 2026-07-21
updated: 2026-07-21
depends_on: [SPEC-009, SPEC-013, SPEC-015]
related_adrs: [ADR-0003, ADR-0005, ADR-0010]
related_code: [src/lib/effectPipeline.ts, src/lib/webgl.ts, src/shaders/gradient.frag.glsl, src/shaders/postprocess/]
related_tests: [src/lib/imageGradient.test.ts, src/lib/effectShaderParity.test.ts, src/lib/imageGradientProtected.test.ts, 'manual: Image Gradient fixed UV and alpha']
human_review: completed
---

# SPEC-030: Image Gradient Sourceの保護描画

## ゴール・成功条件

Image Gradient Source有効時、元画像のUV、形状、Cover、アルファを固定し、色場とグラデーションだけを変更する。

## 方針

元画像テクスチャと色場バッファを分離する。Noise、Diffuse、Slit、Iridescence、Radon、レガシー手動色場変形は色場へ適用する。V2のStretch、Distortレイヤー、Mirror、Kaleidoscope、Voronoi、Glass、Glass V2は元画像保護のためスキップする。Prism/Particlesは独立オーバーレイとして元画像を再サンプリングしない。

## 受け入れ条件

- AC-001: Slit等を操作しても入力画像の形状、明暗、アルファ、Cover配置が変わらない。
- AC-002: 対象効果でグラデーション色だけが変化する。
- AC-003: 保護対象のV2レイヤーは元画像を再サンプリングしない。
- AC-004: プレビュー、タイル書出し、通常書出しで同じ保護動作になる。

## 未決定事項

なし。
