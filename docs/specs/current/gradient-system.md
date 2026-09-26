---
type: current
id: CURRENT-GRADIENT
title: Gradient System
status: current
owners: [maintainer]
created: 2026-07-27
updated: 2026-09-21
requirement_ids: [GRAD-001, GRAD-002, GRAD-003, GRAD-004, GRAD-005, GRAD-006, GRAD-007, GRAD-008, GRAD-009, GRAD-010, GRAD-011, GRAD-012, GRAD-013, GRAD-014, GRAD-015, GRAD-016, GRAD-017, GRAD-018, GRAD-019, GRAD-020, GRAD-021, GRAD-022, GRAD-023, GRAD-024, GRAD-025, GRAD-026]
related_adrs: [ADR-0001, ADR-0003, ADR-0010, ADR-0013]
related_changes: [CHANGE-001, CHANGE-010, CHANGE-024, CHANGE-025, CHANGE-030, CHANGE-031, CHANGE-032, CHANGE-037, CHANGE-039, CHANGE-040, CHANGE-045, CHANGE-048, CHANGE-049]
related_code: [src/types/gradient.ts, src/types/flowGradient.ts, src/types/imageGradient.ts, src/types/renderView.ts, src/types/coneView.ts, src/store/gradientStore.ts, src/lib/gradientRampUtils.ts, src/lib/flowGradientRenderer.ts, src/lib/flowSimulation.ts, src/lib/gradientPreview.ts, src/lib/meshGradientField.ts, src/lib/sceneEvaluation.ts, src/lib/webgl.ts, src/lib/webglCapability.ts, src/lib/webglShaderSources.ts, src/lib/clothGradientRenderer.ts, src/lib/coneView.ts, src/lib/coneSeam.ts, src/lib/processedCanvasClock.ts, src/lib/presetModel.ts, src/components/GradientRamp.tsx, src/components/CustomSelect.tsx, src/components/ColorPicker.tsx, src/components/ColorPaletteGenerator.tsx, src/components/GradientCanvas.tsx, src/components/SandboxPanel.tsx, src/components/FlowGradientPanel.tsx, src/components/ClothGradientPanel.tsx, src/components/ClothCanvas.tsx, src/components/ConeApexEditor.tsx, src/components/ConeViewPanel.tsx, src/components/ExportPanel.tsx, src/lib/videoExportFrames.ts, src/adapters/types.ts, src/lib/colorSpace.ts, src/lib/cubehelix.ts, src/lib/perceptualGradient.ts, src/lib/gradientGenerator.ts, src/i18n/uiLabels.ts, src/i18n/messages.ts]
related_tests: [src/types/gradient.test.ts, src/types/coneView.test.ts, src/lib/flowSimulation.test.ts, src/lib/flowGradientPreset.test.ts, src/lib/meshGradient.test.ts, src/lib/proportionalRampEdit.test.ts, src/lib/sceneEvaluation.glass.test.ts, src/lib/gradientPreview.test.ts, src/lib/videoExportFrames.test.ts, src/lib/coneView.test.ts, src/lib/coneSeam.test.ts, src/lib/webglCapability.test.ts, src/lib/processedCanvasClock.test.ts, src/components/ConeApexEditor.test.tsx, src/components/CustomSelect.test.tsx, src/lib/cubehelix.test.ts, src/lib/perceptualGradient.test.ts, src/lib/gradientGenerator.test.ts, src/lib/effectPipeline.test.ts, src/components/PostprocessStackPanel.test.tsx]
---

# Gradient System

## 目的

Gradient Systemは、色と透明度のRamp、空間的な配置、画像由来の入力、Mesh Gradation、アニメーション可能な勾配状態を一つの編集対象として扱います。ここでいう「グラデーション」は、ランプだけでなく、ランプへ渡す座標・入力値も含みます。

## 現在の要件

### GRAD-001 対応するグラデーションとRamp

現在は `linear`、`radial`、`fourcolor`、`diamond`、`angle`、`bezier`、`mesh` の7種類を選択できます。各グラデーションは色ストップを持ち、必要に応じて透明度ストップを持ちます。色の補間方式、色空間、変数、繰り返し、ミラーはRampの設定として保存されます。

色ストップの位置は0〜1の範囲、色はHex値として扱います。編集後や外部データ読込後も、描画へ渡す前に安全な値へ正規化します。

### GRAD-002 アンカーとBezier

通常のグラデーションはUV空間のアンカーを使い、グラデーションの種類に応じて必要なアンカーを解釈します。Bezierは2つの制御点を持ち、アンカーと併せて曲線軸を定義します。利用者が選択したグラデーションの変更は、種類に対応する既定アンカーを適用します。

### GRAD-003 Image Gradient Source

Image Gradient Sourceを有効にすると、画像の `luminance`、`red`、`green`、`blue` のいずれかをRamp入力として使えます。画像チャンネル値とアンカー配色値の寄与は、0〜1のAnchor Influenceで混合します。元画像の読込状態や画像データ自体は設定スナップショットへ含めず、再起動後・別環境では再読込が必要です。

画像が利用できない場合は、保存された設定を破棄せず、通常のグラデーションへ安全にフォールバックします。画像のアルファとCover配置は、画像グラデーションの外部契約です。

### GRAD-004 Mesh Gradation

Mesh GradationはN×Mセル（縦横 (rows-1)×(columns-1)）のCoons Patchグリッドです。`gradient.mesh` に頂点格子 `points`（rows×columns、row-major）、セル間で共有される辺ごとの2つの三次Bezier制御点 `edgeHandles`、色モード `colorMode` を保持します。既存の単一2×2パッチ（`corners`/`handles`）データは後方互換として同一形状へ導出され、保存時も旧フィールドへ同期されます。

メッシュの色は2つのモードを持ちます。

- **ランプ対応（`colorMode:'ramp'`・既定）**: メッシュ全体が共有グラデーションランプで塗られます。各頂点の色はグリッドの縦位置 v（下辺=0→上辺=1）でランプをサンプルし、セル内部も頂点色の単純補間ではなく、同じ論理v座標でランプを連続サンプルして決まります。これにより、2×2の初期状態でもランプ途中のstopが実際のメッシュ色へ反映されます。グラデーションランプのカラーストップを編集すると、メッシュ全体の色が即時追従します。コーナーごとのランプ位置指定（旧 `colorPositions`）はありません。
- **直接色（`colorMode:'direct'`）**: 各頂点が直接Hex色 `pointColors` を持ち、キャンバス上の点をクリック→色スウォッチ→Tweeq ColorPickerで個別編集できます。directへ切り替えた瞬間は現在のランプ色（v軸）が各点へ初期化され、以後は点ごとのHexがランプと独立して使われます。1点の変更は他点に影響しません。

ランプ対応モードでは、キャンバスに各カラーストップのv位置を示す色付きガイド線とラベルを表示します。ガイド線はメッシュの形状に沿って横断し、右サイドバーのランプで選択したstopと同じ番号・色を使います。キャンバス上のラベルをクリックすると、対応するstopをサイドバーでも選択できます。Rampのrepeatが多い場合は、視認性のため最初のサイクルを表示し、繰り返し回数をガイドに明示します。

右サイドバーのGradient Rampには、Meshの各行の点をRamp上の対応位置へ表示します。初期2×2では`BL`/`BR`がv=0、`TL`/`TR`がv=1に並び、点ラベルをクリックするとキャンバス上の対応点が選択されます。repeat/mirror時は、実際にサンプルされるRamp位置（t）も表示します。directモードではRampとの対応を表示せず、点ごとの色がRampから独立していることを明示します。

キャンバス上では外側と内部の全頂点をドラッグして変形し、セル共有エッジの制御点をドラッグして境界を曲げられます。行・列の点数（2〜8）は変更でき、変更時は現在のCoons形状上で頂点を再サンプルします（directモードでは点色も再サンプル）。色モード切替は、右サイドバーのグラデーション形式下にあるMeshセクションで行います。

Meshの任意頂点の位置はキーフレーム対象です（`mesh.point.*.{x|y}`）。directモードでは頂点の色もキーフレーム対象です（`mesh.point.*.{r|g|b}`）。旧 `mesh.corner.*` は2×2グリッドの該当コーナー頂点として評価します。座標は有限値へ正規化され、描画の数値計算を不安定にする極端な値は制限されます。

### GRAD-005 アニメーションとキーフレーム

アニメーション状態は、再生の有効化、ループ、速度、強度、継続時間、FPS、方向、イージング、機能別の影響範囲を持ちます。Rampの色・位置・透明度、通常アンカー、Bezier制御点（`bezierControl.*`）、Meshの全頂点位置は安定したプロパティIDを持つキーフレームで編集できます。

Bezierでは、制御点を個別にキーフレーム記録でき、アニメーション中も補間された位置で表示・編集されます。Meshの頂点の色は、ランプ対応モードではランプの色ストップが駆動し、直接色モードでは点色キーフレーム（`mesh.point.*.{r|g|b}`）が駆動します。

勾配固有の可変部分と、Noise・Diffuse・Slit・Stretch・Postprocessなど他領域の自動/キー制御は別のトラックとして扱います。機能が無効な場合、その機能に属するトラックは描画へ反映しません。

### GRAD-006 保存・読込と後方互換性

Gradientの状態はPresetの状態スナップショットに含まれます。古いデータで欠落している任意フィールドは既定値で補完し、未知・非有限・範囲外の値は正規化します。Meshがない旧Presetは従来のGradientとして読み込み、Meshの描画は有効にしません。

既存の `gradientType` 識別値と、Rampの旧値を読み込める互換性は維持します。保存形式を変更する場合は、Gradient Systemの変更仕様と必要なADRを先に作成します。

### GRAD-007 描画経路の一貫性

通常プレビュー、静止画、連番、動画のシーン評価は共通の時間評価と描画経路を使用します。Presetサムネイルも保存時の正規化状態から1フレームを描画します。WebGLを利用できない場合の軽量プレビュー（2D Canvasフォールバック）は、互換性を保つためのフォールバックであり、同一の描画実装そのものではありません。フォールバック時はエフェクトスタック（Diffuse等）の効果は適用されず、グラデーション（Meshを含む）のベース表示のみとなり、キャンバス上部に「プレビュー／ベースのみ」バッジで明示されます。グラデーションのアンカー・制御線はフォールバック時も表示・編集できます。

Image Gradient Sourceでは、画像本体の形状・アルファを固定し、色場だけに対象の変形を適用する保護経路を使用します。対象外となる形状変形系レイヤーの扱いはEffect Stackの現行仕様とADR-0010に従います。

### GRAD-008 編集時の境界条件

Rampの位置・透明度・アンカー・Meshの座標は有限値と範囲を確認してから保存・描画します。ストップの編集はRampの範囲外へ移動させず、既存のストップIDを保つことでキーフレームとの対応を維持します。手動入力や破損したPresetが正規化できない場合は、アプリ全体を壊さず対象状態を既定値へ戻します。

### GRAD-009 Ramp候補の結果プレビュー

GradientRampのColor ModeとInterpの選択肢は、現在の色ストップと不透明度を候補へ適用した場合の色のつながりとして表示します。Color Mode候補は色相系ならNear、それ以外ならEaseを既定補間とし、Interp候補は現在のColor Modeを維持します。SHOW PREVIEWSが有効なときは通常のセレクトトリガーとホバー展開を表示せず、候補グリッドのボタンを直接選択面として使います。無効時は従来のホバー／クリック選択UIへ戻ります。プレビューは選択前の比較表示であり、候補を選択するまでRamp状態を変更しません。

### GRAD-010 Rampプレビューの常時表示

Color Mode／Interpの候補プレビューは、ボタンで常時表示へ切り替えられます。常時表示中は候補グリッド上のボタンから直接選択でき、空のセレクトトリガーやホバー展開は表示しません。無効時は従来のホバー／クリックで開く選択UIを維持し、常時表示状態はPresetへ保存しません。

### GRAD-011 Color Palette Generatorの対象

Color Palette GeneratorにはGradient Generatorだけを表示します。画像からの色抽出と、類似色・補色・トライアドなどの配色補助は提供しません。Gradient Rampにある既存パレットの保存・読み込みと、Image Overlay／Mask機能には影響しません。

### GRAD-012 Gradient Generatorのプレビューと操作位置

Base / Start Colorの次にGradient Previewと生成色ストップを表示し、その直後にAlgorithmを配置します。「Shuffle」と「Apply to Gradient」はAlgorithmの直後に固定表示し、Familyや可変設定の数によって位置が変わりません。

### GRAD-013 GradientRampの操作順序

GradientRampは、グラデーション形式／タイプの直後に色・不透明度ストップの編集ランプとストップ操作を表示し、その後にColor Mode／Interpと候補プレビュー、その他の設定、Color Palette Generatorを表示します。候補プレビューの展開・縮小で、頻繁に操作するストップ編集の位置を入れ替えたり、編集を無効化したりしません。表示プレビューの状態は保存形式へ含めません。

### GRAD-014 生成ストップの編集

Generator上の各色ストップを選ぶとTweeqのColor Pickerで個別に編集できます。編集はGeneratorのGradient Previewへ即時反映し、「Apply to Gradient」を押すまで現在のGradient状態を変更しません。生成値へ戻す操作も用意します。生成条件を変えると手動色編集と選択状態をリセットし、新しい生成結果を表示します。

### GRAD-026 連続軌道にもとづくGradient Generator

Gradient Generatorは選択したBase / Start Colorから色相を取得し、既存の多色生成ロジックで連続した色軌道からGradient stopを生成します。Base Colorそのものを最初のstopへ固定せず、Hue、Color Intensity、Brightness、Contrastを各アルゴリズムの軌道へマッピングします。Hue Travel入力は表示しませんが、従来の既定値0.5を内部で維持し、元の色相移動を保ちます。既定stop数は5、適用可能なstop数は3〜10です。内部の軌道評価・知覚的再サンプリングはユーザー向けstop数と分離し、通常128サンプルを使います。

Algorithmは次の2方式を切り替えられます。

- **Cubehelix**: Dave GreenのCubehelix原式（start hue、signed rotations、hue amplitude、gamma、lightness start/end）を使います。Base ColorのHueをstart hueにし、従来のHue Travel既定値0.5からrotationを導出します。Color Intensityはhue amplitude、Brightnessはgammaとlightness range、Contrastはlightness rangeへ元の式で反映します。RGB値は有限値・sRGB範囲へ安全に収めます。原式の参照実装は[Dave GreenのFortran reference implementation](https://people.phy.cam.ac.uk/dag9/CUBEHELIX/cubhlx.f)です。
- **Perceptual**: OKLCH上でHue、Lightness、Chromaを1本の滑らかなtrajectoryとして評価します。Base ColorのHueを起点に、従来のHue Travel既定値180°を使って色相を移動します。Sweep、Soft、Pastel、Deep、AccentのfamilyごとにHue移動量、Lightness、Chromaの式を変え、各位置のsRGB最大Chromaを二分探索してから変換します。範囲外の色はRGBを単純clampせず、LightnessとHueを保ちながらChromaを下げます。OKLab距離の累積arc lengthによる再サンプリングは、元のparameterizationとblendしてAccentなどの局所的な変化を保持します。

FamilyとAccent位置／幅はアルゴリズム固有値へ安全範囲でremapします。ShuffleはランダムなHex色列を作らず、開始色と生成パラメータを変えます。Gradient Previewは生成stop列を既存の`buildGradientPreviewStyle`で表示し、Apply時は同じsRGB linear stop chain（repeat 1、mirror off）を`applicationCommands.setGradient()`へ渡すため、Generator previewとGradient Rampの表示条件を一致させます。Preset形式とGradient Rampの既存補間処理は変更しません。

### GRAD-015 Preview表示アダプター

Previewは2D Canvasを既定とし、Effect Stack内で有効なConeレイヤーは通常のstack passとしてCanvas出力へ投影されます。レイヤー順を変更するとConeの入力textureと後段への出力位置も変わります。SANDBOXのEdit LayerでClothをONにするとCloth表示アダプターへ切り替わり、そこでは現在のMain Stack出力を入力します。Coneの有効状態と順序は`effectPipeline.effectStack`としてPresetへ保存します。Cone pass自体は既存メインWebGLコンテキストを使い、独立したThree.js表示面や保存対象のカメラを作成しません。

### GRAD-016 処理済みCanvasのClothマッピング

3D Clothは既存のGradient／Effect Stackで処理したCanvasをCanvasTextureとして読み込み、Three.jsクロスメッシュのUVへ直接マッピングします。3D表示時は2D入力キャンバスからCloth Baseを外し、クロス変形と表面ライティングを一度だけ適用します。Curl／Noise／Distortなどの2D結果はテクスチャとして布の波打ちに追従します。

### GRAD-017 2D互換とフォールバック

CanvasはCloth初期化中も描画を継続します。Cloth Rendererが利用できない場合は2D Canvasへ戻り、既存のアンカー、オーバーレイ、編集UIを利用できます。

### GRAD-018 Preview表示面の書き出し

ExportはPreviewと同じ`renderSceneAtTime`／render-plan経路でフレームを生成します。Coneレイヤーが有効な場合はその位置で処理済み前段textureをCone shader passへ入力し、その出力と後続レイヤーを含む最終WebGL CanvasをPNG／JPG／WebP、連番PNG ZIP、MOV／MP4／WebM／GIFへ渡します。Cloth表示モードは既存Cloth Renderer Canvasを使用します。Cone専用の別Canvasをキャプチャせず、PreviewとExportで別のCone合成処理を持ちません。

### GRAD-019 Cone面へのstack texture投影

Coneレイヤーは前段textureを画素レイと開口円錐面の交差から得たU/VへサンプルするGPU passで投影します。横方向は円周、V方向は円錐の頂点から開口部への元のCone UVを維持し、出力は元textureの色を保った不透明なCone表示です。MappingはnormalizedTimeでV offsetを進めるFlowと、V offsetを固定するDirect Projectionから選択できます。頂点はCanvas上の専用ハンドルをドラッグしてCanvasの外側まで移動でき、Apex X／Apex Yは正規化値-2..2（Canvasの幅・高さに対して最大50%外側）へ制限します。頂点ハンドルはシアン色の単一円形ボタンで、補助リング・十字線・内側マーカーを表示しません。開口部は四隅を覆う半径を維持するため、1:1、横長、縦長のCanvasに背景を露出しません。Coneは元のUnlit・不透明な表示契約を維持し、ライティング、スペキュラー、フレネルを追加しません。右サイドバーのGradient Rampは前段textureに反映され、その色場がConeへ渡ります。頂点ハンドルとグラデーションアンカーはCanvas上へ重ね、頂点はUIのリセット操作で中央へ戻せます。

### GRAD-020 Cone Texture Flow

ConeのTexture Flowは共通のnormalizedTimeと整数Flow Cycles（-30..30）から位相を決めます。正数は頂点から開口部へ、負数は逆方向、0は停止として扱い、Previewの再生・停止・シークと連番・動画出力で同じ位相を使用します。Direct ProjectionではV offsetを固定します。Texture RepeatとFlow Cyclesの円周方向・高さ方向の境界は、0..0.5のSeam Blend幅とSeam Modeで連続化します。Mirror Repeatは反復座標を鏡面化し、Edge Weldは継ぎ目両側の端色を一つの不透明な最終色へ溶接します。Gradient Reapplyは直前textureの対向端色からRGB差分を求め、raised-cosine重みで中心サンプルのRGBへ再適用し、alphaは中心サンプルを保持します。方式はこの3つから切り替えられ、既定値はMirror Repeatです。各方式はアニメーション中も反復境界の位置を固定し、硬い直線や円形の切れ目、半透明レイヤーの重なりを表示しません。Depthは2..30で編集できます。

### GRAD-021 Flow Gradient Ramp mapping

SANDBOXのFlow Gradientは、3DエミッタからCurl場を固定ステップ積分し、透視投影後の速度方向付きDensityとTemporal Trailを0..1のスカラー値として既存Gradient Rampへ渡します。Flow専用の固定色は最終色にせず、Rampの色ストップ、透明度、補間設定をPreview、Thumbnail、静止画、連番、動画で共有します。深度は投影位置、splatサイズ、Density寄与へ反映され、Tileでは全画面基準の投影を切り出します。Flow OpacityはRamp適用後の最終合成強度、Particle Opacityは個々のsplatがDensityへ加える寄与、Particle Sizeは速度方向splatの長さ・幅を制御します。

### GRAD-022 Cone Color Reapply Seam

Coneの`Gradient Reapply`はCone passへ入力された直前のstack textureを色場として使います。U／V各軸の同じ位置にある対向端のRGB平均を目標色とし、継ぎ目からの距離に応じたraised-cosine重みで`center.rgb + (target.rgb - sideEdge.rgb) * weight`を0..1へクランプします。alphaは中心サンプルをそのまま保持し、端色のalphaやalpha差をシーム補正の重みへ使いません。四隅では軸補正後のRGBを4端色の平均へ`seamX * seamY`の重みで寄せ、両軸の重みが1のとき4端色の平均へ収束させます。既存のMirror Repeat／Edge Weldは別方式として保持し、同じshared seam shaderをPreviewとExportのWebGL stack passで使用します。

### GRAD-023 WebGL2能力不足時の3D viewフォールバック

WebGL2コンテキストを作成できないブラウザ／WebViewでは、メインのGradient CanvasとSANDBOXのCloth表示を既存2D fallbackへ委ね、編集を継続できます。Cone passはMain StackのWebGL2 shaderを必要とし、別のThree.jsコンテキストへ切り替えません。この状態は想定済みの能力不足として扱い、同一ページ内の再マウントでWebGL2コンテキスト作成を繰り返しません。WebGL2が利用可能な場合は、作成済みコンテキストを使うPreview／Export経路を維持し、context lost／restored時は能力状態を再評価します。

### GRAD-024 Meshグリッドの色モード

メッシュは「ランプ対応」と「直接色」の2つの色モードを持ち、右サイドバーのMeshセクションで切り替えます。

- ランプ対応（既定）: グリッド縦位置 v に沿って共有ランプを連続サンプルし、頂点とセル内部の色へ反映する。ランプ編集がメッシュ全体へ追従する。Ramp上には各メッシュ行の点ラベルと対応位置を表示する。
- 直接色: 各頂点が直接Hex色 `pointColors` を持つ。切替時は現在のランプ色（v軸）を初期化し、以後は点クリック→色スウォッチ→Tweeq InputColorで個別編集できる。1点の変更は他点に影響しない。

### GRAD-025 Bezier制御点とMeshグリッドのMCP操作

kgg-control/MCPには、Bezier制御点の移動（`set_bezier_control`）、Meshグリッド寸法（`set_mesh_grid_size`）、グリッド点位置（`set_mesh_grid_point`）、色モード切替（`set_mesh_color_mode`）、グリッド点色（`set_mesh_grid_point_color`）の操作があります。UIの編集操作とMCPの操作は同じデータを同じ範囲・検証で変更します。

## 他領域との関係

- Preset Systemは、Gradientの設定、キーフレーム、関連するエフェクト設定を状態スナップショットとして保存します。
- Effect Stackは、Gradientを生成した後の色場・画像場を処理します。Image Gradient Sourceの保護動作は両仕様にまたがります。
- Animationは、Gradientの一部プロパティと各エフェクトの時間評価を共通の時刻で評価します。

## 変更履歴

- 2026-09-21: Color Palette GeneratorをGradient Generatorだけに整理し、基準色の色相を起点にする多色生成、Algorithm直前のプレビュー、個別ストップ編集を現行仕様化。

この現行仕様の初期整理に参照したLegacy Change Specificationは次のとおりです。

- 2026-09-18: Color Palette GeneratorへCubehelix／Perceptual Gradient Generatorを追加し、GRAD-026として連続軌道・gamut mapping・適用条件を現行仕様化。

- [SPEC-009 Image Gradient Source](../SPEC-009-image-gradient-source)
- [SPEC-019 Gradient Rampストップ編集](../SPEC-019-proportional-gradient-stop-editing)
- [SPEC-030 Image Gradient保護描画](../SPEC-030-image-gradient-protected-rendering)
- [SPEC-040 Mesh Gradation](../SPEC-040-mesh-gradation)
- [SPEC-031〜033 アニメーション関連](../index#legacy-change-specifications)

Legacy SPECは変更理由と当時の受け入れ条件の履歴であり、現在の要件を読むための必須資料ではありません。SPEC-008は未承認のため、この現行仕様の根拠に含めていません。

## 未確認・今後の現行仕様化

本書はコードと自動テストで確認できる現在の契約を中心に整理しています。実機GPUごとの描画品質、全GradientTypeのPreview/Exportの画素一致、巨大画像の性能保証はこの移行では再計測していません。変更時は手動確認結果を変更仕様のvalidationへ記録してください。
