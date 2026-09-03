---
type: design
id: CHANGE-030
title: SANDBOX Flow Gradient Phase A の実装設計
status: approved
---

# CHANGE-030 実装設計

## 採用する実装方針

Flow Gradientは、既存のEffect Stackへ新しい自由配置レイヤーを追加するのではなく、SANDBOXの固定ステージとして実装する。既存の順序は次のまま維持し、PrismとParticlesの間にFlow Gradientを挿入する。

Base → Surface → Main Stack → Prism → Flow Gradient → Particles

Flowを無効にした場合は、Flow用のProgram、FBO、合成を描画計画から外し、従来経路へ戻す。これによりADR-0004、ADR-0005が定めるMain Stackのping-pongと、Particlesを最終オーバーレイとする意味論を変更しない。

Phase Aの描画は次の5段階に分ける。

1. Flow Simulation: Seedと正規化時刻から各サンプルの3D位置、速度方向、深度、寿命位相を決定する。粒子は共通エミッタ原点から球面方向へ放射し、周期的な3D Curl場を固定ステップ積分する。
2. Perspective Splat: 3D位置を固定view/projectionで画面へ投影し、深度に応じて画面上の速度方向、splatサイズ、寄与を決定する。投影後のGaussianまたはcapsuleを低解像度Density FBOへ加算する。
3. Temporal Trail: Densityと前フレームTrailをTrail用Ping-Pong FBOへ減衰合成する。
4. Density Composite: Trailのスカラー値を指数型またはスクリーン相当の飽和応答へ変換し、重なりを有限範囲の連続Fieldへ再構成する。
5. Gradient Composite: 再構成したスカラー値をGradient Ramp Textureで色へ変換し、元画像RGBの加算や粒子単位の固定色を使わずFlowステージへ合成する。

近傍探索や隣接線分は使用しない。Ribbonの連続感は、Curl場に沿って移流された同一流線上の粒子を速度方向へ伸ばしたsplatとして重ね、Gaussian密度、Temporal Trail、空間平滑化の組み合わせで作る。密度の大小は最終合成で単調な濃度応答へ変換してからGradient Rampへ入力する。

## 3Dエミッタ、Curl積分、透視投影

### エミッタと粒子初期値

エミッタ原点はFlowのワールド空間に一つだけ置き、各粒子の初期方向を単位球面上へ分散する。方向、初期半径、spawn phase、lifetimeは次の入力だけから決定する。

    hash(globalSeed, particleId, salt)

`Math.random()`、`performance.now()`、フレームごとの再抽選は使用しない。粒子がlifetime終端へ到達した場合は、同じhash系列から評価される次の周期位相へ連続的に戻し、全粒子が同時にリスポーンしないようspawn phaseを分散する。

### 3D Curl場

Curl場は周期化した3D座標とloop angle（`sin(angle)`, `cos(angle)`）から評価する。発散を抑えたベクトル場として扱い、各粒子は同じ固定ステップ数のRKまたは半ステップ積分で位置と速度を更新する。積分中の速度ベクトルをsplatのlongitudinal方向へ使い、速度に直交する画面空間基底をtransverse方向へ使う。

3Dの場を画面へ事前に潰してから2Dレーンを作る実装は採用しない。ワールド座標の`x/y/z`と速度を保持したまま積分し、最後の投影段でのみ画面座標へ変換する。

### 固定カメラとTile Render

カメラは内部の固定view/projection行列として扱い、ユーザー設定やPresetへ公開しない。透視除算後の`w`、near/far範囲、カメラ後方のクリップを共通関数で処理する。深度が近い粒子ほど投影面積とDensity寄与を調整するが、CPU側の深度ソートや個別粒子の遮蔽判定は行わない。

view/projectionは常に出力全体の解像度と全体UVを基準に作る。Tile Renderでは同じ全画面投影結果をタイルのviewportへ写像し、タイルごとにカメラ位置、視野角、粒子位相、splatサイズを変えない。

### 密度と合成

投影後のDensityは加算ブレンドで蓄積し、Trailと空間再構成後に次のような飽和応答へ変換する。

    saturated = 1 - exp(-trail * densityResponse)
    screenEquivalent = 1 - (1 - saturated) * (1 - overlap)

実装では同じ単調性を持つ1つの応答へ整理し、重なりが多い箇所ほど高いスカラー値になることを保証する。最終RGBはこのスカラー値を既存Gradient Rampへ入力して決定し、元画像RGBをFlowの背景として加算しない。これにより粒子単位の点・短線ではなく、重なりの密度が連続した布状の色面として見える。

## データモデル

Effect PipelineへflowGradientEnabledを追加し、Flow固有の設定は独立したFlowGradientConfigとして保持する。既存Particlesの設定を再利用または上書きしてはならない。

FlowGradientConfigのPhase A案は次のとおり。

- seed: 0から9999の整数、既定値は42
- particleCount: 10000から500000、1000刻み、既定値は100000
- curlScale: 0.1から20、既定値は2.5
- curlStrength: 0から2、既定値は1
- speed: 0から2、既定値は0.6
- ribbonWidth: 0.5から128px、既定値は8px
- stretch: 0から8、既定値は1.5
- density: 0から4、既定値は1
- trail: 0から1、既定値は0.85
- contrast: 0.1から4、既定値は1.2

Loop、Loop Duration、再生の有効状態は既存Animation設定を参照する。FlowGradientConfigにloopDuration、loopEnabled、diffusionを追加しない。

Flow設定のnormalizerは、値の欠落、NaN、Infinity、範囲外、旧プリセットを安全な既定値へ正規化する。parameterLimitsに上記の範囲を追加し、UI、Store、Preset、WebGLへ同じ制限を供給する。

## 状態管理

WebGL側にFlowRuntimeStateを持たせる。Runtime Stateはプリセットに保存せず、次の情報を保持する。

- Density用の描画先とサイズ
- Trail用Ping-Pong FBOの読み書きインデックス
- Flow Program、VAO、Buffer、Gradient Ramp参照
- 現在のRender Session、論理フレームキー、設定シグネチャ
- reset済みか、prewarm済みか、現在の論理フレームを描画済みか

論理フレームキーは少なくともRender Session、正規化時刻、設定シグネチャ、入力ソースの識別子を含む。同一キーの再描画はDensity生成、Trail更新、合成用出力を再利用する。設定、Seek方向、Loop境界、解像度、入力ソースが変わったときは新しいSessionまたはepochを開始して履歴を破棄する。

Previewでは通常の再生に対して論理フレームを順に進める。時間が後退した場合、再生を再開した場合、設定が変わった場合はresetし、現在時刻へ到達するための決定的なprewarmを行う。ExportとThumbnailは開始時に必ずresetし、対象フレームより前の必要なフレームを同じ固定スケジュールでprewarmする。

Transitionでは、同じ論理フレームに対するfrom/toの評価がFlowを二度進めないようにする。Flowを含む結果を作るRender Sessionのフレームキャッシュまたは状態スナップショットを使い、複数のタイルも同じFlow出力を参照する。

## シミュレーションとループ

既存ParticlesのCurl Noise式と乱数シードの考え方を調査し、Flow専用の決定的な3D評価関数へ抽出または共有する。各サンプルの初期位相と球面方向はseedとサンプル番号から決定し、時間はperformance.nowや実時間deltaではなく正規化時刻から求める。

Curl Noiseの入力座標はループ位相が0と1で一致する周期写像にする。粒子位置は速度方向とspeedから評価し、寿命位相をループ内で循環させる。Loop Durationは既存AnimationのDurationを正規化して使用する。

Trail更新の概念式は次とする。`smoothDensity`と`smoothTrail`は低解像度FBO上の近傍サンプルを空間再構成する関数である。

    trailNext = mix(smoothDensity(currentDensity), smoothTrail(trailPrev), retention)
    density = 1 - exp(-trailNext * 4)
    intensity = mix(0.2, 1.0, density)

実際のretentionはTrail設定から指数減衰へ変換し、Previewの可変deltaに依存しない。Exportではフレーム番号とtotalFramesから同じ論理フレーム列を再生する。フレームNの描画で更新した状態を、フレームNのタイル数だけ繰り返し適用してはならない。

## 再生ループと境界処理

Animationの再生が有効なとき、Flowは既存Animationの`previewLoop`（未指定時は既定で有効）、`duration`、`fps`、normalized timeをそのまま参照する。Loop有効時の位相は次で求める。

    loopPhase = fract(elapsedSeconds / duration)

FPSが指定されている場合、出力する表示フレームは`0..N-1`（`N = ceil(duration * fps)`）とし、`N`番目の終端フレームを追加で出力しない。再生時間がDurationへ到達した時点では、同じ終端フレームをもう一度描画してから0へ戻るのではなく、次の論理フレームを位相0として扱う。

Loop境界の位相0は、終端時点のTrailをそのまま再利用しない。Runtime Stateは次の周期の先頭Densityと必要なprewarmフレームを非表示の決定的スケジュールで評価し、最初に表示する位相0が通常再生中の定常Trailと一致するようにする。prewarm中も同じ3Dエミッタ、Curl積分、透視投影、Density応答を使い、Tile数でTrailの進行回数を増やさない。

再生開始とRestartは位相0からreset/prewarmして開始する。Pause/Resumeは現在位相とTrailを保持して続行し、Seekで時刻が後退した場合は対象位相までreset/prewarmする。`previewLoop`を無効にした場合だけ既存Animationの非ループ終了動作へ従い、Flow専用のLoop Durationや再生時計は追加しない。

## UI構成

SandboxPanelへflowGradientモジュールを追加し、FlowGradientPanelを新設する。表示上は既存モジュールと同じくSANDBOXの選択カードとして扱い、現在のモジュール数表示も更新する。

FlowGradientPanelには次を配置する。

- Seed
- Particle Count
- Curl Scale
- Curl Strength
- Speed
- Ribbon Width
- Stretch
- Density
- Trail
- Contrast
- 既存AnimationのLoop状態とLoop Durationの参照表示

UIから変更した設定は共通Store、parameterLimits、normalizerを経由してWebGLへ渡す。Flowの設定変更時はFlowRuntimeStateをresetする。既存Particlesの同名または類似設定を直接書き換えない。

## 描画・外部プロセス・Tauri側の変更

### WebGL Pass

Flow専用のSplat、Trail、Gradient CompositeのProgramをwebglShaderSourcesへ遅延登録する。Splatのvertex段では3D粒子位置、速度、深度を固定view/projectionで投影し、fragment段では速度方向Gaussian/capsuleをDensityへ加算する。既存のGradient Ramp TextureをCompositeへ渡し、Sampler、Blend、Viewport、Framebuffer、Active Texture、VAOの状態をPassの入口と出口で管理する。

view/projectionは画面全体の出力サイズから一度だけ決定し、Tile Renderへ同じ全体行列を渡す。深度から得た透視スケールはsplatの画面サイズとDensity寄与へ使うが、CPU側の粒子ソートは行わない。Trail後のCompositeはDensityをスクリーン相当の飽和応答へ変換してからRamp Lookupし、元画像RGBの加算を行わない。

Flowの作業解像度はPhase Aでは画面解像度の0.4倍を使い、FBO上の隣接splatを集約して粒子間の隙間を目立たせない。0.25倍へ下げてもFBOが成立する構造は維持する。ユーザー向けの解像度設定はPhase Aでは公開せず、内部定数または将来の別CHANGEとして扱う。

低解像度FBOで同じ粒子数を加算したときだけDensityが過飽和しないよう、Splatへ渡すDensityを内部FBO面積に比例して補正する。基準はFull HDの0.5倍FBO（960×540）とし、基準以上は1、基準未満は0.05を下限とする。この補正は粒子数、重なり、ユーザーのDensity値の意味を変えず、解像度変更時の白飛びだけを抑える。

Render TargetはまずEXT_color_buffer_float等の利用可否とFramebuffer完整性を確認する。FP16経路が使えない場合はRGBA8へ切り替える。どちらも成立しない場合はFlowを無効化し、既存描画を継続する。

FlowのFBO、Texture、Program、VAO、Bufferは初期化時に作成し、サイズ変更時だけ再構成する。Context Lost/Restoredでは古いWebGLオブジェクトを全て破棄扱いにして再作成する。dispose時にはFlowが所有する全リソースを解放する。

### Render入口

renderSceneAtTime、renderBridge、tileRender、presetThumbnailの境界へ、Render Session、論理フレーム、reset/prewarmの情報を渡す。Exportの1フレーム、Transitionの評価、Tile Renderの各タイルが同じFlow状態を複数回更新しないことを実装テストで固定する。

Tauri/Rust、FFmpeg、外部プロセスには変更を加えない。既存のExport契約が作るフレーム列をFlow側が決定的に評価する。

## 変更対象の主要ファイル

実装時に既存ファイルを更新する候補:

- src/components/SandboxPanel.tsx
- src/components/FlowGradientPanel.tsx
- src/types/flowGradient.ts
- src/types/distortion.ts
- src/types/latestState.ts
- src/store/gradientStore.ts
- src/lib/parameterLimits.ts
- src/lib/flowSimulation.ts
- src/lib/flowGradientRenderer.ts
- src/lib/renderSceneAtTime.ts
- src/lib/renderBridge.ts
- src/lib/tileRender.ts
- src/lib/presetModel.ts
- src/lib/presetThumbnail.ts
- src/lib/webgl.ts
- src/lib/webglShaderSources.ts
- src/shaders/flow-splat.vert.glsl
- src/shaders/flow-splat.frag.glsl
- src/shaders/flow-trail.frag.glsl
- src/shaders/flow-gradient.frag.glsl
- src/i18n/messages.ts
- src/i18n/uiLabels.ts

実装時に追加する候補テスト:

- src/lib/flowSimulation.test.ts
- src/lib/flowGradientRenderer.test.ts
- src/lib/presetModel.flowGradient.test.ts
- src/lib/renderBridge.flowGradient.test.ts
- src/lib/tileRender.flowGradient.test.ts
- src/lib/presetThumbnail.flowGradient.test.ts

## 代替案とトレードオフ

### Main StackへFlowを追加する案

採用しない。Main Stackの自由順序、ping-pong、Prism、Particlesの境界を変更し、ADR-0004とADR-0005の再設計が必要になる。Phase Aでは固定ステージの追加で目的を満たす。

### CPUで粒子軌跡を保持する案

採用しない。Particle Countの増加に比例してCPU転送と近傍探索のコストが増え、PreviewとExportで更新回数の違いが結果へ混入しやすい。

### 既存Particlesのスプライトを横長にする案

採用しない。速度方向の情報は使えるが、Trail、密度合成、Gradient Mappingを共有できず、連続した場としてのFlow表現にならない。

### 画面上の2Dレーンを3D表現として扱う案

採用しない。画面空間の`x/y`だけをCurl場で移流しても、奥行きによる投影スケール、複数深度の重なり、共通エミッタからの放射を再現できず、現在確認されている平面的なRibbon表現から脱しない。3Dワールド座標を先に積分し、最後にDensityへ投影する方式を採用する。

### Phase AからDirectional Diffusionを含める案

採用しない。速度場、拡散係数、境界条件、精度とコストの検証が追加されるため、Temporal Trailの決定性とリソース契約を先に確立する。

## 移行方法

既存プリセットにはflowGradientEnabledがないため、読み込み時はfalseへ正規化する。FlowGradientConfigがない場合は本設計の既定値を適用する。既存Particles、Prism、Main Stack、Animationの保存値は読み書きとも変更しない。

新しいプリセットはFlowの有効フラグと設定を保存する。旧バージョンが未知のFlow設定を読み込んだ場合も、既存設定を破壊せずFlowだけを無効化できるよう、正規化結果を検証する。

## ロールバック方法

Flowの機能フラグをfalseへ戻し、Flow設定を読み込まない場合も既存の既定値へ正規化する。描画計画からFlow PassとFlow FBOを除外すれば、旧来のBase → Surface → Main Stack → Prism → Particlesへ戻せる。

ロールバック時に既存Particlesの設定、Effect Stackの順序、Gradient Ramp、Presetの既存フィールドを削除・変換しない。Flow専用のProgram、FBO、型、UIを削除する場合は同じCHANGEの変更範囲として差分と検証を更新する。

## レビュー状態

3Dエミッタ、固定view/projection、深度を使ったDensity合成、既存Animationループ同期は、承認済みPhase Aの追加要件である。実装後はMCP実GPUと自動検証の結果をvalidationへ記録し、未確認の出力経路は明示的に残す。
