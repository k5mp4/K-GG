---
type: current
id: CURRENT-GRADIENT
title: Gradient System
status: current
owners: [maintainer]
created: 2026-07-27
updated: 2026-08-13
requirement_ids: [GRAD-001, GRAD-002, GRAD-003, GRAD-004, GRAD-005, GRAD-006, GRAD-007, GRAD-008, GRAD-009, GRAD-010, GRAD-011, GRAD-012, GRAD-013, GRAD-014, GRAD-015, GRAD-016, GRAD-017, GRAD-018, GRAD-019, GRAD-020, GRAD-021]
related_adrs: [ADR-0001, ADR-0003, ADR-0010, ADR-0013]
related_changes: [CHANGE-001, CHANGE-010, CHANGE-024, CHANGE-025, CHANGE-030, CHANGE-032]
related_code: [src/types/gradient.ts, src/types/flowGradient.ts, src/types/imageGradient.ts, src/types/renderView.ts, src/types/coneView.ts, src/store/gradientStore.ts, src/lib/gradientRampUtils.ts, src/lib/flowGradientRenderer.ts, src/lib/flowSimulation.ts, src/lib/gradientPreview.ts, src/lib/imageGradient.ts, src/lib/meshGradientField.ts, src/lib/sceneEvaluation.ts, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/lib/clothGradientRenderer.ts, src/lib/coneView.ts, src/lib/coneViewRenderer.ts, src/lib/processedCanvasClock.ts, src/lib/presetModel.ts, src/components/GradientRamp.tsx, src/components/CustomSelect.tsx, src/components/ColorPaletteGenerator.tsx, src/components/GradientCanvas.tsx, src/components/SandboxPanel.tsx, src/components/FlowGradientPanel.tsx, src/components/ClothGradientPanel.tsx, src/components/ClothCanvas.tsx, src/components/ConeCanvas.tsx, src/components/ConeViewPanel.tsx, src/components/ExportPanel.tsx, src/lib/videoExportFrames.ts, src/adapters/types.ts, src/lib/clothView.ts, src/lib/colorHarmony.ts, src/i18n/uiLabels.ts, src/i18n/messages.ts]
related_tests: [src/types/gradient.test.ts, src/types/coneView.test.ts, src/lib/flowSimulation.test.ts, src/lib/flowGradientPreset.test.ts, src/lib/imageGradient.test.ts, src/lib/imageGradientProtected.test.ts, src/lib/meshGradient.test.ts, src/lib/proportionalRampEdit.test.ts, src/lib/sceneEvaluation.glass.test.ts, src/lib/colorHarmony.test.ts, src/lib/gradientPreview.test.ts, src/lib/videoExportFrames.test.ts, src/lib/clothView.test.ts, src/lib/coneView.test.ts, src/lib/processedCanvasClock.test.ts]
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

Mesh Gradationは単一の2×2 Coons Patchです。4つのコーナー、4辺それぞれの2つの制御点、4つの色位置、bilinear補間を `gradient.mesh` に保持します。MVPでは複数セルの編集や複数パッチは提供しません。

Meshのコーナーはキーフレーム対象ですが、辺の制御点と色位置は現在静的です。座標は有限値へ正規化され、描画の数値計算を不安定にする極端な値は制限されます。

### GRAD-005 アニメーションとキーフレーム

アニメーション状態は、再生の有効化、ループ、速度、強度、継続時間、FPS、方向、イージング、機能別の影響範囲を持ちます。Rampの色・位置・透明度、通常アンカー、Meshコーナーは安定したプロパティIDを持つキーフレームで編集できます。

勾配固有の可変部分と、Noise・Diffuse・Slit・Stretch・Postprocessなど他領域の自動/キー制御は別のトラックとして扱います。機能が無効な場合、その機能に属するトラックは描画へ反映しません。

### GRAD-006 保存・読込と後方互換性

Gradientの状態はPresetの状態スナップショットに含まれます。古いデータで欠落している任意フィールドは既定値で補完し、未知・非有限・範囲外の値は正規化します。Meshがない旧Presetは従来のGradientとして読み込み、Meshの描画は有効にしません。

既存の `gradientType` 識別値と、Rampの旧値を読み込める互換性は維持します。保存形式を変更する場合は、Gradient Systemの変更仕様と必要なADRを先に作成します。

### GRAD-007 描画経路の一貫性

通常プレビュー、静止画、連番、動画のシーン評価は共通の時間評価と描画経路を使用します。Presetサムネイルも保存時の正規化状態から1フレームを描画します。WebGLを利用できない場合の軽量プレビューは、互換性を保つためのフォールバックであり、同一の描画実装そのものではありません。

Image Gradient Sourceでは、画像本体の形状・アルファを固定し、色場だけに対象の変形を適用する保護経路を使用します。対象外となる形状変形系レイヤーの扱いはEffect Stackの現行仕様とADR-0010に従います。

### GRAD-008 編集時の境界条件

Rampの位置・透明度・アンカー・Meshの座標は有限値と範囲を確認してから保存・描画します。ストップの編集はRampの範囲外へ移動させず、既存のストップIDを保つことでキーフレームとの対応を維持します。手動入力や破損したPresetが正規化できない場合は、アプリ全体を壊さず対象状態を既定値へ戻します。

### GRAD-009 Ramp候補の結果プレビュー

GradientRampのColor ModeとInterpの選択肢は、現在の色ストップと不透明度を候補へ適用した場合の色のつながりとして表示します。Color Mode候補は色相系ならNear、それ以外ならEaseを既定補間とし、Interp候補は現在のColor Modeを維持します。SHOW PREVIEWSが有効なときは通常のセレクトトリガーとホバー展開を表示せず、候補グリッドのボタンを直接選択面として使います。無効時は従来のホバー／クリック選択UIへ戻ります。プレビューは選択前の比較表示であり、候補を選択するまでRamp状態を変更しません。

### GRAD-010 Rampプレビューの常時表示

Color Mode／Interpの候補プレビューは、ボタンで常時表示へ切り替えられます。常時表示中は候補グリッド上のボタンから直接選択でき、空のセレクトトリガーやホバー展開は表示しません。無効時は従来のホバー／クリックで開く選択UIを維持し、常時表示状態はPresetへ保存しません。

### GRAD-011 配色補助パレット

Color Palette Generatorの配色補助は、TweeqのInputColorで指定した基準色1色と配色ルールだけを入力として、類似色、補色、分割補色、トライアド、スクエア、複合色、シェード、モノクロマティックの実色チップを生成します。基準色は候補に含め、補色は追加1色、トライアドは追加2色を生成します。色チップからHexを確認・コピーでき、候補全体をGradientの色ストップへ適用できます。基準色は上段、配色ルールは下段の1列2段で表示します。SHOW PREVIEWSが有効なときは配色ルールごとの実色パレットを一覧表示し、グリッドボタンからルールを直接選択できます。Harmonyルール名は英語UIでは英語名、日本語UIでは日本語名で表示します。候補の選択や基準色の変更だけではGradient状態を変更しません。

### GRAD-012 プレビューと配色補助の視認性

Color Mode／Interpの候補は、有効な複数背景レイヤーとして色帯と透明度チェッカーを表示し、ブラウザーのCSS解釈で黒一色へフォールバックしません。ホバー選択肢と常時表示候補では、色帯を選択肢ボタンの背面全体へ敷き、ラベルと開閉矢印を前面へ表示します。Color Palette Generatorは「画像からストップを生成」と「配色補助」を内部の別区分として表示し、親説明でも両方の用途を示します。配色補助の見出しとHarmonyプレビュー切替は同じ行に置き、説明文はその下の独立した全幅行へ置きます。`Local`という補助表示は使用しません。配色補助の説明文・補助ラベル・境界・フォーカス表示は、配置される背景に対してWCAG 2.2の通常テキスト4.5:1以上、非テキスト3:1以上を満たす配色を使用します。

### GRAD-013 GradientRampの操作順序

GradientRampは、グラデーション形式／タイプの直後に色・不透明度ストップの編集ランプとストップ操作を表示し、その後にColor Mode／Interpと候補プレビュー、その他の設定、Color Palette Generatorを表示します。候補プレビューの展開・縮小で、頻繁に操作するストップ編集の位置を入れ替えたり、編集を無効化したりしません。表示プレビューの状態は保存形式へ含めません。

### GRAD-014 プレビュー表示stateの独立性

GradientRampのColor Mode／Interp候補プレビューとColor Palette GeneratorのHarmonyルール候補プレビューは、それぞれ独立した表示切替を持ちます。一方を展開・収納しても、もう一方の表示状態は変更しません。どちらの表示stateもGradientやPresetへ保存しません。

### GRAD-015 Preview表示アダプター

Previewは2D Canvasを既定とし、SANDBOXのEdit LayerでClothまたはConeモジュールをONにすると該当する3D表示アダプターへ切り替わります。専用のPreview Surface／プレビュー表示モードUIは表示しません。ClothまたはConeをOFFにすると2D Canvasへ戻り、表示状態は一時的でPresetへ保存しません。

### GRAD-016 処理済みCanvasのClothマッピング

3D Clothは既存のGradient／Effect Stackで処理したCanvasをCanvasTextureとして読み込み、Three.jsクロスメッシュのUVへ直接マッピングします。3D表示時は2D入力キャンバスからCloth Baseを外し、クロス変形と表面ライティングを一度だけ適用します。Curl／Noise／Distortなどの2D結果はテクスチャとして布の波打ちに追従します。

### GRAD-017 2D互換とフォールバック

CanvasはCloth初期化中も描画を継続します。Cloth Rendererが利用できない場合は2D Canvasへ戻り、既存のアンカー、オーバーレイ、編集UIを利用できます。

### GRAD-018 Preview表示面の書き出し

Exportは現在Previewで選択されている表示面を使用します。2DモードではGradientCanvas、3Dモードでは処理済みCanvasをCanvasTextureとしてマッピングしたClothまたはConeのWebGL CanvasをPNG／JPG／WebP、連番PNG ZIP、MOV／MP4へ渡します。

### GRAD-019 3D Cone表示面

3D Coneは処理済みCanvasの横方向を円周、縦方向を頂点から開口部へ対応させ、開口したThree.js円錐内面へCanvasTextureとしてマッピングします。Mappingは、normalizedTimeでV offsetを進めるFlowと、V offsetを固定して処理済み2Dフレームをそのまま投影するDirect Projectionから選択できます。頂点はプレビュー面上の専用ハンドルをドラッグしてCanvasの外側まで移動でき、Apex X／Apex Yは正規化値-2..2（Canvasの幅・高さに対して最大50%外側）へ制限します。開口部は四隅を覆う半径を維持するため、1:1、横長、縦長のCanvasに背景を露出しません。Coneはunlitかつ不透明で、環境光、ライト、スペキュラー、フレネルを追加しません。Gradient Rampは右サイドバーで操作し、3D表示中も処理済みCanvasへ反映します。頂点ハンドルとグラデーションアンカーはプレビュー面へ重ねて維持し、頂点はUIのリセット操作で中央へ戻せます。

### GRAD-020 Cone Texture Flow

ConeのTexture Flowは共通のnormalizedTimeと整数Flow Cycles（-30..30）から位相を決めます。正数は頂点から開口部、負数は逆方向、0は停止として扱い、Previewの再生・停止・シークと連番・動画出力で同じ位相を使用します。ループ境界では整数テクスチャオフセットへ戻ります。Texture RepeatとFlow Cyclesの円周方向・高さ方向の境界は、0..0.5のSeam Blend幅とSeam Modeで連続化します。Mirror Repeatは反復座標を鏡面化し、Edge Weldは継ぎ目両側の端色を一つの不透明な最終色へ溶接します。方式はこの2つから切り替えられ、既定値はEdge Weldです。各方式はアニメーション中も反復境界の位置を固定し、硬い直線や円形の切れ目、半透明レイヤーの重なりを表示しません。Depthは2..30で編集できます。

### GRAD-021 Flow Gradient Ramp mapping

SANDBOXのFlow Gradientは、3DエミッタからCurl場を固定ステップ積分し、透視投影後の速度方向付きDensityとTemporal Trailを0..1のスカラー値として既存Gradient Rampへ渡します。Flow専用の固定色は最終色にせず、Rampの色ストップ、透明度、補間設定をPreview、Thumbnail、静止画、連番、動画で共有します。深度は投影位置、splatサイズ、Density寄与へ反映され、Tileでは全画面基準の投影を切り出します。Flow OpacityはRamp適用後の最終合成強度、Particle Opacityは個々のsplatがDensityへ加える寄与、Particle Sizeは速度方向splatの長さ・幅を制御します。

## 他領域との関係

- Preset Systemは、Gradientの設定、キーフレーム、関連するエフェクト設定を状態スナップショットとして保存します。
- Effect Stackは、Gradientを生成した後の色場・画像場を処理します。Image Gradient Sourceの保護動作は両仕様にまたがります。
- Animationは、Gradientの一部プロパティと各エフェクトの時間評価を共通の時刻で評価します。

## 変更履歴

この現行仕様の初期整理に参照したLegacy Change Specificationは次のとおりです。

- [SPEC-009 Image Gradient Source](../SPEC-009-image-gradient-source)
- [SPEC-019 Gradient Rampストップ編集](../SPEC-019-proportional-gradient-stop-editing)
- [SPEC-030 Image Gradient保護描画](../SPEC-030-image-gradient-protected-rendering)
- [SPEC-040 Mesh Gradation](../SPEC-040-mesh-gradation)
- [SPEC-031〜033 アニメーション関連](../index#legacy-change-specifications)

Legacy SPECは変更理由と当時の受け入れ条件の履歴であり、現在の要件を読むための必須資料ではありません。SPEC-008は未承認のため、この現行仕様の根拠に含めていません。

## 未確認・今後の現行仕様化

本書はコードと自動テストで確認できる現在の契約を中心に整理しています。実機GPUごとの描画品質、全GradientTypeのPreview/Exportの画素一致、巨大画像の性能保証はこの移行では再計測していません。変更時は手動確認結果を変更仕様のvalidationへ記録してください。
