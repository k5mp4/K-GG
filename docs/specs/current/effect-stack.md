---
type: current
id: CURRENT-EFFECT-STACK
title: Effect Stack
status: current
owners: [maintainer]
created: 2026-07-27
updated: 2026-09-27
requirement_ids: [EFFECT-001, EFFECT-002, EFFECT-003, EFFECT-004, EFFECT-005, EFFECT-006, EFFECT-007, EFFECT-008, EFFECT-009, EFFECT-010, EFFECT-011, EFFECT-012, EFFECT-013, EFFECT-014, EFFECT-015, EFFECT-016, EFFECT-017, EFFECT-018, EFFECT-019, EFFECT-020, EFFECT-021, EFFECT-022, EFFECT-023, EFFECT-025, EFFECT-026, EFFECT-027, EFFECT-028, EFFECT-029, EFFECT-030, EFFECT-031, DISTORT-001, DISTORT-002, CLOTH-001, CLOTH-002, CLOTH-003, SANDBOX-001, FLOW-001, FLOW-002, FLOW-003, FLOW-004, FLOW-005, FLOW-006, FLOW-007, FLOW-008, FLOW-009, FLOW-010, FLOW-011, FLOW-012, VIDEO-MOTION-001, VIDEO-MOTION-002, VIDEO-MOTION-003, VIDEO-MOTION-004, DATAMOSH-001, DATAMOSH-002, DATAMOSH-003, DATAMOSH-004, DATAMOSH-005]
related_adrs: [ADR-0004, ADR-0005, ADR-0009, ADR-0010, ADR-0017, ADR-20260927-datamosh-feedback-layer]
related_changes: [CHANGE-001, CHANGE-011, CHANGE-012, CHANGE-013, CHANGE-014, CHANGE-015, CHANGE-018, CHANGE-019, CHANGE-020, CHANGE-021, CHANGE-022, CHANGE-023, CHANGE-024, CHANGE-025, CHANGE-026, CHANGE-027, CHANGE-030, CHANGE-031, CHANGE-032, CHANGE-033, CHANGE-034, CHANGE-035, CHANGE-036, CHANGE-037, CHANGE-044, CHANGE-046, CHANGE-047, CHANGE-048, CHANGE-053]
related_code: [src/types/distortion.ts, src/types/coneView.ts, src/lib/effectPipeline.ts, src/lib/normalMap.ts, src/lib/effectStackTransition.ts, src/lib/postprocessStack.ts, src/lib/postprocessAnimation.ts, src/lib/sceneEvaluation.ts, src/lib/animationRegistry.ts, src/lib/glass.ts, src/lib/glassTile.ts, src/lib/webgl.ts, src/lib/voronoi.ts, src/shaders/postprocess/stack.glsl, src/shaders/postprocess/uniforms.glsl, src/store/documentModel.ts, packages/kgg-control/src/parameterLimits.ts, packages/kgg-control/src/types.ts, packages/kgg-control/src/scenarios.ts, src/lib/slitAnimation.ts, src/lib/webglShaderSources.ts, src/lib/flowGradientRenderer.ts, src/lib/flowSimulation.ts, src/lib/presetModel.ts, src/lib/presetThumbnail.ts, src/lib/coneView.ts, src/lib/coneSeam.ts, src/store/gradientStore.ts, src/lib/kggControlRuntime.ts, src/components/PostprocessStackPanel.tsx, src/components/EffectStackWorkspace.tsx, src/components/PostprocessPanel.tsx, src/components/PostprocessOverlay.tsx, src/components/DistortOverlay.tsx, src/components/SandboxPanel.tsx, src/components/FlowGradientPanel.tsx, src/components/BlockNoisePanel.tsx, src/components/DiffuseCurveEditor.tsx, src/components/SlitScanPanel.tsx, src/components/StretchPanel.tsx, src/components/PresetPanel.tsx, src/components/ClothGradientPanel.tsx, src/components/ClothCanvas.tsx, src/components/ConeApexEditor.tsx, src/components/ConeViewPanel.tsx, src/lib/clothGradientRenderer.ts, src/types/clothGradient.ts, src/types/flowGradient.ts, src/shaders/normalmap.frag.glsl, src/shaders/postprocess/glass-optics.glsl, src/shaders/postprocess/glass-field.glsl, src/shaders/postprocess/glass-compact.glsl, src/shaders/postprocess/uniforms.glsl, src/shaders/postprocess/glass-tile.glsl, src/shaders/postprocess/diffuse.glsl, src/shaders/postprocess/noise-diffuse-main.glsl, src/shaders/flow-splat.vert.glsl, src/shaders/flow-splat.frag.glsl, src/shaders/flow-trail.frag.glsl, src/components/DatamoshPanel.tsx, src/types/datamosh.ts, src/lib/videoMotionSource.ts, src/lib/videoMotionRuntime.ts, src/shaders/datamosh/uniforms.glsl, src/shaders/datamosh/motion-field.glsl, src/shaders/datamosh/main.glsl]
related_tests: [tests/e2e/shaders.spec.ts, src/lib/effectPipeline.test.ts, src/lib/webglNormalMapParity.test.ts, src/lib/effectStackTransition.test.ts, src/lib/postprocessStack.test.ts, src/lib/postprocessAnimation.test.ts, src/lib/effectStackDrag.test.ts, src/lib/effectShaderParity.test.ts, src/lib/webglExportPrograms.test.ts, src/lib/webglShaderSources.test.ts, src/lib/glassTile.test.ts, src/lib/glassTileShader.test.ts, src/lib/flowSimulation.test.ts, src/lib/flowGradientPreset.test.ts, src/lib/glass.test.ts, src/store/gradientStore.effectPipeline.test.ts, src/store/gradientStore.postprocessStack.test.ts, src/store/gradientStore.glass.test.ts, src/store/gradientStore.animation.test.ts, src/lib/sceneEvaluation.glass.test.ts, src/lib/slitAnimation.test.ts, src/lib/presetModel.slit.test.ts, src/lib/presetThumbnail.test.ts, src/lib/coneView.test.ts, src/lib/coneSeam.test.ts, src/lib/presetModel.diffuse.test.ts, src/lib/processedCanvasClock.test.ts, src/types/coneView.test.ts, tests/clothGradient.test.ts, src/types/datamosh.test.ts, src/lib/videoMotionSource.test.ts, src/lib/videoMotionRuntime.test.ts, src/lib/kggControlRuntime.test.ts, packages/kgg-control/src/scenarios.test.ts, src/components/PostprocessPanel.test.tsx, src/components/PostprocessStackPanel.test.tsx, src/components/SandboxPanel.test.tsx]
---

# Effect Stack

## 目的

Effect Stackは、Gradientから得た画像・色場へ複数の効果を適用し、その順序と有効状態を編集可能にする機能です。ユーザーが編集する主スタックと、処理の意味や複数パス要件が異なる固定段を分けます。

## 現在の要件

### EFFECT-001 主スタックの効果

Unified Effect Stack V2の主スタックは、`Noise`、`Slit`、`Stretch`、`Distort`、`Mirror`、`Kaleidoscope`、`Voronoi`、`Glass`、`GlassTile`、`Diffuse`、`Datamosh`、`Cone`の12種類です。`Datamosh`は前フレームの履歴を使う時間フィードバック経路、`Glass`はGLASS V2、`GlassTile`はKG_Glassのタイル表面モデルを移植した専用描画経路、`Cone`は前段textureを円錐面へ投影する専用描画経路を使用します。各種類はスタック内に一度だけ存在し、同じ種類の複数インスタンスは現在サポートしません。

主スタックは既知の種類を正規化して保持します。未知の種類や重複は保存・読込時に除外され、欠落した既知の種類は無効状態で補完されます。旧Presetの`videoMotion`レイヤーはDATAMOSH-005に従って同じ位置の`datamosh`レイヤーへ写像されます。旧Presetの`glassV2`は`glass`へ写像され、旧`glass`と同時に存在する場合も一つへ統合されます。

### EFFECT-002 有効化と順序

利用者は主スタックの各効果を有効/無効に切り替え、順序を手動またはランダムに並べ替え、選択中の効果を変更できます。現在の実装は任意の新しい種類を追加・削除するモデルではなく、既知の12種類を無効化することで「使わない」状態を表現します。

新規V2状態の既定順は `Noise → Slit → Stretch → Distort → Mirror → Kaleidoscope → Voronoi → Glass → GlassTile → Diffuse → Datamosh → Cone` で、Diffuseが既定で有効です。ユーザーが保存した順序と有効状態はPresetへ保存されます。ランダム化操作では12種類を一度ずつ含む順列を作り、有効状態・選択状態・固定段を維持します。現在の描画結果から目標順序の結果へ400msの`easeInOut`表示ブレンドを行い、完了後に目標順序を確定します。

### EFFECT-014 Postprocessの全体有効状態

`Stretch`、`Distort`、`Mirror`、`Kaleidoscope`、`Voronoi`、`Glass`、`GlassTile`、`Datamosh`、`Cone`のいずれか一つ以上が有効な場合、Postprocess全体を有効状態として表示します。Postprocessのプロパティモジュールには各レイヤーの個別ON／OFFを表示せず、レイヤーの有効状態はEffect Stackで管理します。プロパティモジュールではPostprocess全体のON／OFFと、選択レイヤーの詳細プロパティを表示します。Postprocessの全レイヤーが無効な場合は全体も無効状態になります。

### EFFECT-029 Mirror／Kaleidoscopeのガイド表示

Effect Stack V2で`Mirror`または`Kaleidoscope`を選択し、そのレイヤーが有効な場合、Canvas表示中にPostprocessプロパティを表示している間は対応する編集ガイドを常に表示します。ガイドの種類と有効状態は`effectPipeline.selectedKind`および`effectPipeline.effectStack`から決定し、Presetに残る旧`showOverlay`値では隠しません。Mirror／KaleidoscopeのプロパティにはガイドのON／OFF切替を表示しません。Legacy V1ではPostprocessプロパティ表示中に選択された有効なレイヤーのガイドを表示します。

### EFFECT-003 固定段と描画順

V2の全体順序は `Base → Surface → Main Stack → Prism → Flow Gradient → Particles` です。NormalはSurface、PrismはGlowを含む専用段、Flow GradientはGPU密度・Temporal TrailをGradient Rampへ合成する固定段、Particlesは最終2Dオーバーレイとして扱い、これらを主スタックの並べ替え対象には含めません。ConeはMain Stack内の通常レイヤーであり、配置された位置で前段textureを円錐面へ投影し、その描画結果を後段へ出力します。DatamoshとConeはdrag、randomize、solo、選択、永続化、render planの対象です。Coneを含む通常レイヤーはSANDBOXの固定段ではありません。Flow Gradientを無効にした場合は、Flow Gradientを除いたParticlesまでの経路を使用します。

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

motion sourceは`Animation Flow`（既定）、`Procedural`、`Video Motion`を持つ。`Animation Flow`はDatamoshレイヤーの入力（前段のNoise、Slitなどのアニメーション結果）の前フレームと現在フレームの輝度からLucas–Kanade法で動きを推定し、アニメーションが動いた向きへ履歴を引き伸ばす。推定は3×3の標本点と正則化項で行い、平坦な領域や変化のない入力では動きを0とし、1フレームの推定量はフレームの5%以下に制限する。入力が静止している間は動かない。`Procedural`はfbmの流れ関数のcurlと低周波のdriftから成る時間変化する2chベクトル場で、`Motion Scale`で空間スケール、`Motion Speed`で時間変化速度を変える。motion vectorはマクロブロック中心でブロック範囲を窓として評価し、ブロック内の全画素が同じvectorを共有する。`Block Lock`（0〜1、既定0.6）はブロックのvectorと画素ごと（6px窓）のvectorの混合量で、1ではブロック単位、下げるほど画素がアニメーションの流れに沿って個別に引き伸ばされる。基準の大きさは`Block Size`（1〜128px、1で量子化なし）で、`Block Variance`（0〜1）の確率で隣接ブロックを2倍へ結合、またはx／y／両方向へ最大2段分割し、不規則な大きさ・縦横比のパーティションにする。パーティション配置は6論理フレームごとに変わる。`Neighbor Mix`は隣接ブロックのvectorを混ぜる量で、`Strength`は1フレーム当たりの履歴のずらし量を決める。

### DATAMOSH-003 history feedback, stretch, and refresh

Datamoshは前フレームの自身の出力を履歴として保持し、各画素でmotion vectorだけずらした履歴を予測画像として参照する。ずらし量は画素ごとに履歴の輝度と彩度で変わり、`1 + Luma Stretch × (輝度 − 0.5) × 2 + Saturation Stretch × (彩度 − 0.5) × 2`を0〜4へ制限した倍率を掛ける（Luma Stretch／Saturation Stretchは−2〜2、負の値は明るい／鮮やかな画素ほど短くする）。同じブロック内でも色によって引き伸ばされる長さが変わり、筋状に崩れる。予測画像は`Feedback`の重みで現在フレームと合成し、`Refresh`の割合のマクロブロックだけを毎フレーム現在フレームで置き換える（Intra refresh）。Refreshが小さいほど履歴が残り、Iフレームを失ったような引きずりになる。`Freeze`は履歴の更新を止め、固定した履歴を現在のmotionで参照し続ける。`Mix Mode`は`Mix`、`Lighten`、`Difference`、`Ramp Lock`を持つ。`Color Drift`はR／Bの参照位置をmotion方向へずらす。

### DATAMOSH-004 corruption

`Glitch Threshold`より大きいブロック乱数を持つマクロブロックを破損ブロックとし、`Glitch Amount`の強さでmotion vectorの0化、隣接ブロックvectorの流用、更新の停止、参照ブロック位置のずらしのいずれかを適用する。`Jitter`は全ブロックの参照UVをブロック単位で乱す。破損とRefreshの乱数は論理フレームごとに変わる。

### DATAMOSH-005 history lifecycle and compatibility

履歴は論理フレーム（timeline正規化時刻、shader時刻、video source時は動画fieldの更新回数）が変わったときだけ進む。同じ論理フレームの再描画は同じ履歴から再評価し、停止中のパラメータ編集で崩れを進めない。解像度変更、render session変更、motion source変更、動画reset時は履歴を初期化し、初回フレームは現在フレームをそのまま出力する。旧Presetの`videoMotion`レイヤーは同じ位置・有効状態の`datamosh`レイヤーへ、選択中の`videoMotion`は`datamosh`へ写像する。`datamosh`設定を持たない旧Presetの`videoMotion`設定は、`Video Motion` source、`Ramp Lock`、Block Size 1、Block Lock 1、Block Variance 0、Luma／Saturation Stretch 0、Refresh 0、破損なしのDatamosh設定へ移行する。スタックにレイヤーがない旧Presetで`videoMotion.enabled`が有効な場合はDatamoshレイヤーを有効にする。保存時は`datamosh`だけを書き、`videoMotion`設定は書かない。

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

SANDBOXのEdit Layerには`Cloth`、`Normal`、`Prism`、`Particles`、`Flow Gradient`、`Seamless`の6モジュールを表示し、アクティブカウントを`/6`で示します。ConeはSANDBOXから除外し、EFFECT-021のMain StackレイヤーとしてEffect Stackで管理します。モジュールのON/OFF状態およびプログラム状態をUI上に可視化します。

### EFFECT-020 Cloth表示アダプター

Cloth表示はEffect Stackの新しい段階ではなく、処理済みCanvasを受け取る後段の表示アダプターです。Effect Stackの有効状態、順序、処理結果はCanvas表示とCloth表示で共通です。3D表示の入力ではCloth Baseを二重適用せず、CanvasTextureをクロスのUVへ割り当てた後に表面変形・ライティングを一度だけ行います。

Cloth表示面はSANDBOXのClothモジュールON/OFFで切り替えます。Coneは次のEFFECT-021で定義するMain StackレイヤーのON/OFFと順序に従って通常のCanvas出力へ合成されます。Preview右側に別のPreview Surface設定を追加しません。

### EFFECT-021 Cone Effect Stackレイヤー

Coneは通常の`EffectStackKind`であり、順序・有効状態は`effectPipeline.effectStack`に保存します。Effect Stackで選択、toggle、drag、randomize、soloでき、SANDBOX Edit Layerからは除外します。描画では直前のMain Stack textureを`stackCore`のCone GPU passへ渡し、画素レイとCone面の交差から円周U・高さVを求め、前段textureをそのUVへサンプルします。Gradient RampをCone用色源として再サンプルせず、前段の色場を保持します。投影結果は通常のping-pong targetへ書き込み、次のレイヤーが同じ描画結果を入力として使用します。Depth、Apex、Rotation、Texture Repeat、Flow／Direct Projection、Seam Blend、Mirror Repeat／Edge Weld／Gradient Reapplyの既存設定と、Gradient ReapplyのRGB補正・中心alpha保持を維持します。設定はConeレイヤーを選択したとき左Postprocessパネルに表示し、ApexはCanvas上の既存ハンドルで編集します。PreviewとExportは同じWebGL stack passとrender planを使用します。旧形式でConeレイヤーがないeffectStackは、追加されるConeレイヤーを無効状態に正規化します。

K-GG control APIのEffectState一覧はConeを返し、enable／reorder／resetとscenario commandで同じレイヤー状態を操作できます。

3Dレイヤーは共通のstack programではなく、3Dレイヤーが有効な場合だけ遅延コンパイルする専用program（`threeD`）で描画します。専用programが失敗した場合はレイヤーを描画せず、残りのstackを継続します。Cone以外の形状は共通の段で描画します。各形状は交点・法線・任意の表面UVを返し、`surfaceMapping`（`uv`既定、`triplanar`、`matcap`、未知の値は`uv`）で色を決め、`shade`（0〜1、0で照明なし）でカメラ左上からの光を混ぜ、`fog`（0〜1）で距離に応じて黒へ減衰させます。`uv`は表面UVを持たない形状では`triplanar`になります。`matcap`はカメラ基準の法線でキャンバスを引きます。Camera Roll／Yaw／Pitch／Position／WiggleはCone以外の全形状に共通で、各形状の基準カメラに対して適用します。Coneは従来の解析的な交差、UV、照明なしの描画を維持し、Surface Mapping・Shade・Fog・Camera設定を使いません。

`coneView.shape`の`lattice`は、周期`latticeScale`（0.5〜8）、壁の厚み`latticeThickness`（0.02〜0.9、場の値の単位）の三重周期極小曲面（`latticeType`: `gyroid`既定／`schwarzP`）を壁にした格子の中を描画します。カメラはx軸方向のまっすぐな通路（Gyroidは`(x, P/4, 0)`、Schwarz Pは`(x, 0, 0)`で、壁に触れない）を進み、Flowでは`normalizedTime * flowCycles`周期だけ前進するため、整数のFlow Cyclesでループ境界の視界が一致します。表面UVを持たないため`uv`ではTriplanarで貼ります。未知の`latticeType`は`gyroid`として扱います。`lattice`、`terrain`、`extrusion`、`rings`、`field`ではFlowをtexture offsetではなく幾何の移動に使い、texture offsetは0とします。

Cone以外の形状は`projection`（`perspective`既定、`fisheye`、`equirect`、未知の値は`perspective`）でカメラの投影を選びます。`perspective`は垂直画角60°、`fisheye`は短辺に内接する円へ等距離射影した180°のドームマスター（中心が視線方向、円外は黒）、`equirect`は横方向に経度360°・縦方向に緯度180°を割り当てた全天球パノラマです。投影はCamera Roll／Yaw／Pitchより前に求め、同じカメラの向きを適用します。

`terrain`はキャンバスの輝度に`terrainHeight`（0〜2）を掛けた高さ場を、`4 / textureRepeat`ごとに繰り返す地面として描画します。高さはSeam ModeがMirror RepeatならMirror Repeatの色と同じ補間、それ以外はfractで折り返した1回のtexture参照で求めます。カメラは高さ`terrainAltitude`（0.1〜3）で水平から下向きの基準方向へ進み、Flowで`normalizedTime * flowCycles`タイル前進するため、整数のFlow Cyclesでループ境界の視界が一致します。交点は高さの差に比例した歩幅で探索し、下へ抜けた区間を二分法で詰めます。表面UVは地面座標から両軸にTexture Repeatを掛けた値です。`extrusion`はキャンバスを`extrudeCells`（4〜128の整数）四方のセルに分け、各セル中心の色の輝度に`extrudeHeight`（0〜2）を掛けた高さの柱を[-1, 1]²の範囲へ立てます。柱の間には`extrudeGap`（0〜0.8、セル幅に対する割合）の隙間を空けます。光線は2DのDDAでセルを順にたどって柱の箱と交差判定し、柱の色はセル中心の色、柱に当たらない光線は範囲内の床にキャンバスを25%の明るさで表示します。カメラは仰角約31°、距離`max(depth * 0.35, 1.5)`で中心を向いて周回し、Flowで`normalizedTime * flowCycles`周します。

`ribbon`はXZ平面の単位円に沿って、半幅`ribbonWidth`（0.05〜0.6）・厚み0.024の平らな帯をスイープした面です。断面はリング1周で`ribbonHalfTwists`（0〜12の整数）半回転し、奇数ならメビウスの帯になります。断面の長方形は点対称なので、リング角の折り返し位置でも面は連続します。表面UVは帯に沿って`ringRepeat`タイル、幅方向に0〜1で、メビウスの帯では閉じる位置で幅方向が反転します。Flowでは帯に沿って`normalizedTime * flowCycles`タイル流れ、`spin`（整数）で帯全体がループごとに縦軸まわりに回転します。カメラは仰角約26°、距離`max(depth * 0.4, 1.6)`から中心を向きます。

`rings`（UI表示`Square Rings · Frame tunnel`）は、外側半幅1・枠の太さ`ringsThickness`（0.02〜0.6、半幅に対する割合）・奥行き`ringsDepth`（0.01〜1、ただし間隔の0.9倍まで）の四角いフレームを経路に沿って`ringsSpacing`（0.3〜4）ごとに並べ、その中をカメラが進むVJ向けの形状です。フレームkは経路位置k、カメラは経路位置`travel = normalizedTime * flowCycles * ringsPerTile`にあり、Flow Cycles 1につきループごとに`ringsPerTile`（1〜32の整数）枚のフレームを通過します（Direct Projectionでは`travel = 0`）。`ringsPattern`は`corridor`（既定、-z方向の直線）、`serpent`（xが1タイル1周期、yが1タイル2周期でうねる経路。曲率0.4以下・傾き0.8以下に抑えた振幅に`ringsAmount`を掛ける。カメラは1フレーム先を向き、曲率に応じて最大約34°バンクする）、`tumble`（カメラからの距離が1.5〜7.5フレームの範囲で`ringsAmount`倍まで増える強さで、フレームを横へ最大2.5ずらし、`k mod ringsPerTile`ごとの乱数軸まわりに最大180°回転する。カメラ付近では整列する）で、未知の値は`corridor`として扱います。各フレームは`(k - travel) * ringsTwist`（-45〜45°／フレーム）と`spin`（整数、ループごとの回転数）の合計だけ経路軸まわりに回転し、大きさは`1 + 0.5 * ringsPulse * sin(2π(k / ringsPerTile - ringsBeats * normalizedTime))`倍（`ringsPulse` 0〜1、`ringsBeats` 0〜16の整数）になります。フレームごとの変化はすべて`k - travel`、`k mod ringsPerTile`、またはループ当たり整数回の値に依存するため、整数のFlow Cyclesでループ境界の視界が一致します。交差はフレームごとの解析的な箱と穴の判定で、カメラの後方12枚から前方52枚までのうち最も近い交点を採り、範囲の端に近いフレームは黒へフェードして出入りが見えないようにします。表面UVは`ringsMapping`で決め、`wrap`（既定）はフレームの外周に沿って左上角から時計回りに0〜1（Texture Repeat倍）をU、枠の内側から外側を`(k + 枠内の位置) / ringsPerTile`としてVに割り当て、1タイル分のフレームにまたがってキャンバスの縦方向を配置します。`picture`はフレームのローカル座標`(x, y) * 0.5 + 0.5`（Texture Repeat倍）で各フレームにキャンバス全体を貼り、穴の部分は描画しません。未知の`ringsMapping`は`wrap`として扱います。texture offsetは0で、Camera Positionは最小の穴に収まるよう`(1 - ringsThickness) * (1 - 0.5 * ringsPulse)`倍します。Fogの距離係数は`0.25 / ringsSpacing`です。

`field`（UI表示`Geometry Field · Scattered flythrough`）は、空間に散らばったジオメトリの間をカメラが-z方向へ進むVJ向けの形状です。空間をz方向の単位スライスに分け、各スライスをxy方向の単位セルに分けます。セルの格子はスライスごとの乱数でxy方向にずらし、物体が奥へ向かう列に揃わないようにします。各セルは確率`fieldDensity`（0.05〜1）で物体を1つ持ち、中心がz軸から`fieldClearance`（1〜5セル）以上`max(fieldSpread, fieldClearance + 1)`（`fieldSpread` 2〜12セル）以下のセルだけを使います。物体の境界球の半径は`0.5 * fieldSize * (0.55〜1の乱数)`（`fieldSize` 0.2〜1）で、境界球がセル内に収まる範囲で中心をずらすため、光線はいま居るセルの物体だけを距離関数で評価し、セルの出口を越えて進みません。これにより進路からの空きは`fieldClearance - √0.5`セル以上になり、Camera Positionはその範囲へ縮めます。`fieldGeometry`は`mix`（既定、物体ごとにランダム）、`sphere`、`cube`、`prism`（三角柱）、`octahedron`、`torus`で、未知の値は`mix`として扱います。`fieldRender`は`solid`（既定）、`wire`（辺を太さ`fieldWire`（0.005〜0.12、物体半径に対する比）の管として描く。球は経線4本と緯線3本、トーラスは管の断面円12本と周方向の円4本）、`mixed`（物体ごとにランダム）で、未知の値は`solid`として扱います。遠くの線が途切れないよう、線の太さは約0.75画素を下限とします。配置の乱数とスライスのずれはスライス番号を`fieldLoopCells`（4〜64の整数）で割った余りから求め、カメラは`travel = normalizedTime * flowCycles * fieldLoopCells`セル進みます（Direct Projectionでは0）。カメラ位置は`travel`を`fieldLoopCells`で割った余りを使うため、整数のFlow Cyclesでループ境界の視界が一致します。各物体はランダムな軸まわりに、`spin`（整数）の±1倍または±2倍の回転数でループごとに回転します。Dollyは視線方向ではなく進行方向（-z）へ1セルを1として移動します。表面UVは物体座標で求め、球は経度・緯度、トーラスはリング周方向・管周方向の角度、立方体・三角柱・正八面体は面の法線から作る平面投影で、Texture Repeat倍したうえで物体ごとの乱数に`fieldVariation`（0〜1）を掛けたoffsetを加えます。群れの外側へ向かう光線と26セルより遠い光線は打ち切り、14セルから26セルにかけて黒へフェードします。texture offsetは0、Fogの距離係数は0.12です。

`fieldArms`（0〜8の整数、既定0）が1以上のとき、`field`は格子の代わりにらせん配置を使います。各スライスを`fieldArms`本の扇形（腕）と、`fieldClearance`から外側へ幅1セルのリングに分け、腕の中心角をスライスごとに`2π * fieldTwist / fieldLoopCells`（`fieldTwist` -8〜8の整数、既定1）ずつ回すため、腕はLoop Lengthあたり`fieldTwist`回転のらせんになり、ループ境界で一致します。物体は（腕, リング, スライス）のセルごとに最大1つ置き、腕の中心線から扇形の幅の`fieldArmWidth`（0.05〜1、既定0.35）倍までずらし、境界球が扇形・リング・スライスに収まる大きさと位置にします。光線はz平面、扇形の境界平面、内外の円筒のうち最も近い境界までしか進みません。進行方向から見たらせんはスクリーン上の半径と奥行きが対応するときにだけ読み取れるため、SpreadをClearance + 1程度まで狭めると最もはっきり見えます。`fieldArms`が0のときの配置と描画は従来の格子と同一です。

`fieldGeometry`の`model`は、ユーザーが読み込んだ.glb（最大64 MB、100万三角形）を物体として使います。GLTFLoaderで全メッシュの三角形をシーン座標で取り出し、バウンディングボックス中心を原点として全頂点が単位球に収まるよう正規化したうえで、Web Workerで48³の距離グリッドに変換します。グリッドは面までの符号付き距離（三角形から3ボクセル以内は厳密値、それより遠くは26近傍のchamfer伝播値に0.88を掛けた下限値）と、平らな面の対角線（隣接面の角度が1°未満）を除いた辺までの距離の2チャンネルで、内外はグリッド境界からの塗りつぶしで判定し、両側から到達される開いた面は薄い殻として扱います。スライスを並べたアトラスをRG16Fテクスチャ（texture unit 13）へ、モデルが変わったときだけ各WebGL contextへアップロードし、シェーダーは2スライスの双線形補間を線形補間して距離を求め、単位球までの距離と大きい方を下限値として使います。モデルの材質とテクスチャは使わず、表面UVでは物体座標の3軸投影を法線で混ぜてキャンバスを貼ります。ワイヤーはグリッド解像度のため線の太さを0.8ボクセル以上とし、辺の間隔がボクセルより細かい高ポリゴンのモデルでは面に近い見た目になります。読み込んだモデルは他の読み込み画像と同じく実行中だけ保持し、Presetには`fieldGeometry: 'model'`の選択だけを保存します。モデルがない間の`model`は球として描画し、モデル読み込み後は`mix`の候補にも含めます。Draco等の圧縮拡張を使った.glbは読み込めずエラーを表示します。

3D programは`three-d.frag.glsl`を`#version 300 es`（GLSL ES 3.00）として、`texture2D`と`gl_FragColor`の別名を前置してコンパイルし、専用の頂点シェーダーを使います。レイマーチのループ内でモデルのアトラスを`textureLod`で明示LODサンプリングするためで、暗黙微分のままではANGLEで全形状の描画が遅くなります。

Cone以外のカメラは、`cameraFov`（15〜150°、既定60°）を透視投影の垂直画角、`fisheyeAngle`（90〜360°、既定180°）を魚眼の円が覆う全画角として使います。`lensDistortion`（-0.5〜0.5）は透視投影の放射方向の歪みで、画面隅で1となる半径の2乗に比例して光線を広げ（正でたる型）、狭めます（負で糸巻き型）。`cameraDolly`（-1〜1）はカメラを視線方向へ移動し、移動量はTorusで0.6、Latticeで`latticeScale * 0.5`、Terrainで1.5、ExtrusionとRibbonでカメラ距離の半分、Square Ringsで`ringsSpacing`を1とします。Geometry Fieldでは進行方向へ1セルを1として移動します。`torusAim`（0〜1、既定1）はTorusの曲がりの内側へ向ける自動補正の強さです。Wiggleの`zoomPulse`はループ当たり整数回の正弦波で画角を脈打たせ、`vertigo`は画角を±25°振りながら`dolly -= tan(基準画角/2) / tan(画角/2) - 1`で前後移動を加え、距離1の被写体の見かけの大きさを保つドリーズームにします。アニメーション後の画角は10〜170°に制限します。Coneは従来の固定60°カメラのままで、これらの設定を使いません。

UI上の表示名は`3D`です。レイヤー種別`cone`、Presetキー`coneView`、パラメータキー`cone.*`は互換性のため変更しません。`coneView.shape`は`cone`（既定）と`torus`を持ち、値がない旧Presetや未知の値は`cone`として扱います。`torus`では、チューブ半径1、リング半径`1 / torusBend`のトーラスの中心線上にカメラを固定し、リング接線方向からチューブ壁に視線が半径の半分以上離れる最遠の中心線点へ向けてカメラを曲がりの内側へ向けます。画素レイはチューブ内部から壁までの距離でsphere tracingし、交点のチューブ周方向角をU、リング周方向角を`ringRepeat`倍したタイル座標をVとします。前方がVの正方向で、FlowではConeと同じ`offsetV = normalizedTime * flowCycles`を加えるため、正のFlow Cyclesは模様がカメラへ向かって流れ、リングが回転してトンネルを進む見た目になります。`ringRepeat`と`flowCycles`が整数なのでリングの継ぎ目とループ境界は連続します。`torusTwist`（-4〜4、リング1タイル当たりのチューブ周方向回転数）はUへリング周方向角に比例した回転を加え、リング一周の総回転数`round(torusTwist * ringRepeat)`を整数に丸めてリングの継ぎ目を保ちます。Flowと組み合わせると模様が回転しながらカメラへ流れ込み、渦へ吸い込まれる見た目になります。`spin`（-8〜8の整数）はUのoffsetへ`normalizedTime * spin`回転を加え、ループ境界で一致させます。Rotation（UI表示は`torus`で`Camera Roll`）は`torus`ではtexture offsetではなくカメラのロールとして曲がる方向を変えます。曲がりの内側への自動の向きは`cos(cameraYaw)`倍し、後方を向いたときは反対側へ向けて後方トンネルの奥を捉え、側方では補正しません。`cameraYaw`／`cameraPitch`（度）は自動の向きに対する視線調整で、カメラ座標系でPitch、Yawの順に適用してからRoll、自動の向きを適用するため、Roll値によらず画面上の水平・垂直方向に作用します。`cameraX`／`cameraY`（-0.8〜0.8、チューブ半径単位）はカメラ位置のチューブ断面内オフセットで、Rollに追従し、半径0.8を超える場合は同じ向きのまま0.8へ縮めます。Rotation、Camera Yaw、Camera Pitchは0〜360°で循環する角度として保存し、UIはInputAngleを使用します。旧Presetの負のRotationは同じ向きの0〜360°値へ正規化されます。Camera X／YのUIはTweeqのInputPositionで、表示値はオフセットの100倍、Yは画面の上方向が正になるよう符号を反転します。`wigglePreset`は`off`（既定）、`drift`、`handheld`、`float`、`orbit`、`sway`、`lookAround`で、未知の値は`off`として扱います。各presetはYaw・Pitch・Roll（度）とCamera X／Y（チューブ半径）へ加える正弦波の組で、周波数はループ当たりの整数回数です。`lookAround`は加えてYawをループ当たり整数回転（0〜360°に正規化）させます。`wiggleAmount`（0〜2）は正弦波の振幅だけを、整数の`wiggleSpeed`（1〜8）は全周波数と回転数を倍率で変えます。回転はAmountで縮めるとループ境界で角度が一致しなくなるため、Amountの影響を受けません。時間はFlowと同じループ正規化時間を使うため、正規化時間0と1でカメラが一致し、PreviewとExportでシームレスにループします。揺れを加えたカメラ位置にも半径0.8の制限を適用します。Texture Repeat、Seam Mode、Seam Blend、Flow／Direct Projectionは共通で、Depth、Apexは`torus`では使わずApexハンドルも表示しません。探索が上限ステップで収束しない視線は最後の到達点をヒットとして扱い、穴を描きません。

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
