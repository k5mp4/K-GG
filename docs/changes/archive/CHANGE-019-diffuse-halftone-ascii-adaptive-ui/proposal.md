---
type: change
id: CHANGE-019
title: Diffuse描画モードとEffect Stack UIの拡張
status: archived
change_kind: F
owners: [maintainer]
created: 2026-08-03
updated: 2026-08-11
current_specs: [CURRENT-EFFECT-STACK, CURRENT-UI-CONTROLS]
related_adrs: [ADR-0004, ADR-0005, ADR-0011]
related_code: [src/types/distortion.ts, src/store/gradientStore.ts, src/lib/webgl.ts, src/lib/sceneEvaluation.ts, src/components/BlockNoisePanel.tsx, src/components/DiffuseCurveEditor.tsx, src/components/SlitScanPanel.tsx, src/components/StretchPanel.tsx, src/components/PostprocessPanel.tsx, src/components/PresetPanel.tsx, src/lib/presetThumbnail.ts]
related_tests: [src/lib/effectShaderParity.test.ts, src/lib/sceneEvaluation.glass.test.ts, src/lib/parameterLimits.test.ts, src/store/gradientStore.effectPipeline.test.ts, src/lib/presetThumbnail.test.ts]
human_review: completed
---

# CHANGE-019 Diffuse描画モードとEffect Stack UIの拡張

## 背景・問題

Diffuseは現在、Block・Smooth・Ditherの3モードと輝度Bezier 1本の適応制御に限られている。ドット形状や文字組版のような表現をキャンバスへ直接出力できず、拡散量だけでなく粒度を入力画像の特性に応じて変えることもできない。

また、輝度適応の大きなプレビュー描画がTweeqのInputCubicBezierと並んで表示されているため、ユーザーが意図しない編集面を操作する懸念がある。Slitはアニメーション設定を個別に理解していないとタイムライン上で自然にループせず、StretchとPostprocessの一部には共通Tweeq入力へ揃っていないUIが残っている。

## 変更理由

Effect Stackの各プロパティを、視覚表現の選択とアニメーションの初期体験が直感的に一致する状態へ揃える。新しい描画モードはGPUの既存の通常描画・Stack描画の両方で同じ設定を使い、プリセット保存後も再現できるようにする。

## ゴール・成功条件

- DiffuseのモードをInputDrumでBlock、Smooth、Dither、Halftone、ASCIIの5つから選べる。
- Halftoneで円形／四角形を選択でき、セルサイズと形状サイズ、入力色の階調に応じたドット描画、およびTweeq InputColorで指定した背景色がキャンバスへ反映される。
- ASCIIでユーザーが指定した文字列を濃度順の文字セットとして使い、入力の濃度に応じた文字とInputColorで指定した背景色がキャンバスへ描画される。
- 適応カーブの入力を輝度・色相・彩度から選択でき、拡散量のカーブとは別に粒度のカーブを有効化できる。
- 適応カーブの編集面はTweeqのInputCubicBezierを中心としたコンパクトな表示にし、大きなSVGプレビューを表示しない。
- Slitは`animMode`のLoop／PingPongと`offsetSpeed`／`phaseSpeed`で再生し、キャンバスと書き出しで同じ速度になる。
- StretchのGlow TintをTweeq InputColorで編集でき、PostprocessのDistort Brush ModeをTweeq InputRadioで編集できる。

## 対象

- Diffuseの型、既定値、プリセットの後方互換読み込み、通常描画シェーダー、Effect Stackシェーダー、関連UI。
- Halftoneの形状・セルサイズ・ドットサイズ・背景色、ASCII文字セット・背景色の保存とWebGL描画。
- 適応ソース（輝度／色相／彩度）、拡散量カーブ、粒度カーブの保存と描画への反映。
- SlitのLoop／PingPong表示・動作と、キャンバス／書き出し共通の速度計算。
- Stretch、Postprocess Distortの入力コントロール表示。
- 既存の3モード、旧Preset、既存のAnimationトラックの読み込み互換性。

## 対象外

- ASCIIフォントファイルのインポート、フォント選択、文字ごとの個別レイアウト編集。
- HalftoneのCMYK分版、回転角、網点ごとの個別色チャンネル制御。
- Diffuseの複数インスタンス化、Effect Stackの順序モデル変更。
- Slitの新しいアニメーション補間方式や、タイムライン自体の編集モデル変更。
- WebGL実機ごとの画素一致や固定FPSの保証。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack)
- [UI入力コントロール](../../../specs/current/ui-controls)

## 関連ADR

- [ADR-0004 Postprocess Stack Rendering](../../../adr/0004-postprocess-stack-rendering)
- [ADR-0005 Unified Effect Stack V2](../../../adr/0005-unified-effect-stack-v2)
- [ADR-0011 Tweeq vendor source and API](../../../adr/0011-tweeq-vendor-source-and-api)

## 主なリスク

- ASCII文字セット変更時のフォントアトラス更新がWebGLの描画経路と同期しないと、古い文字が表示される可能性がある。
- Halftone／ASCIIは1ピクセルごとの追加サンプルまたはアトラス参照を必要とするため、高解像度・小セル時のGPU負荷が増える。
- 適応ソースの色相計算は低彩度色で不安定になり得るため、彩度が低い場合は色相を0として扱う。
- 旧Presetに追加項目がない場合は既定値で補完し、既存の見た目を変えない。
- 粒度適応時にセルサイズをフラグメントごとに変えると円形が歪むため、ベースセル単位の代表色で粒度を決め、セル内座標を安定させる。

## 決定事項

- ASCIIの既定文字列は ` .:-=+*#%@` とし、左から右へ暗い順に割り当てる。
- SlitのTimeline Loop切替と自動速度上書きは持たず、`animMode`、`offsetSpeed`、`phaseSpeed`を一次入力とする。
- 粒度カーブは拡散量カーブと独立したBezierとして保存する。
- Halftone／ASCIIの背景色は`#RRGGBB`で保存し、既定値は`#000000`とする。
