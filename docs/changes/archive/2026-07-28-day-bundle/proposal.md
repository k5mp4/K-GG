---
type: change
id: CHANGE-010
title: 2026-07-28変更履歴の統合
status: archived
change_kind: S
owners: [maintainer]
created: 2026-07-28
updated: 2026-07-28
current_specs: [CURRENT-GRADIENT, CURRENT-UI-CONTROLS]
related_adrs: [ADR-0011, ADR-0012, ADR-0014]
related_code: [AGENTS.md, docs/development/change-workflow.md, docs/changes/archive/index.md, docs/specs/current/gradient-system.md, docs/specs/current/ui-controls.md]
related_tests: ['manual: archive bundle and documentation validator check']
human_review: completed
---

# 2026-07-28変更履歴の統合

## 背景・問題

2026-07-28の作業では、同じ一連のUI・Gradient改善と開発体制整理に対してCHANGE-002〜009のArchiveディレクトリが作られました。履歴を参照するたびに日付ディレクトリが分散し、変更単位と会話ターンの境界が分かりにくくなっていました。

## 変更理由

07-28の履歴を1つの日付bundleへまとめ、今後の実装では会話ターンや日付ではなく、承認済みのWhy／What／対象外／受け入れ条件を1つのchangeパッケージとして扱える状態にします。

## 対象

- 07-28のArchiveディレクトリを`2026-07-28-day-bundle`へ統合する。
- 検証器が認識する正規の変更パッケージとしてCHANGE-010のproposal、delta、tasks、validationを置く。
- CHANGE-002〜009の元文書は履歴スナップショットとして保持する。
- Archive indexとcurrent specの関連変更をCHANGE-010へ同期する。
- 追加指示の取り込みとコミット単位のルールを開発ドキュメントへ明記する。

## 対象外

- アプリのUI、描画、保存形式、計算、出力の変更。
- CHANGE-002〜009の履歴本文の書き換えや削除。
- ユーザーが明示していないcommit、push、Pull Requestの実行。

## 受け入れ条件

- 07-28のトップレベルArchiveディレクトリが1つだけ存在する。
- `tools/check-docs.mjs`がCHANGE-010を読み取り、current specの関連変更を解決できる。
- 元のCHANGE-002〜009のID、文書、検証記録へbundle内から到達できる。
- 今後の追加指示が既存changeへ取り込まれる条件と、新しいchangeへ分離する条件が文書化されている。
