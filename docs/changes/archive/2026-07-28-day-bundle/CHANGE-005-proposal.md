---
type: change
id: CHANGE-005
title: GradientRampプレビューと配色補助の視認性を修正
status: archived
change_kind: B
owners: [maintainer]
created: 2026-07-28
updated: 2026-07-28
current_specs: [CURRENT-GRADIENT, CURRENT-UI-CONTROLS]
related_adrs: [ADR-0012]
related_code: [src/components/CustomSelect.tsx, src/components/GradientRamp.tsx, src/components/ColorPaletteGenerator.tsx, src/lib/gradientPreview.ts, src/i18n/messages.ts]
related_tests: [src/lib/gradientPreview.test.ts, 'manual: GradientRamp preview contrast and palette generator section browser checks']
human_review: completed
---

# CHANGE-005 GradientRampプレビューと配色補助の視認性を修正

## 背景・問題

CHANGE-004で追加したColor Mode／Interpのプレビューが、選択肢と常時表示のどちらでも黒く見え、色空間や補間結果を判断できません。色付きプレビューと透明度用チェッカーを一つのCSS `backgroundImage`へ組み立てる際の指定が無効になり、ブラウザーが背景全体を無視している可能性があります。

また、ホバーで開く選択肢は色プレビューを文字の左側へ置いたため、狭いサイドバーでは文字幅が潰れて読めません。カラーパレットのプリセットボタンのように、色を文字の背面全体へ敷き、文字を前面へ置く表示へ揃える必要があります。常時表示の候補グリッドも同じ表示方式にします。

Color Palette Generatorは、セクションの説明が「画像からストップを生成」のままなのに、開いた直後に配色補助が表示されます。画像からのストップ生成と配色補助を内部で明示的に区分し、親の説明も両方を説明する文へ変更します。配色補助の説明文は背景に対して暗く、読み取りにくい状態です。

## 変更理由

プレビューを実際の色として判断できる状態へ戻し、ラベルを削らずに色と意味を同時に比較できるようにします。配色補助と画像抽出を視覚的・文言的に分離し、初見時の誤解を減らします。説明文はW3C WCAG 2.2の1.4.3（通常テキスト4.5:1以上、太字の大きな文字は3:1以上）を基準に、背景色を含めて確認します。非テキストの境界・状態表示は1.4.11の3:1以上を目標にします。

参照: [W3C WCAG 2.2 1.4.3 Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#contrast-minimum)、[W3C WCAG 2.2 1.4.11 Non-text Contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast)

## ゴール・成功条件

- Color Mode／Interpのホバー選択肢と常時表示候補で、候補ごとの実際の色が黒化せず表示される。
- 色プレビューは文字の背面全体へ敷き、文字と矢印を前面へ置いて、狭い幅でもラベルが潰れない。
- 画像からのストップ生成と配色補助をColor Palette Generator内部の別区分として表示し、親説明も両方を説明する。
- 配色補助の説明文が背景に対してWCAG AAの通常テキスト基準を満たし、ブラウザー上で読みやすい。
- 保存形式、Ramp計算、配色計算、既存の画像抽出操作を変更しない。

## 対象

- GradientRampプレビュー背景の有効なCSS構成と透明度チェッカーの分離。
- CustomSelectの選択肢プレビューを背面カラー＋前面ラベルへ変更。
- Color Palette Generatorの親説明と、画像抽出／配色補助の内部区分。
- 配色補助説明文の色・背景・境界・フォーカス表示。
- 自動テスト、ブラウザー手動確認、WCAGコントラスト測定。

## 対象外

- Color Mode、補間方式、配色理論の計算式や保存形式の変更。
- CustomSelectを使う他の選択UIへのプレビュー追加。
- WCAG AAAへの全面対応、テーマ全体の色トークン刷新、外部アクセシビリティライブラリの追加。

## 影響を受ける現行仕様

- [Gradient System](../../../specs/current/gradient-system)
- [UI入力コントロール](../../../specs/current/ui-controls)

## 関連ADR

- [ADR-0012 型付きローカライズとアイコン意味論](../../../adr/0012-typed-localization-and-icon-semantics)

## 主なリスク

文字背面の色を強くすると背景の色差が分かりにくくなり、暗い色や明るい色では文字のコントラストが変動します。半透明の暗色オーバーレイ、テキストシャドウ、背景色の実測を組み合わせ、ラベルと色の両方を確認します。CSS背景を分離して指定し、透明度プレビューのチェッカーが色帯を覆わないようにします。

## 未決定事項

なし。実装前に人間レビューを完了します。
