---
type: current
id: CURRENT-UI-CONTROLS
title: UI入力コントロール
status: current
owners: [maintainer]
created: 2026-07-28
updated: 2026-09-26
requirement_ids: [UI-001, UI-002, UI-003, UI-004, UI-005, UI-006, UI-007, UI-008, UI-009, UI-010, UI-011, UI-012, UI-013, UI-014, UI-015, UI-019, UI-021, UI-022, UI-023, UI-024, UI-025, UI-026, UI-027, UI-028, UI-029]
related_adrs: [ADR-0009, ADR-0011, ADR-0012, ADR-20260926-native-secondary-windows]
related_changes: [CHANGE-010, CHANGE-012, CHANGE-013, CHANGE-014, CHANGE-015, CHANGE-018, CHANGE-019, CHANGE-024, CHANGE-025, CHANGE-026, CHANGE-027, CHANGE-030, CHANGE-031, CHANGE-032, CHANGE-034, CHANGE-037, CHANGE-038, CHANGE-039, CHANGE-041, CHANGE-046, CHANGE-047, CHANGE-048, CHANGE-051, CHANGE-053]
related_code: [src/App.tsx, src/App.css, src/types/coneView.ts, src/components/CustomSelect.tsx, src/components/GradientRamp.tsx, src/features/gradientRampEditor/GradientRampEditorWindowApp.tsx, src/features/gradientRampEditor/useGradientRampEditorHost.ts, src/adapters/tauri/gradientRampEditorWindow.ts, src/main.tsx, src-tauri/src/gradient_ramp_editor.rs, src-tauri/capabilities/gradient-ramp-editor.json, src/components/SliderField.tsx, src/components/NoiseDistortionPanel.tsx, src/components/BlockNoisePanel.tsx, src/components/DiffuseCurveEditor.tsx, src/components/SlitScanPanel.tsx, src/components/StretchPanel.tsx, src/components/TimelineBar.tsx, src/components/NormalMapPanel.tsx, src/components/SandboxPanel.tsx, src/components/FlowGradientPanel.tsx, src/components/ClothGradientPanel.tsx, src/components/ClothCanvas.tsx, src/components/ConeApexEditor.tsx, src/components/ConeViewPanel.tsx, src/components/PostprocessPanel.tsx, src/components/PostprocessStackPanel.tsx, src/components/PresetPanel.tsx, src/components/Toggle.tsx, src/lib/effectPipeline.ts, src/lib/parameterLimits.ts, src/lib/voronoi.ts, src/lib/glass.ts, src/lib/glassTile.ts, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/store/documentModel.ts, src/store/documentActions.ts, packages/kgg-control/src/parameterLimits.ts, packages/kgg-control/src/parameters.ts, src/types/flowGradient.ts, src/types/distortion.ts, src/i18n/uiLabels.ts, src/i18n/messages.ts, src/components/VideoMotionPanel.tsx, src/types/videoMotion.ts, src/lib/noiseSeed.ts]
related_tests: [src/adapters/tauri/gradientRampEditorWindow.test.ts, 'manual: Gradient Ramp editor native window on Tauri (WebView2)', src/lib/tweeqAngle.test.ts, src/lib/effectPipeline.test.ts, src/lib/parameterLimits.test.ts, src/lib/animationDirection.test.ts, src/lib/effectShaderParity.test.ts, src/lib/glass.test.ts, src/lib/postprocessAnimation.test.ts, src/store/gradientStore.glass.test.ts, src/lib/flowSimulation.test.ts, src/lib/flowGradientPreset.test.ts, src/lib/presetThumbnail.test.ts, src/types/coneView.test.ts, src/lib/coneView.test.ts, src/lib/coneSeam.test.ts, src/lib/webglShaderSources.test.ts, src/components/CustomSelect.test.tsx, src/components/ConeApexEditor.test.tsx, src/components/NoiseDistortionPanel.test.tsx, 'manual: Cone Effect Stack ordering and SANDBOX controls browser check', 'manual: Cone background coverage and color check', src/components/PostprocessPanel.test.tsx, src/components/PostprocessStackPanel.test.tsx, src/components/SandboxPanel.test.tsx]
---

# UI入力コントロール

## 目的

主要なパラメータ入力をTweeqの共通コントロールで表示し、通常のパネルとAnimationタイムラインで同じ値編集・選択操作を提供します。

## 数値パラメータの共通管理

登録された数値パラメータの範囲、step、整数指定、角度単位、既定値は packages/kgg-control/src/parameterLimits.ts の PARAMETER_LIMITS を一次情報とします。列挙選択肢とその既定値は ENUM_PARAMETER_LIMITS で管理し、アプリ側の src/lib/parameterLimits.ts は共通定義を再公開します。

共有キーを指定した SliderField、対応するストア初期値と読込正規化、描画パラメータの正規化、K-GG Controlの数値定義は同じレジストリを参照します。レジストリに登録されていないコントロールは、そのコントロール固有の範囲を使います。Noise Type切替時の NOISE_TYPE_PRESETS のように意味が異なるモード固有プリセットは、共通既定値とは別に管理します。

## 現在の要件

### UI-001 InputAngleの表示

Angle入力は、Tweeqのロータリーボタンと数値入力の両方を同じ行のInputAngle境界内に表示し、パネル幅が変わっても親レイアウトからはみ出したり、ラベルに対して上下へずれたりしません。ロータリーボタンのpaddingやSVGの寸法によって右端へオーバーフローさせません。アプリCSSではTweeqの実コンポーネント属性を使い、`Tweak`表記の誤ったセレクターを使用しません。直接入力、ドラッグ、キーフレーム編集は既存の角度値へ反映されます。

### UI-002 Seedのシャッフル

Noise、Slit、StretchのSeed行では、InputShuffleは対応するSeedスライダーの入力欄の下端に揃えて表示されます。シャッフル操作は既存のSeed値域と保存形式を維持します。

### UI-003 Slitの選択コントロール

SlitのModeはLinear、Circular、Polygon、WaveをInputDrumで選択できます。MotionはUnidirectional（Loop）とPingPongをInputRadioで選択し、Offset Speedだけで速度を調整できます。Phase SpeedおよびTimeline Loop切替は表示しません。Source ImageはSlitプロパティモジュール内の全設定とSeedの下端に置き、既存の読込・削除・エラー表示を維持します。

### UI-004 Animationの名称

日本語表示時もAnimationタブの名称は`ANIMATION`とします。英語表示のAnimation名称と、アニメーションの保存・再生動作は変更しません。

### UI-005 プレビュー付き選択肢のラベル

色プレビューを持つCustomSelectは、候補の色をボタン背面全体へ表示し、ラベルと開閉矢印を前面へ配置します。ホバー／クリックで開く選択肢と常時表示候補のどちらでも、選択肢名が左側の色サムネイルによって潰れない表示幅を確保します。`previewOnly`が有効な常時プレビューでは、セレクトトリガー、ドロップダウン、ホバー開閉を表示せず、候補グリッドのボタンだけを選択面として使います。Harmonyルールなどの候補名は型付きUI用語辞書で表示言語へ変換します。通常のCustomSelectは従来の操作を維持します。

### UI-006 VariableのTweeq入力

GradientRampでInterpがVariableの場合、VariableはTweeqのInputNumberで表示します。入力値は-1〜1、stepは0.001とし、既存のrampVariableへ有限値を反映します。native range inputは使用しません。

### UI-007 Glassの色コントロール

PostprocessのプロパティモジュールにはGlassを一つだけ表示し、その実体はGLASS V2です。ColorグループへChromatic Hue、Chromatic Saturation、Transmission Tint、Highlight Tintを表示します。HueとSaturationは数値編集、TintはTweeqのInputColorで即時に描画へ反映します。Transmission TintとHighlight TintのInputColorは同じ固定横幅で表示します。旧Glassの選択肢と`Glass V2`の別表示はありません。この変更では4項目にキーフレーム／自動アニメーション操作を表示しません。

### UI-028 Glassの表面種類・IOR・色収差サンプル数

GlassのSurface groupにはSurface Typeを表示し、Organic／Rippleを選択できます。OrganicはScale、Stretch、Rotation、Complexity、Warp、Seedを表示します。RippleはFrequency（`0.5..18`、step`0.1`、既定値`6`）、Depth（`0..1`、step`0.01`、既定値`0.35`）、Animation Speed（Animationループ1周あたり`1..8`周期、step`1`、既定値`1`）を表示します。Glass Surfaceは有機的に変化する形状を対象とし、Noise Distortion Influenceは両Surfaceで共通です。

Optics groupにはIORを`1.0..2.5`、step`0.01`、既定値`1.5`で表示します。説明文はIORが屈折、波長分散、Fresnel反射率へ作用する2Dスクリーン空間近似であることを伝えます。Chromatic StepsはChromatic Aberrationの近くに表示する`1..3`の整数スライダーで、既定値は1です。1は各shader経路の現行色分散サンプルを保ち、2..3はその経路の分散アンカー間を細分化します。新しいラベルと説明は英語／日本語に対応します。

### UI-008 Effect Stack探索操作

Effect Stackには主スタック11種類の順序をランダム化する操作を表示します。操作は既存の有効状態・選択状態を維持し、現在の描画結果から新しい順序へ滑らかに遷移します。主スタックの行位置もキャンバス遷移と同じ400msの`easeInOut`で、現在位置から移動します。主スタックの行またはそのオンオフToggleをAltクリックすると、その行だけを有効にするソロ操作になります。ソロ化によって新たに無効化された行は黄色の`STAY`で表示します。同じ対象を再度Altクリックするとソロ化前の有効状態へ戻ります。Altキーなしのクリック、トグル、ドラッグ並べ替えは既存の操作を維持します。Video Motionを選択しても、別のNoise／Glassレイヤーを選択した際に動画source/runtimeを破棄しません。

### UI-024 GlassTileの操作パネル

PostprocessのEdit LayerからGlassTileを選択できます。PatternとEdge Modeは選択入力です。Square／Diamond／Hexagon／Triangle／BrickではTile Size、Bevel、Surface Height、Curvature、Detail Scale、Roughnessを表示します。FacetedではFacet Density（`1..16`、step`0.1`、既定値`5`）とFacet Depth（`0..1`、step`0.01`、既定値`0.48`）を表示し、タイルのベベルやドームを使わない共有頂点の平面三角面を説明します。Rotation、Refraction、Dispersion、Mix、Seedは共通です。数値範囲と既定値は共通レジストリを使い、Edge Modeの選択肢と既定値も同レジストリで管理します。値はGlassの設定やレイヤーとは別にPresetへ保存します。

### UI-009 Effect Stackの表示形態

Effect Stackは常にワークスペース内のインライン表示のみで提供します。別ウィンドウ化（Document Picture-in-Picture、ポップアップ、TauriネイティブWebviewWindow）は行わず、操作ボタン自体を表示しません。ブラウザーでも同様に別ウィンドウ操作は提供せず、インライン表示に統一します。Gradient Ramp editorの表示形態はUI-029で定めます。

### UI-010 トップバーとSANDBOXのモジュール入口

TOPバーは左から`Diffuse`、`Noise`、`Slit`、`Postprocess`、`SANDBOX`、`Export`、`Preset`の順に表示します。`Stretch`はTOPバーの独立項目として表示せず、Postprocessのプロパティモジュールで編集します。PostprocessのプロパティモジュールはON／OFFと`Edit Layer`を表示し、選択したEdit Layerの詳細プロパティをその下で操作できます。`Edit Layer`は`Stretch`、`Distort`、`Mirror`、`Kaleidoscope`、`Voronoi`、`Glass`、`GlassTile`、`Video Motion`の順に選択肢を表示し、選択はEffect Stackの選択レイヤーと同期します。Effect Stackで`Stretch`を選択するとPostprocessのプロパティモジュールを開き、Scan Position、Band Height、Height Variance、Variation、Seed、Glowの各パラメータを表示します。Stretch、Distort、Mirror、Kaleidoscope、Video Motionなどの個別ON／OFFはプロパティモジュールに表示せず、いずれか一つ以上がEffect Stackで有効な場合にPostprocess全体をONとして表示します。SANDBOXの文字色はPostprocessと同じ通常色を使います。`Normal`と`Distort`も独立項目として表示しません。SANDBOXの左パネルにはPostprocessの`Edit Layer`と同じ選択要素を表示し、Normal、Prism、Particlesから一つを選択して既存の有効状態とパラメータを編集できます。モジュールのON／OFFと描画準備状態を確認でき、SANDBOXの選択状態はPresetへ保存しません。Video MotionはPostprocessの`Edit Layer`とEffect Stackから選択し、動画source/runtimeは別のEffect Stackレイヤー選択で維持します。DistortはPostprocessの`Edit Layer`で選択し、Effect StackとPostprocessの主スタック編集UIにPrism／Particlesの重複入口を表示しません。
### UI-011 Diffuseのモードと適応カーブ

DiffuseのモードはTweeqのInputDrumでBlock、Smooth、Dither、Halftone、ASCII、Stippleから選択できます。Halftoneの形状はInputRadio、ASCII文字セットはInputString、Halftone／ASCIIの背景色はInputColorで編集します。適応ソースと粒度適応の2本のBezierはTweeq InputCubicBezierを中心としたコンパクトな行で表示し、大きなSVGプレビューやヒストグラムは表示しません。

### UI-015 Stippleの編集UI

Stipple選択時はScatter、Grain、Seed、Seed Per Frameだけを表示し、適応Diffuse、適応Grain、Bezier、Halftone／ASCII、Dither専用の設定は表示しません。モードの表示名は`Stipple`、Presetへ保存する値は`legacy`です。

### UI-012 Slitのモーション速度

SlitのMotionにはLoop／PingPongのInputRadioとOffset Speedだけを表示します。位相速度は独立した入力・アニメーションパラメータとして持たず、キャンバスと書き出しは同じ秒ベースのSlit時計を使います。

### UI-013 共通Tweeq入力への統一

StretchのGlow TintはTweeq InputColor、Postprocess DistortのBrush ModeはTweeq InputRadioで編集します。InputColorの色相Wheel回転は既定感度を0.25とし、必要な利用箇所では`hueWheelSensitivity`で上書きできます。保存値と描画上の意味は変更しません。

### UI-014 SANDBOX Clothの表示設定

SANDBOXで`Cloth`を選択した場合、Quality、Surface Wave、Organic Motion、Lighting、Specular、Fresnel、Rampの詳細パラメータを同じプロパティモジュール内で編集できます。ClothモジュールのON/OFFが3D Cloth表示の切替も兼ねます。

### UI-019 Effect Stack Cone layerと設定

Coneは通常の自由順序`EffectStackKind`として表示し、他レイヤーと同じ選択、ON/OFF、drag、randomize、soloの対象にします。SANDBOXのEdit LayerからConeを除外し、SANDBOXモジュール一覧・アクティブ数には含めません。Coneを選択すると設定を左Postprocessパネル内に表示します。Mapping（Flow／Direct Projection）、Depth（2..30）、Rotation、Texture Repeat、Seam Mode（Mirror Repeat／Edge Weld／Gradient Reapply）、Seam Blend（0..0.5）、Flow Cycles（-30..30）を既存のTweeq数値入力で編集します。Seam Modeのプロパティ名と候補名は言語設定に関係なく`Seam Mode`、`Mirror Repeat`、`Edge Weld`、`Gradient Reapply`と英語で表示します。Gradient Reapplyは直前のstack textureのRGB色場を端色へ補正し、中心サンプルのalphaを保持します。Apex X／Apex Yの数値入力は表示せず、Coneが選択・有効なときCanvas上の単一シアン円形ハンドルで外側まで頂点位置を操作し、補助リング・十字線・内側マーカーは表示しません。リセットボタンで中央へ戻し、頂点の正規化位置は-2..2に制限します。既定のSeam ModeはMirror Repeatです。Direct ProjectionではFlow Cyclesを停止します。Gradient Rampは右サイドバーで前段textureへ適用し、Coneはその色場を維持します。グラデーションアンカー表示の切替はConeの頂点ハンドルにも適用します。照明や背景を変更するコントロールは表示しません。

### UI-021 SANDBOX Flow Gradient

SANDBOXのEdit Layerには`Flow Gradient`を表示し、固定段のON/OFFと設定編集を行えます。Flow GradientはSeed（0..9999整数）、Particle Count（10000..500000、1000刻み）、Curl Scale（0.1..20）、Curl Strength（0..2）、Speed（0..2）、Ribbon Width（0.5..128px）、Stretch（0..8）、Density（0..4）、Trail（0..1）、Contrast（0.1..4）、Flow Opacity（0..1、0.01刻み）、Particle Opacity（0..1、0.01刻み）、Particle Size（0.25..2、0.01刻み）を表示します。Flow Opacityは最終合成、Particle Opacityは各splatのDensity寄与、Particle Sizeは速度方向Ribbonの長さ・幅を調整します。値は共通parameterLimitsとnormalizerで扱います。LoopとLoop Durationは既存Animationの状態を参照し、Flow専用のDurationやDiffusion入力は表示しません。

### UI-026 Effect Stack Video Motion

Postprocessの`Edit Layer`とEffect Stackには`Video Motion`を表示し、動画選択、再生／停止、固定Modeの`Motion Feedback`、Effect Strength、Blend Amount、Feedback Amount、Decay、Smear Length、Stabilization、Motion Damping、Field Smoothingを操作できます。Mode選択は表示しません。動画入力は外部runtimeだけで保持し、PresetへはVideo Motionの設定値だけを保存します。正規化されたタイムライン時刻は読み込んだ動画のdurationへ対応付けます。`Motion Debug`では動画状態、lazy shader状態、処理サンプル数、fieldの平均／最大強度、活動率、平均方向、変化量、現在動画時刻とmapped時刻を確認でき、64×36 fieldを色と矢印で可視化できます。別のEffect Stackレイヤーを選択してもこのruntimeは継続します。

### UI-022 Cone Apex circular handle

Coneの頂点操作点は、シアン色の単一の円形ボタンとして表示します。外周の補助リング、水平・垂直の補助線、内側の別マーカーは表示しません。ドラッグ、`Reset Position`、`aria-label`、`title`は既存の操作契約を維持します。

### UI-023 Noise共通プロパティとType順序

Noiseが有効な場合、Type選択の直後に`Amount`、`Scale`、`Seed`をこの順序で表示します。`Seed`のShuffle操作は共通行へ置き、通常Noiseでは`noiseSeed`、Curl系では`curlSeed`を更新します。Type固有の設定はこの共通プロパティの後ろへ表示します。

Noise Typeの候補は、`Fast Curl`、`Curl (Legacy)`、`Simplex`、`Perlin`、`Aura Ridges`、`Fractal Drift`、`Domain Warp`、`Seamless`、`Voronoi`、`Caustics`、`Phasor Lines`の順で表示します。この順序はFlow、Base / Fractal、Warp / Periodic、Structured Fieldの性質が近い候補を隣接させ、Flow系を先頭へ置きます。候補の内部値と保存・描画上の意味は維持します。数値コントロールの範囲、step、既定値はUI-025の共通レジストリに従います。

`Perlin`（内部値`perlin`）は画面XYと時間Zを軸にした3D gradient Perlin noiseから、Material Makerの`FBM Noise(Perlin, Folds 1) → Invert → Tonality`に反転した2枚目レイヤーをLightenで重ねて`Tonality`をかけた構成と同等のスカラー場（After Effectsフラクタルノイズの「にじみ」に近い、暗い領域を横切る柔らかく光る筋）を作り、その値で`Direction`方向へUVを押し出します。時間経過では形状がその場で変形します。`Perlin`選択時だけ`Octaves`、`Roughness`（`noise.perlinRoughness`、主レイヤーのオクターブ振幅倍率）、`Sharpness`（`noise.perlinSharpness`、Tonality相当のカーブ強度）、`Layer Mix`（`noise.perlinLayerMix`、2枚目レイヤーの不透明度）、`Direction`（`noise.perlinAngle`、押し出し方向）、`Dimension`（`noise.perlinDimension`、`3D` / `4D (Loop)`）を表示します。`3D`は時間をZ軸に割り当てます。`4D (Loop)`は4D Perlinを使い、時間をZW平面の円周に割り当てるため、Loop Periodごとにクロスフェードなしで同じ形状へ正確に戻ります。4D (Loop)では周期性を保つためDirectionのドリフトを適用しません。4D (Loop)選択時だけ`Loop Wobble`（`noise.perlinLoopWobble`、0〜1、既定0.5）を表示し、ループ軌道を真円から、場所ごとの位相ずれ・速度と半径の揺らぎ・XYの小さな揺れを持つ閉曲線へ変えます。すべてループ角の整数倍の周期関数なので、Loop Periodごとに正確に元へ戻ります。`fBm`（内部値`fbm`）はPerlinで置き換えたため候補に表示しませんが、`fbm`で保存されたプリセットは従来どおり描画します。

### UI-025 数値入力範囲と既定値の共有

共通レジストリのキーを持つ数値入力は、そのキーに登録された範囲、step、整数指定、角度単位、既定値を使います。対応する保存データは同じ範囲へ正規化され、各数値入力のリセット値も登録済みの既定値を使います。パラメータの保存キーと型は維持します。旧Presetに範囲外の数値がある場合は読込時に登録範囲へ正規化します。

### UI-029 Gradient Ramp editorの表示形態

右サイドバーのGradient Rampにある`Open Gradient Ramp editor`ボタンでエディタを開きます。Tauri版ではK-GGのメインウィンドウとは別のネイティブウィンドウ（タイトル`Gradient Ramp - KAGARIBI Grad`、初期760×600、最小460×360、サイズ変更可）として開き、キャンバスを覆わずに編集できます。すでに開いている場合は新しく作らず、最小化を解除して前面へ出します。エディタウィンドウはメインウィンドウに従属し、メインウィンドウを閉じると一緒に閉じます。

エディタウィンドウには、タイトルバーのUndo／Redo、拡大したRampキャンバス、Mesh対応表示、Mirror、Repeat、カラーピッカーとストップ操作、パレットの保存・内蔵プリセット・ユーザーパレットを表示します。編集内容はメインウィンドウのGradient Ramp、キャンバス、キーフレームへ即時に反映され、メインウィンドウ側の変更やUndo／Redoもエディタへ反映されます。選択中のストップとGradientアンカーは両ウィンドウで共有します。Undo／Redo（ボタンとCtrl+Z／Ctrl+Y／Ctrl+Shift+Z）はメインウィンドウの履歴を操作します。

ブラウザー版、またはTauriでネイティブウィンドウを作成できなかった場合は、従来どおりワークスペース上にドラッグ・リサイズ可能なフローティングエディタを表示します。Preset形式と描画結果は変更しません。

### UI-026 Postprocess Voronoiの入力

PostprocessのVoronoiではCell Scale、Randomness、Distance Metric（Euclidean／Manhattan／Chebyshev／Minkowski）、Minkowski選択時のExponent、Feature（F1／F2／Edge）、Angle、Seedを編集できます。Distance MetricとFeatureの選択肢・既定値はNoiseのVoronoiと共通です。Gradient Scaleと旧Edge Widthの入力は表示せず、旧Presetに保存された値は読込互換のため保持します。

## 互換性

Mode、Motion、Seed、Animationの保存キーを維持し、旧PresetのautoLoopは読み込み時に破棄します。登録済み数値パラメータの既定値と範囲は共通レジストリで正規化します。Postprocess Voronoiの旧Gradient ScaleとEdge WidthはPresetの保存形式に残りますが、描画では使用しません。

## 検証上の留意事項

標準のローカル開発ブラウザーで各コントロールの表示とDOM種別を確認済みです。実機GPUごとの描画結果や、未確認の任意Viewportにおける画素単位の差異は本仕様の保証範囲外です。

### UI-027 オフラインのライセンス表示

ヘルプ内の「第三者ライセンス」からコンポーネント名・ライセンス名を検索し、同梱した本文・著作権通知とバージョン別ソースのリンクを閲覧できる。デスクトップ版ではオンラインURLを既定のブラウザーで開き、Web版ではブラウザー標準のリンク動作を使う。「オンラインドキュメント」は公開ドキュメントURLを開く。表示案内は日英に対応する。UIアニメーションはブラウザ標準機能を使用し、GSAPへ依存しない。動きを減らす設定では開閉アニメーションを省略する。
