---
title: 開発者向けドキュメント
---

# 開発者向けドキュメント

このページを、K-GGの開発を始める入口として使用します。利用方法を知りたい場合は[使い方ガイド](/)を参照してください。

## 初参加者向けの最短ルート

1. [開発・検証ガイド](./development-guide.md)でローカル起動と検証方法を確認する。
2. 変更したい機能を[現行仕様](../specs/current/index.md)で探し、要件IDと関連ADRを読む。
3. [進行中の変更](../changes/active/index.md)に対象のapproved changeがあるか確認する。なければ、観測可能な変更を実装せず、[DocDD運用ガイド](./docdd.md)に従って小さなchangeを提案する。
4. 実装後は受け入れ条件を検証し、current spec、テスト、利用者向け文書を同期する。

current specは現在の動作、active changeは今回実装する差分、ArchiveとLegacy SPECは過去の経緯です。この区別がつかない場合は、実装より先に[コントリビューションガイド](https://github.com/k5mp4/K-GG/blob/main/CONTRIBUTING.md)を確認してください。

## 推奨する読む順番

1. [プロジェクト概要](./project-overview.md)
2. [アーキテクチャ](./architecture.md)
3. [開発・検証ガイド](./development-guide.md)
4. [変更パッケージ運用](./change-workflow.md)
5. [DocDD運用ガイド](./docdd.md)
6. [現行仕様](../specs/current/index.md)
7. [進行中の変更](../changes/active/index.md)
8. [ADR一覧](../adr/index.md)
9. [UI用語・アイコン表記ガイド](./ui-terminology.md)

## 一次情報の優先順位

情報が矛盾した場合は、次の順序で確認します。ただし、矛盾を発見した時点で文書と実装を同期する必要があります。

1. 承認済みのactive change（今回の実装対象）
2. current spec
3. Accepted状態のADR
4. 実行可能なテスト
5. 実装コード
6. Legacy Change Specification

矛盾を見つけた場合は、上位文書へ自動的に合わせず、[仕様と実装が異なる場合](./docdd.md#仕様と実装が異なる場合)に従います。

## ドキュメントの責務

| 場所 | 読者 | 記録する内容 |
| --- | --- | --- |
| `README.md` | 初めて訪れた人 | 製品概要、最短の起動方法、主要リンク |
| `docs/index.md` | 利用者 | 操作方法、出力、利用上の注意 |
| `docs/development/` | 開発者 | 構造、ローカル開発、共通ルール |
| `docs/specs/current/` | 開発者・レビュー担当 | 現在有効なWhy/What、受け入れ可能な動作 |
| `docs/changes/` | 開発者・レビュー担当 | 今回のWhy/What、delta、How、tasks、validation、履歴 |
| `docs/specs/SPEC-*.md` | 開発者・レビュー担当 | Legacy Change Specificationとして過去の変更理由 |
| `docs/adr/` | 将来の開発者 | 長期的な技術判断と理由 |
| `AGENTS.md` | AIコーディングエージェント | リポジトリで常に守る作業規約 |

## 現在の文書化範囲

既存コード全体を一度に完全仕様化するのではなく、Gradient、Effect Stack、Presetから現行仕様を整備し、次の変更から機能領域ごとに蓄積します。未移行領域を変更する際は、Legacy SPEC・コード・テストを調査して現行動作を小さく記録し、current specとchangeをレビューしてから実装します。
