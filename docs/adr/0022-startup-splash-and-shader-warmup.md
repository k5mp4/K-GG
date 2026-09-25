---
id: ADR-0022
title: スプラッシュの演出をアダプターで分離し、Shader準備をPreview contextで優先度付きに行う
status: proposed
date: 2026-09-25
deciders: [maintainer]
related_specs: []
supersedes: []
---

# ADR-0022: スプラッシュの演出をアダプターで分離し、Shader準備をPreview contextで優先度付きに行う

## コンテキスト

Effect Stackの各EffectのShaderは初回利用時にコンパイルされるため、行を有効にしてから反映まで待ち時間がある。同一contextのコンパイルは`context lost`防止のため直列であり、起動直後の重い`generator`の後ろに利用者の要求が並ぶこともある。

また、今後のブランド化でスプラッシュスクリーンを用意し、演出をLottieやRiveで制作する可能性がある。WebGL Programは作成したcontextでしか使えないため、スプラッシュ側で別contextに事前ロードしても本体では再利用できない。Lottie／Riveのランタイムは容量が大きく、RiveやdotLottieはWASMを使う。

## 決定

- スプラッシュを「演出（visual adapter）」「進捗（warmup snapshot）」「準備（lazy compile queue）」の3層に分ける。
- 演出は`SplashVisualAdapter`（mount → `setProgress` / `playExit` / `dispose`）の契約だけに依存する。静的ポスターは常に使える既定・フォールバックとし、Lottie／Riveは動的importで読み込むアダプターとしてレジストリへ追加する。未登録・失敗・時間超過は静的ポスターへ戻す。
- スプラッシュの表示時間、終了条件、スキップはオーバーレイ側が持ち、演出側は描画だけを持つ。終了は最大表示時間で必ず行う。
- Shaderの準備はPreviewのWebGL contextで行う。直列キューに`demand > prefetch > warmup`の優先度を持たせ、待機中の要求は引き上げ可能にする。起動時は現在のシーンを優先し、残りはアイドル時間に一つずつ準備する。
- 並列Shaderコンパイルが使えない環境ではwarmupを行わない。

## 理由

- 演出の制作方法（CSS、Lottie、Rive）を変えても、起動処理とShader準備に手を入れずに差し替えられる。
- 準備処理はスプラッシュがなくても単独で効き、スプラッシュを閉じた後も継続できる。
- 優先度付きキューにより、事前準備が利用者の操作を遅らせない。直列実行は維持するため、既存の`context lost`対策と矛盾しない。

## 代替案

| 案 | 採用しなかった理由 |
| --- | --- |
| スプラッシュ中にすべてのShaderを同期的にコンパイルする | Glass系は完了時間の上限がなく、起動が長くなる。閉じられない状態が起こり得る。 |
| スプラッシュ用の別WebGL contextで事前ロードする | ProgramはPreview contextで再利用できない。GPUとコンパイルを奪い合う。 |
| Lottie／Riveを最初から依存へ追加して直接描画する | 演出が未確定の段階で初期bundle、CSP、WASM配布の負担を先に負う。 |
| 事前準備をFIFOのまま追加する | 利用者が有効にしたEffectが事前準備の後ろで待たされる。 |

## 結果

### 利点

- Effect Stackの初回有効化の待ち時間を、起動後のアイドル時間とホバー時のprefetchで吸収できる。
- 演出の差し替えは、アダプター1ファイル、レジストリ1行、`brand.ts`の設定変更で済む。

### 欠点・コスト

- 起動後しばらく、GPUドライバでのコンパイル負荷とProgramのメモリが増える。
- Lottie／Riveを採用する際は、アセットとWASMの自己ホスト、CSP（Rive／dotLottieのWASMには`'wasm-unsafe-eval'`）、Canvas2D描画の選択を別途確認する必要がある。

## 再検討条件

- WebGLでProgramバイナリのキャッシュや別contextとの共有が使えるようになった場合。
- warmupによるGPU負荷やメモリが低スペック環境で問題になった場合。
- スプラッシュの演出がPreviewと同じGPU資源を必要とする方式に変わった場合。
