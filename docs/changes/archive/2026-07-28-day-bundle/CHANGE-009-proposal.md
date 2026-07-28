---
type: change
id: CHANGE-009
title: コミット単位の開発変更管理へ整理
status: archived
change_kind: A
owners: [maintainer]
created: 2026-07-28
updated: 2026-07-28
current_specs: []
related_adrs: [ADR-0014]
related_code: [AGENTS.md, docs/development/docdd.md, docs/development/development-guide.md]
related_tests: ['manual: change package and commit workflow review']
human_review: completed
---

# CHANGE-009 コミット単位の開発変更管理へ整理

## 背景・問題

現在の運用では、会話中の追加指示や小さな修正ごとに新しいchangeディレクトリを作る流れになりやすく、proposal、tasks、validation、Archiveが細かく分断されます。変更の意図と検証履歴を残す目的に対して、実装単位と文書単位が過剰に増える場合があります。

## 変更理由

人間が承認したまとまりを1つの変更パッケージとして扱い、そのパッケージを原則1コミット単位で追跡できるようにします。実装中の関連する追加指示は、既存のWhy／What／受け入れ条件の範囲内なら同じchangeのproposal、tasks、validationへ追記します。独立した機能、別の利用者影響、または承認済みスコープを変える要求だけを新しいchangeとして分離します。

## ゴール・成功条件

- ユーザー要求や会話ターンの数ではなく、承認された変更パッケージ単位でchangeディレクトリを作る。
- 同じパッケージ内の追加修正ではディレクトリを増やさず、既存のproposal／delta／tasks／validationを更新する。
- Why／What、対象外、受け入れ条件が変わる場合だけレビューへ戻し、同じパッケージを再承認する。
- 1つの承認済みパッケージに属するコード・テスト・文書を、検証結果とともに1コミットへまとめられる。
- コミットやpushは承認パッケージの単位を参考にするが、ユーザーが明示的に依頼するまで外部Git操作を実行しない。
- `AGENTS.md`は短い実行制約に絞り、詳細な変更管理手順は開発ドキュメントへ集約する。

## 対象

- `AGENTS.md`のchange作成・追加指示・コミット単位に関する運用ルール。
- `docs/development/docdd.md`の変更パッケージ、レビュー、Archive手順。
- `docs/development/development-guide.md`のAI・人間レビューとGit運用の説明。
- 必要に応じた新しい開発体制ドキュメントとADR。

## 対象外

- アプリのUI、描画、保存形式、ユーザー向け機能。
- 承認なしのコミット、push、Pull Request作成を許可すること。
- current specの要件IDやアプリ機能別のchange履歴を削除すること。
- 過去のArchiveを、履歴を失う形で統合・削除すること。

## 影響を受ける現行仕様

この変更はアプリのcurrent specを変更しません。開発運用の一次情報として、`docs/development/`と`AGENTS.md`を更新します。

## 関連ADR

- [ADR-0014 コミット単位の変更パッケージ](../../../adr/0014-commit-centered-change-workflow)

## 主なリスク

同じchangeへ無関係な要求を混ぜると、かえってレビュー範囲が不明瞭になります。追加指示が既存のWhy／What／ACに収まるかを判定する基準を文書化し、収まらない場合は新しいchangeへ分離します。コミット単位とchange単位を同一視しすぎて、ユーザーが望まないコミットや公開操作を自動実行しないよう、Git操作の明示依頼ルールは維持します。

## 未決定事項

- 同一change内で、検証を分ける必要がある独立したコミットを許容するか。
- `AGENTS.md`へ残す最小限の規則と、開発ドキュメントへ移す詳細の境界。

これらは人間レビューで確定し、承認前にproposalとdesignへ反映します。
