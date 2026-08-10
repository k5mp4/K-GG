---
type: current
id: CURRENT-UI-CONTROLS
title: UI入力コントロール
status: current
owners: [maintainer]
created: 2026-07-28
updated: 2026-08-10
requirement_ids: [UI-001, UI-002, UI-003, UI-004, UI-005, UI-006, UI-007, UI-008, UI-009, UI-010, UI-011, UI-012, UI-013, UI-014, UI-019]
related_adrs: [ADR-0011, ADR-0012]
related_changes: [CHANGE-010, CHANGE-012, CHANGE-013, CHANGE-014, CHANGE-015, CHANGE-018, CHANGE-019, CHANGE-024, CHANGE-025]
related_code: [src/App.tsx, src/App.css, src/types/renderView.ts, src/types/coneView.ts, src/components/CustomSelect.tsx, src/components/GradientRamp.tsx, src/components/SliderField.tsx, src/components/NoiseDistortionPanel.tsx, src/components/BlockNoisePanel.tsx, src/components/DiffuseCurveEditor.tsx, src/components/SlitScanPanel.tsx, src/components/StretchPanel.tsx, src/components/TimelineBar.tsx, src/components/IridescencePanel.tsx, src/components/NormalMapPanel.tsx, src/components/SandboxPanel.tsx, src/components/ClothGradientPanel.tsx, src/components/ClothCanvas.tsx, src/components/ConeCanvas.tsx, src/components/ConeApexEditor.tsx, src/components/ConeViewPanel.tsx, src/components/RadonPanel.tsx, src/components/PostprocessPanel.tsx, src/components/PostprocessStackPanel.tsx, src/components/PresetPanel.tsx, src/components/Toggle.tsx, src/lib/effectPipeline.ts, src/i18n/uiLabels.ts, src/i18n/messages.ts]
related_tests: [src/lib/tweeqAngle.test.ts, src/lib/effectPipeline.test.ts, src/lib/parameterLimits.test.ts, src/lib/animationDirection.test.ts, src/lib/effectShaderParity.test.ts, src/lib/presetThumbnail.test.ts, src/types/coneView.test.ts, src/lib/coneView.test.ts, 'manual: SANDBOX Edit Layer and Cone controls browser check', 'manual: Cone background coverage and color check']
---

# UI入力コントロール

## 目的

主要なパラメータ入力をTweeqの共通コントロールで表示し、通常のパネルとAnimationタイムラインで同じ値編集・選択操作を提供します。

## 現在の要件

### UI-001 InputAngleの表示

Angle入力は、Tweeqのロータリーボタンと数値入力の両方を同じ行のInputAngle境界内に表示し、パネル幅が変わっても親レイアウトからはみ出したり、ラベルに対して上下へずれたりしません。ロータリーボタンのpaddingやSVGの寸法によって右端へオーバーフローさせません。アプリCSSではTweeqの実コンポーネント属性を使い、`Tweak`表記の誤ったセレクターを使用しません。直接入力、ドラッグ、キーフレーム編集は既存の角度値へ反映されます。

### UI-002 Seedのシャッフル

Noise、Slit、StretchのSeed行では、InputShuffleは対応するSeedスライダーの入力欄の下端に揃えて表示されます。シャッフル操作は既存のSeed値域と保存形式を維持します。

### UI-003 Slitの選択コントロール

SlitのModeはLinear、Circular、Polygon、WaveをInputDrumで選択できます。MotionはUnidirectional（Loop）とPingPongをInputRadioで選択し、Offset SpeedとPhase Speedで速度を調整できます。Timeline Loop切替や速度の自動上書きは表示しません。

### UI-004 Animationの名称

日本語表示時もAnimationタブの名称は`ANIMATION`とします。英語表示のAnimation名称と、アニメーションの保存・再生動作は変更しません。

### UI-005 プレビュー付き選択肢のラベル

色プレビューを持つCustomSelectは、候補の色をボタン背面全体へ表示し、ラベルと開閉矢印を前面へ配置します。ホバー／クリックで開く選択肢と常時表示候補のどちらでも、選択肢名が左側の色サムネイルによって潰れない表示幅を確保します。`previewOnly`が有効な常時プレビューでは、セレクトトリガー、ドロップダウン、ホバー開閉を表示せず、候補グリッドのボタンだけを選択面として使います。Harmonyルールなどの候補名は型付きUI用語辞書で表示言語へ変換します。通常のCustomSelectは従来の操作を維持します。

### UI-006 VariableのTweeq入力

GradientRampでInterpがVariableの場合、VariableはTweeqのInputNumberで表示します。入力値は-1〜1、stepは0.001とし、既存のrampVariableへ有限値を反映します。native range inputは使用しません。

### UI-007 Glassの色コントロール

PostprocessのプロパティモジュールにはGlassを一つだけ表示し、その実体はGLASS V2です。ColorグループへChromatic Hue、Chromatic Saturation、Transmission Tint、Highlight Tintを表示します。HueとSaturationは数値編集、TintはTweeqのInputColorで即時に描画へ反映します。Transmission TintとHighlight TintのInputColorは同じ固定横幅で表示します。旧Glassの選択肢と`Glass V2`の別表示はありません。この変更では4項目にキーフレーム／自動アニメーション操作を表示しません。

### UI-008 Effect Stack探索操作

Effect Stackには主スタック9種類の順序をランダム化する操作を表示します。操作は既存の有効状態・選択状態を維持し、現在の描画結果から新しい順序へ滑らかに遷移します。主スタックの行位置もキャンバス遷移と同じ400msの`easeInOut`で、現在位置から移動します。主スタックの行またはそのオンオフToggleをAltクリックすると、その行だけを有効にするソロ操作になります。ソロ化によって新たに無効化された行は黄色の`STAY`で表示します。同じ対象を再度Altクリックするとソロ化前の有効状態へ戻ります。Altキーなしのクリック、トグル、ドラッグ並べ替えは既存の操作を維持します。

### UI-009 Effect Stackの表示形態

Effect Stackは常にワークスペース内のインライン表示のみで提供します。別ウィンドウ化（Document Picture-in-Picture、ポップアップ、TauriネイティブWebviewWindow）は行いません。TauriのWebView2環境では別ウィンドウ化が安定動作しないため、操作ボタン自体を表示しません。ブラウザーでも同様に別ウィンドウ操作は提供せず、インライン表示に統一します。

### UI-010 トップバーとSANDBOXのモジュール入口

TOPバーは左から`Diffuse`、`Noise`、`Slit`、`Postprocess`、`SANDBOX`、`Export`、`Preset`の順に表示します。`Stretch`は独立項目として表示せず、Postprocessのプロパティモジュールにも表示しません。PostprocessのプロパティモジュールはON／OFFと`Edit Layer`を表示し、選択したEdit Layerの詳細プロパティをその下で操作できます。Stretch、Distort、Mirror、Kaleidoscopeなどの個別ON／OFFはプロパティモジュールに表示せず、いずれか一つ以上がEffect Stackで有効な場合にPostprocess全体をONとして表示します。SANDBOXの文字色はPostprocessと同じ通常色を使います。`Normal`と`Distort`も独立項目として表示しません。SANDBOXの左パネルにはPostprocessの`Edit Layer`と同じ選択要素を表示し、Normal、Prism、Particlesから一つを選択して既存の有効状態とパラメータを編集できます。モジュールのON／OFFと描画準備状態を確認でき、SANDBOXの選択状態はPresetへ保存しません。DistortはPostprocessの`Edit Layer`で選択し、Effect StackとPostprocessの主スタック編集UIにPrism／Particlesの重複入口を表示しません。
### UI-011 Diffuseのモードと適応カーブ

DiffuseのモードはTweeqのInputDrumでBlock、Smooth、Dither、Halftone、ASCIIから選択できます。Halftoneの形状はInputRadio、ASCII文字セットはInputString、Halftone／ASCIIの背景色はInputColorで編集します。適応ソースと粒度適応の2本のBezierはTweeq InputCubicBezierを中心としたコンパクトな行で表示し、大きなSVGプレビューやヒストグラムは表示しません。

### UI-012 Slitのモーション速度

SlitのMotionにはLoop／PingPongのInputRadio、Offset Speed、Phase Speedだけを表示します。キャンバスと書き出しは同じ秒ベースのSlit時計を使います。

### UI-013 共通Tweeq入力への統一

StretchのGlow TintはTweeq InputColor、Postprocess DistortのBrush ModeはTweeq InputRadioで編集します。保存値と描画上の意味は変更しません。

### UI-014 SANDBOX Clothの表示設定

SANDBOXで`Cloth`を選択した場合、Quality、Surface Wave、Organic Motion、Lighting、Specular、Fresnel、Rampの詳細パラメータを同じプロパティモジュール内で編集できます。ClothモジュールのON/OFFが3D Cloth表示の切替も兼ねます。

### UI-019 SANDBOX Edit LayerとCone設定

SANDBOXのEdit Layerには`Cloth`と`Cone`を同じ粒度のモジュールとして表示します。専用のPreview Surface／プレビュー表示モードは表示せず、ClothまたはConeモジュールのON/OFFで2D Canvasと各3D表示を切り替えます。ConeではMapping（Flow／Direct Projection）、Depth（2..30）、Rotation、Texture Repeat、Seam Mode（Mirror Repeat／Edge Weld）、Seam Blend（0..0.5）、Flow Cycles（-30..30）を既存のTweeq数値入力で編集します。Apex X／Apex Yの数値入力は表示せず、プレビュー面上の頂点ハンドルでCanvasの外側まで位置を操作し、リセットボタンで中央へ戻します。頂点の正規化位置は-2..2に制限します。既定のSeam ModeはEdge Weldです。Direct ProjectionではFlow Cyclesを停止し、処理済み2Dフレームを固定投影します。Gradient Rampは右サイドバーだけに表示し、処理済みCanvasへ反映します。グラデーションアンカー表示の切替は、Coneの頂点ハンドルにも適用します。照明や背景を変更するコントロールは表示しません。

## 互換性

Mode、Motion、Seed、Animationの保存キーと値域を維持し、旧Presetの`autoLoop`は読み込み時に破棄します。Tweeqのコントロール変更は表示と操作方法に限定し、描画、プリセット、キーフレームのデータ契約へ影響させません。

## 検証上の留意事項

標準のローカル開発ブラウザーで各コントロールの表示とDOM種別を確認済みです。実機GPUごとの描画結果や、未確認の任意Viewportにおける画素単位の差異は本仕様の保証範囲外です。
