---
id: ADR-0015
title: 開発専用WebGL観測層を既存Canvasへ接続する
status: accepted
date: 2026-08-12
deciders: [maintainer]
related_specs: [SPEC-012, SPEC-013, SPEC-018]
supersedes: []
---

# ADR-0015: 開発専用WebGL観測層を既存Canvasへ接続する

## コンテキスト

K-GGはWebGL2の単一Canvasと既存のEffect Stackを使ってPreview、SANDBOX、Exportを描画する。性能調査のためにCanvasやrender loopを複製すると、計測値そのものと利用者向け描画結果が変わる。また、GPU timer queryは同期的な結果取得を行うとGPU stallを作る。

## 決定

Developmentビルドだけで生成するProfilerを既存WebGL contextへ任意参照として接続し、既存のdraw境界を観測する。Effect名は描画時のEffect Stack引数から取得する。GPU時間は`EXT_disjoint_timer_query_webgl2`の非同期queryを後続フレームで読む。stats-gl、Spector.js、webgl-memory、webgl-lintは開発時dynamic importとし、Productionビルドは直接描画関数を選び、Profilerのquery・統計・Validation処理を実行しない。

Spector.jsはCapture操作時だけ既存Canvasを渡す。webgl-lintはcontext生成前に有効化できるが、Program情報との競合を避けるため、Validation拡張が利用できるDevelopment環境ではKHR並列Shaderコンパイルを使わず同期リンクする。Benchmark中はValidationを無効化する。lazy ShaderのUniform反映はProgram公開前に完了させ、単独の反映失敗でEffect Stack全体を停止させない。Profilerは保存形式、seed、time、frame index、texture、framebuffer stateを変更しない。

## 理由

- 既存描画経路を直接計測するため、PreviewとEffect Stackの実際の負荷を測れる。
- 非同期queryにより、計測自体がGPU stallを作ることを避けられる。
- 開発依存をProductionへロードしないことで、利用者向け描画のoverheadを抑えられる。
- 外部ツールの得意領域（FPS/GPU overlay、command capture、memory estimate、API validation）と、K-GG固有のEffect/Benchmark集計を分離できる。

## 代替案

| 案 | 不採用理由 |
| --- | --- |
| Canvasとrender loopをProfiler用に複製する | 出力、負荷、Export経路が変わる |
| `gl.finish()`でEffectごとに測る | GPUとMain Threadを同期させ、測定がボトルネックになる |
| ProductionでもAPI wrapperを常時有効化する | 通常利用へ観測オーバーヘッドを持ち込む |

## 再検討条件

WebGPU移行、複数Canvasの同時描画、外部ツールのAPI変更、またはProfilerの数値を製品UIへ公開する要件が発生した場合は、観測層の境界と依存ロード方式を再検討する。
