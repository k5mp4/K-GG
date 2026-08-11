---
type: change
id: CHANGE-021
title: SANDBOX Cloth Gradient Base Generator
status: archived
change_kind: F
owners: [maintainer]
created: 2026-08-04
updated: 2026-08-11
current_specs: [CURRENT-EFFECT-STACK]
related_adrs: []
related_code: [src/types/clothGradient.ts, src/lib/clothGradientRenderer.ts, src/components/ClothGradientPanel.tsx, src/components/SandboxPanel.tsx, src/types/latestState.ts, src/store/gradientStore.ts, src/lib/presetModel.ts, src/lib/webgl.ts, src/lib/renderSceneAtTime.ts]
related_tests: [tests/clothGradient.test.ts]
human_review: completed
---

# CHANGE-021-cloth-gradient Proposal

## Why

K-GGのグラデーション表現力を拡張し、有機的で立体感のあるウェーブ・グラデーション背景を生成するために、SANDBOX内に Three.js を用いた 3D 布状メッシュジェネレーター (Cloth Gradient) を追加します。

既存の Base Gradient に加え、波打つ3D面、環境光・スポットライトによる自然な陰影、および K-GG 既存の Gradient Ramp カラーマッピングを統合することで、豊かなダイナミックビジュアルを実現します。

## What

1. **SANDBOX Base Generator としての位置付け**:
   - `Cloth Gradient` を SANDBOX パネル内に追加（Active Count 4/4）。
   - Effect Stack の並べ替え可能レイヤーにするのではなく、Base 画像の生成方式（Base Generator）として既存パイプラインの最前段へ統合する。
2. **Three.js Offscreen レンダリング統合**:
   - 別 Canvas を画面上に重ねず、独立した Offscreen Renderer (`ClothGradientRenderer`) の描画結果を K-GG の `ctx.gradTexture` へ転送する。
   - 既存 Effect Stack (Noise, Slit, Stretch, Distort, Mirror, Kaleidoscope, Voronoi, Glass, Diffuse, Normal Map, Prism, Particles) および Export・Tile Export のすべての動作をそのまま維持する。
3. **K-GG Gradient Ramp の完全共有**:
   - K-GG の `stops`, `opacityStops`, `rampInterpolation`, `rampColorMode` 等を単一の正規値とし、`buildRampTextureData` から生成されたランプデータを 1D DataTexture として参照する。
4. **パラメータ設計と Preset 永続化**:
   - Surface Wave, Organic Motion, Lighting, Specular, Fresnel, Ramp Mapping, Quality の各パラメータを定義し、Preset へ保存・復元可能とする。
5. **決定性とフォールバック**:
   - レンダラー準備中や初期化失敗時には画面を暗転させず、既存の Base Gradient に安全にフォールバックする。

## Scope

- 範囲内: `src/types/clothGradient.ts` の追加、`src/lib/clothGradientRenderer.ts` の追加、`src/components/ClothGradientPanel.tsx` の追加、SANDBOX Panel / Store / Preset / WebGL 統合、自動テストの追加。
- 範囲外: 物理エンジン（Cloth Collision, Soft Body, Verlet）の導入、Effect Stack 種別への `cloth` の追加。

## Acceptance Criteria

- [x] SANDBOX に `Cloth Gradient` モジュールが表示され、ON/OFF できること。
- [x] Three.js による波打つ 3D 布状メッシュが描画され、陰影・法線・高さ・Fresnel・FlowNoise から Gradient Ramp が正しくマッピングされること。
- [x] 画面上に別 Canvas が重ならず、Base Texture として全 Effect Stack がそのまま適用されること。
- [x] Cloth Gradient が無効な場合、既存の描画結果と一切変化がないこと。
- [x] レンダラー初期化失敗時も黒画面にならず既存 Gradient へフォールバックすること。
- [x] Preview, PNG Export, Image Sequence Export, Video Export, Tile Export で評価結果が一致し、Tile Export に継ぎ目がないこと。
- [x] Preset の保存・読み込みで Cloth Gradient の設定が正しく保持されること。
- [x] すべての自動テスト、Lint、Build、Docs チェックが成功すること。
