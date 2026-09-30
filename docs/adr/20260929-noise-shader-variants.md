---
id: ADR-20260929-noise-shader-variants
title: Noise依存ProgramをNoise種別ごとに特殊化し、未準備の間はStack passで代替する
status: proposed
date: 2026-09-29
deciders: [maintainer]
related_specs: []
supersedes: []
---

# ADR-20260929-noise-shader-variants: Noise依存ProgramをNoise種別ごとに特殊化し、未準備の間はStack passで代替する

## コンテキスト

Windows版（WebView2）では、WebGLのShaderはANGLEがHLSLへ変換し、Direct3Dのコンパイラ（fxc）がコンパイルする。`generator`、`noiseStack`、`noiseDiffuseStack`は全Noise種別（13種）を`u_noiseType`の実行時分岐で1本のShaderに含めていたため、RTX 3060 Ti環境でも`generator`が約98〜126秒、`noiseStack`が約44秒かかった。

[ADR-0022](./0022-startup-splash-and-shader-warmup.md)の直列コンパイルキューは実行中のコンパイルを中断しないため、この間に利用者がEffect Stackの行を有効にしても、その行のShaderは前のコンパイルが終わるまで開始されない。スプラッシュは最大4秒で閉じるため、閉じた後の数分間はEffectの有効化が反映されなかった。KHR並列コンパイルのwatchdog（30秒）を超えると同期のstatus参照へ切り替わり、残りのコンパイルの間メインスレッドも止まる。

計測では、コンパイル時間の大半は使われないNoise種別の分岐と、Slitの区間テーブルを32分岐で選ぶ処理、V2では使われないManual Distortの9点平滑化が占めていた。

## 決定

- Noise依存Program（`generator`、`noiseStack`、`noiseDiffuseStack`）は、`#define KGG_NOISE_VARIANT <NOISE_TYPE_MAP index>`を先頭に付けたNoise種別ごとのvariantとしてコンパイルする。Noiseの分岐は`#if`で除外し、指定がない場合は従来どおり全種別を含む。
- variantは`${key}:${variant}`で識別し、状態・Program・キューIDをvariantごとに持つ。描画は毎フレームで必要なvariantを選び、既存の`ctx.<key>Program`へ反映する。Noise依存Programごとに最近使ったvariantを最大3個保持し、それ以外は削除する。
- Generatorは、Noiseを評価しない場合（V2でanalytic prefixがNoiseを取り込まない場合）と、Legacy／保護Image GradientでNoiseとManual Distortが無効な場合は、初期化時にコンパイル済みのbootstrap Programを使う。bootstrapからManual Distortも除外する。
- analytic prefixがNoiseを取り込むシーンで該当Generator variantが未準備の間は、Render PlanをNoiseがStack passになる形（`analyticNoisePending`）で組み直して描画する。Generator variantはこのフレームのStack pass要求より低い`prefetch`優先度で要求し、準備後にanalytic pathへ戻る。Exportは従来どおり、最初のフレームの前に実際のRender Planで必要なvariantを待つ。
- 起動時の必須Shaderとホバー時のprefetchは`analyticNoisePending`のRender Planから求める。warmupは現在のNoise種別のvariantだけを準備し、Generatorのvariantは最後に準備する。
- Slitの区間テーブルは、uniformの32分岐選択ではなくローカル配列の添字で参照する。

## 理由

- Noise分岐を除外したvariantは、同じNoise種別の描画結果を変えずに、`noiseStack`を約44秒から0.05〜1.8秒、`generator`を約98秒から4〜10秒へ短縮した。Slitの配列化で`stackCore`は約5〜8秒から約2秒、bootstrapは約5秒から約1.3〜1.7秒になった。
- 実行中のコンパイルを中断できない直列キューでは、個々のコンパイルを短くすることが利用者の待ち時間を直接短くする。
- Stack passでの代替により、Generator variantのコンパイル中もNoiseの有効化がすぐ見える。`noiseStack`の単独コンパイルは短い。
- 変更前後の同一シーンのCanvasは、最大1/255の丸め差の範囲で一致した。

## 代替案

| 案 | 採用しなかった理由 |
| --- | --- |
| 直列キューをやめて並列にコンパイルする | 重いShaderの同時コンパイルによる`context lost`対策（PERF-010）と矛盾する。 |
| 実行中のwarmupを中断してdemandを先に通す | WebGLにはコンパイルの中断APIがなく、Programを捨てても GPU側の処理は止まらない。 |
| 全Noise種別のvariantを起動時に準備する | 13種×3 Programのコンパイルとメモリを常に払う。現在の種別だけで足りる。 |
| Noiseの実行時分岐をuniform配列や関数テーブルで書き換える | GLSL ES 1.00に関数ポインタはなく、分岐自体はfxcが展開するため効果がない。 |
| variantのキャッシュを無制限にする | Noise種別を切り替えるたびにProgramが増え、GPUメモリが戻らない。 |

## 結果

### 利点

- 起動直後の最初のGPU描画と、スプラッシュを閉じた後のEffect有効化が数秒以内に反映される。
- 巨大Shaderのコンパイルが減り、watchdog超過による長時間のメインスレッド停止が起きにくくなる。

### 欠点・コスト

- Noise種別を変更すると、初回はそのvariantのコンパイルが発生する（`noiseStack`は短い。Generator variantはStack passで代替する）。
- Noise種別を追加するときは、`NOISE_TYPE_MAP`の値と`noise.glsl`等の`#if KGG_NOISE_VARIANT`のガードを揃える必要がある。`webglShaderSources.test.ts`と`tests/e2e/shaders.spec.ts`（全variantの実コンパイル）で検査する。
- Generator variantの準備中はNoiseがanalytic pathではなくStack passで描画される。見た目は同じ設計だが、厳密な画素値は準備後の描画と一致しない場合がある。

## 再検討条件

- Legacy pipelineの汎用`postprocess` Program（計測で約4.5〜8分）を分割するとき。本ADRの対象外。
- WebGLでProgramバイナリのキャッシュが使えるようになった場合。
- Noise以外の実行時分岐（Diffuseのmode、Gradientの種類など）がコンパイル時間の主因になった場合。
