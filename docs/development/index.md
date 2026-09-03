---
title: 開発者向けドキュメント
---

# 開発者向けドキュメント

K-GGの開発は、入力元を限定しないDevelopment Requestから始めます。最初に[開発ワークフロー](./workflow.md)でQuick / Tracked / Designedを分類し、必要なCurrent Spec・ADR・Change Capsuleだけを読みます。

## 最短ルート

1. [開発ワークフロー](./workflow.md)でRequestの分類とSource of Truthを確認する。
2. [開発・検証ガイド](./development-guide.md)で環境と起動方法を確認する。
3. 対象の[現行仕様](../specs/current/index.md)と関連ADRを読む。過去Change/Legacy Specは必要なときだけ参照する。
4. [ValidationとCI](./validation.md)から変更範囲に合うコマンドを選ぶ。
5. Designed Changeだけ[変更Capsule運用](./change-workflow.md)に従い、Merge前にfinalizeする。

## 目的別リンク

| 目的 | 文書 |
| --- | --- |
| Request、分類、Issue、PR、main運用 | [開発ワークフロー](./workflow.md) |
| Change Capsule、finalize、Archive | [変更Capsule運用](./change-workflow.md) |
| DocsDDの責務とCurrent Spec | [DocDD運用ガイド](./docdd.md) |
| 検証コマンド、Gate、CI | [ValidationとCI](./validation.md) |
| AIが読むコンテキストと実装規約 | [AI駆動開発](./ai-development.md) |
| Release Gate、実機確認、GitHub設定 | [Releaseと環境検証](./releasing.md) |
| ローカル起動、テスト、構造 | [開発・検証ガイド](./development-guide.md) |
| アプリ構造 | [アーキテクチャ](./architecture.md) |
| プロジェクトの目的と制約 | [プロジェクト概要](./project-overview.md) |
| MCP開発インターフェース | [MCP開発ガイド](./mcp.md) |

## 文書の境界

- `docs/specs/current/`: 現在有効な観測可能動作。
- `docs/adr/`: 複数機能を長期に拘束する判断。
- `docs/changes/active/`: feature branch/PR中のDesigned Change用Capsule。mainでは原則0件。
- `docs/changes/archive/`: 完了・移行済みChangeの履歴。現在仕様の根拠ではない。
- `docs/specs/SPEC-*.md`: Legacy Change Specification。通常のAIコンテキストには含めない。
- `AGENTS.md`: AIコーディングエージェントが常に守る短い境界条件。

Current Spec、コード、テスト、Issue/PRの記述が異なる場合は、上位文書へ黙って合わせず、差異と選択肢をレビューへ出します。
