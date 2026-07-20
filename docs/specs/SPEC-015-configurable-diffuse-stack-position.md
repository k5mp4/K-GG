---
id: SPEC-015
title: DiffuseのEffect Stackレイヤー化
status: implemented
owners: [maintainer]
created: 2026-07-12
updated: 2026-07-18
depends_on: [SPEC-013]
related_adrs: [ADR-0005]
related_code: [src/types/distortion.ts, src/lib/effectPipeline.ts, src/lib/webgl.ts, src/shaders/postprocess/, src/components/PostprocessStackPanel.tsx, src/components/SlitScanPanel.tsx, src/store/gradientStore.ts]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/effectShaderParity.test.ts, src/store/gradientStore.effectPipeline.test.ts]
human_review: completed
---

# SPEC-015: DiffuseのEffect Stackレイヤー化

## 背景・問題

V2のDiffuseは常に最終段へ固定されているため、Slitなどの前段へDiffuseを適用できない。Diffuseの見た目を従来どおり最終段へ固定する用途と、Effect Stackの一要素として順序を編集する用途を切り替えられる必要がある。

## 方針

Diffuseを固定段の専用行ではなく、9種類目のEffect Stackレイヤーとして扱う。既定の正規化順はDiffuseを最後に置き、既定状態では有効にする。Diffuseは他のレイヤーと同じドラッグ操作で順序変更できる。

V2描画ではDiffuseレイヤーを通常のstack coreのDiffuseパスとして、その位置で一度だけ適用する。Diffuse設定の一次情報は既存`DiffuseConfig`を維持し、Legacy経路は変更しない。DiffuseのBlock/Smoothサンプルは前段レイヤーのUVではなく描画先のグローバル座標を基準にする。Diffuseの直後にSlitを置いた場合はDiffuseをSlitの出力座標側で評価し、Slitによる延長領域でDiffuseのセルが縞状に引き延ばされないようにする。

## エラー・境界条件

- 旧プリセットはDiffuseを最後のレイヤーとして補完する。
- Diffuseが無効な場合は、どの位置でも描画しない。

## 受け入れ条件

- AC-001: DiffuseがEffect Stack内のレイヤーとして表示され、既定で有効・最後尾に配置される。
- AC-002: Diffuseを他のレイヤーと同じ操作でドラッグし、Slitの前後へ移動できる。
- AC-003: Diffuseは指定されたスタック位置で一度だけ描画される。
- AC-004: 旧プリセット読込時に既存の最終Diffuse挙動を維持する。
- AC-005: Diffuseの順序を新規保存・再読込できる。
- AC-006: Noise -> DiffuseのBlockモードで、Diffuseのセル配置がNoiseのUV変位によって歪まない。
- AC-007: Diffuse -> Slitの隣接順で、Slitの延長領域にもDiffuseが適用され、セルの引き延ばしに由来する縞模様を生じさせない。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-002, AC-004 | 正規化・UI手動確認 | `effectPipeline.ts`, `PostprocessStackPanel.tsx` |
| AC-003 | スタック描画コードレビューとプレビュー確認 | `webgl.ts` |
| AC-005 | ストア・プリセット互換テスト | `gradientStore.effectPipeline.test.ts` |
