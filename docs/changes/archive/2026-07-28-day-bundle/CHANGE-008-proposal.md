---
type: change
id: CHANGE-008
title: 配色補助ヘッダーの密度と説明文レイアウトを修正
status: archived
change_kind: B
owners: [maintainer]
created: 2026-07-28
updated: 2026-07-28
current_specs: [CURRENT-GRADIENT]
related_adrs: [ADR-0012]
related_code: [src/components/ColorPaletteGenerator.tsx]
related_tests: ['manual: narrow right-sidebar harmony header and preview toggle layout']
human_review: completed
---

# CHANGE-008 配色補助ヘッダーの密度と説明文レイアウトを修正

## 背景・問題

Color Palette Generatorの配色補助ヘッダーでは、説明文の横に`Local`表示とHarmony用のShow／Hide previewsボタンが配置されています。右サイドバーが狭くなると説明文の横幅が過度に縮み、文章が一文字ずつに近い縦長表示になります。

## 変更理由

配色補助の見出しとプレビュー切替を同じ行へ置き、説明文をその下の独立した行へ移します。説明文が操作ボタンの横幅に影響されないようにし、右サイドバーの狭い表示領域でも読める行幅を確保します。`Local`は利用者の判断に必要な情報ではないため削除します。

## ゴール・成功条件

- 配色補助の見出しとHarmony用Show／Hide previewsボタンが同じ行に表示される。
- 説明文が見出し行の下に表示され、ボタンと横幅を競合しない。
- `Local`という表示を配色補助UIから削除する。
- 右サイドバーを狭くしても、説明文が不自然に一文字単位の縦長にならず、読みやすい行として折り返される。
- Harmony候補、基準色、プレビュー切替の動作と保存形式を変更しない。

## 対象

- Color Palette GeneratorのHarmonyセクションヘッダーDOMとCSSレイアウト。
- 右サイドバーの狭幅ブラウザー確認。

## 対象外

- 説明文の内容そのものの変更。
- Harmonyの色計算、候補一覧、保存形式、Gradientへの適用処理の変更。
- Color Mode／Interp側のプレビュー切替。

## 影響を受ける現行仕様

- [Gradient System](../../../specs/current/gradient-system)

## 関連ADR

- [ADR-0012 型付き辞書と意味的アイコン](../../../adr/0012-typed-localization-and-icon-semantics)

## 主なリスク

見出しとボタンを同じ行に配置した結果、極端に狭い幅で見出しが押し出される可能性があります。見出し側に`min-w-0`、操作側に`shrink-0`を適用し、説明文は次行の全幅を使う構造にしてブラウザーで確認します。

## 未決定事項

なし。人間レビュー後に実装します。
