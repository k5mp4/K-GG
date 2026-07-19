---
id: SPEC-018
title: Glass V2光学屈折エフェクト
status: implemented
owners: [maintainer]
created: 2026-07-17
updated: 2026-07-18
depends_on: [SPEC-003, SPEC-012, SPEC-013, SPEC-015]
related_adrs: [ADR-0005]
related_code: [src/types/distortion.ts, src/lib/effectPipeline.ts, src/lib/postprocessStack.ts, src/lib/glass.ts, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/shaders/postprocess.frag.glsl, src/components/PostprocessPanel.tsx, src/components/PostprocessStackPanel.tsx]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/postprocessStack.test.ts, src/lib/glass.test.ts, src/lib/effectShaderParity.test.ts, src/lib/webglShaderSources.test.ts]
human_review: completed
---

# SPEC-018: Glass V2光学屈折エフェクト

## 背景・問題

Glass V2の実装が現行のエフェクトスタックから失われ、Glassだけが利用できる状態になっていた。既存Glassの勾配圧縮にも過剰な一律縮小が残っていたため、以前動作していたGlass系エフェクトとスタック上の描画経路を復元する。

## ゴール・成功条件

- 既存のGlassをスタック上で継続して利用でき、微小な勾配が不必要に縮小されない。
- Glass V2をGlassとは独立したスタックレイヤー、UI項目、遅延コンパイルprogramとして利用できる。
- Glass V2は勾配ノイズ、波長ごとの屈折、粗さによる透過、Fresnelハイライトを組み合わせたスクリーン空間近似で描画する。
- GlassとGlass V2を含むタイル出力では、各レイヤーの参照距離に応じたガターを確保する。

## 方針

Glass V2は既存Glassのパラメータを共有しつつ、quintic fadeの勾配ノイズ、Cauchy分散式による代表5波長のIOR、roughnessの対称サンプル、Fresnel反射を専用GLSL経路で評価する。スタックでは`Glass`と`Glass V2`を別レイヤーとして扱い、必要なprogramだけを遅延コンパイルする。コンパイル中または失敗時は対象レイヤーだけをスキップし、他のスタック描画を維持する。

## 受け入れ条件

- AC-001: V2のEffect StackにGlassとGlass V2を表示し、各レイヤーを個別に有効化・並べ替えできる。
- AC-002: 既存Glassの描画とUIが維持され、Glass V2の追加で既存設定の読込を壊さない。
- AC-003: Glass V2の専用shader sourceに勾配ノイズ、屈折、Cauchy IOR、光学描画処理が含まれる。
- AC-004: Glass V2の遅延program準備中でも、対象外の描画は継続する。
- AC-005: Glass系レイヤー数に応じてタイル出力のサンプルガターが増加する。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001 | スタック正規化、順序、UI項目のテスト | `effectPipeline.test.ts`, `postprocessStack.test.ts` |
| AC-002, AC-003 | 既存GlassとGlass V2のshader parity/sourceテスト | `effectShaderParity.test.ts`, `webglShaderSources.test.ts` |
| AC-004 | program選択と描画経路のテスト、WebGLプレビュー確認 | `webgl.ts`, 手動確認 |
| AC-005 | ガター計算テスト | `glass.test.ts` |

## 移行・互換性

Glass V2を持たない旧プリセットは、既定のスタック正規化によってGlass V2を無効状態で補完する。既存Glassの設定と描画は変更せず、Glass V2の設定は既存Glassの共通パラメータを使用する。
