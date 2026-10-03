---
type: current
id: CURRENT-EFFECT-STACK
title: Effect Stack
status: current
owners: [maintainer]
created: 2026-07-27
updated: 2026-10-03
requirement_ids: [EFFECT-001, EFFECT-002, EFFECT-003, EFFECT-004, EFFECT-005, EFFECT-006, EFFECT-007, EFFECT-008, EFFECT-009, EFFECT-010, EFFECT-011, EFFECT-012, EFFECT-013, EFFECT-014, EFFECT-015, EFFECT-016, EFFECT-017, EFFECT-018, EFFECT-019, EFFECT-020, EFFECT-021, EFFECT-022, EFFECT-023, EFFECT-025, EFFECT-026, EFFECT-027, EFFECT-028, EFFECT-029, EFFECT-030, EFFECT-031, DISTORT-001, DISTORT-002, CLOTH-001, CLOTH-002, CLOTH-003, SANDBOX-001, FLOW-001, FLOW-002, FLOW-003, FLOW-004, FLOW-005, FLOW-006, FLOW-007, FLOW-008, FLOW-009, FLOW-010, FLOW-011, FLOW-012, VIDEO-MOTION-001, VIDEO-MOTION-002, VIDEO-MOTION-003, VIDEO-MOTION-004, DATAMOSH-001, DATAMOSH-002, DATAMOSH-003, DATAMOSH-004, DATAMOSH-005, DATAMOSH-006, TEXTURE-001, TEXTURE-002, TEXTURE-003, SHAPES-001, SHAPES-002, SHAPES-003, SHAPES-004]
related_adrs: [ADR-0004, ADR-0005, ADR-0009, ADR-0010, ADR-0017, ADR-20260927-datamosh-feedback-layer, ADR-20260929-sandbox-texture-material-stage, ADR-20260930-sandbox-shapes-final-stage]
related_changes: [CHANGE-001, CHANGE-011, CHANGE-012, CHANGE-013, CHANGE-014, CHANGE-015, CHANGE-018, CHANGE-019, CHANGE-020, CHANGE-021, CHANGE-022, CHANGE-023, CHANGE-024, CHANGE-025, CHANGE-026, CHANGE-027, CHANGE-030, CHANGE-031, CHANGE-032, CHANGE-033, CHANGE-034, CHANGE-035, CHANGE-036, CHANGE-037, CHANGE-044, CHANGE-046, CHANGE-047, CHANGE-048, CHANGE-053]
related_code: [src/types/distortion.ts, src/types/coneView.ts, src/lib/effectPipeline.ts, src/lib/normalMap.ts, src/lib/effectStackTransition.ts, src/lib/postprocessStack.ts, src/lib/postprocessAnimation.ts, src/lib/sceneEvaluation.ts, src/lib/animationRegistry.ts, src/lib/glass.ts, src/lib/glassTile.ts, src/lib/webgl.ts, src/lib/voronoi.ts, src/shaders/postprocess/stack.glsl, src/shaders/postprocess/uniforms.glsl, src/store/documentModel.ts, packages/kgg-control/src/parameterLimits.ts, packages/kgg-control/src/types.ts, packages/kgg-control/src/scenarios.ts, src/lib/slitAnimation.ts, src/lib/webglShaderSources.ts, src/lib/flowGradientRenderer.ts, src/lib/flowSimulation.ts, src/lib/presetModel.ts, src/lib/presetThumbnail.ts, src/lib/coneView.ts, src/lib/coneSeam.ts, src/store/gradientStore.ts, src/lib/kggControlRuntime.ts, src/components/PostprocessStackPanel.tsx, src/components/EffectStackWorkspace.tsx, src/components/PostprocessPanel.tsx, src/components/PostprocessOverlay.tsx, src/components/DistortOverlay.tsx, src/components/SandboxPanel.tsx, src/components/FlowGradientPanel.tsx, src/components/BlockNoisePanel.tsx, src/components/DiffuseCurveEditor.tsx, src/components/SlitScanPanel.tsx, src/components/StretchPanel.tsx, src/components/PresetPanel.tsx, src/components/ClothGradientPanel.tsx, src/components/ClothCanvas.tsx, src/components/ConeApexEditor.tsx, src/components/ConeViewPanel.tsx, src/lib/clothGradientRenderer.ts, src/types/clothGradient.ts, src/types/flowGradient.ts, src/shaders/normalmap.frag.glsl, src/shaders/postprocess/glass-optics.glsl, src/shaders/postprocess/glass-field.glsl, src/shaders/postprocess/glass-compact.glsl, src/shaders/postprocess/uniforms.glsl, src/shaders/postprocess/glass-tile.glsl, src/shaders/postprocess/diffuse.glsl, src/shaders/postprocess/noise-diffuse-main.glsl, src/shaders/flow-splat.vert.glsl, src/shaders/flow-splat.frag.glsl, src/shaders/flow-trail.frag.glsl, src/components/DatamoshPanel.tsx, src/types/datamosh.ts, src/lib/videoMotionSource.ts, src/lib/videoMotionRuntime.ts, src/shaders/datamosh/uniforms.glsl, src/shaders/datamosh/motion-field.glsl, src/shaders/datamosh/pixel-stretch.glsl, src/shaders/datamosh/main.glsl, src/types/texture.ts, src/shaders/texture.frag.glsl, src/components/TexturePanel.tsx, src/types/shapes.ts, src/lib/shapesLibrary.ts, src/shaders/shapes.frag.glsl, src/features/shapes/shapesMaskStore.ts, src/components/ShapesPanel.tsx, src/lib/renderFrame.ts]
related_tests: [tests/e2e/shaders.spec.ts, src/lib/effectPipeline.test.ts, src/lib/webglNormalMapParity.test.ts, src/lib/effectStackTransition.test.ts, src/lib/postprocessStack.test.ts, src/lib/postprocessAnimation.test.ts, src/lib/effectStackDrag.test.ts, src/lib/effectShaderParity.test.ts, src/lib/webglExportPrograms.test.ts, src/lib/webglShaderSources.test.ts, src/lib/glassTile.test.ts, src/lib/glassTileShader.test.ts, src/lib/flowSimulation.test.ts, src/lib/flowGradientPreset.test.ts, src/lib/glass.test.ts, src/store/gradientStore.effectPipeline.test.ts, src/store/gradientStore.postprocessStack.test.ts, src/store/gradientStore.glass.test.ts, src/store/gradientStore.animation.test.ts, src/lib/sceneEvaluation.glass.test.ts, src/lib/slitAnimation.test.ts, src/lib/presetModel.slit.test.ts, src/lib/presetThumbnail.test.ts, src/lib/coneView.test.ts, src/lib/coneSeam.test.ts, src/lib/presetModel.diffuse.test.ts, src/lib/processedCanvasClock.test.ts, src/types/coneView.test.ts, tests/clothGradient.test.ts, src/types/datamosh.test.ts, src/lib/videoMotionSource.test.ts, src/lib/videoMotionRuntime.test.ts, src/lib/kggControlRuntime.test.ts, packages/kgg-control/src/scenarios.test.ts, src/components/PostprocessPanel.test.tsx, src/components/PostprocessStackPanel.test.tsx, src/components/SandboxPanel.test.tsx, src/types/texture.test.ts, src/store/gradientStore.texture.test.ts, src/types/shapes.test.ts, src/lib/shapesLibrary.test.ts, src/lib/presetModel.shapes.test.ts, src/lib/renderFrame.test.ts]
---

# Effect Stack

## 目的

Effect Stackは、Gradientから得た画像・色場へ複数の効果を適用し、その順序と有効状態を編集可能にする機能です。ユーザーが編集する主スタックと、処理の意味や複数パス要件が異なる固定段を分けます。

## 現在の要件

### EFFECT-001 主スタックの効果

Unified Effect Stack V2の主スタックは、`Noise`、`Slit`、`Stretch`、`Distort`、`Mirror`、`Kaleidoscope`、`Voronoi`、`Glass`、`GlassTile`、`Diffuse`、`Datamosh`、`Cone`、`Texture`の13種類です。`Datamosh`は前フレームの履歴を使う時間フィードバック経路、`Glass`はGLASS V2、`GlassTile`はKG_Glassのタイル表面モデルを移植した専用描画経路、`Cone`は前段textureを円錐面へ投影する専用描画経路、`Texture`は前段の結果へ高さ場でライティングする専用描画経路（TEXTURE-001）を使用します。各種類はスタック内に一度だけ存在し、同じ種類の複数インスタンスは現在サポートしません。

主スタックは既知の種類を正規化して保持します。未知の種類や重複は保存・読込時に除外され、欠落した既知の種類は無効状態で補完されます。旧Presetの`videoMotion`レイヤーはDATAMOSH-005に従って同じ位置の`datamosh`レイヤーへ写像されます。旧Presetの`glassV2`は`glass`へ写像され、旧`glass`と同時に存在する場合も一つへ統合されます。

### EFFECT-002 有効化と順序

利用者は主スタックの各効果を有効/無効に切り替え、順序を手動またはランダムに並べ替え、選択中の効果を変更できます。現在の実装は任意の新しい種類を追加・削除するモデルではなく、既知の13種類を無効化することで「使わない」状態を表現します。

新規V2状態の既定順は `Noise → Slit → Stretch → Distort → Mirror → Kaleidoscope → Voronoi → Glass → GlassTile → Diffuse → Datamosh → Cone → Texture` で、Diffuseが既定で有効です。ユーザーが保存した順序と有効状態はPresetへ保存されます。ランダム化操作では13種類を一度ずつ含む順列を作り、有効状態・選択状態・固定段を維持します。現在の描画結果から目標順序の結果へ400msの`easeInOut`表示ブレンドを行い、完了後に目標順序を確定します。

### EFFECT-014 Postprocessの全体有効状態

`Stretch`、`Distort`、`Mirror`、`Kaleidoscope`、`Voronoi`、`Glass`、`GlassTile`、`Datamosh`、`Cone`、`Texture`のいずれか一つ以上が有効な場合、Postprocess全体を有効状態として表示します。Postprocessのプロパティモジュールには各レイヤーの個別ON／OFFを表示せず、レイヤーの有効状態はEffect Stackで管理します。プロパティモジュールではPostprocess全体のON／OFFと、選択レイヤーの詳細プロパティを表示します。Postprocessの全レイヤーが無効な場合は全体も無効状態になります。

### EFFECT-029 Mirror／Kaleidoscopeのガイド表示

Effect Stack V2で`Mirror`または`Kaleidoscope`を選択し、そのレイヤーが有効な場合、Canvas表示中にPostprocessプロパティを表示している間は対応する編集ガイドを常に表示します。ガイドの種類と有効状態は`effectPipeline.selectedKind`および`effectPipeline.effectStack`から決定し、Presetに残る旧`showOverlay`値では隠しません。Mirror／KaleidoscopeのプロパティにはガイドのON／OFF切替を表示しません。Legacy V1ではPostprocessプロパティ表示中に選択された有効なレイヤーのガイドを表示します。

### EFFECT-003 固定段と描画順

V2の全体順序は `Base → Surface → Main Stack → Prism → Flow Gradient → Particles` です。SANDBOXのShapesを有効にした場合は、Seamlessを含むこの全体の描画が終わった後に最終段として適用します（SHAPES-001）。NormalはSurface、PrismはGlowを含む専用段、Flow GradientはGPU密度・Temporal TrailをGradient Rampへ合成する固定段、Particlesは最終2Dオーバーレイとして扱い、これらを主スタックの並べ替え対象には含めません。ConeはMain Stack内の通常レイヤーであり、配置された位置で前段textureを円錐面へ投影し、その描画結果を後段へ出力します。Datamosh、Cone、Textureはdrag、randomize、solo、選択、永続化、render planの対象です。Coneを含む通常レイヤーはSANDBOXの固定段ではありません。Flow Gradientを無効にした場合は、Flow Gradientを除いたParticlesまでの経路を使用します。

有効な主スタックレイヤーは前段の結果を次段の入力として処理します。レイヤーが0件の場合の直接描画、軽量な主スタック、追加の中間バッファが必要な構成は描画計画として一貫して決定されます。

### FLOW-001 SANDBOX Flow Gradient module

Flow GradientはSANDBOXから選択・有効化する固定段であり、Main Stackの自由な並べ替え対象には含めません。

### FLOW-002 deterministic velocity-oriented density

FlowはSeedと正規化時刻から決定的に生成したサンプルを、速度方向へ伸ばしたsplatとして低解像度Density FBOへGPU蓄積します。CPU側の近傍探索や隣接線分生成は使用しません。

### FLOW-003 Phase A temporal trail

Phase AはDensity FBOとTrail Ping-Pong FBOを使い、現在密度と前Trailを減衰合成します。Directional Diffusionは含めません。

### FLOW-004 scalar gradient mapping

Flowの密度スカラーは既存Gradient Rampへ入力し、Rampの色・透明度設定で最終合成色を決定します。

### FLOW-005 loop and lifecycle

Loop時のFlow位相は既存Animationの正規化時刻を使い、Seek、設定変更、解像度変更、Export、Thumbnailの境界でTrail履歴をリセットまたは決定的に事前評価します。実時間時計は結果へ使用しません。

### FLOW-006 logical-frame idempotence

同一Render Sessionの同一論理フレームを再描画しても、FlowのDensity生成とTrail更新を重複して進めません。Tileは各領域を同じ論理フレーム規則で評価します。

### FLOW-007 resource and capability fallback

FlowのProgram、FBO、Texture、VAO、Bufferは再利用し、サイズ変更時にだけ再構成します。RGBA8のFramebuffer完整性を確認し、Flowが利用できない場合は既存描画を継続します。

### FLOW-008 3D radial emitter and periodic curl integration

Flowは共通の3Dエミッタ原点から決定的な単位方向へ放射し、粒子ID、Seed、正規化時刻から同じspawn phaseとlifetimeを再評価します。粒子の位置と速度は周期的な3D Curl場を固定ステップで積分して求め、2Dキャンバス座標だけで流線を生成しません。

### FLOW-009 deterministic perspective projection

Flowの3D位置は固定されたview/projection基準で画面全体へ投影します。深度は画面位置、splatの大きさ、Density寄与へ反映し、near/far範囲外とカメラ後方をクリップします。Tileは同じ全画面投影を切り出します。

### FLOW-010 depth-aware density compositing

投影後の速度方向splatはDensity FBOへ加算し、Temporal Trail後に指数型の飽和応答で連続したスカラー場へ再構成します。重なりが多い領域ほどDensityが高くなり、既存Gradient Rampが最終色を決定します。低密度部は粒や元画像の平坦な背景Gradientを主表示にしません。

### FLOW-011 3D render parity

Preview、Thumbnail、静止画、連番、動画、Transition、Tile Renderは同じ3Dエミッタ、Curl積分、固定投影、論理フレーム規則を共有します。同一論理フレームの再描画でTrailを余分に進めません。

### FLOW-012 playback loop continuity

Animationの既存`previewLoop`、`duration`、`fps`、normalized timeをFlowが共有します。Loop有効時は位相0へ戻る際に決定的なreset/prewarmを行い、終端フレームを重複せず再生を継続します。Loop無効時は既存の非ループ挙動に従います。

### LOOP-TIMING-001 位相駆動レイヤーへのLoop Timing適用

Loop Timing（`animation.easing`のBezierとBeat Sync）は自動トラックの時刻変換で、Flow Gradient、Datamosh、3D（Cone）、Textureなど正規化時刻（ループ位相）で動くレイヤーにも同じ変換後の位相を渡します。0と1は固定点で、整数回のループ計算はLoop Timingの有無にかかわらずループ境界で閉じます。Loop Timing無効時は従来と同じ位相です。キーフレーム（Keys）トラックは利用者が置いた時刻どおりに評価し、Loop Timingでは変換しません。PreviewとExportは同じ`renderSceneAtTime`経路でこの位相を使います。

### VIDEO-MOTION-001 Datamosh video motion source

Video Motionは独立したレイヤーではなく、Datamoshレイヤーの`Motion Field`で`Video Motion`を選んだときのmotion sourceとして提供する。動画ファイルはブラウザの`HTMLVideoElement`へ接続し、Datamoshパネルから選択、再生／停止、Field Smoothing、Motion Damping、`Motion Debug`を操作できる。動画を選択するとDatamoshを有効化し、motion sourceを`video`へ切り替える。動画ファイル自体はPresetへ保存しない。別のEffect Stackレイヤーを選択しても、Datamoshパネルと動画source/runtimeは破棄しない。

### VIDEO-MOTION-002 shared motion field source

Video Motionは、低解像度へ縮小した連続フレームの輝度を比較し、近傍パッチの最小SADから方向と強度を推定する。生成結果はRGBA8のmotion field textureとして描画へ渡し、RGに方向、Bに移動量、Aにフレーム変化量を保持する。DatamoshはこのfieldをDATAMOSH-002のmotion field契約へ変換して使う。source境界は将来のcodec motion vector／高品質optical flow実装へ置換可能なfield契約とする。

### VIDEO-MOTION-003 Gradient Rampを維持する合成

旧`Motion Feedback`のGradient Ramp投影は、Datamoshの`Mix Mode`の`Ramp Lock`として提供する。`Ramp Lock`では履歴と現在フレームの合成RGBを、現在のGradient Rampを32点サンプルした中で最も近い色へ投影し、反復合成による中間色・彩度低下を抑える。Video MotionはDatamoshレイヤーとして主スタック内の配置位置で適用する。

### VIDEO-MOTION-004 feedback safety and fallback

動画未選択、動画未再生、field未取得、shader準備中はDatamoshを現在フレームのまま通すか既存描画を使用し、Effect StackとPreviewを停止させない。正規化されたタイムライン時刻を動画durationへ線形マッピングし、PreviewのseekとExportの各フレーム準備に同じruntimeを使用する。動画差し替え、タイムラインの巻き戻し、Export開始時はDatamoshの履歴をリセットする。

### DATAMOSH-001 Datamosh Effect Stack layer

Datamoshは主スタックの通常レイヤーで、配置された位置の前段textureへ前フレームの履歴を重ね、その結果を後段へ出力する。drag、randomize、solo、選択、永続化、render planの対象で、有効状態は`effectPipeline.effectStack`、設定は`datamosh`へ保存する。`datamosh.enabled`はV2ではレイヤーの有効状態と同期し、Legacy V1ではDatamoshの有効状態として使う。設定はDatamoshレイヤーを選択したとき左Postprocessパネルに表示する。有効時はtexture経路で描画し、タイル描画では適用しない。

### DATAMOSH-002 motion field and partitions

motion sourceは`Animation Flow`（既定）、`Procedural`、`Video Motion`、`Pixel Stretch`（DATAMOSH-006）を持つ。`Animation Flow`はDatamoshレイヤーの入力（前段のNoise、Slitなどのアニメーション結果）の前フレームと現在フレームの輝度からLucas–Kanade法で動きを推定し、アニメーションが動いた向きへ履歴を引き伸ばす。推定は3×3の標本点と正則化項で行い、平坦な領域や変化のない入力では動きを0とし、1フレームの推定量はフレームの5%以下に制限する。入力が静止している間は動かない。`Procedural`はfbmの流れ関数のcurlと低周波のdriftから成る時間変化する2chベクトル場で、`Motion Scale`で空間スケール、`Motion Speed`で時間変化速度を変える。motion vectorはマクロブロック中心でブロック範囲を窓として評価し、ブロック内の全画素が同じvectorを共有する。`Block Lock`（0〜1、既定0.6）はブロックのvectorと画素ごと（6px窓）のvectorの混合量で、1ではブロック単位、下げるほど画素がアニメーションの流れに沿って個別に引き伸ばされる。基準の大きさは`Block Size`（1〜128px、1で量子化なし）で、`Block Variance`（0〜1）の確率で隣接ブロックを2倍へ結合、またはx／y／両方向へ最大2段分割し、不規則な大きさ・縦横比のパーティションにする。パーティション配置は6論理フレームごとに変わる。`Neighbor Mix`は隣接ブロックのvectorを混ぜる量で、`Strength`は1フレーム当たりの履歴のずらし量を決める。

### DATAMOSH-003 history feedback, stretch, and refresh

Datamoshは前フレームの自身の出力を履歴として保持し、各画素でmotion vectorだけずらした履歴を予測画像として参照する。ずらし量は画素ごとに履歴の輝度と彩度で変わり、`1 + Luma Stretch × (輝度 − 0.5) × 2 + Saturation Stretch × (彩度 − 0.5) × 2`を0〜4へ制限した倍率を掛ける（Luma Stretch／Saturation Stretchは−2〜2、負の値は明るい／鮮やかな画素ほど短くする）。同じブロック内でも色によって引き伸ばされる長さが変わり、筋状に崩れる。予測画像は`Feedback`の重みで現在フレームと合成し、`Refresh`の割合のマクロブロックだけを毎フレーム現在フレームで置き換える（Intra refresh）。Refreshが小さいほど履歴が残り、Iフレームを失ったような引きずりになる。`Freeze`は履歴の更新を止め、固定した履歴を現在のmotionで参照し続ける。`Mix Mode`は`Mix`、`Lighten`、`Difference`、`Ramp Lock`を持つ。`Color Drift`はR／Bの参照位置をmotion方向へずらす。

### DATAMOSH-004 corruption

`Glitch Threshold`より大きいブロック乱数を持つマクロブロックを破損ブロックとし、`Glitch Amount`の強さでmotion vectorの0化、隣接ブロックvectorの流用、更新の停止、参照ブロック位置のずらしのいずれかを適用する。`Jitter`は全ブロックの参照UVをブロック単位で乱す。破損とRefreshの乱数は論理フレームごとに変わる。

### DATAMOSH-005 history lifecycle and compatibility

履歴は論理フレーム（timeline正規化時刻、shader時刻、video source時は動画fieldの更新回数）が変わったときだけ進む。同じ論理フレームの再描画は同じ履歴から再評価し、停止中のパラメータ編集で崩れを進めない。解像度変更、render session変更、motion source変更、動画reset時は履歴を初期化し、初回フレームは現在フレームをそのまま出力する。旧Presetの`videoMotion`レイヤーは同じ位置・有効状態の`datamosh`レイヤーへ、選択中の`videoMotion`は`datamosh`へ写像する。`datamosh`設定を持たない旧Presetの`videoMotion`設定は、`Video Motion` source、`Ramp Lock`、Block Size 1、Block Lock 1、Block Variance 0、Luma／Saturation Stretch 0、Refresh 0、破損なしのDatamosh設定へ移行する。スタックにレイヤーがない旧Presetで`videoMotion.enabled`が有効な場合はDatamoshレイヤーを有効にする。保存時は`datamosh`だけを書き、`videoMotion`設定は書かない。

### DATAMOSH-006 Pixel Stretch motion source

motion sourceの`Pixel Stretch`は、`Angle`（0〜360°、既定0°。0°は右、90°は上、反時計回り）の向きを基準にしたmotion vector（`Curl`が0の既定では全画素で一定方向、`Curl`を上げると場所ごとに向きが変わる）を使い、大きさは`Procedural`と同じ基準（Strength 1で1フレーム当たりフレーム高さの1.2%）とする。輝度（Rec.709係数）が`Threshold`（0〜1、既定0.6）以上の画素を起点とし、各画素の出力を次の順で決める。

1. 現在フレームの入力が起点なら入力をそのまま出す。伸びた画素は明るい入力の背後を通る。
2. motion vector 1ステップ後ろの履歴（予測画像）がThreshold以上で、かつ後方`Length`（1〜2048px、既定240px）以内に現在入力の起点があれば、その予測画像を出す。これにより明るい画素は論理フレームごとに1ステップずつ伸びる。
3. 自身の履歴がThreshold以上なら履歴をそのまま出す。伸びた画素はFeedbackで薄れず、そのまま描画に残る。
4. それ以外は現在入力と自身の履歴を`Feedback`と`Mix Mode`で合成する。

`Curl`（0〜1、既定0）と`Curl Scale`（0.25〜8、既定1.5）は方向を場所ごとに変える。静的な2オクターブvalue noiseの流れ関数のcurl（発散なし）を単位方向へ正規化し、`Angle`方向との単位ベクトル補間`normalize(mix(Angle方向, curl方向, Curl))`を各位置の伸びる向きとする（打ち消し合って長さ0、またはcurlが0なら`Angle`方向）。Curl 0は全画素で`Angle`の一定方向（従来の描画のまま）、1は`Angle`を使わずcurlのみで、伸びる向きが渦を巻く。起点探索は伸びる向きの場に沿って後方へ辿るため、曲がった筋も起点までつながる。`Curl Scale`は場の空間周波数で、大きいほど渦が細かい。`Curl Loops`（0〜8の整数、既定1）はタイムライン1ループの間に力場が展開して元へ戻る回数で、流れ関数を独立な2つのnoise場A、Bの`cos(φ)A + sin(φ)B`（φ = 2π × Loops × 正規化時間）とするため、強さを保ったまま滑らかに変化し、正規化時間1で開始時と一致して書き出しループが閉じる。0は場が固定される。起点は`Length / 64`px（最小1px）間隔で探し、キャンバス外は起点にならない。`Length Variance`（0〜1、既定0.5）は伸びる向きを横切る`Block Size`幅の帯ごとにLengthを乱数で短くし、この乱数は論理フレームで変わらない。`Luma Stretch`／`Saturation Stretch`は引き込む側（1ステップ後ろ）の色に掛かり、伸びる速さを変える。`Refresh`で選ばれたブロックは現在フレームで作り直されるため残った伸びも消え、Refresh 0では消えない。`Freeze`中は伸びが止まる。破損とJitterは他のsourceと同じく予測画像の参照位置へ作用する。motion sourceを切り替えると履歴を初期化する（DATAMOSH-005）。

### EFFECT-004 DiffuseとImage Gradient Source

Diffuseは主スタック内の一つのレイヤーです。旧来の固定最終段として別に二重適用しません。Image Gradient Sourceが有効なとき、画像本体の形状・アルファを変える `Stretch`、`Distort`、`Mirror`、`Kaleidoscope`、`Voronoi`、`Glass`、`GlassTile` は保護経路の対象外となり、色場の契約を壊さないよう扱われます。手描き`Distort`の編集・描画入力はPostprocessの設定を正規値とし、旧`manualDistort`はPreset移行用の互換値としてのみ扱います。

### EFFECT-005 旧Presetとの互換性

`effectPipeline`を持たない旧PresetはLegacy V1として読み込みます。旧来のPostprocess設定に残る`effectMode: glass`およびstackの`kind: glass`は、読み込み時に`glassV2`へ正規化し、正規化後のPostprocess状態には旧Glassを残しません。旧Presetの`manualDistort`だけに保存されたDistort値はPostprocessへ移行し、Legacy generatorへ二重適用しません。V2の状態を持つPresetでは `effectPipeline` が有効状態と順序の一次情報です。

Diffuseへ追加されたHalftone、ASCII、適応ソース、粒度カーブの値がない旧Presetは既定値で補完します。Slitの旧Presetに残る`autoLoop`、`phaseAnimEnabled`、`phaseSpeed`は読み込み時に無視し、保存済みの`animMode`と`offsetSpeed`だけを使います。旧`slitScan.slitPhase`のPhase Motionキーフレームも破棄しますが、手動設定として保存された静的な`slitPhase`は保持します。

### DISTORT-001 歪みマップテクスチャの浮動小数点化

WebGL2の`manualDistortTexture`は`RGBA32F`（32-bit float RGBA）内部フォーマットを使用し、データ転送には`Float32Array`と`gl.FLOAT`を使用します。これにより、歪みマップの8-bit量子化による階段状の描画段差やブロックノイズを避け、連続した歪み変位を提供します。

### DISTORT-002 歪みマップ転送時の精度維持

CPU側でCatmull-Rom補間した変位値は、0.0〜1.0へ正規化した小数値のまま浮動小数点バッファへ転送します。8-bit整数への丸めは行わず、シェーダー側のサンプリング精度を維持します。

### EFFECT-006 描画失敗からの復旧

描画に必要なプログラムとバッファは、現在の描画計画に必要なものだけを準備します。準備中・失敗・フォールバックの状態はEffect Stack UIへ反映され、失敗した効果があっても保存済みPresetのデータ自体は失われません。再試行や別構成への変更で描画計画を再評価できます。

GPUやブラウザ固有のコンパイル結果・性能を一律に保証する仕様ではありません。復旧可能性は、純粋な描画計画のテストと実機確認を分けて検証します。

### EFFECT-007 Preview、Thumbnail、Export

Preview、Preset thumbnail、静止画・連番・動画のレンダリングは、Glass（GLASS V2）とGlassTileの設定を含む同じ正規化されたEffect Pipelineとシーン評価を共有します。出力形式ごとに別のHue、Saturation、Tint計算を持ちません。外部画像が保存されないPresetのthumbnailは、画像入力なしで安全に生成できるフォールバック状態から作成します。

有効レイヤーが増えるほど描画パスや中間バッファのコストが増えますが、現在は固定FPSや固定レイテンシの数値保証を置きません。性能を変更する場合は、対象構成・解像度・GPU・測定方法を変更仕様へ明記します。

### EFFECT-008 GLASSの決定性

Effect StackのGlassは、同一の入力texture、同一のパラメータ、同一のnormalizedTime、同一のEffect Stack順序に対して、直前の描画履歴やevent loopの状態に依存しないRGBA結果を返します。描画にはGLASS V2専用programを使用し、export中に描画program、fallback方針、render planを変更しません。

### EFFECT-009 Glassの色調整

Glassは、既存の表面形状、屈折、波長依存分散を維持したまま、色収差サンプル密度、色収差成分のHueとSaturation、透過光のTint、ハイライトのTintを個別に調整できます。Chromatic Aberrationは`0..80px`、Chromatic Stepsは`1..3`の整数、Hueは`-180°..180°`、Saturationは`0..200%`、Tintは`#RRGGBB`で保持します。Chromatic Stepsの既定値1では専用GLASS V2の3アンカー経路とfull fallbackの5アンカー経路それぞれの既存出力を維持します。値2..3では各経路の隣接分散アンカー間を等分し、offsetとRGB寄与を補間したサンプルを追加します。最大値3でのサンプル数は専用経路が7、full fallbackが13です。値を上げるほど既存アンカー間の色分散を細かく再構成し、source texture参照が増えます。

Hueの既定値は`0°`、Saturationの既定値は`100%`、両Tintの既定値は`#FFFFFF`です。これらが既定値でChromatic Stepsが1の場合は変更前のGLASS V2のRGBA計算をそのまま使用します。Hue／Saturationは入力Gradient全体ではなく色収差残差だけへ作用し、Tintは透過光とハイライトへ独立して作用します。

### EFFECT-030 Glassの屈折率

Glassは屈折率`glassIor`を`1.0..2.5`、step`0.01`、既定値`1.5`で保持します。旧Presetで値が欠落した場合も`1.5`を使い、従来のGlass設定を維持します。IORは基準波長の屈折率としてCauchy型の波長分散計算へ渡し、Chromatic Aberrationはその分散幅を操作します。IOR`1.0`では空気との屈折率差がなくなり、屈折と屈折由来の色分散は消えます。

GLASS V2の専用経路は各波長の屈折率をSnellの法則によるスクリーン空間サンプル方向へ使い、IOR由来の`F0`をFresnelハイライトへ反映します。既定値`1.5`は既存の屈折方向とエッジの反射応答を維持します。フルshader fallbackは安定した勾配変位へIOR由来の係数を適用し、tile出力のサンプル余白は最大IORの変位範囲を予約します。これは2D入力に対する光学近似であり、体積厚み、環境反射、厚み依存吸収は計算しません。

### EFFECT-031 GlassのOrganic／Ripple表面

GlassのSurface TypeはOrganic、Rippleを選択でき、Organicが既定です。Glassは有機的に変化する表面を対象とし、静的な幾何パターンはGlassTileへ置きます。Rippleはキャンバス中心を基準に同心円状の周期高さ場を作り、各帯の中央が滑らかに盛り上がるレンズ断面を形成します。Frequencyは`0.5..18`、step`0.1`、既定値`6`、Depthは`0..1`、step`0.01`、既定値`0.35`です。Animation SpeedはAnimationループ1周あたりのRipple周期数を`1..8`の整数で指定し、既定値`1`です。整数周期でループ端の表面位相が一致します。

Organicは既存の有機的な高さ場とMotionを使います。RippleはOrganic用Motion値に依存せずAnimationループで周期運動し、Noise Distortion Influenceはどちらの表面にもブレンドできます。両Surfaceの法線は既存のIOR屈折、色分散、Roughness、Fresnel合成へ渡ります。専用Glass V2とfull shader fallbackは同じSurface選択とRipple高さ場を使います。

### EFFECT-027 GlassTileのタイル表面光学

`GlassTile`は`Glass`とは別の主スタックレイヤーとして、KG_Glassで確立したタイル表面モデルを使用します。PatternはSquare、Diamond、Hexagon、Triangle、Brick、Faceted、Edge ModeはClamp、Tile、Mirror、Transparentです。Square／Diamond／Hexagon／Triangle／BrickはTile Size、Bevel、Surface Height、Curvature、Detail Scale、Roughnessを使い、FacetedはFacet Density（`1..16`、step`0.1`、既定値`5`）とFacet Depth（`0..1`、step`0.01`、既定値`0.48`）を使います。各形状のほか、Rotation、Refraction、Dispersion、Mix、Seedを保存し、共通値の既定値はTile Size `12px`、Bevel `18%`、Surface Height `45%`、Curvature `75%`、Refraction `28px`、Dispersion `6%`、Mix `100%`、Edge Mode `Mirror`、Seed `17`です。Patternごとに使わない値はPresetに保持されます。

Facetedは共有頂点を持つ三角格子を高さ補間し、各三角面内は平面、稜線をまたぐと法線が変わる連続表面を作ります。面間に段差やベベル、タイルの継ぎ目、丸いドームは作りません。Triangle Patternはセル単位でベベルとドームを持つため、Facetedとは異なる表面です。Facetedは静的なパターンとしてGlassTileに属し、時間変化するOrganic／Rippleを扱うGlass Surface Typeには含めません。

描画は有限差分で表面法線を求め、RGBを`1 + Dispersion`、`1`、`1 - Dispersion`倍の屈折オフセットでサンプリングしてMixします。Preview、thumbnail、静止画、連番、動画、Tileは同じ専用`glassTile` programと正規化値を共有し、Tile出力では`u_fullResolution`と`u_tileOffset`から得たグローバル画素座標でパターン位相を評価します。必要サンプル余白は`ceil(Refraction * (1 + Dispersion)) + 2`です。Image Gradient保護中はGlassと同様にGlassTileを適用せず、MixまたはRefractionがゼロのときidentityとして扱います。タイル形状ではSurface Heightがゼロ、FacetedではFacet Depthがゼロのときもidentityです。

### EFFECT-028 Postprocess Voronoiのセル内テクスチャ変形

PostprocessのVoronoiは、Euclidean、Manhattan、Chebyshev、Minkowskiの距離計量と、F1、F2、Distance to EdgeのFeatureを選択できます。Minkowski Exponentは0.5から8、既定値2です。選択肢、既定値、値の正規化はNoiseのVoronoiと共有します。

各Voronoiセルは直前のEffect Stack出力テクスチャを入力としてセル内へ再配置します。Gradient Rampを別に重ねず、Feature値はセル内テクスチャの向きと倍率へ使います。Gradient ScaleとEdge Widthによる暗い境界線は描画しません。旧PresetのGradient ScaleとEdge Widthは読込後も保存データに保持しますが、描画には影響しません。

### EFFECT-010 主スタック順序のランダム化

ユーザーがランダム化操作を実行すると、主スタック12種類の順序だけをランダムな順列へ変更します。各レイヤーの有効状態、レイヤー設定、選択中の種類、Prism／Particlesなど固定段の状態は変更しません。ランダム化は描画フレームやexportフレームごとには実行せず、ユーザー操作時に一度だけ実行します。

### EFFECT-011 Altクリックによるソロレイヤー

主スタックのレイヤー行またはオンオフToggleをAltクリックすると、クリックしたレイヤーだけを有効にし、その他の主スタックレイヤーを無効にします。最初のソロ化時に現在の主スタックの有効状態を一時保持し、同じ対象をもう一度Altクリックするとソロ化前へ復元します。ソロ中に別レイヤーをAltクリックした場合は対象だけを切り替えます。ソロ化によって新たに無効化されたレイヤーの状態欄には黄色の`STAY`を表示します。固定段とレイヤー設定値は変更せず、ソロ状態は既存の`enabled`値としてPresetへ保存します。専用の`solo`保存キーは持ちません。

### EFFECT-012 SANDBOX固定段

TOPバーのSANDBOXから、Postprocessの`Edit Layer`と同じ選択要素でNormal、Prism、Particles、Flow Gradientのいずれか一つを選択して編集できます。SANDBOXのモジュール選択は描画順を変更せず、NormalはSurface、Prismは主スタック後、Flow GradientはPrismとParticlesの間、Particlesは最終オーバーレイとして既存のEffect Pipelineへ反映します。SANDBOXの選択状態は保存せず、各モジュールの設定だけをPreset、Preview、Thumbnail、Exportへ引き継ぎます。Flow Gradientの設定はSeed、Particle Count、Curl Scale、Curl Strength、Speed、Ribbon Width、Stretch、Density、Trail、Contrast、Flow Opacity、Particle Opacity、Particle Sizeで構成し、LoopとDurationは既存Animationを参照します。Flow Opacityは最終合成、Particle Opacityは各splatのDensity寄与、Particle Sizeは速度方向Ribbonの投影サイズへ適用します。DiffusionはPhase Aでは提供しません。

### EFFECT-013 Normal Mapの描画互換

Legacy V1とEffect Stack V2のNormal Mapは、同じNormal Mapシェーダー、輝度サンプリング、中心差分、角度回転、反転、`R=右・G=上・B=手前`のRGBAエンコードを使用します。両経路はDiffuseが有効なフレームではNormalを描画せず、Diffuseを法線計算用入力の代替として扱いません。V2の`manualDistort`状態がPostprocessのNormal入力やDistort値を上書きすることはありません。
### EFFECT-015 DiffuseのHalftoneとASCII

DiffuseはBlock、Smooth、Dither、Halftone、ASCII、Stippleの6モードを持ちます。Halftoneは円形または四角形の形状、セルサイズ、形状サイズ、背景色を持ち、入力色の濃度に応じて形状の占有率を変えます。ASCIIは保存された文字セットと背景色を濃度順に割り当て、セルごとに対応文字を描画します。背景色の既定値は`#000000`です。Halftone／ASCIIはフラグメント解像度の色と座標を使い、Ditherだけがセル中心サンプリングを使います。粒度適応時もベースセル単位で代表色とセル内座標を決めるため、円形・四角形の形状を崩しません。Halftone／ASCIIのセルは指定した背景色と不透明アルファを持ち、キャンバスの裏面が透けないようにします。ASCIIアトラスはCanvasの行順を維持してアップロードし、シェーダーはアトラス座標をそのままサンプリングするため、アトラスのrow 0（先頭の文字）がキャンバス上で正しく表示されます。ASCIIは保存されたフォント指定と文字サイズ（px）を持ち、グリフアトラスの生成とグリフセルサイズへ反映されます。通常描画とEffect Stack描画は同じ保存設定を使います。Block、Smooth、Dither、Halftone、ASCIIの契約はStipple追加によって変わりません。

### EFFECT-018 ASCIIのフォントと文字サイズ

ASCII描画モードは、保存されたフォント指定（CSS font-family）、文字サイズ（px、既定29）、回転角（度、既定0）を持ちます。グリフアトラスはフォントと文字サイズで生成され、グリフセルはフォントサイズに応じて拡大します。フォント名はCSSクォートで囲み、`document.fonts.load`でロードしてからアトラスを描画するため、スペースを含むフォント名や未ロードのフォントも実際のグリフへ適用されます。シェーダーはセルフラクションをそのまま使ってアトラスをサンプリングするため、フォントサイズが大きくてもグリフは自分のセルに収まり、隣のセルの文字と混ざりません。回転角はInputAngleで調整し、シェーダーがセル内座標を回転してグリフを回転させます。フォントはInputDropdownで選択し、選択肢にはシステムにインストールされたフォント（Tauriコマンド`list_system_fonts`で列挙）が含まれます。フォント・文字サイズ・回転角はPresetへ保存され、通常描画とEffect Stack描画、Preview、Thumbnail、書き出しで同じ見た目になります。旧Presetにこれらの値がない場合は既定値（`monospace`、29px、0°）で補完されます。

### EFFECT-019 システムフォント列挙

Tauriコマンド`list_system_fonts`は、OSの標準フォントディレクトリ（Windowsは`SystemRoot\Fonts`、`%LOCALAPPDATA%\Microsoft\Windows\Fonts`、`ProgramFiles\Common Files\Adobe\Fonts`、`ProgramFiles\Morisawa`等）からフォントファイル（TTF/OTF/TTC）を再帰スキャンし、Windowsではレジストリ（`HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts`）から正確なフォントファミリー名も取得します。これによりAdobeフォントや森澤フォントなど、ユーザーが個別にインストールしたフォントがフォント選択肢へ含まれます。列挙に失敗した場合は汎用フォント（monospace/serif/sans-serif等）のみを表示します。

### EFFECT-016 Diffuseの適応ソースと粒度

Diffuseの適応ソースは輝度、色相、彩度から選択できます。選択した値を拡散量Bezierの入力として評価し、粒度適応を有効にした場合は独立した粒度Bezierをベースセル単位の代表色へ評価します。セル内座標はベースセル基準で固定され、Halftoneの円形・四角形とASCII文字は自分のセル内に収まるため、フラグメント境界で崩れません。粒度適応はBlock/Smoothの拡散セルサイズ（`diffusePanelDisplacement`とLegacyの拡散グリッド）にも反映され、グレインカーブとアマウントが拡散セルの大きさを変化させます。ドメインワープは等方的に保たれ、セルはアスペクト比を維持したまま拡大します。粒度適応を無効にした場合は固定粒度を使います。

### EFFECT-022 Diffuseの旧方式Stippleモード

Stippleは保存上のモード値`legacy`で表す旧Diffuse互換モードです。色の量子化、背景色、Halftone/ASCII形状、適応量Bezier、粒度Bezier、ドメインワープは適用しません。提示された旧Diffuseパネルの見た目を作った旧`gradient.frag.glsl`と同じ、`max(grain, 0.01)`のセル、seed付きp3ハッシュ、および`mediump`精度を使います。Effect Stack V2は`highp`シェーダーですが、Stippleのセル化とハッシュだけはこの旧Generator精度を明示的に使い、Scatter（px）で直前テクスチャの入力UVを変位します。変位後の入力テクスチャは隣接画素を線形補間せず、変位先の入力画素色を保持します。これにより`Grain=0.23px`のような小数設定では、均一なドメインワープや広い中間色のぼけではなく、旧版と同じ高密度の微粒子格子になります。Seed Per Frameが有効な場合は既存の`diffuse.seed`自動トラックを使用します。

### EFFECT-023 StippleのEffect Stack挿入

Effect Stack V2でDiffuseレイヤーがStippleの場合、レイヤー位置で直前のテクスチャを一度だけ、旧Generator方式の粒子場でサンプリングします。Stippleが唯一の有効レイヤーでもGenerator直結最適化を使わず、テクスチャスタックを確保してこの粒子場を適用します。Direct Generatorは同じ旧Generator方式を使い、Preview、Thumbnail、静止画／連番／動画ExportはEffect Stackと同じ方式および保存済みのScatter、Grain、Seed、Seed Per Frame設定を使います。V2のping-pongバッファとレイヤー順序の契約は変更しません。

### EFFECT-025 Diffuse直後のSlitにおける出力座標評価

Effect Stack V2で有効なDiffuseの直後に有効なSlitがある場合、DiffuseはSlitが生成する出力座標側で一度だけ評価します。これによりSlitの延長領域にもDiffuseのセル表現が反映され、Diffuse済みの画像をSlitが再サンプリングしてセルを縞状に引き延ばすことを避けます。Block／SmoothがAnalytic Prefixの条件を満たす場合でも、この隣接順ではTexture Stack経路を使います。SlitがDiffuseの直後にない場合は、既存のAnalytic Prefix境界と消費範囲を維持します。

### EFFECT-026 Noise→Diffuseの旧Generator UV合成

Effect Stack V2で有効な`Noise`より後ろに有効な`Diffuse`があり、DiffuseがBlockまたはSmoothで適用方式（`diffuse.applyMode`）が`noiseLinked`の場合、NoiseとDiffuseの間に他の有効レイヤーがあるかどうかにかかわらず、Noiseの位置で同じ入力textureからNoiseのUV変換を一度行った後にDiffuseのグローバル座標変位を加え、`I(N(x) + D(x))`として一度だけサンプリングします。これによりDiffuseの変位がNoiseの歪みで増幅・引き伸ばされず、間にレイヤーがない場合と同じかかり方になります。間にあるレイヤーはこの合成結果を入力として処理し、Diffuseの本来の位置では再適用しません。NoiseとDiffuseのglobalCoord、seed、time、subpixel Grain、Scatter、Tile offset、full resolutionは既存の各レイヤー契約に従います。先頭の解析可能なNoiseは、後続のDiffuseを含めて既存Generatorで一度だけ評価します。`Diffuse → Noise`、直後に`Slit`がある`Diffuse`、Dither／Halftone／ASCII／Stippleおよびその他の非対象モードはこの合成を使わず、既存のTexture StackまたはSlit出力座標評価を使います。Preview、Thumbnail、静止画、連番、動画、Tileは同じRender Planを使います。

Block／SmoothのDiffuseは適用方式`diffuse.applyMode`を持ち、値は`noiseLinked`（既定）と`uniform`です。Presetに値がない、または未知の値の場合は`noiseLinked`として扱います。`uniform`はNoiseとの合成を行わず、Diffuseのスタック位置で直前のtextureを`T(x + D(x))`として画面空間で均一に散らします。Noiseより前のレイヤーは粒を変形せず、後ろのレイヤーは粒ごと変形します。NoiseがなくDiffuseだけが先頭にある場合は既存Generatorで評価します。Dither／Halftone／ASCII／Stippleでは適用方式を使いません。

### EFFECT-017 Slitのduration基準ループ

AnimationとSlitが有効な場合、Slitは`animMode`（Loop／PingPong）と`offsetSpeed`だけで連続アニメーションします。`phaseSpeed`および位相モーションの自動トラックは存在せず、旧Presetに残る値は無視します。キャンバス再生と書き出しは、Easing・Animation Speed・Durationを反映した同じ秒ベースのアニメーション時計を使います。Offset Speedが0またはModeが`off`のときはSlitの自動動作を停止します。旧Presetに残る`autoLoop`やTimeline Loopの状態は描画へ影響させません。

Slitのshader位相は、秒ベース時計のduration周期に対して閉じた周期として計算します。Duration周期内のサイクル数は`abs(offsetSpeed) * loopPeriod`に最も近い1以上の整数へ量子化し、Loop／PingPong／Waveの周期関数がduration境界で同じ位相になるようにします。これにより既定の5秒再生でも、5秒時点から0秒時点へ戻る際にスリット位置が不連続になりません。正負のOffset Speedは進行方向を維持し、秒ベースの`slitAnimationTime`自体は変更しません。

### CLOTH-001 SANDBOX 3D 布メッシュ Base Generator

SANDBOX内に Three.js (`ClothGradientRenderer`) を用いた 3D 布状メッシュ描画モジュールを追加する。波打つ頂点変形、変形後法線計算、環境光・スポットライトによる立体陰影処理を適用し、K-GG 既存の Gradient Ramp (`stops`, `opacityStops`, `rampInterpolation` 等) からの色決定結果（Ramp Lookup）を統合してビジュアルを生成する。

ランプ適用の順序は「ライティング・スペキュラー・フレネルから計算した白黒シェーディングの輝度をランプのインデックスとして使う」方式で、ピクセルの色は常に Gradient Ramp から決定される。Ramp 信号は白黒輝度のみで構成され、旧加重合成（`lightWeight` 等）は行わない。スペキュラー色・フレネル色は白黒輝度への加算係数としてのみ使用し、ランプ適用後の色に色相を加算しない。`rampOffset` は白黒輝度への加算として維持し、`rampLow` / `rampHigh` / `shadingMix` は廃止された。

### CLOTH-002 オフスクリーンテクスチャ転送と Effect Stack 完全分離

Three.js の描画は非表示 Offscreen Canvas で行い、そのレンダリング結果を K-GG の WebGLContext 側 `ctx.gradTexture` へ `gl.texSubImage2D` で転送する。画面上に直接別 Canvas を重ねず、既存の全 Effect Stack (Noise, Slit, Stretch, Distort, Mirror, Kaleidoscope, Voronoi, Glass, GlassTile, Diffuse, Normal Map, Prism, Particles) への入力 Base Texture として供給する。

### CLOTH-003 Preset 永続化とエラーフォールバック

Cloth の全パラメータ (Surface Wave, Organic Motion, Lighting, Specular, Fresnel, Ramp, Quality) は Preset 保存スナップショットおよびストアに永続化され、旧 Preset 読み込み時も安全に初期化される。レンダラーの初期化や描画に失敗した場合は黒画面を起こさず既存 Base Gradient に自動フォールバックする。旧 Preset に残る廃止キー（`lightWeight`, `heightWeight`, `fresnelWeight`, `flowWeight`, `rampLow`, `rampHigh`, `shadingMix`）は無視され、残りのパラメータは正規化される。

### SANDBOX-001 SANDBOX パネルモジュールの拡張

SANDBOXのEdit Layerには`Cloth`、`Normal`、`Prism`、`Particles`、`Flow Gradient`、`Seamless`、`Shapes`の7モジュールを表示し、アクティブカウントを`/7`で示します。ConeはSANDBOXから除外し、EFFECT-021のMain StackレイヤーとしてEffect Stackで管理します。モジュールのON/OFF状態およびプログラム状態をUI上に可視化します。

### SHAPES-001 SANDBOX Shapes最終段

Shapesは、SVGの形状を連続した輝度の場に変え、Gradient Rampで着色してCanvasを描き直すSANDBOXの固定段です（サーモグラフィやdepthパスのような見た目）。完成したK-GGの描画（Legacy／V2、Cloth Base、Particles、Seamlessを含む）は、Fillの`render`で輝度として使います。有効状態と設定は`shapes`に保存し、Main Stackの並べ替え対象には含めません。描画は各フレームの`render`完了後に行い、描画面の内容を専用textureへコピーしてから、専用program（`shapes`、GLSL ES 3.00）で同じ描画面へ描き直します。Effect Stackの表示ブレンドではfrom／toの各フレームへ適用してからブレンドします。programは有効時だけ遅延コンパイルし、準備できるまで・失敗した場合はShapesを適用しないフレームを表示します。Export準備は他のprogramと同じく`shapes`のコンパイル完了を待ちます。画素座標はグローバル座標（`gl_FragCoord + tileOffset`）とフル解像度から求めるため、タイル書き出しはフル描画と一致します。Cloth／3D表示面は、Shapes適用後の処理済みCanvasを入力にします。

### SHAPES-002 形状ソースとマスク

形状は`source`で選びます。`circle`、`star`、`text`（「KGG」のアウトライン）はパスデータとして内蔵し、同期的にラスタライズするためPreset、Thumbnail、書き出しで再現されます。`custom`は利用者が読み込んだSVGで、DOMParserで解析し、`script`、`foreignObject`、アニメーション要素、`on*`属性、`opacity`／`fill-opacity`／`stroke-opacity`／`filter`／`mask`を除去し、同じ値を打ち消すスタイルを加えてから画像としてデコードします（スクリプトは実行されず外部資源は読み込まれません）。2 MBを超えるファイル、SVGとして解析できない文書、大きさを測れない文書は拒否します。塗りのある要素は塗り、線のある要素は線として形状になり、色は使いません。viewBoxがない場合はwidth／height、それもない場合は描画範囲を測ります。マスクは内容の長辺の30%を四辺へ余白として加えた範囲（長辺2048px）で作り、アルファだけをmipmap付きtextureとして使います。読み込んだSVGはセッション内だけで保持し、未読込の`custom`は`star`で描画します。

### SHAPES-003 輝度の場とGradient Ramp

形状の短いほうの辺を単位長とし、画素ごとに0..1の輝度を作ってGradient Ramp（右サイドバーの`gradientRampTexture`）で着色します。(1) `softness`：マスクのぼかしでパスの輪郭をなめらかにします。(2) `innerShadow`／`innerShadowSize`：3つのぼかし半径（0.5×、1×、2×）の平均から、縁で0・内側へ連続的に1へ近づく奥行きを作り、`innerShadow`の割合で内部を縁へ向かって暗くします。`shadowOffset`はその奥行きを`lightAngle`と反対側へずらします。(3) `fillSource`：`flow`（ループするドメインワープのノイズ）、`ripple`（奥行きに沿って内側へ進む帯）、`stripes`（`fillAngle`方向へ曲がりながら流れる帯）、`render`（K-GGの描画の輝度）のいずれかで内部の輝度を動かし、`fillAmount`で強さ、`fillScale`で模様の大きさ、`fillWarp`で有機的な歪みを決めます。`fillCycles`（整数）はAnimation 1ループの周期数で、ノイズの標本点を円周上で1周させるため継ぎ目なくループします。(4) `glowRadius`／`glowIntensity`：広くぼかしたアルファを加え、縁で約0.5・内側で上昇・外側で減衰する場とします。(5) 輝度は`0.45×オーラ＋0.55×内部`をソフトニー（0.75以上をなだらかに1へ）で収め、`contrast`（ガンマ）を掛け、`grain`で輝度へノイズを加えてからRampを引きます。背景はRampの左端の色で、`transparentBackground`では形状とオーラ以外を透明にします。配置は`scale`（Canvasへcontainで収める割合）、`offsetX`／`offsetY`（短辺の半分単位、+Yは下）、`rotation`で決めます。ぼかしはmask mipmapを使う25点のリングカーネルで、半径によらず一定コストです。

### SHAPES-004 表示・非表示ループ

`reveal`は`fadeGlow`（既定）、`wipe`、`flicker`、`none`です。Animationの1ループに`revealCycles`回のサイクルを置き、各サイクルは「表示の保持 → 消える（`revealTransition`）→ 非表示（`revealHidden`）→ 現れる（`revealTransition`）」の順で、`revealOffset`で位相をずらします。2回の切替と非表示が1サイクルに収まるよう切替時間を制限します。`fadeGlow`は輝度とオーラの広がりを同時に増減し（消えるとRampの左端の色になる）、`wipe`は`fillAngle`の方向に沿って縁が進み、同じ側から現れて同じ側から消えます。`flicker`は決定的な擬似乱数で点灯時にちらついてから安定し、消灯時は短くちらついて消えます。時刻はLoop Timing適用後のループ位相（Flow／Textureと同じ）を使うため、正規化時刻0と1が一致し、PreviewとExportで同じ結果になります。AnimationがOFFのとき、または`none`のときは常に表示し、AnimationがOFFのときはFillの動きも止めます。サイクルは表示状態から始まるため、時刻0のThumbnailと先頭フレームには形状が表示されます。

### TEXTURE-001 Texture Effect Stackレイヤー

Textureは主スタックの通常レイヤー（`EffectStackKind`の`texture`）で、配置された位置の前段textureへ高さ場でライティングし、その結果を後段へ出力します。drag、randomize、solo、選択、永続化、render planの対象で、有効状態と順序は`effectPipeline.effectStack`、設定は`texture`へ保存します。既定順では最後（`Cone`の後）に置き、既定は無効です。設定はPostprocessの`Edit Layer`で編集します。

専用program（`texture`）はTextureレイヤーが有効な場合だけ遅延コンパイルし、programが準備できるまでは通常のBase描画を維持し、失敗した場合はレイヤーを描画せず残りのstackを継続します。ON時は直接描画を使わずtexture pathを使います。Effect Stack V2だけで動作し、Legacy V1では適用しません。Image Gradient Sourceの保護中も、画像を再サンプルしないためTextureレイヤーは適用します。画素の座標はグローバル座標から求めるため、タイル書き出しでもフル描画と同じ結果になります。

### TEXTURE-002 高さ場・異方性反射・回折

Textureは高さ場から法線を求め、点光源の下でWard異方性反射を計算します。高さ場は`source`で選びます。`procedural`は`brushedMetal`（グレインに沿った細い傷）、`spunMetal`（中心を基準にした同心の旋盤目）、`cdGroove`（1本のらせん溝）、`paper`（繊維と低周波のむら）で、`image`は読み込んだ画像の輝度です。画像は`cover`（Canvasへ中央基準で合わせる）または`tile`（`scale`回反復）で配置し、画像が未読込のときは選択中の手続き型プリセットで描画します。

反射は`roughness`、`anisotropy`（グレインに沿う方向を滑らか、直交方向を粗くする）、`metallic`（ハイライトを元の色で着色する割合）、`specular`で決まります。グレインの向きは`rotation`で指定し、`spunMetal`と`cdGroove`は中心（`centerX`／`centerY`）まわりの接線方向です。`diffraction`は溝直交方向のライト成分から虹色を求めて加算し、`diffractionSpread`が色相の変化幅です。`strength`は結果と元画像の混合率で、`bump`が負の値は高さを反転します。

ライトは`lightAngle`（キャンバス中心まわりの角度）と`lightHeight`で決まります。`lightSweep`は整数の回転数で、Animationの1ループでライトがキャンバス中心を回る回数です。時刻はscene evaluationの正規化時刻を使うため、整数値ではループ境界が一致します。プリセットを選ぶと`TEXTURE_PRESET_LOOKS`の見た目値を`enabled`／`source`／`imageFit`／グレイン配置を保ったまま適用します。

### TEXTURE-003 Texture設定の保存と外部画像

Textureの設定は`texture`としてPreset、履歴（undo／redo）、storeへ保存し、旧Presetで欠落している場合は無効の既定値へ補完します。すべての数値と列挙は正規化時に範囲へ収め、未知の列挙値は既定値へ戻します。読み込んだ画像は外部入力としてセッション内だけで保持し、Preset、Thumbnail、書き出し用の設定JSONへ含めません。Thumbnailは画像を使わず選択中の手続き型プリセットで描画します。

### EFFECT-020 Cloth表示アダプター

Cloth表示はEffect Stackの新しい段階ではなく、処理済みCanvasを受け取る後段の表示アダプターです。Effect Stackの有効状態、順序、処理結果はCanvas表示とCloth表示で共通です。3D表示の入力ではCloth Baseを二重適用せず、CanvasTextureをクロスのUVへ割り当てた後に表面変形・ライティングを一度だけ行います。

Cloth表示面はSANDBOXのClothモジュールON/OFFで切り替えます。Coneは次のEFFECT-021で定義するMain StackレイヤーのON/OFFと順序に従って通常のCanvas出力へ合成されます。Preview右側に別のPreview Surface設定を追加しません。

### EFFECT-021 Cone Effect Stackレイヤー

Coneは通常の`EffectStackKind`であり、順序・有効状態は`effectPipeline.effectStack`に保存します。Effect Stackで選択、toggle、drag、randomize、soloでき、SANDBOX Edit Layerからは除外します。描画では直前のMain Stack textureを`stackCore`のCone GPU passへ渡し、画素レイとCone面の交差から円周U・高さVを求め、前段textureをそのUVへサンプルします。Gradient RampをCone用色源として再サンプルせず、前段の色場を保持します。投影結果は通常のping-pong targetへ書き込み、次のレイヤーが同じ描画結果を入力として使用します。Depth、Apex、Rotation、Texture Repeat、Flow／Direct Projection、Seam Blend、Mirror Repeat／Edge Weld／Gradient Reapplyの既存設定と、Gradient ReapplyのRGB補正・中心alpha保持を維持します。設定はConeレイヤーを選択したとき左Postprocessパネルに表示し、ApexはCanvas上の既存ハンドルで編集します。PreviewとExportは同じWebGL stack passとrender planを使用します。旧形式でConeレイヤーがないeffectStackは、追加されるConeレイヤーを無効状態に正規化します。

K-GG control APIのEffectState一覧はConeを返し、enable／reorder／resetとscenario commandで同じレイヤー状態を操作できます。

3Dレイヤーは共通のstack programではなく、3Dレイヤーが有効な場合だけ遅延コンパイルする専用programで描画します。専用programは形状（`coneView.shape`）ごとに1つ（`threeDCone`、`threeDTorus`、`threeDLattice`、`threeDTerrain`、`threeDRibbon`、`threeDRings`、`threeDField`、`threeDDiscs`、`threeDCrystal`、`threeDAbstract`）で、同じ`three-d.frag.glsl`を`KGG_THREE_D_SHAPE`で特殊化し、現在の形状とカメラ・マッピングなど共通部分だけをコンパイルします。全形状を1つのprogramに入れるとレイマーチ部の合計が大きくコンパイルが遅いためです。形状を切り替えると、その形状のprogramを初回だけコンパイルし、以後は再利用します。Effect Stackの他のlazy programと同様に、コンパイルは直列キューで行い、編集中の形状を有効行のhover prefetchの対象にします。専用programが失敗した場合はレイヤーを描画せず、残りのstackを継続します。Cone以外の形状は共通の段で描画します。各形状は交点・法線・任意の表面UVを返し、`surfaceMapping`（`uv`既定、`triplanar`、`matcap`、未知の値は`uv`）で色を決め、`shade`（0〜1、0で照明なし）でカメラ左上からの光を混ぜ、`fog`（0〜1）で距離に応じて黒へ減衰させます。`uv`は表面UVを持たない形状では`triplanar`になります。`matcap`はカメラ基準の法線でキャンバスを引きます。Camera Roll／Yaw／Pitch／Position／WiggleはCone以外の全形状に共通で、各形状の基準カメラに対して適用します。Coneは解析的な交差、UV、照明なしの描画を維持し、Surface Mapping・Shade・Fogを使いません。Coneのカメラは`coneCameraMode`（`classic`既定、`free`、未知の値は`classic`）で選びます。`classic`は従来の固定カメラで、Camera設定を一切使わず、UIにCameraセクションを表示しません。`free`はCamera設定のうちProjection、FOV、Lens Distortion、Fisheye Angle、Dolly、Yaw、Pitch、Position、Wiggleを使い、RotationはCamera Rollではなくtexture offsetのままとします（Wiggleのロールだけをカメラへ適用し、UIにCamera Rollを表示しません）。

`coneView.shape`の`lattice`は、周期`latticeScale`（0.5〜8）、壁の厚み`latticeThickness`（0.02〜0.9、場の値の単位）の三重周期極小曲面（`latticeType`: `gyroid`既定／`schwarzP`）を壁にした格子の中を描画します。カメラはx軸方向のまっすぐな通路（Gyroidは`(x, P/4, 0)`、Schwarz Pは`(x, 0, 0)`で、壁に触れない）を進み、Flowでは`normalizedTime * flowCycles`周期だけ前進するため、整数のFlow Cyclesでループ境界の視界が一致します。表面UVを持たないため`uv`ではTriplanarで貼ります。未知の`latticeType`は`gyroid`として扱います。`lattice`、`terrain`、`ribbon`、`rings`、`field`、`discs`、`crystal`ではFlowをtexture offsetではなく幾何の移動（`crystal`では背景の移動）に使い、texture offsetは0とします。

全形状は`projection`（`perspective`既定、`fisheye`、`equirect`、未知の値は`perspective`）でカメラの投影を選びます。`perspective`は垂直画角`cameraFov`、`fisheye`は短辺に内接する円へ等距離射影した180°のドームマスター（中心が視線方向、円外は黒）、`equirect`は横方向に経度360°・縦方向に緯度180°を割り当てた全天球パノラマです。投影はCamera Roll／Yaw／Pitchより前に求め、同じカメラの向きを適用します。

`terrain`はキャンバスの輝度に`terrainHeight`（0〜2）を掛けた高さ場を、`4 / textureRepeat`ごとに繰り返す地面として描画します。高さはSeam ModeがMirror RepeatならMirror Repeatの色と同じ補間、それ以外はfractで折り返した1回のtexture参照で求めます。カメラは高さ`terrainAltitude`（0.1〜3）で水平から下向きの基準方向へ進み、Flowで`normalizedTime * flowCycles`タイル前進するため、整数のFlow Cyclesでループ境界の視界が一致します。交点は高さの差に比例した歩幅で探索し、下へ抜けた区間を二分法で詰めます。表面UVは地面座標から両軸にTexture Repeatを掛けた値です。

`ribbon`（UI表示`Ribbons · Growing bands`）は、カメラが進む-z方向の軸のまわりに`ribbonCount`（1〜12の整数、既定6）本の平らな帯（半幅`ribbonWidth`（0.05〜0.6、既定0.15）、厚み0.024）を、軸から`ribbonRadius`（0.2〜2、既定0.7）の距離へ等角度で並べた形状です。帯の中心線は軸のまわりを`ribbonLength`（4〜64、既定16）当たり`ribbonTwist`（-8〜8の整数、既定1）回転のらせんを描き、各帯の断面は中心線のまわりを`ribbonLength`当たり`ribbonHalfTwists`（0〜12の整数、既定1）半回転します。`spin`（-8〜8の整数）は帯全体を軸のまわりへループ当たり整数回転させます。各帯はカメラの進行位置から前方6の位置を最遠とする先端で終わり、先端は帯ごとの固定の乱数と`ribbonStagger`（0〜1、既定0.5）で最大85%カメラ側へ寄せてばらけさせ、先端から1.5の範囲で幅を0から細く絞ります。先端はカメラの進行位置に対して固定なので、帯が前方へ伸び続け、それをカメラが追いかける見た目になります。帯はカメラ後方へは途切れずに続きます。表面UVは帯に沿って`ribbonLength`当たり`ringRepeat`タイル（帯ごとに固定の乱数でずらす）、幅方向に0〜1です。Triplanarは`ribbonLength`当たり1タイルで世界座標に固定します。Flowではtextureを動かさず、カメラが`normalizedTime * flowCycles * laps`個の`ribbonLength`ぶん進みます。`laps`は`ribbonHalfTwists`が奇数なら2（`ribbonLength`ごとに帯の幅方向が反転するため）、それ以外は1です。らせん・帯の回転・textureはそれぞれ整数回転・整数半回転の組・整数タイルで閉じ、先端はカメラに対して固定なので、整数のFlow Cyclesでループ境界の視界が一致します。精度を保つため、形状はカメラの進行位置からの相対座標で評価し、進行量の整数周期分を位相から取り除きます。`cameraX`／`cameraY`はカメラを軸から`max(ribbonRadius, 0.2)`単位で外し、`cameraDolly`は3を1として視線方向へ移動します。光線は距離60で打ち切り、距離36〜60で黒へフェードします。

`discs`（UI表示`Discs · Slit rings in 3D`）は、Slitの`circle`を立体にした形状です。キャンバスを縦の半分を1、横の半分を縦横比とする平面に置き、半対角線`hypot(aspect, 1)`までを`discsCount`（2〜48の整数、既定12）本の同心円リングに等幅で分けます。各リングは内外の端から幅の`discsGap`（0〜0.9、既定0.2）の半分ずつ削った円環（最内のリングは中心まで埋めた円盤）で、`discsForm`が`discs`（未知の値は既定の`rings`）の場合は全てのリングを外径までの円盤にします（下記の積み重ね）。厚み`discsThickness`（0.01〜0.5、既定0.06）の板として前面`z = 0`から奥へ伸びます。前面と側面はリングの局所座標の位置にあるキャンバスの色を、リングの回転に合わせて回して表示し、側面は55%の明るさにします。色は形状側で決めるため、Surface UVではSeam ModeとTexture Repeatを使いません。リング`k`の位相を`discsWaves`（0〜4、既定1）` * k / count + discsScatter`（0〜1、既定0）` * hash(k)`とします。`travel`は`normalizedTime * flowCycles`で、整数のFlow Cyclesで波が整数周期進みます。`rings`では各リングの中心を軸方向へ`discsSpread`（0〜2、既定0.5）` * sin(2π(位相 - travel))`だけ動かし、`discsTilt`（0〜75°、既定12°）だけ傾けます。傾きの軸の向き`2π(discsTiltTurns * normalizedTime + 位相)`はループ当たり`discsTiltTurns`（-4〜4の整数、既定1）回転します。`discs`では円盤同士が交差しないよう、全円盤が共通の傾き（軸の向き`2π * discsTiltTurns * normalizedTime`）を持つ1本の軸上に、最も小さい円盤を手前にして積み重ねます。円盤`k`の前面から次の円盤の前面までの間隔は`discsThickness + 0.004 + 4 * discsSpread / count * (0.5 + 0.5 * sin(2π(位相 - travel)))`で、厚みより狭くならないため重なりません。積み重ね全体の中心を原点に置き、波は円盤の間隔を開閉しながら積み重ねの中を進みます。回転角は`discsSpinPattern`（`together`／`alternate`／`stagger`既定、未知の値は`stagger`）と`discsSpin`（-8〜8の整数、既定1）で決めます。`together`は`2π * discsSpin * normalizedTime`、`alternate`は奇数番目のリングだけ逆向き、`stagger`は進み`normalizedTime * |discsSpin| - 0.5 * k / count`の整数部と小数部の3次イーズを足した段階回転で、中心から外側へ半ステップずつ遅れて動きます。これに`discsTwist`（-45〜45°）` * k`と`discsOffset`（0〜1、既定0.3）` * π * (hash(k) * 2 - 1)`の固定角を加えます。回転・傾き・Orbitは整数回転で閉じ、ループ境界で一致します。カメラは常に原点を注視し、リングの軸から`discsView`（0〜85°、既定35°）だけ下側へ傾いた位置から、原点を通る縦軸のまわりを`discsOrbit`（-4〜4の整数、既定1）回/ループ公転して側面・背面へ回り込みます。上方向は縦軸に保ちます。距離は基準画角`cameraFov`でキャンバスの縦の半分を収める`1 / tan(cameraFov / 2)`を基準に、`1 + (max(1.5 * hypot(aspect, 1), 1) - 1) * sqrt(s)`倍します。`s`は公転しない場合`sin(discsView)`、公転する場合は側面を通るため1とし、公転中に距離が変わらないようにします。`cameraX`／`cameraY`は外側の半径の半分を1として動かし、`cameraDolly`はこの距離を1として視線方向へ動かします。光線は各リングの外接球で枝刈りしてから円環板と解析的に交差し、最も近い交点を使います。`rings`で`discsView`・`discsOrbit`・`discsSpread`・`discsTilt`・`discsSpin`・`discsOffset`が0で他のカメラ設定が既定の場合、前面はキャンバスと同じ構図で映ります。

`crystal`（UI表示`Crystals · Refraction`）は、カメラと背後のキャンバスの間をクリスタルで埋め尽くし、キャンバスを屈折させる形状です。各クリスタルは局所座標の+Y軸を長軸とする凸多面体で、横方向の半径`r`と長軸方向の半長`h = r * crystalLength`（`crystalLength` 1〜5、既定2.6）で大きさを決めます。`crystalForm`は`quartz`（既定。外接半径`r`の正六角柱の両端に高さ`min(h, r)`の六角錐を付けた水晶柱）、`bipyramid`（六角錐の高さが`h`で柱のない双角錐）、`prism`（外接半径`r`の正三角形を断面とし、両端が平らな三角柱）、`octahedron`（`|x| / r + |y| / h + |z| / r ≤ 1`の八面体）、`rhombohedron`（法線`(tan50° cos θ, 1, tan50° sin θ)`、`θ = 0°, 120°, 240°`の3組の平行な面を`(r, h, r)`倍した方解石型の菱面体）、`dodecahedron`（`|x| + |y| ≤ 1`、`|y| + |z| ≤ 1`、`|x| + |z| ≤ 1`を`(r, h, r)`倍したざくろ石型の菱形十二面体）、`mix`（クリスタルごとに6種類から等確率で選ぶ）で、未知の値は`quartz`として扱います。面の定義はCPU側の`getCrystalFaces`とshaderの`crystalSpan`で同じです。配置は`crystalSeed`（0〜99の整数、既定0）を種とする決定的な乱数で求め、`crystalCount`（1〜24の整数、既定12）個のクリスタルに`r = 0.5 * crystalSize`（0.3〜2、既定1.2）` * (0.6〜1の乱数)`、形、ランダムな向き、長軸まわりの転がりの倍率（±1または±2）を与えます。CPU側は面から頂点を求め、外接球の半径、長軸からの最大距離（`reach`）、長軸方向の範囲を得ます。

クリスタルは、基準カメラのどの視線も必ずいずれかのクリスタルに当たるように配置します。カメラ距離を`D = 1 / tan(cameraFov / 2)`とし、カメラから距離1の像面で覆う範囲を、`crystalRevolve`が0なら画面を1.05倍した長方形（aspectは0.25〜4に制限）、0でなければ画面の半対角線の1.05倍を半径`R`とする円とします。各クリスタルの方向`(x, y)`は、長方形では`rows = round(sqrt(count / aspect))`行・`ceil(count / rows)`列の格子の各マスの中央60%の範囲に乱数で置き、円では黄金角ずつ回る点を乱数でずらしたヒマワリ状の配置（中心からの距離`R * sqrt((i + 乱数) / count)`）にします。中心は方向`(x, y, -1)`に沿ってカメラから距離`L`の位置に置き、長軸はランダムな向きを視線方向に垂直な面へ射影した向きとします。Spinはクリスタルを自身の長軸まわりにループ当たり`転がりの倍率 * crystalSpin`（-8〜8の整数、既定1）回転がすだけなので、長軸は常に視線方向に垂直で、クリスタルがカメラ側へ張り出す距離は`reach`以下です。長軸上の9点（長軸方向の範囲の±85%に等間隔）を中心とし、半径をその点から最も近い面までの距離とする球は、転がりによらず常にクリスタルの内部にあり、像面で中心の投影から半径`ρ / 距離`以上の円を覆います。`L`の初期値は`r * (2 + 3 * min(crystalSpread, 2) * 乱数)`（`crystalSpread` 0.2〜2、既定1。UI表示`Field Depth`）で、範囲より1目盛り外まで広げた格子（範囲の長い辺または直径を64等分）の点のうち、どのクリスタルの球にも格子の対角線の半分の余裕を持って覆われない点がある間、その点に最も近いクリスタルを10%ずつ近づけます。ただしカメラから`1.15 * reach`より近づけません。これで覆えない場合は、方向の間の最大の隙間（円上で同じ格子で測り、格子の対角線の半分を足して1.05倍した値）`g`に対して、全クリスタルの`L`を`ρ0 / g`以下（`ρ0`は中心から最も近い面までの距離）にして必ず覆い、このときはカメラがクリスタルの内部に入ることがあります。クリスタル同士は交差してよく、`crystalRevolve`（-4〜4の整数、既定0）は配置全体をループ当たりその回数だけ視線軸（z軸）まわりに回すため、円を覆う配置はループ中も画面全体を覆います。いずれも整数回転なのでループ境界で一致します。Camera Position、Dolly、Yaw、Pitch、画角のWiggleで基準カメラから動かした場合、覆う範囲の外が見えることがあります。配置は配置に関わる設定（Revolveが0かどうかを含む）と縦横比が変わったときだけCPU側で求め直し、姿勢は毎フレーム求めて、長さ24のuniform配列（中心と外接球の半径、回転、`r`・`h`・六角錐の高さ・形の番号）でshaderへ渡します。

`crystal`のカメラは+Z軸上の距離`D`から原点を注視します。キャンバスはクリスタルが届く最も奥の位置から`crystalBackdrop`（0.1〜4、既定1）だけ後ろのz平面に置き、基準カメラから見て画面全体を覆う大きさ（縦の半分が`(D - 背景面のz) * tan(cameraFov / 2)`。画角のWiggleでは変わらない）にして`textureRepeat`倍で繰り返し、キャンバスの外は鏡像で折り返します。Seam ModeとSeam Blendは背景に使いません。Flowでは`travel = normalizedTime * flowCycles`として背景を`2 * fract(travel)`キャンバス分上へずらすため、整数のFlow Cyclesでループ境界が一致します（Direct Projectionでは0）。カメラ側へ向かう光線は背景面を鏡像にした面を見るものとし、方向のz成分の絶対値を0.12以上として扱うため、どの方向にも黒い領域はできません。

`crystal`の各クリスタルは、重なっている部分でもそれぞれ独立したガラスとして扱います。光線は各クリスタルを外接球と、長軸まわりの円柱（半径は長軸からの最大距離、六角柱系は外接半径。長さは`±h`）で枝刈りしてから、形ごとの面（平行な対面の組はまとめて）と解析的に交差し、いずれかのクリスタルの面を横切るたびに、そのクリスタルへ入る面では空気からガラスへ、出る面ではガラスから空気へ、屈折率`crystalIor`（1〜2.4、既定1.6）のSnellの法則に従って屈折します。そのため、画面上で重なったクリスタルの奥の面でも屈折が重なります。重なりのないクリスタルでは通常のガラスと同じです。出る面で全反射になる場合は内部で反射し、2回反射した後は全反射になる面をそのままの向きで通過させます。光線は面の通過と反射を合わせて最大5回まで追跡してから背景を参照します。カメラがクリスタルの内部にある場合も、光線はカメラの位置から同じ規則で追跡します。`crystalDispersion`（0〜0.3、既定0.08）が0より大きい場合は`crystalDispersionSteps`（1〜10の整数、既定3。Dispersionが0の場合は1として扱う）個の波長を`crystalIor ± crystalDispersion / 2`の範囲（屈折率は1以上）に等間隔で並べます。追跡は範囲の両端と中央の3回だけ行い（カメラから最初の面までは波長によらないため1回だけ求めて共有し）、各波長の背景位置はその3点を通る2次曲線で補間して読み、赤・緑・青の重みが重なり合う分光の重み（中心0.15、0.5、0.85、幅0.25のガウス関数）でチャンネルごとに正規化して合成します。Stepsを増やしても追跡の回数は増えません。Stepsが1の場合は中央の1回だけを追跡します。カメラがどのクリスタルの内部にもない場合、最初に入る面ではSchlick近似のFresnel係数の3倍に`crystalReflection`（0〜1、既定0.35）を掛けた割合（最大1）で、反射方向の環境を混ぜます。環境はキャンバスを周囲に巻いたもので、反射方向の経度`atan(x, z)`を横方向に2周（鏡像で折り返して継ぎ目を連続させる）、緯度`asin(y)`を縦方向に割り当てます。さらに、カメラ左上からの光の方向と反射方向の内積の48乗に`0.9 * crystalReflection`を掛けた白いハイライトを加えます。`shade`は最初に横切る面（カメラ側を向けた法線）にカメラ左上からの光を掛けます。`crystalMaterial`（`refract`既定、`faces`、未知の値は`refract`）が`faces`の場合は、最初に横切る面に共通の`surfaceMapping`でキャンバスを貼り、`crystalFaceOpacity`（0〜1、既定1）の割合で屈折の色に重ねます（1では屈折を追跡しません。追跡回数をuniformから決まるループで回し、分岐の平坦化で追跡が常に実行されないようにします）。Surface UVは面の横方向を`r`、長軸方向をクリスタルの全長`2h`で1とする面ごとの平面座標（長軸に垂直な面では横方向をx軸とする）をTexture Repeat倍し、Flowで`fract(travel)`だけずらします。面の色にはSeam Modeと`shade`を共通の段で適用します。`refract`では`surfaceMapping`を使わず、UIにSurface Mappingを表示しません。`cameraX`／`cameraY`はキャンバスの半対角線の半分を1として動かし、Fogの距離係数は0.3、距離はクリスタルに当たる光線ではカメラから最初の面まで、当たらない光線では背景面までです。

`abstract`（UI表示`Abstract · Organic glass`）は、形・素材・光を鑑賞するAbstract CGのための形状で、原点に有機的な彫刻を1つ置き、その後ろの背景面にキャンバスを置きます。彫刻は符号付き距離場で表し、球面追跡で交差を求めます。基準の半径を`R = 0.6 * abstractSize`（0.3〜1.6、既定1。キャンバスの縦の半分を1とする単位）とし、`abstractForm`（`blob`既定、`metaball`、`torus`、`cellular`、未知の値は`blob`）で形を選びます。`blob`は半径`R`の球、`metaball`は`abstractCount`（2〜8の整数、既定5。Metaball以外では使わない）個の球（半径`0.5 * R * cbrt(5 / 個数) * (0.8〜1.2の乱数)`）を幅`0.4 * R`の多項式smooth minで溶け合わせた形、`torus`はカメラに正対する半径`0.72 * R`のリングに、管の半径`0.34 * R * (1 + 0.3 * sin(3θ + 位相))`（θはリングまわりの角度）の管を付けた形、`cellular`は半径`R`の球のうち、周波数`5 * abstractFrequency / R`のジャイロイド`sin x cos y + sin y cos z + sin z cos x`が0.35以下の側だけを残した、内部をトンネルが通り表面に穴が開くスポンジ状の形です。各形からノイズ`abstractDisplace`（0〜1、既定0.45）` * 0.4 * R`倍の変位を引きます。ノイズは`abstractSeed`（0〜99の整数、既定0）を種とするランダムな方向と位相を持つ4つのSin波（周波数は`abstractFrequency`（0.5〜4、既定1.4）` / R`の1、1.9、3.1、4.7倍、振幅0.5、0.5、0.3、0.2）の和を1.5で割ったもので、2〜4番目の波の位相に1番目の波の値の1.3、0.9、-1.1倍を加えて渦を巻くようにします。形とノイズは、Spinで回した彫刻の座標系で縦軸まわりに高さ`y`に比例して`abstractTwist`（-360〜360°、既定30°。半径`R`ぶんの高さあたりの角度）だけねじってから評価します。球面追跡は、変位とねじれを含む距離場の勾配の上限（Lipschitz定数）の逆数（0.2〜1）を各ステップに掛け、1区間あたり最大96ステップ、距離0.0015以内を交点とし、外接球（ループ全体で彫刻を含む半径）の外では追跡しません。法線は正四面体の4点で求めた勾配です。

`abstract`の動きは、`abstractMorph`（-4〜4の整数、既定1）からループ当たりの位相`2π * fract(abstractMorph * normalizedTime)`を求めて、各Sin波の位相にその1、-1、2、-2倍を加え、Metaballの各球を縦を0.8倍に平らにした半径`0.62 * R`の軌道上で各軸ごとに±1または±2倍の速さで動かし、Torusの管のふくらみを回します。`abstractPulse`（0〜1、既定0.3）は大きさを`1 + 0.25 * abstractPulse * sin(位相)`倍にします。Metaballの球は毎フレーム全球の中心の平均が原点になるようにずらすため、群れは画面の中央にとどまったまま離れたり溶け合ったりします。`abstractSpin`（-4〜4の整数、既定1）は彫刻をループ当たりその回数だけ縦軸（y軸）まわりに回します。`abstractElevation`（-90〜90°、既定0）は、Spinで回した彫刻をさらに横軸（x軸）まわりにその角度だけ上端がカメラ側へ来る向きに傾け、彫刻を上（正）や下（負）から見せます。90°では真上から見下ろします。`abstractTumble`（-4〜4の整数、既定0）はこの傾きにループ当たりその回数の1回転を加え、視点が上から下へ回り込みます。カメラ、ライト、背景のキャンバスは動かさず、カメラから見て同じ位置に残ります。いずれも整数周期なのでループ境界で一致し、Morphが0の場合は形が静止します。外接球の半径はPulseの最大値、Metaballの軌道（ループを96等分した位置で測り5%の余裕を持たせる）、変位の振幅から求め、ループ中は変えません。

`abstract`のカメラは`abstractView`（`outside`既定、`inside`、未知の値は`outside`）で置き場所を選びます。`outside`は+Z軸上の距離`D = 1 / tan(cameraFov / 2)`から原点を注視し、Camera Position、Dolly、Yaw、Pitch、Roll、WiggleはCrystalsと同じ規則で適用します。`inside`は基準カメラを彫刻の中心（原点）に置いて-Z方向を向け、Camera Positionは外接球の半径を1、Dollyも外接球の半径を単位として中心から動かし、Yaw、Pitch、Roll、Wiggleは同じ規則で適用します。どちらでも、カメラが彫刻の内部にあるかは最初の追跡で距離場の符号から判定し、内部にある場合は最初の面を彫刻から出る面として扱います。キャンバスは外接球の奥端から`abstractBackdrop`（0.1〜4、既定1）だけ後ろのz平面に置き、基準カメラから見て画面全体を覆う大きさ（縦の半分が`(カメラのz - 背景面のz) * tan(cameraFov / 2)`。`outside`ではカメラのzが`D`、`inside`では0）にし、`textureRepeat`倍で繰り返して外は鏡像で折り返し、Flowで`2 * fract(travel)`キャンバス分上へずらす点もCrystalsと同じです（Seam Modeは使いません）。彫刻に当たらない光線は背景面のキャンバスに`abstractBackground`（0〜1、既定0.25）を掛けた色になり、彫刻を通った光線や反射が参照するキャンバスは元の明るさのままです。

`abstract`の`abstractMaterial`（`glass`既定、`chrome`、`surface`、未知の値は`glass`）が`glass`の場合、光線は最初に当たった面（カメラが内部にある場合は出る面）から、屈折率`abstractIor`（1〜2.4、既定1.45）のSnellの法則で入る面では空気からガラスへ、出る面ではガラスから空気へ屈折し、出る面で全反射になる場合は内部で反射します。彫刻の外へ出た光線が再び彫刻に入る場合も追跡し、面の通過と反射を合わせて最大5回まで追跡してから、最後の点と向きから背景面のキャンバスを参照します。内部の追跡が交点を見つけられない場合は、その点からそのままの向きで背景を参照します。`abstractDispersion`（0〜0.3、既定0.12）が0より大きい場合は、追跡した面の位置を共有したまま、屈折率`abstractIor ± abstractDispersion / 2`（1以上）でも同じ面で光線を曲げ（中央の屈折率で反射した面は反射のまま、他の屈折率で全反射になる面はそのままの向きで通過）、3点の背景位置を通る2次曲線上に`abstractDispersionSteps`（1〜10の整数、既定6。Dispersionが0の場合は1）個の波長を並べて、Crystalsと同じ分光の重みで合成します。面の位置を共有するため、球面追跡は波長の数によらず1回です。`chrome`は反射方向の環境だけを映し、屈折を追跡しません。`surface`は最初の面に共通の`surfaceMapping`でキャンバスを貼ります（UVを持たないため、Surface UVはTriplanarになります。Triplanarの縮尺は1）。

`abstract`の全素材で、最初の面の反射方向の環境（Crystalsと同じく、キャンバスを経度方向に2周、鏡像で折り返して周囲に巻いたもの）を使います。`glass`と`surface`はSchlick近似のFresnel係数（`glass`では`abstractIor`、他の素材では屈折率1.5から求める）の3倍に`abstractReflection`（0〜1、既定0.6）を掛けた割合（最大1）で環境を混ぜ、`chrome`は環境に`0.75`〜`1`（Fresnel係数で補間）を掛けた色とし、Reflectionを使いません。`abstractThinFilm`（0〜1、既定0.4）は反射を薄膜干渉の色で染めます。屈折率1.33、厚さ`abstractFilmThickness`（100〜1200 nm、既定420）` * (1 + 0.6 * ノイズ)`（ノイズは彫刻の座標を0.7倍して評価）の膜について、光路差`2 * 1.33 * 厚さ * cos(膜内の角度)`から波長650、532、450 nmの`1 - cos(2π * 光路差 / 波長)`（平均1）を求め、`abstractThinFilm`の割合で白と補間して反射と下記のライトに掛けます。`abstractLights`（0〜1、既定0.7。UI表示`Light Cards`）は、反射方向（+Zがカメラ側）の方位角`|atan(x, z)|`が0.96 rad付近の縦長の2本、2.5 rad付近の0.6倍のリム用の2本（いずれも`|y|`が0.55〜0.7で消える）と、`y`が0.78〜0.86以上で`|x|`が0.3〜0.42以内の0.7倍のソフトボックスを光源とし、`1.6 * abstractLights`倍の明るさに、`glass`と`surface`ではFresnel係数で0.35〜1倍に補間して加えます。反射、Fresnel係数、薄膜、`shade`は最初の面の法線をカメラ側へ向けて求めます。カメラが`glass`の内部にある場合、最初の面での反射は内部の追跡に含まれるため、環境の反射とライトを加えません。`shade`は最初の面にカメラ左上からの光を掛け（`glass`では屈折の色、`chrome`では全体）、`surface`では共通の段で適用した後に、反射とライトを`反射の割合`で重ねます。GlassとChromeではSurface Mappingを使わず、UIにSurface Mappingを表示しません。MaterialがGlass以外の場合、UIはIOR、Dispersion、Dispersion Stepsを無効表示にし、ChromeではReflectionも無効表示にします。Fogの距離係数は0.3、距離は彫刻に当たる光線ではカメラから最初の面まで、当たらない光線では背景面までです。

`rings`（UI表示`Square Rings · Frame tunnel`）は、外側半幅1・枠の太さ`ringsThickness`（0.02〜0.6、半幅に対する割合）・奥行き`ringsDepth`（0.01〜1、ただし間隔の0.9倍まで）の四角いフレームを経路に沿って`ringsSpacing`（0.3〜4）ごとに並べ、その中をカメラが進むVJ向けの形状です。フレームkは経路位置k、カメラは経路位置`travel = normalizedTime * flowCycles * ringsPerTile`にあり、Flow Cycles 1につきループごとに`ringsPerTile`（1〜32の整数）枚のフレームを通過します（Direct Projectionでは`travel = 0`）。`ringsPattern`は`corridor`（既定、-z方向の直線）、`serpent`（xが1タイル1周期、yが1タイル2周期でうねる経路。曲率0.4以下・傾き0.8以下に抑えた振幅に`ringsAmount`を掛ける。カメラは1フレーム先を向き、曲率に応じて最大約34°バンクする）、`tumble`（カメラからの距離が1.5〜7.5フレームの範囲で`ringsAmount`倍まで増える強さで、フレームを横へ最大2.5ずらし、`k mod ringsPerTile`ごとの乱数軸まわりに最大180°回転する。カメラ付近では整列する）で、未知の値は`corridor`として扱います。各フレームは`(k - travel) * ringsTwist`（-45〜45°／フレーム）と`spin`（整数、ループごとの回転数）の合計だけ経路軸まわりに回転し、大きさは`1 + 0.5 * ringsPulse * sin(2π(k / ringsPerTile - ringsBeats * normalizedTime))`倍（`ringsPulse` 0〜1、`ringsBeats` 0〜16の整数）になります。フレームごとの変化はすべて`k - travel`、`k mod ringsPerTile`、またはループ当たり整数回の値に依存するため、整数のFlow Cyclesでループ境界の視界が一致します。交差はフレームごとの解析的な箱と穴の判定で、カメラの後方12枚から前方52枚までのうち最も近い交点を採り、範囲の端に近いフレームは黒へフェードして出入りが見えないようにします。表面UVは`ringsMapping`で決め、`wrap`（既定）はフレームの外周に沿って左上角から時計回りに0〜1（Texture Repeat倍）をU、枠の内側から外側を`(k + 枠内の位置) / ringsPerTile`としてVに割り当て、1タイル分のフレームにまたがってキャンバスの縦方向を配置します。`picture`はフレームのローカル座標`(x, y) * 0.5 + 0.5`（Texture Repeat倍）で各フレームにキャンバス全体を貼り、穴の部分は描画しません。未知の`ringsMapping`は`wrap`として扱います。texture offsetは0で、Camera Positionは最小の穴に収まるよう`(1 - ringsThickness) * (1 - 0.5 * ringsPulse)`倍します。Fogの距離係数は`0.25 / ringsSpacing`です。

`field`（UI表示`Geometry Field · Scattered flythrough`）は、空間に散らばったジオメトリの間をカメラが-z方向へ進むVJ向けの形状です。空間をz方向の単位スライスに分け、各スライスをxy方向の単位セルに分けます。セルの格子はスライスごとの乱数でxy方向にずらし、物体が奥へ向かう列に揃わないようにします。各セルは確率`fieldDensity`（0.05〜1）で物体を1つ持ち、中心がz軸から`fieldClearance`（1〜5セル）以上`max(fieldSpread, fieldClearance + 1)`（`fieldSpread` 2〜12セル）以下のセルだけを使います。物体の境界球の半径は`0.5 * fieldSize * (0.55〜1の乱数)`（`fieldSize` 0.2〜1）で、境界球がセル内に収まる範囲で中心をずらすため、光線はいま居るセルの物体だけを距離関数で評価し、セルの出口を越えて進みません。これにより進路からの空きは`fieldClearance - √0.5`セル以上になり、Camera Positionはその範囲へ縮めます。`fieldGeometry`は`mix`（既定、物体ごとにランダム）、`sphere`、`cube`、`prism`（三角柱）、`octahedron`、`torus`で、未知の値は`mix`として扱います。`fieldRender`は`solid`（既定）、`wire`（辺を太さ`fieldWire`（0.005〜0.12、物体半径に対する比）の管として描く。球は経線4本と緯線3本、トーラスは管の断面円12本と周方向の円4本）、`mixed`（物体ごとにランダム）で、未知の値は`solid`として扱います。遠くの線が途切れないよう、線の太さは約0.75画素を下限とします。配置の乱数とスライスのずれはスライス番号を`fieldLoopCells`（4〜64の整数）で割った余りから求め、カメラは`travel = normalizedTime * flowCycles * fieldLoopCells`セル進みます（Direct Projectionでは0）。カメラ位置は`travel`を`fieldLoopCells`で割った余りを使うため、整数のFlow Cyclesでループ境界の視界が一致します。各物体はランダムな軸まわりに、`spin`（整数）の±1倍または±2倍の回転数でループごとに回転します。Dollyは視線方向ではなく進行方向（-z）へ1セルを1として移動します。表面UVは物体座標で求め、球は経度・緯度、トーラスはリング周方向・管周方向の角度、立方体・三角柱・正八面体は面の法線から作る平面投影で、Texture Repeat倍したうえで物体ごとの乱数に`fieldVariation`（0〜1）を掛けたoffsetを加えます。群れの外側へ向かう光線と26セルより遠い光線は打ち切り、14セルから26セルにかけて黒へフェードします。texture offsetは0、Fogの距離係数は0.12です。

`fieldArms`（0〜8の整数、既定0）が1以上のとき、`field`は格子の代わりにらせん配置を使います。各スライスを`fieldArms`本の扇形（腕）と、`fieldClearance`から外側へ幅1セルのリングに分け、腕の中心角をスライスごとに`2π * fieldTwist / fieldLoopCells`（`fieldTwist` -8〜8の整数、既定1）ずつ回すため、腕はLoop Lengthあたり`fieldTwist`回転のらせんになり、ループ境界で一致します。物体は（腕, リング, スライス）のセルごとに最大1つ置き、腕の中心線から扇形の幅の`fieldArmWidth`（0.05〜1、既定0.35）倍までずらし、境界球が扇形・リング・スライスに収まる大きさと位置にします。光線はz平面、扇形の境界平面、内外の円筒のうち最も近い境界までしか進みません。進行方向から見たらせんはスクリーン上の半径と奥行きが対応するときにだけ読み取れるため、SpreadをClearance + 1程度まで狭めると最もはっきり見えます。`fieldArms`が0のときの配置と描画は従来の格子と同一です。

`fieldGeometry`の`model`は、ユーザーが読み込んだ.glb（最大64 MB、100万三角形）を物体として使います。GLTFLoaderで全メッシュの三角形をシーン座標で取り出し、バウンディングボックス中心を原点として全頂点が単位球に収まるよう正規化したうえで、Web Workerで48³の距離グリッドに変換します。グリッドは面までの符号付き距離（三角形から3ボクセル以内は厳密値、それより遠くは26近傍のchamfer伝播値に0.88を掛けた下限値）と、平らな面の対角線（隣接面の角度が1°未満）を除いた辺までの距離の2チャンネルで、内外はグリッド境界からの塗りつぶしで判定し、両側から到達される開いた面は薄い殻として扱います。スライスを並べたアトラスをRG16Fテクスチャ（texture unit 13）へ、モデルが変わったときだけ各WebGL contextへアップロードし、シェーダーは2スライスの双線形補間を線形補間して距離を求め、単位球までの距離と大きい方を下限値として使います。モデルの材質とテクスチャは使わず、表面UVでは物体座標の3軸投影を法線で混ぜてキャンバスを貼ります。ワイヤーはグリッド解像度のため線の太さを0.8ボクセル以上とし、辺の間隔がボクセルより細かい高ポリゴンのモデルでは面に近い見た目になります。読み込んだモデルは他の読み込み画像と同じく実行中だけ保持し、Presetには`fieldGeometry: 'model'`の選択だけを保存します。モデルがない間の`model`は球として描画し、モデル読み込み後は`mix`の候補にも含めます。Draco等の圧縮拡張を使った.glbは読み込めずエラーを表示します。

3D programは`three-d.frag.glsl`を`#version 300 es`（GLSL ES 3.00）として、`texture2D`と`gl_FragColor`の別名を前置してコンパイルし、専用の頂点シェーダーを使います。レイマーチのループ内でモデルのアトラスを`textureLod`で明示LODサンプリングするためで、暗黙微分のままではANGLEで全形状の描画が遅くなります。

カメラは、`cameraFov`（15〜150°、既定60°）を透視投影の垂直画角、`fisheyeAngle`（90〜360°、既定180°）を魚眼の円が覆う全画角として使います。`lensDistortion`（-0.5〜0.5）は透視投影の放射方向の歪みで、画面隅で1となる半径の2乗に比例して光線を広げ（正でたる型）、狭めます（負で糸巻き型）。`cameraDolly`（-1〜1）はカメラを視線方向へ移動し、移動量はTorusで0.6、Latticeで`latticeScale * 0.5`、Terrainで1.5、Square Ringsで`ringsSpacing`を1、Ribbonで3、Coneでカメラから円錐の奥行き中央まで（`1.25 + depth / 2`）、DiscsとCrystalsでカメラの基準距離を1とします。Geometry Fieldでは進行方向へ1セルを1として移動します。`torusAim`（0〜1、既定1）はTorusの曲がりの内側へ向ける自動補正の強さです。Wiggleの`zoomPulse`はループ当たり整数回の正弦波で画角を脈打たせ、`vertigo`は画角を±25°振りながら`dolly -= tan(基準画角/2) / tan(画角/2) - 1`で前後移動を加え、距離1の被写体の見かけの大きさを保つドリーズームにします。アニメーション後の画角は10〜170°に制限します。

`classic`のConeは従来と同じ描画です。原点の固定カメラから垂直画角60°の画面レイを-z方向へ出し、開口部（カメラ前方1.25、半径は垂直画角60°の視野の対角を1.08倍で覆う大きさ）から頂点までの円錐面だけと交差させ、範囲外の光線は黒とします。頂点の位置は正規化位置`apexX`／`apexY`を垂直画角60°で投影した画面位置に置きます。

`free`のConeは、開口部を`cameraFov`によらず同じ大きさに固定し、FOVとズーム系Wiggleは画角だけを変えます。頂点の位置は、正規化位置`apexX`／`apexY`がWiggle前の`cameraFov`の透視投影で同じ画面位置になるよう求めるため、FOVを変えても頂点ハンドルは頂点の上に留まります。円錐面は開口部より手前（カメラの後方を含む）へも同じ傾きで続けて交差を求めるため、広い画角・カメラ移動・Wiggleでも開口部の縁による黒は出ません。手前側のVは負の値になり、Seam Modeに従って繰り返します。後方を向くなど円錐面に当たらない光線は黒です。`cameraX`／`cameraY`はカメラを開口部の半径単位で動かします。頂点を大きく画面外へ動かすとカメラが延長した円錐の外側に出るため、`classic`では見えていた内側の奥の面の代わりに延長部分の外側の面が見えることがあります。

`coneTwist`（-4〜4、既定0）は両方のモードで、UへV（開口部0〜頂点1）に比例した`coneTwist`回転を加えてからTexture Repeatを掛け、textureを開口部から頂点へ向けてらせん状にねじります。ねじれは幾何のVに対して固定でFlowのoffsetを含まないため、任意の値でループ境界が一致し、Flowと組み合わせると模様が渦を巻いて頂点へ吸い込まれます。`coneTwist`が0の`classic`の描画は従来のConeと一致します。

UI上の表示名は`3D`です。レイヤー種別`cone`、Presetキー`coneView`、パラメータキー`cone.*`は互換性のため変更しません。`coneView.shape`は`cone`（既定）、`torus`、`lattice`、`terrain`、`ribbon`、`rings`、`field`、`discs`を持ち、値がない旧Presetや未知の値、削除した形状（`mirrorRoom`、`sphere`、`extrusion`）は`cone`として扱います。削除した形状の設定（`extrudeCells`など）は読み込み時に破棄します。`torus`では、チューブ半径1、リング半径`1 / torusBend`のトーラスの中心線上にカメラを置き、リング接線方向からチューブ壁に視線が半径の半分以上離れる最遠の中心線点へ向けてカメラを曲がりの内側へ向けます。画素レイはチューブ内部から壁までの距離でsphere tracingし、交点のチューブ周方向角をU、リング周方向角を`ringRepeat`倍したタイル座標をVとします。前方がVの正方向です。Flowではtextureを動かさず、カメラが中心線に沿ってリングを`normalizedTime * flowCycles`周進みます（交点・視線・カメラ基底をリング軸まわりに回転）。正のFlow Cyclesは前方へ進み、Surface UV・Triplanar・Matcapのいずれでもトンネルを進む見た目になります。`ringRepeat`と`flowCycles`が整数なのでリングの継ぎ目とループ境界は連続します。`torusTwist`（-4〜4、リング1タイル当たりのチューブ周方向回転数）はUへリング周方向角に比例した回転を加え、リング一周の総回転数`round(torusTwist * ringRepeat)`を整数に丸めてリングの継ぎ目を保ちます。カメラの移動と組み合わせると模様が回転しながらカメラへ流れ込み、渦へ吸い込まれる見た目になります。`spin`（-8〜8の整数）はUのoffsetへ`normalizedTime * spin`回転を加え、ループ境界で一致させます。Rotation（UI表示は`torus`で`Camera Roll`）は`torus`ではtexture offsetではなくカメラのロールとして曲がる方向を変えます。曲がりの内側への自動の向きは`cos(cameraYaw)`倍し、後方を向いたときは反対側へ向けて後方トンネルの奥を捉え、側方では補正しません。`cameraYaw`／`cameraPitch`（度）は自動の向きに対する視線調整で、カメラ座標系でPitch、Yawの順に適用してからRoll、自動の向きを適用するため、Roll値によらず画面上の水平・垂直方向に作用します。`cameraX`／`cameraY`（-0.8〜0.8、チューブ半径単位）はカメラ位置のチューブ断面内オフセットで、Rollに追従し、半径0.8を超える場合は同じ向きのまま0.8へ縮めます。Rotation、Camera Yaw、Camera Pitchは0〜360°で循環する角度として保存し、UIはInputAngleを使用します。旧Presetの負のRotationは同じ向きの0〜360°値へ正規化されます。Camera X／YのUIはTweeqのInputPositionで、表示値はオフセットの100倍、Yは画面の上方向が正になるよう符号を反転します。`wigglePreset`は`off`（既定）、`drift`、`handheld`、`float`、`orbit`、`sway`、`lookAround`で、未知の値は`off`として扱います。各presetはYaw・Pitch・Roll（度）とCamera X／Y（チューブ半径）へ加える正弦波の組で、周波数はループ当たりの整数回数です。`lookAround`は加えてYawをループ当たり整数回転（0〜360°に正規化）させます。`wiggleAmount`（0〜2）は正弦波の振幅だけを、整数の`wiggleSpeed`（1〜8）は全周波数と回転数を倍率で変えます。回転はAmountで縮めるとループ境界で角度が一致しなくなるため、Amountの影響を受けません。時間はFlowと同じループ正規化時間を使うため、正規化時間0と1でカメラが一致し、PreviewとExportでシームレスにループします。揺れを加えたカメラ位置にも半径0.8の制限を適用します。Texture Repeat、Seam Mode、Seam Blend、Flow／Direct Projectionは共通で、Depth、Apexは`torus`では使わずApexハンドルも表示しません。探索が上限ステップで収束しない視線は最後の到達点をヒットとして扱い、穴を描きません。

## 他領域との関係

- Gradient SystemはEffect Stackの入力画像・色場と、Image Gradient Sourceの保護条件を定義します。
- Preset SystemはEffect Pipeline、各効果の設定、選択状態を保存します。
- Animationは、Noise・Diffuse・Slit・Stretch・Postprocessの時間依存状態を有効状態と共に評価します。

## 変更履歴

- [SPEC-012 Postprocess Effect Stack](../SPEC-012-postprocess-effect-stack)
- [SPEC-013 Unified Effect Stack V2](../SPEC-013-unified-effect-stack-v2)
- [SPEC-014〜018 Effect Stackの安定化・配置・Glass](../index#legacy-change-specifications)
- [SPEC-027 Diffuse輝度カーブ](../SPEC-027-diffuse-luminance-curve)
- [SPEC-029 パラメータ制限](../SPEC-029-unified-parameter-limits)
- [SPEC-034〜035 Noise拡張](../index#legacy-change-specifications)
- [CHANGE-011 GLASS／GLASS V2書き出し決定性修正](../../changes/archive/CHANGE-011-deterministic-glass-export/proposal)
- [CHANGE-012 GLASS V2色調整コントロール](../../changes/archive/CHANGE-012-glass-v2-color-controls/proposal)
- [CHANGE-013 Effect Stack GlassをGLASS V2へ統合](../../changes/archive/CHANGE-013-glass-v2-only/proposal)
- [CHANGE-014 Effect Stackのランダム順序とソロレイヤー](../../changes/archive/CHANGE-014-effect-stack-controls/proposal)
- [CHANGE-015 Effect Stack別ウィンドウの廃止](../../changes/archive/CHANGE-015-effect-stack-window-repair/proposal)
- [CHANGE-018 SANDBOX描画モジュールの新設](../../changes/archive/CHANGE-018-sandbox-graphics/proposal)
- [CHANGE-019 Diffuse描画モードとEffect Stack UIの拡張](../../changes/archive/CHANGE-019-diffuse-halftone-ascii-adaptive-ui/proposal)
- [CHANGE-020 歪みマップテクスチャのFloat32化](../../changes/archive/2026-08-05-distort-float32-precision/proposal)
- [CHANGE-021 SANDBOX Cloth Gradient Base Generator](../../changes/archive/CHANGE-021-cloth-gradient/proposal)
- [CHANGE-022 Cloth Gradientのランプ適用順序の反転](../../changes/archive/CHANGE-022-cloth-ramp-last-shading/proposal)
- [CHANGE-023 ASCIIのフォント選択と文字サイズ](../../changes/archive/CHANGE-023-ascii-font-controls/proposal)

Legacy SPECは履歴参照用です。現行の主スタック、固定段、互換性はこの文書と関連ADRを先に確認します。

## 未確認・今後の現行仕様化

GPUごとのシェーダーコンパイル失敗率、全効果の実機画素一致、主スタックの同種複数インスタンス、Prism/Particles/Normalの自由順序化は未保証です。必要になった時点で別の変更仕様とADRを作成します。
