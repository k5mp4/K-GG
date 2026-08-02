---
type: current
id: CURRENT-UI-CONTROLS
title: UI入力コントロール
status: current
owners: [maintainer]
created: 2026-07-28
updated: 2026-08-02
requirement_ids: [UI-001, UI-002, UI-003, UI-004, UI-005, UI-006, UI-007, UI-008, UI-009]
related_adrs: [ADR-0011, ADR-0012]
related_changes: [CHANGE-010, CHANGE-012, CHANGE-013, CHANGE-014, CHANGE-015]
related_code: [src/App.css, src/components/CustomSelect.tsx, src/components/GradientRamp.tsx, src/components/SliderField.tsx, src/components/NoiseDistortionPanel.tsx, src/components/SlitScanPanel.tsx, src/components/StretchPanel.tsx, src/components/TimelineBar.tsx, src/components/IridescencePanel.tsx, src/components/NormalMapPanel.tsx, src/components/RadonPanel.tsx, src/components/PostprocessPanel.tsx, src/components/PostprocessStackPanel.tsx, src/lib/effectStackWindow.ts, src/lib/effectPipeline.ts, src/i18n/uiLabels.ts, src/i18n/messages.ts]
related_tests: [src/lib/tweeqAngle.test.ts, src/lib/effectPipeline.test.ts, src/lib/effectStackWindow.test.ts, src/lib/parameterLimits.test.ts, src/lib/animationDirection.test.ts, 'manual: Tweeq InputAngle and InputShuffle and InputDrum and InputRadio browser checks', 'manual: Glass color controls browser check', 'manual: Effect Stack randomize; Alt-solo; detached-window checks']
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

SlitのModeはLinear、Circular、Polygon、WaveをInputDrumで選択できます。Auto ModifierはUnidirectional（Loop）とPingPongをInputRadioで選択できます。選択によるSlit設定値とアニメーション設定値の意味は変わりません。

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

### UI-009 Effect Stack別ウィンドウ

Effect Stackはインライン表示と別ウィンドウ表示を切り替えられます。別ウィンドウでは通常表示と同じLanguageProviderおよびTweeq Viewportの下で表示し、選択と有効状態変更を既存storeへ反映します。Tauriの別ウィンドウは非表示で生成し、ネイティブ生成成功後に表示・フォーカスします。子側React rootの準備完了通知は表示後の状態同期に使い、通知遅延によって表示自体を失敗扱いにしません。別ウィンドウのclose、作成失敗、ポップアップ制限、Tauri作成タイムアウトではインライン表示へ復旧し、再試行可能な状態を残します。

## 互換性

Mode、Auto Modifier、Seed、Animationの保存キーと値域は変更しません。Tweeqのコントロール変更は表示と操作方法に限定し、描画、プリセット、キーフレームのデータ契約へ影響させません。

## 検証上の留意事項

標準のローカル開発ブラウザーで各コントロールの表示とDOM種別を確認済みです。実機GPUごとの描画結果や、未確認の任意Viewportにおける画素単位の差異は本仕様の保証範囲外です。
