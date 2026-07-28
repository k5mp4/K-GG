---
type: change
id: CHANGE-007
title: GradientRampのプレビュー制御と配色補助UIを整理
status: archived
change_kind: F
owners: [maintainer]
created: 2026-07-28
updated: 2026-07-28
current_specs: [CURRENT-GRADIENT, CURRENT-UI-CONTROLS]
related_adrs: [ADR-0011, ADR-0012]
related_code: [src/components/GradientRamp.tsx, src/components/ColorPaletteGenerator.tsx, src/i18n/uiLabels.ts]
related_tests: ['manual: independent preview toggles, one-column harmony controls, Tweeq InputNumber variable control, and bilingual harmony labels']
human_review: completed
---

# CHANGE-007 GradientRampのプレビュー制御と配色補助UIを整理

## 背景・問題

GradientRampのColor Mode／Interp候補プレビューと、Color Palette GeneratorのHarmony候補プレビューが同じ表示stateを共有しています。そのため、一方の`Show previews`／`Hide previews`を切り替えると、もう一方も同時に展開・収納され、目的の候補だけを確認したい操作と競合します。

また、配色補助の基準色と配色ルールが横並び2列になっており、基準色側に余白が生じます。基準色を先に決めてからルールを選ぶ操作に合わせ、1列2段の順序へ整理します。

Variable補間の値入力はnative range inputのまま残っているため、他のTweeq入力と操作感・表示仕様が揃っていません。配色ルール名も日本語固定で、英語UI時に英語名称へ切り替わりません。

## 変更理由

候補プレビューの対象を個別に制御できるようにし、Color Mode／Interpの比較とHarmonyルールの比較を独立した操作として扱います。配色補助は基準色、ルールの順に縦へ配置して、視線と入力順を一致させます。VariableはTweeqのInputNumberへ統一し、入力部品の見た目・値域・キーボード操作を既存の共通UIへ寄せます。Harmonyルールは型付きUI用語辞書を通して日本語・英語を切り替えます。

## ゴール・成功条件

- Color Mode／Interpのプレビュー表示とHarmonyルールのプレビュー表示を、別々のボタンで独立して展開・収納できる。
- 配色補助の基準色を上段、配色ルールを下段にした1列レイアウトとし、基準色入力に不要な横余白を作らない。
- Variable補間の入力をTweeqのInputNumberで表示し、`-1`〜`1`、`0.001`刻み、既存の`rampVariable`値を維持する。
- `Analogous`、`Complementary`、`Split-Complementary`、`Triad`、`Square`、`Compound`、`Shades`、`Monochromatic`を英語UIで表示し、日本語UIでは対応する日本語名を表示する。
- Gradient、Preset、Harmony計算の保存値・識別子・計算式を変更しない。

## 対象

- GradientRampのColor Mode／Interpプレビュー表示stateとColor Palette GeneratorのHarmonyプレビュー表示state。
- Color Palette Generator内の基準色・配色ルールの表示順序と幅。
- GradientRampのVariable入力部品。
- HarmonyルールのUI用語辞書と日本語／英語表示。
- 受け入れ条件に対応したブラウザー確認、型検査、既存テストの実行。

## 対象外

- Color Mode／Interp／Harmonyの計算式、配色候補の色、保存形式の変更。
- 配色補助への新しいルールや追加入力の導入。
- GradientRamp以外のnative range inputを一括してInputNumberへ置き換えること。
- Tweeq vendor本体、上流固定コミット、外部依存の更新。

## 影響を受ける現行仕様

- [Gradient System](../../../specs/current/gradient-system)
- [UI入力コントロール](../../../specs/current/ui-controls)

## 関連ADR

- [ADR-0011 Tweeq vendor](../../../adr/0011-tweeq-vendor-source-and-api)
- [ADR-0012 型付き辞書と意味的アイコン](../../../adr/0012-typed-localization-and-icon-semantics)

## 主なリスク

プレビューstateを分離する際に、Harmony候補だけがColor Mode候補のstateを参照し続けたり、セクション開閉と候補表示を混同したりする可能性があります。各ボタンのstateとDOMを個別に確認します。InputNumberへの置換では入力値のclampと小数精度を確認し、Gradient storeへ渡す値を既存範囲へ制限します。用語辞書の追加では日本語表示が変わらないことを確認します。

## 未決定事項

なし。実装開始には、このproposalとdeltaの人間レビュー完了が必要です。
