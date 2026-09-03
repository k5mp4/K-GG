---
type: current
id: CURRENT-EFFECT-STACK
title: Effect Stack
status: current
owners: [maintainer]
created: 2026-07-27
updated: 2026-08-30
requirement_ids: [EFFECT-001, EFFECT-002, EFFECT-003, EFFECT-004, EFFECT-005, EFFECT-006, EFFECT-007, EFFECT-008, EFFECT-009, EFFECT-010, EFFECT-011, EFFECT-012, EFFECT-013, EFFECT-014, EFFECT-015, EFFECT-016, EFFECT-017, EFFECT-018, EFFECT-019, EFFECT-020, EFFECT-021, EFFECT-022, EFFECT-023, EFFECT-025, DISTORT-001, DISTORT-002, CLOTH-001, CLOTH-002, CLOTH-003, SANDBOX-001, FLOW-001, FLOW-002, FLOW-003, FLOW-004, FLOW-005, FLOW-006, FLOW-007, FLOW-008, FLOW-009, FLOW-010, FLOW-011, FLOW-012]
related_adrs: [ADR-0004, ADR-0005, ADR-0010, ADR-0017]
related_changes: [CHANGE-001, CHANGE-011, CHANGE-012, CHANGE-013, CHANGE-014, CHANGE-015, CHANGE-018, CHANGE-019, CHANGE-020, CHANGE-021, CHANGE-022, CHANGE-023, CHANGE-024, CHANGE-025, CHANGE-026, CHANGE-027, CHANGE-030, CHANGE-031, CHANGE-032, CHANGE-033, CHANGE-034, CHANGE-035, CHANGE-036, CHANGE-037]
related_code: [src/types/distortion.ts, src/types/renderView.ts, src/types/coneView.ts, src/lib/effectPipeline.ts, src/lib/normalMap.ts, src/lib/effectStackTransition.ts, src/lib/postprocessStack.ts, src/lib/postprocessAnimation.ts, src/lib/sceneEvaluation.ts, src/lib/animationRegistry.ts, src/lib/glass.ts, src/lib/webgl.ts, src/lib/slitAnimation.ts, src/lib/webglShaderSources.ts, src/lib/flowGradientRenderer.ts, src/lib/flowSimulation.ts, src/lib/presetModel.ts, src/lib/presetThumbnail.ts, src/lib/coneView.ts, src/lib/coneViewRenderer.ts, src/lib/coneSeam.ts, src/lib/processedCanvasClock.ts, src/store/gradientStore.ts, src/components/PostprocessStackPanel.tsx, src/components/EffectStackWorkspace.tsx, src/components/PostprocessPanel.tsx, src/components/DistortOverlay.tsx, src/components/SandboxPanel.tsx, src/components/FlowGradientPanel.tsx, src/components/BlockNoisePanel.tsx, src/components/DiffuseCurveEditor.tsx, src/components/SlitScanPanel.tsx, src/components/StretchPanel.tsx, src/components/PresetPanel.tsx, src/components/ClothGradientPanel.tsx, src/components/ClothCanvas.tsx, src/components/ConeCanvas.tsx, src/components/ConeViewPanel.tsx, src/lib/clothGradientRenderer.ts, src/lib/clothView.ts, src/types/clothGradient.ts, src/types/flowGradient.ts, src/shaders/normalmap.frag.glsl, src/shaders/postprocess/glass-optics.glsl, src/shaders/flow-splat.vert.glsl, src/shaders/flow-splat.frag.glsl, src/shaders/flow-trail.frag.glsl, src/shaders/flow-gradient.frag.glsl]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/webglNormalMapParity.test.ts, src/lib/effectStackTransition.test.ts, src/lib/postprocessStack.test.ts, src/lib/postprocessAnimation.test.ts, src/lib/effectStackDrag.test.ts, src/lib/effectShaderParity.test.ts, src/lib/imageGradientProtected.test.ts, src/lib/webglExportPrograms.test.ts, src/lib/webglShaderSources.test.ts, src/lib/flowSimulation.test.ts, src/lib/flowGradientPreset.test.ts, src/lib/glass.test.ts, src/store/gradientStore.effectPipeline.test.ts, src/store/gradientStore.postprocessStack.test.ts, src/store/gradientStore.glass.test.ts, src/store/gradientStore.animation.test.ts, src/lib/sceneEvaluation.glass.test.ts, src/lib/slitAnimation.test.ts, src/lib/presetModel.slit.test.ts, src/lib/presetThumbnail.test.ts, src/lib/clothView.test.ts, src/lib/coneView.test.ts, src/lib/coneSeam.test.ts, src/lib/presetModel.diffuse.test.ts, src/lib/processedCanvasClock.test.ts, src/types/coneView.test.ts, tests/clothGradient.test.ts]
---

# Effect Stack

## 目的

Effect Stackは、Gradientから得た画像・色場へ複数の効果を適用し、その順序と有効状態を編集可能にする機能です。ユーザーが編集する主スタックと、処理の意味や複数パス要件が異なる固定段を分けます。

## 現在の要件

### EFFECT-001 主スタックの効果

Unified Effect Stack V2の主スタックは、`Noise`、`Slit`、`Stretch`、`Distort`、`Mirror`、`Kaleidoscope`、`Voronoi`、`Glass`、`Diffuse`の9種類です。`Glass`はGLASS V2の描画経路を使用します。各種類はスタック内に一度だけ存在し、同じ種類の複数インスタンスは現在サポートしません。

主スタックは既知の種類を正規化して保持します。未知の種類や重複は保存・読込時に除外され、欠落した既知の種類は無効状態で補完されます。旧Presetの`glassV2`は`glass`へ写像され、旧`glass`と同時に存在する場合も一つへ統合されます。

### EFFECT-002 有効化と順序

利用者は主スタックの各効果を有効/無効に切り替え、順序を手動またはランダムに並べ替え、選択中の効果を変更できます。現在の実装は任意の新しい種類を追加・削除するモデルではなく、既知の9種類を無効化することで「使わない」状態を表現します。

新規V2状態の既定順は `Noise → Slit → Stretch → Distort → Mirror → Kaleidoscope → Voronoi → Glass → Diffuse` で、Diffuseが既定で有効です。ユーザーが保存した順序と有効状態はPresetへ保存されます。ランダム化操作では9種類を一度ずつ含む順列を作り、有効状態・選択状態・固定段を維持します。現在の描画結果から目標順序の結果へ400msの`easeInOut`表示ブレンドを行い、完了後に目標順序を確定します。

### EFFECT-014 Postprocessの全体有効状態

`Stretch`、`Distort`、`Mirror`、`Kaleidoscope`、`Voronoi`、`Glass`のいずれか一つ以上が有効な場合、Postprocess全体を有効状態として表示します。Postprocessのプロパティモジュールには各レイヤーの個別ON／OFFを表示せず、レイヤーの有効状態はEffect Stackで管理します。プロパティモジュールではPostprocess全体のON／OFFと、選択レイヤーの詳細プロパティを表示します。Postprocessの全レイヤーが無効な場合は全体も無効状態になります。

### EFFECT-003 固定段と描画順

V2の全体順序は `Base → Surface → Main Stack → Prism → Flow Gradient → Particles` です。Normal/MatcapはSurface、PrismはGlowを含む専用段、Flow GradientはGPU密度・Temporal TrailをGradient Rampへ合成する固定段、Particlesは最終オーバーレイとして扱い、これらを主スタックの並べ替え対象には含めません。固定段の有効状態とパラメータはSANDBOXで編集し、Effect Stackには表示しません。Flow Gradientを無効にした場合は、従来のParticlesまでの経路を使用します。

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

### EFFECT-004 DiffuseとImage Gradient Source

Diffuseは主スタック内の一つのレイヤーです。旧来の固定最終段として別に二重適用しません。Image Gradient Sourceが有効なとき、画像本体の形状・アルファを変える `Stretch`、`Distort`、`Mirror`、`Kaleidoscope`、`Voronoi`、`Glass` は保護経路の対象外となり、色場の契約を壊さないよう扱われます。手描き`Distort`の編集・描画入力はPostprocessの設定を正規値とし、旧`manualDistort`はPreset移行用の互換値としてのみ扱います。

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

Preview、Preset thumbnail、静止画・連番・動画のレンダリングは、Glass（GLASS V2）の色設定を含む同じ正規化されたEffect Pipelineとシーン評価を共有します。出力形式ごとに別のHue、Saturation、Tint計算を持ちません。外部画像が保存されないPresetのthumbnailは、画像入力なしで安全に生成できるフォールバック状態から作成します。

有効レイヤーが増えるほど描画パスや中間バッファのコストが増えますが、現在は固定FPSや固定レイテンシの数値保証を置きません。性能を変更する場合は、対象構成・解像度・GPU・測定方法を変更仕様へ明記します。

### EFFECT-008 GLASSの決定性

Effect StackのGlassは、同一の入力texture、同一のパラメータ、同一のnormalizedTime、同一のEffect Stack順序に対して、直前の描画履歴やevent loopの状態に依存しないRGBA結果を返します。描画にはGLASS V2専用programを使用し、export中に描画program、fallback方針、render planを変更しません。

### EFFECT-009 Glassの色調整

Glassは、既存の表面形状、屈折、波長依存分散を維持したまま、色収差成分のHueとSaturation、透過光のTint、ハイライトのTintを個別に調整できます。Chromatic Aberrationは`0..80px`、Hueは`-180°..180°`、Saturationは`0..200%`、Tintは`#RRGGBB`で保持します。

Hueの既定値は`0°`、Saturationの既定値は`100%`、両Tintの既定値は`#FFFFFF`です。すべて既定値の場合は変更前のGLASS V2のRGBA計算をそのまま使用します。Hue／Saturationは入力Gradient全体ではなく色収差残差だけへ作用し、Tintは透過光とハイライトへ独立して作用します。

### EFFECT-010 主スタック順序のランダム化

ユーザーがランダム化操作を実行すると、主スタック9種類の順序だけをランダムな順列へ変更します。各レイヤーの有効状態、レイヤー設定、選択中の種類、Prism／Particlesなど固定段の状態は変更しません。ランダム化は描画フレームやexportフレームごとには実行せず、ユーザー操作時に一度だけ実行します。

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

### EFFECT-017 Slitのduration基準ループ

AnimationとSlitが有効な場合、Slitは`animMode`（Loop／PingPong）と`offsetSpeed`だけで連続アニメーションします。`phaseSpeed`および位相モーションの自動トラックは存在せず、旧Presetに残る値は無視します。キャンバス再生と書き出しは、Easing・Animation Speed・Durationを反映した同じ秒ベースのアニメーション時計を使います。Offset Speedが0またはModeが`off`のときはSlitの自動動作を停止します。旧Presetに残る`autoLoop`やTimeline Loopの状態は描画へ影響させません。

Slitのshader位相は、秒ベース時計のduration周期に対して閉じた周期として計算します。Duration周期内のサイクル数は`abs(offsetSpeed) * loopPeriod`に最も近い1以上の整数へ量子化し、Loop／PingPong／Waveの周期関数がduration境界で同じ位相になるようにします。これにより既定の5秒再生でも、5秒時点から0秒時点へ戻る際にスリット位置が不連続になりません。正負のOffset Speedは進行方向を維持し、秒ベースの`slitAnimationTime`自体は変更しません。

### CLOTH-001 SANDBOX 3D 布メッシュ Base Generator

SANDBOX内に Three.js (`ClothGradientRenderer`) を用いた 3D 布状メッシュ描画モジュールを追加する。波打つ頂点変形、変形後法線計算、環境光・スポットライトによる立体陰影処理を適用し、K-GG 既存の Gradient Ramp (`stops`, `opacityStops`, `rampInterpolation` 等) からの色決定結果（Ramp Lookup）を統合してビジュアルを生成する。

ランプ適用の順序は「ライティング・スペキュラー・フレネルから計算した白黒シェーディングの輝度をランプのインデックスとして使う」方式で、ピクセルの色は常に Gradient Ramp から決定される。Ramp 信号は白黒輝度のみで構成され、旧加重合成（`lightWeight` 等）は行わない。スペキュラー色・フレネル色は白黒輝度への加算係数としてのみ使用し、ランプ適用後の色に色相を加算しない。`rampOffset` は白黒輝度への加算として維持し、`rampLow` / `rampHigh` / `shadingMix` は廃止された。

### CLOTH-002 オフスクリーンテクスチャ転送と Effect Stack 完全分離

Three.js の描画は非表示 Offscreen Canvas で行い、そのレンダリング結果を K-GG の WebGLContext 側 `ctx.gradTexture` へ `gl.texSubImage2D` で転送する。画面上に直接別 Canvas を重ねず、既存の全 Effect Stack (Noise, Slit, Stretch, Distort, Mirror, Kaleidoscope, Voronoi, Glass, Diffuse, Normal Map, Prism, Particles) への入力 Base Texture として供給する。

### CLOTH-003 Preset 永続化とエラーフォールバック

Cloth の全パラメータ (Surface Wave, Organic Motion, Lighting, Specular, Fresnel, Ramp, Quality) は Preset 保存スナップショットおよびストアに永続化され、旧 Preset 読み込み時も安全に初期化される。レンダラーの初期化や描画に失敗した場合は黒画面を起こさず既存 Base Gradient に自動フォールバックする。旧 Preset に残る廃止キー（`lightWeight`, `heightWeight`, `fresnelWeight`, `flowWeight`, `rampLow`, `rampHigh`, `shadingMix`）は無視され、残りのパラメータは正規化される。

### SANDBOX-001 SANDBOX パネルモジュールの拡張

SANDBOX パネルのモジュール選択肢に `Cloth` を追加し、アクティブカウント表示を `4/4` に更新する。モジュールの ON/OFF 状態およびプログラミングステータス（applied / fallback / preparing）を UI 上に可視化する。

### EFFECT-020 Cloth表示アダプター

Cloth表示はEffect Stackの新しい段階ではなく、処理済みCanvasを受け取る後段の表示アダプターです。Effect Stackの有効状態、順序、処理結果はCanvas表示とCloth表示で共通です。3D表示の入力ではCloth Baseを二重適用せず、CanvasTextureをクロスのUVへ割り当てた後に表面変形・ライティングを一度だけ行います。

表示面の切り替えはSANDBOXのCloth／ConeモジュールのON/OFFで行います。Effect Stackの操作領域やPreview右側に、別のPreview Surface設定を追加しません。

### EFFECT-021 Cone表示アダプター

Cone表示はEffect Stackの新しい段階ではなく、処理済みCanvasを受け取る後段の表示アダプターです。Cloth Baseを含む現在のGradient／Effect Stack／SANDBOX結果をCanvasTextureとして読み込み、描画完了フレームの通知に同期して、照明計算を持たない円錐内面へ表示します。ConeはMapping、キャンバス上の頂点ハンドル、Seam Blend、Mirror Repeat／Edge Weld／Gradient ReapplyのSeam Modeを表示アダプター内で処理し、Gradient Reapplyでは処理済みCanvasのRGB色場を端色へ補正して中心alphaを保持します。Mapping設定が変わった場合も最後に完了した処理済みCanvasへ同じ時刻で即時再マッピングします。Gradient Rampは右サイドバーで編集し、同じ処理済みCanvasへ反映します。Coneの選択や設定はEffect Stackの有効状態、順序、処理結果を変更しません。

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
