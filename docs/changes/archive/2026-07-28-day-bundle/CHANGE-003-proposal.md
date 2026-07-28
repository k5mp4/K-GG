---
type: change
id: CHANGE-003
title: InputAngleロータリーボタンのオーバーフローを修正
status: archived
change_kind: B
owners: [maintainer]
created: 2026-07-28
updated: 2026-07-28
current_specs: [CURRENT-UI-CONTROLS]
related_adrs: [ADR-0011, ADR-0012]
related_code: [src/App.css, src/components/SliderField.tsx, src/components/SlitScanPanel.tsx, src/components/TimelineBar.tsx, vendor/tweeq/index.es.js]
related_tests: [src/lib/tweeqAngle.test.ts, 'manual: InputAngle rotary button containment browser check']
human_review: completed
---

# CHANGE-003 InputAngleロータリーボタンのオーバーフローを修正

## 背景・問題

SlitのAngle入力で数値欄の右側にあるInputAngleのロータリーボタンが右へはみ出し、赤いダイヤルが行の外側で切れて表示されます。数値欄とダイヤルが同じInputAngleの境界内に収まらず、狭いプロパティモジュールで位置が崩れます。

## 原因調査

Tweeqの実DOMはロータリーボタンへ`data-tq-component="input-rotary"`と`data-tq-tweak-mode`を付けます。現行のアプリCSSは存在しない`button[tweak-mode]`を対象にしているため、幅・padding・高さのリセットが適用されません。結果として、グローバルなボタンpadding（左右14.4px）が32pxのロータリーSVGに加わり、InputAngleの境界からSVGがオーバーフローします。アプリ側の誤った`Tweak`表記は、Tweeqの実コンポーネント属性を使うセレクターへ修正します。vendor側の上流属性名は変更しません。

## 変更理由

実際のTweeq DOM属性に一致するセレクターでロータリーボタンとSVGの寸法を制約し、通常パネル、SlitのAngle／Offset Angle、Animation方向のすべてでInputAngleを境界内に表示するためです。

## ゴール・成功条件

- InputAngleのロータリーボタンがInputAngleの境界内に収まり、赤いダイヤルが右端からはみ出さない。
- 数値欄とダイヤルが同じ行に表示され、狭いプロパティモジュールでも切れない。
- SlitのAngle／Offset Angle、SliderFieldのAngle、Animation方向の既存値・イベント・単位変換を変更しない。

## 対象

- `src/App.css`のInputAngleロータリーボタン用セレクターと寸法指定、およびアプリ側の誤った`Tweak`セレクター。
- InputAngleを利用する通常パネルとAnimationタイムラインのブラウザー確認。
- UI-001の現行仕様の明確化と再現可能な検証結果。

## 対象外

- Tweeq vendor生成物と上流の`data-tq-tweak-mode`属性名、Angle値の変換、保存形式、描画、操作イベントの変更。
- InputShuffle、InputDrum、InputRadio、Animation名称の再変更。
- InputAngle以外のボタンの共通スタイル変更。

## 影響を受ける現行仕様

- [UI入力コントロール](../../../specs/current/ui-controls)

## 関連ADR

- [ADR-0011 Tweeq vendorを固定上流ソースから最小構成で生成する](../../../adr/0011-tweeq-vendor-source-and-api)
- [ADR-0012 型付きローカライズとアイコン意味論](../../../adr/0012-typed-localization-and-icon-semantics)

## 主なリスク

セレクターを広くしすぎると、InputAngle以外のロータリー入力やTweeqの標準レイアウトへ影響する可能性があります。`data-tq-component="input-rotary"`をInputAngle直下に限定し、ブラウザーで境界内の寸法を確認します。

## 未決定事項

人間レビュー待ちです。
