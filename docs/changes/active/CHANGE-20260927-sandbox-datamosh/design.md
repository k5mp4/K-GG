# Design

## 採用する実装方針

既存のWebGL2パイプライン（`src/lib/webgl.ts`の生WebGL + lazy program）に固定段を追加する。依頼文はThree.jsを例示していたが、Effect StackとVideo Motionの既存描画はThree.jsではなく生WebGLで、ping-pong target、lazy compile、Render Planもそこにある。Three.js（Cloth）を混ぜると描画結果の受け渡しに別contextとコピーが必要になるため採用しない。

## データモデル

`src/types/datamosh.ts`の`DatamoshConfig`を一次情報とする。数値パラメータは`DATAMOSH_RANGES`で範囲を持ち、`normalizeDatamoshConfig`で正規化する。旧Video Motionからの変換は`datamoshFromLegacyVideoMotion`と`resolvePersistedDatamosh`に閉じ込める。

| 旧Video Motion | Datamosh |
| --- | --- |
| Effect Stack `videoMotion`レイヤーの有効状態（V2）／`videoMotion.enabled` | `enabled` |
| — | `motionSource: video`、`mixMode: rampLock`、`blockSize: 1`、`refresh: 0`、破損0 |
| `smearLength × effectStrength` | `strength` |
| `min(feedbackAmount × decay, 0.82) × blendAmount × effectStrength` | `feedback` |
| `motionDamping`／`fieldSmoothing` | `videoMotionDamping`／`videoFieldSmoothing` |
| `stabilization` | 再現しない |

## 状態管理

storeの`videoMotion` sliceを`datamosh`へ置き換え、`setVideoMotion`を`setDatamosh`へ置き換える。Stretchと同じく、`setDatamosh({ enabled })`はEffect Stackレイヤーを更新し、`setEffectPipeline`はレイヤーの有効状態を`datamosh.enabled`へ反映する。スタックにレイヤーがない旧文書で`datamosh.enabled`が有効ならレイヤーを有効にする。

## UI構成

`PostprocessPanel`のEdit Layerへ`Datamosh`を追加し、`DatamoshPanel`は選択に関わらず`hidden`で常時mountする（`<video>`要素とruntimeを維持するため）。Effect Stackの行ラベルは`Datamosh`。

## 描画

- `drawDatamoshPass`: 入力texture、履歴（読み取り側）、Video Motion field、Gradient Rampを読み、書き込み側の履歴FBOへ描く。戻り値の書き込み側textureを後段の入力にする。
- `advanceDatamoshHistory`: フレームキーが変わったときだけ読み取り／書き込みを入れ替える。Freeze中はprimed済みなら入れ替えない。
- V2: Main Stackループ内の`datamosh`レイヤーの位置で実行。Legacy V1: `datamosh.enabled`のとき、Flowの後、Seamless／Particlesの前で実行し、後段がなければ既定framebufferへblitする。
- 不規則パーティション: 基準グリッドのブロックを`Block Variance × 0.35`の確率で2倍へ結合し、それ以外は`Block Variance`の確率でx／y／両方向へ最大2段分割する。配置は6論理フレームごとに変わる。
- 輝度・彩度stretch: 未移動の履歴画素の輝度・彩度から0〜4倍の倍率を求め、motionのずらし量に掛ける。
- Shaderは`uniforms.glsl`、`motion-field.glsl`（`datamoshMotionField`契約）、`main.glsl`の3 chunkを連結する。procedural motionは解析的勾配つきvalue noiseの3 octave fbmでcurlを求め、finite differenceを使わない。

## 変更対象の主要ファイル

コード: `src/types/datamosh.ts`、`src/shaders/datamosh/*.glsl`、`src/lib/webgl.ts`、`src/lib/webglShaderSources.ts`、`src/lib/effectPipeline.ts`、`src/lib/sceneRenderPlan.ts`、`src/components/DatamoshPanel.tsx`、`src/components/PostprocessPanel.tsx`、`src/components/EffectStackPanelView.tsx`、`src/features/effectStack/effectStackView.ts`、`src/lib/presetModel.ts`、`src/components/PresetPanel.tsx`、`src/store/*`、`src/components/GradientCanvas.tsx`、`src/lib/videoExportFrames.ts`、`packages/kgg-control/src/*`。

テスト: `src/types/datamosh.test.ts`、`src/lib/effectPipeline.test.ts`、`src/lib/webglExportPrograms.test.ts`、`src/store/gradientStore.effectPipeline.test.ts`、`src/components/PostprocessPanel.test.tsx`、`src/lib/webgl.lifecycle.test.ts`、`tests/e2e/shaders.spec.ts`。

## 代替案とトレードオフ

ADR-20260927-datamosh-feedback-layerを参照。

## 移行方法

Preset読込（`PresetPanel`）と保存（`makePreset`）で`resolvePersistedDatamosh`を使う。保存時は`videoMotion`を書かない。

## ロールバック方法

このPRをrevertする。revert後は`datamosh`で保存されたPresetのDatamosh設定が無視され、Video Motionは既定の無効状態になる。
