---
type: change
id: CHANGE-004
title: GradientRampのプレビューと配色補助ツールを改善
status: archived
change_kind: F
owners: [maintainer]
created: 2026-07-28
updated: 2026-07-28
current_specs: [CURRENT-GRADIENT]
related_adrs: [ADR-0001, ADR-0012]
related_code: [src/components/GradientRamp.tsx, src/components/CustomSelect.tsx, src/components/ColorPaletteGenerator.tsx, src/components/Icon.tsx, src/lib/colorHarmony.ts, src/App.tsx, src/i18n/messages.ts]
related_tests: [src/lib/gradientRampUtils.test.ts, src/lib/colorHarmony.test.ts, 'manual: GradientRamp preview and harmony palette browser checks']
human_review: completed
---

# CHANGE-004 GradientRampのプレビューと配色補助ツールを改善

## 背景・問題

GradientRampのカラーモードと補間方法は、ホバーまたはクリックで選択肢を開くまで、適用後の見た目を判断できません。RGB、HSV、OKLCHなどの色空間や、Ease、Constantなどの補間方式を選ぶ前に、現在のストップからどのような色のつながりになるかを比較できる必要があります。現在の選択UIには、プレビューを常時表示する切替もありません。

また、右サイドバーには「グラデーションワークスペース」や「01 / 主要設定」の補助見出しが表示されますが、設定内容の識別に不要です。削除アイコンのパスも不完全で、ゴミ箱の外形が壊れて表示されます。

画像からパレットを抽出する既存のColor Palette Generatorに、指定色から配色理論に基づく候補を作る機能がありません。Adobe Colorのように、類似色、補色、分割補色、トライアド、スクエア、複合色、シェード、モノクロマティックを、説明文や色名の一覧ではなく実際の色チップとして比較し、そのままGradientへ適用できる補助が必要です。基準色はtweeqのInputColorで1色だけ指定し、補色なら基準色に対するもう1色、トライアドなら基準色に対するもう2色を自動生成するなど、入力を増やさず判断を補助します。

## 変更理由

色空間と補間方式の違いを適用前に視覚比較できるようにし、選択後の結果を予測しやすくします。補助見出しを減らして設定本体へ視線を集中させ、壊れたアイコンを共通コンポーネント側で修正します。

## ゴール・成功条件

- Color Modeの各選択肢に、現在のストップを候補の色空間と既定補間で評価したカラーパレットを表示する。
- Interpの各選択肢に、現在のストップを候補の補間方式で評価したカラーパレットを表示する。
- カラーモード／補間プレビューの常時表示をボタンで切り替えられる。初期状態は現在のホバー動作を保ち、既存のクリック選択を壊さない。
- 「グラデーションワークスペース」と「01 / 主要設定」の不要な見出しを削除する。
- 削除アイコンを完全なゴミ箱形状で描画し、既存のアイコンボタンのサイズ・アクセシビリティを維持する。
- tweeqのInputColorで基準色を1色だけ指定し、類似色、補色、分割補色、トライアド、スクエア、複合色、シェード、モノクロマティックの候補を実際の色チップ／帯として生成する。補色は追加1色、トライアドは追加2色を生成し、色の判断を視覚的に補助する。
- 配色補助では色数、Hex文字列、明度・彩度などの追加入力を要求せず、配色ルールの切替と生成された色の確認だけで使える。候補名や説明文は補助情報に留める。
- プレビューは選択前の表示だけに使用し、保存されるRamp値、色変換、補間計算、プリセット形式は変更しない。

## 対象

- `CustomSelect`の選択肢プレビュー描画と、プレビュー常時表示の切替。
- `GradientRamp`のColor Mode／Interp向け候補プレビュー。
- 既存の画像抽出パレット生成へ、tweeqのInputColorを使った最小入力の配色理論別候補生成を追加する。
- 右サイドバーの不要見出しと日本語／英語メッセージキーの整理。
- 共通`Icon`のdeleteパス修正。

## 対象外

- カラーモード、補間方式、Rampストップの保存形式や値域の変更。
- 色変換や補間アルゴリズム自体の変更。
- すべての選択UIをプレビュー対応にすること。
- Adobe Colorのアカウント連携、オンライン共有、外部API、完全な色知覚モデルの再現。
- 配色補助での自由な色数指定、複数の基準色入力、手入力Hex欄、詳細な色調整パネル。
- アイコンライブラリ全体の刷新や外部アイコン依存の追加。

## 影響を受ける現行仕様

- [Gradient System](../../../specs/current/gradient-system)

## 関連ADR

- [ADR-0001 文書を一次情報とする](../../../adr/0001-documentation-source-of-truth)
- [ADR-0012 型付きローカライズとアイコン意味論](../../../adr/0012-typed-localization-and-icon-semantics)

## 主なリスク

候補ごとのプレビュー計算を毎回重くすると、選択UIの開閉やストップ編集中の応答性が低下する可能性があります。プレビューは少数サンプルのCSSグラデーションとして生成し、実Ramp描画の高精度キャンバス処理とは分離します。候補を適用した結果とプレビューの意味がずれないよう、既存の`getColorAtPosition`と正規化済み設定を利用します。

## 未決定事項

プレビュー常時表示ボタンの初期状態とラベルは、人間レビューで確認します。保存形式へ状態を追加するかどうかは、セッション内のUI状態として保存しない方針を既定案とします。
