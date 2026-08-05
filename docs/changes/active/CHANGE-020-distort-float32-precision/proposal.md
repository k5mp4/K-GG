---
type: change
id: CHANGE-020
title: 歪みマップテクスチャの Float32 化による量子化段差の修正
status: approved
change_kind: B
owners: [maintainer]
created: 2026-08-04
updated: 2026-08-04
current_specs: [CURRENT-EFFECT-STACK]
related_adrs: []
related_code: [src/lib/webgl.ts]
related_tests: [src/lib/webgl.test.ts]
human_review: completed
---

# 歪みマップテクスチャの Float32 化による量子化段差の修正

## Why
歪みエフェクト（Manual Distort）を適用した際、歪みマップ（`manualDistortTexture`）が 8-bit 整数 (`UNSIGNED_BYTE`) で保存・転送されていたため、変位ベクトルが 256 段階に量子化され、歪み強度が大きい場合に描画結果へブロック状・階段状の段差（量子化ノイズ）が発生していた。

## What
`manualDistortTexture` のテクスチャ内部フォーマットおよび転送フォーマットを 8-bit (`UNSIGNED_BYTE`) から 32-bit Float (`RGBA32F` / `FLOAT`) へ変更する。これにより CPU 上で計算された Catmull-Rom 補間後の滑らかな変位値を精度を落とさずに GPU シェーダーへ引き渡し、ブロック状の段差を完全解消する。

## 対象外スコープ
- Manual Distort のマップ解像度（64x64）や Catmull-Rom スプライン補間アルゴリズム自体の変更
- シェーダー側サンプリング計算式の変更（0.0〜1.0 範囲の互換を維持するため）

## 受け入れ条件
- AC-001: WebGLContext の `manualDistortTexture` が `RGBA32F` / `FLOAT` テクスチャとして作成され、データの転送バッファが `Float32Array` に変更されること。
- AC-002: 歪みマップ更新処理 (`uploadManualDistortMap`) で 8-bit 整数への丸め (`Math.round(...) * 255`) が行われず、浮動小数点精度でそのまま書き込まれること。
- AC-003: アプリケーション全体のビルド、テスト、ドキュメント検証 (`npm run docs:check`, `npm test`, `npm run build`) が成功すること。
