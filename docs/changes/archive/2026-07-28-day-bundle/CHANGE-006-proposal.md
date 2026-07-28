---
type: change
id: CHANGE-006
title: GradientRampのプレビュー選択と操作順序を安定化
status: archived
change_kind: F
owners: [maintainer]
created: 2026-07-28
updated: 2026-07-28
current_specs: [CURRENT-GRADIENT, CURRENT-UI-CONTROLS]
related_adrs: [ADR-0012]
related_code: [src/components/CustomSelect.tsx, src/components/GradientRamp.tsx, src/components/ColorPaletteGenerator.tsx, src/i18n/messages.ts]
related_tests: ['manual: SHOW PREVIEWS grid-only selection, harmony preview grid, and stable GradientRamp order browser checks']
human_review: completed
---

# CHANGE-006 GradientRampのプレビュー選択と操作順序を安定化

## 背景・問題

SHOW PREVIEWSを有効にすると、カラーモードと補間の候補グリッドに加えて従来のCustomSelectも残るため、ホバーやクリックで別のセレクトを開く必要があります。候補グリッドがすでに操作可能な場合は、グリッド上のボタンを直接押して適用できる方が、表示と操作の対応が明確です。

また、配色補助の配色ルールは現在テキスト中心のセレクトで、基準色から各ルールを適用した結果を選択前に比較できません。GradientRampのカラーモード／補間候補と同じように、各ルールの実色パレットを一覧で表示する必要があります。

現在のGradientRampは、グラデーションタイプの直後にカラーモード、補間、プレビューグリッドがあり、その後にストップ編集キャンバスがあります。プレビューの展開でストップ編集位置が下へ移動するため、頻繁に操作するストップへ戻るたびに視線とポインター位置が変わります。

## 変更理由

プレビューをそのまま選択面として扱い、同じ候補を二重に開かない操作にします。グラデーションストップ編集をグラデーションタイプの直下へ固定し、カラーモードや候補プレビューの展開がストップ操作を押し下げない順序にします。配色ルールも候補の実色を同じ視覚言語で比較できるようにします。

補間方式の候補名は保存値と既存の英語UIに合わせ、`Near`、`Far`、`Clockwise`、`Counter-Clockwise`などの英語名を維持します。保存キー、補間計算、既存の画像抽出・配色計算は変更しません。

## ゴール・成功条件

- SHOW PREVIEWSが有効なとき、Color Mode／Interpの空のセレクトトリガーやホバー展開を表示せず、一覧グリッド上のボタンだけで候補を適用できる。
- SHOW PREVIEWSが無効なときは、従来のホバー／クリックによるセレクト操作を維持する。
- 補間方式の候補名は`Near`、`Far`、`Clockwise`、`Counter-Clockwise`などの英語名で表示し、既存の保存値と意味を変えない。
- Color Palette Generatorの配色ルールについて、基準色に対する各ルールの実色パレットを一覧プレビューとして表示し、候補ボタンからルールを適用できる。基準色を変更すると一覧も更新される。
- GradientRampの表示順序を、グラデーションタイプ → ストップ編集（ランプとストップ操作） → カラーモード／補間とそのプレビュー → その他の設定、の順にする。プレビュー展開でストップ編集の位置が入れ替わらず、ストップ操作が無効化されない。
- 既存のGradient、Preset、配色補助の保存形式と描画計算を変更しない。

## 対象

- CustomSelectのプレビュー専用表示モードと、SHOW PREVIEWS時の直接選択。
- GradientRamp内のストップ編集、カラーモード、補間、プレビューのDOM順序。
- Color Palette Generatorの配色ルール候補プレビューと選択操作。
- Near／Far／Clockwise／Counter-Clockwise等の補間候補表示。
- 自動テスト、ブラウザー手動確認、現行仕様の同期。

## 対象外

- カラーモード、補間方式、配色理論の計算式の変更。
- GradientやPaletteの保存形式、既存Presetの移行、描画経路の変更。
- SHOW PREVIEWS以外のCustomSelectを一括してグリッド専用へ変更すること。
- 配色候補への追加入力、オンラインサービス連携、外部カラーパレットAPIの追加。

## 影響を受ける現行仕様

- [Gradient System](../../../specs/current/gradient-system)
- [UI入力コントロール](../../../specs/current/ui-controls)

## 関連ADR

- [ADR-0012 型付きローカライズとアイコン意味論](../../../adr/0012-typed-localization-and-icon-semantics)

## 主なリスク

プレビュー専用モードの条件分岐がCustomSelectの既存利用箇所へ波及すると、通常のセレクト操作が使えなくなる可能性があります。対象を明示的なpropで限定し、SHOW PREVIEWS時と無効時の両方をブラウザーで確認します。候補パレットの生成回数が増えるため、少数の実色チップと既存の配色計算だけを使い、入力変更時に必要な候補だけを再計算します。

## 未決定事項

なし。人間レビューでは、プレビュー専用時にラベルだけを残すか、グリッド内の見出しで代替するかを含めて表示密度を確認します。
