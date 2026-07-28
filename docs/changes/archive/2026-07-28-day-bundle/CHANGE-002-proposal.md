---
type: change
id: CHANGE-002
title: Tweeq入力コントロールのレイアウトとSlit選択UIを修正
status: archived
change_kind: F
owners: [maintainer]
created: 2026-07-28
updated: 2026-07-28
current_specs: [CURRENT-UI-CONTROLS]
related_adrs: [ADR-0011, ADR-0012]
related_code: [src/App.css, src/components/SliderField.tsx, src/components/NoiseDistortionPanel.tsx, src/components/SlitScanPanel.tsx, src/components/StretchPanel.tsx, src/components/TimelineBar.tsx, src/components/IridescencePanel.tsx, src/components/NormalMapPanel.tsx, src/components/RadonPanel.tsx, src/components/PostprocessPanel.tsx, src/i18n/messages.ts]
related_tests: [src/lib/tweeqAngle.test.ts, src/lib/parameterLimits.test.ts, src/lib/animationDirection.test.ts, 'manual: Tweeq InputAngle and InputShuffle and InputDrum and InputRadio browser checks']
human_review: completed
---

# CHANGE-002 Tweeq入力コントロールのレイアウトとSlit選択UIを修正

## 背景・問題

直近のTweeq入力UI統一後、InputAngleの表示に必要な幅の確保方法が実際のコンパクト行と一致せず、数値欄やダイヤルの配置が崩れることがあります。AnimationタイムラインのAngle表示でも、高さと親ラベルの揃え方が一致していません。NoiseとSlitのSeed行ではInputShuffleに付いた下マージンによって、スライダーより少し上へずれて表示されます。

SlitのModeとAuto Modifierは独自ボタンで表示されているため、Tweeqの選択コントロールへ統一します。日本語のAnimation名称もプロダクト内の英語見出し方針に合わせます。

## 変更理由

入力コントロールの表示位置と操作モデルを揃え、パネル幅や言語設定にかかわらず、値編集の視認性と選択状態の一貫性を保つためです。

## 過去実装の監査結果

- SPEC-028のsemantic angle対象（Gradient、Slit、Noise、Normal Map、Radon、Iridescence、Postprocess、Animation Direction）は、現行コードで`SliderField`の角度モードまたはAnimation専用の`InputAngle`として実装済みです。今回のInputAngleレイアウト修正では、これら全対象へ共通CSSの回帰がないことを確認します。
- SPEC-036のSeed panelsにはNoise、Slit、Stretchが含まれます。現行コードでも3パネルにInputShuffleが存在しますが、StretchのSeed行が今回のproposalから漏れていました。同じ`mb-1`による位置ずれの対象として追加します。
- SPEC-039でvendor公開APIへ追加済みのInputDrum/InputRadioは利用可能です。vendor生成物や上流コミットの更新は不要です。

## ゴール・成功条件

- InputAngleがダイヤルと数値欄を同時に表示し、通常パネルとAnimationタイムラインで上下・左右の崩れがない。
- Noise、Slit、StretchのSeed行のInputShuffleがスライダーの下端に揃う。
- SlitのModeがInputDrum、Auto ModifierがInputRadioで表示される。
- 日本語表示のAnimation名称が`ANIMATION`になる。
- 既存の保存値、Seed値域、描画、アニメーション評価を変更しない。

## 対象

- [CURRENT-UI-CONTROLS](../../../specs/current/ui-controls) のUI-001〜UI-004。
- InputAngleのレイアウト境界、Seed行の余白、Slitの選択コンポーネント、Animation名称。
- DOM上のコントロール種別、ラベル、値変更、既存値の互換性確認。

## 対象外

- Noise、Slit、Animationの保存形式や値域の変更。
- Slitの描画アルゴリズム、アニメーション評価、プリセット移行。
- Tweeq vendorの上流コミット更新や新しいコンポーネントの追加。
- 今回監査で特定していない他のパネルのレイアウト改善。

## 影響を受ける現行仕様

- [UI入力コントロール](../../../specs/current/ui-controls)

## 関連ADR

- [ADR-0011 Tweeq vendorを固定上流ソースから最小構成で生成する](../../../adr/0011-tweeq-vendor-source-and-api)
- [ADR-0012 型付きローカライズとアイコン意味論](../../../adr/0012-typed-localization-and-icon-semantics)

## 主なリスク

InputAngleの最小幅を狭くしすぎるとTweeqが数値入力を隠す可能性があります。InputDrum/InputRadioの導入時に値の型や選択イベントを誤ると、Mode変更時の既定値補正やAuto Modifier変更が失われる可能性があります。実装後に型チェック、既存テスト、ブラウザーでの操作確認を行います。

## 未決定事項

なし。人間レビュー承認済み。
