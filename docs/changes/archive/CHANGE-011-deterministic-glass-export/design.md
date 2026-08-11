# Design

## 方針

最初にGLASS系の有無とEffect Stack順序を比較し、根本原因をFBO、program、time、capture競合のいずれかへ絞る。原因未確定の段階で、固定sleep、frame補間、GLASS無効化、毎フレームのcontext再生成は採用しない。

## export session

`renderBridge`を中心にexport session tokenとrender generationを管理する。AnimationLoopの停止だけに依存せず、通常renderの入口とstatic schedulerのcallbackがsessionを確認する。通常描画要求は拒否または最新1件へ集約し、終了時に最新Preview状態を1回だけ描画する。

sessionには次を保持する。

- session IDとgeneration
- 開始前のPreview再生状態
- 固定したLatestStateまたはrender plan snapshot
- 必要programと事前に決定したfallback方針
- Canvas、FBO、tile paddingの出力条件
- 最後に成功したrender sequence

## program readiness

Effect Pipelineのrender planから必要programを列挙し、export開始前にreadyを待つ。Glass専用programが必要な場合、compile failureを途中フレームのfallbackへ遅延させない。fallbackを許可する場合も、開始前に選択し、session中に変更しない。

## WebGL状態

GLASS passの開始時にprogram、framebuffer、viewport、active texture、sampler binding、blend／scissor、clear、Glass uniformを設定する。source textureとdestination textureの一致を検出して中止し、destinationをフレーム開始時に初期化する。診断モードではframebuffer completenessと`gl.getError()`、オブジェクトdebug ID、render sequenceを記録する。

## 共通フレーム生成

Browser／Tauri adapterから、frameIndexとexport sessionを受け取る共通サービスへ次を移す。

1. AbortSignalとsessionを検証する。
2. snapshot済みrender planとprogramを検証する。
3. frameIndexからnormalizedTimeを計算し、time remapを一度だけ適用する。
4. GLASSを含む描画状態を初期化して、一度だけrenderする。
5. GPU完了を確認する。
6. capture対象のrender sequenceを検証する。
7. PNG Blobまたはadapterの書き出し先へ渡す。

Tile pathでは同じsessionを保持したまま各tileを描画し、tile終了時にPreviewを再描画しない。Canvasサイズ復元と終了後のPreview再描画はsession終了処理で一度だけ行う。

## 同期方式

`requestAnimationFrame`を描画完了の唯一の根拠にしない。診断ではrender sequenceとGPU状態を比較し、必要な場合だけ`gl.finish()`またはfenceを採用する。毎フレームの過剰同期による性能劣化を測定し、validationへ記録する。

## 代替案と不採用理由

| 案 | 不採用理由 |
| --- | --- |
| `setTimeout(0)`だけ削除する | 潜在的なFBO汚染、program切替、Preview競合を解消できない |
| 異常フレームを前後補間する | 描画の根本原因を隠し、正しいフレームを生成しない |
| GLASSを常にfallbackへ固定する | 専用GLASS／GLASS V2の出力契約を失い、問題を隠す |
| 毎フレームWebGL contextを再生成する | 高コストで、program／texture管理の問題を解決しない |
| Preview Canvasとは別の大規模rendererへ全面移行する | 今回の原因に対して変更範囲とロールバックコストが過大 |

## ロールバック

共通frame generator、export session、診断ログを分離した単位で戻せるようにする。診断ログは開発フラグで無効化でき、本番の常時大量出力を避ける。

## 実装結果

- `renderBridge`がexport session tokenとrender sequenceを所有し、準備開始から終了までPreview、AnimationLoop、static scheduler、seekを拒否する。
- session開始時に`LatestState`をdeep copyし、Canvas系sourceだけ参照を維持する。Effect Stack、GLASS設定、animation、keyframe、tile paddingは以後UI更新から分離される。
- `getRequiredExportProgramKeys()`で必要programを列挙し、GLASS／GLASS V2は専用programを最初のフレーム前に待つ。compile failure時はsession開始前に失敗する。
- `renderAndCaptureExportFrame()`がframeIndex、GPU完了、capture、sequence検証を共有し、Browser ZIPとTauri MOV／MP4が同じ処理を使う。
- GLASS passはblend、scissor、color mask、framebuffer、viewport、source samplerを明示し、texture FBOをclearする。sourceとdestinationが同じping-pong textureの場合は中止する。
- Tile pathも同じsession tokenを使い、tileごとにGPU完了とsequenceを検証する。tile終了ごとのPreview再描画は行わず、session終了時に最新Previewを1回だけ復元する。

## 開発用診断

開発ビルドのコンソールで次を設定すると、session、frameIndex、normalizedTime、renderTime、sequence、固定plan、program、GLASS passのFBO／texture debug ID、viewport、active texture、sampler unit、framebuffer status、`gl.getError()`、capture時刻を記録する。

```js
globalThis.__KGG_EXPORT_DIAGNOSTICS__ = true
```

既定は無効であり、本番ビルドでは有効にならない。
