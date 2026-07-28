---
title: 2026-07-28変更履歴
---

# 2026-07-28変更履歴

07-28に実装した変更を、履歴参照用の1つの日付bundleへ整理しています。各変更のWhy／What／検証結果は、元のCHANGE IDを付けたファイルとして保持しています。これは過去履歴の整理であり、複数の独立した要求を今後も1つのchangeへ混ぜることを意味しません。

このbundleの正規パッケージは[CHANGE-010のproposal](./proposal)です。元のCHANGE-002〜009は、当時の実装・検証単位を確認するための履歴スナップショットです。

## 変更一覧

| ID | 内容 | 記録 |
| --- | --- | --- |
| CHANGE-002 | Tweeq入力コントロール、Slit選択UI | [proposal](./CHANGE-002-proposal) / [delta](./CHANGE-002-delta) / [tasks](./CHANGE-002-tasks) / [validation](./CHANGE-002-validation) |
| CHANGE-003 | InputAngleロータリーボタン | [proposal](./CHANGE-003-proposal) / [delta](./CHANGE-003-delta) / [tasks](./CHANGE-003-tasks) / [validation](./CHANGE-003-validation) |
| CHANGE-004 | GradientRampプレビュー、配色補助 | [proposal](./CHANGE-004-proposal) / [delta](./CHANGE-004-delta) / [tasks](./CHANGE-004-tasks) / [validation](./CHANGE-004-validation) |
| CHANGE-005 | プレビューと配色補助の視認性 | [proposal](./CHANGE-005-proposal) / [delta](./CHANGE-005-delta) / [tasks](./CHANGE-005-tasks) / [validation](./CHANGE-005-validation) |
| CHANGE-006 | プレビュー直接選択、操作順序 | [proposal](./CHANGE-006-proposal) / [delta](./CHANGE-006-delta) / [tasks](./CHANGE-006-tasks) / [validation](./CHANGE-006-validation) |
| CHANGE-007 | プレビュー制御、配色補助UI | [proposal](./CHANGE-007-proposal) / [delta](./CHANGE-007-delta) / [design](./CHANGE-007-design) / [tasks](./CHANGE-007-tasks) / [validation](./CHANGE-007-validation) |
| CHANGE-008 | Harmonyヘッダー密度 | [proposal](./CHANGE-008-proposal) / [delta](./CHANGE-008-delta) / [tasks](./CHANGE-008-tasks) / [validation](./CHANGE-008-validation) |
| CHANGE-009 | コミット単位の開発変更管理 | [proposal](./CHANGE-009-proposal) / [delta](./CHANGE-009-delta) / [design](./CHANGE-009-design) / [tasks](./CHANGE-009-tasks) / [validation](./CHANGE-009-validation) |

今後の実装は、会話ターンや日付ではなく、[変更パッケージ運用](../../../development/change-workflow)で定めたWhy／What／対象外／受け入れ条件のまとまりを1つのactive changeとして扱います。
