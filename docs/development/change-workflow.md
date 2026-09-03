---
title: Change Capsule運用
---

# Change Capsule運用

Change Capsuleは、複雑なDesigned ChangeのWhy、仕様差分、設計、検証を一時的にまとめるための成果物です。すべてのRequestに作るものではありません。Requestの分類とLifecycleは[開発ワークフロー](./workflow.md)を一次情報とします。

## 作成する基準

次のいずれかに当てはまる場合に、Issueまたは既存Requestと同じ短命ブランチ上へCapsuleを作ります。

- Current Specの受け入れ可能な動作を変更する。
- 保存、出力、描画、UI、外部連携の契約を変更する。
- 複数機能を拘束するArchitecture Decisionが必要になる。
- 複数PRへ分ける大きな変更で、PRだけではWhy/対象外/移行を追跡できない。
- 実装中の追加要求が既存Requestの対象外、AC、互換性を変更する。

誤字、局所CSS、明確な小修正、外部契約を変えない内部整理はQuick ChangeとしてCapsuleを省略できます。Bugや将来作業を後から参照する価値がある場合はTracked ChangeとしてIssueを作成しますが、Issueの存在だけでCapsuleを要求しません。

## 成果物の選び方

```text
Quick       → PR
Tracked     → Issue + PR
Designed    → Issue + 必要なCapsule/Spec Delta/ADR + PR
```

Capsuleに含めるファイルは必要最小限にします。

| ファイル | 使う場合 |
| --- | --- |
| `proposal.md` | Designed ChangeのWhy、What、対象外、AC、metadata |
| `delta.md` | Current Specの要件を追加・変更・削除する場合 |
| `design.md` | 複数の実装判断、データ移行、外部境界、ロールバックがある場合 |
| `tasks.md` | Issue/PR checklistだけでは追跡できない作業分解がある場合 |
| `validation.md` | Change固有のAC、Gate、環境依存の未確認事項を残す場合 |

`tasks.md`はIssue/PR checklistの代替ではありません。`validation.md`はCIログの複製場所ではなく、Merge Gate、Release Gate、Observationの判断を記録する場所です。

## metadata

既存の`proposal.md`は次のfrontmatterを使います。

```yaml
type: change
id: CHANGE-###
title: 変更の短い名前
status: draft
change_kind: F
owners: [maintainer]
created: YYYY-MM-DD
updated: YYYY-MM-DD
current_specs: [CURRENT-example]
related_adrs: []
human_review: required
```

Archiveへ移したChangeは必要に応じて次を追加します。

```yaml
outcome: merged       # merged / follow-up / cancelled / superseded
follow_up: issue-needed: Release Gateの実機確認
```

`outcome: follow-up`は実装が完全だという意味ではありません。未完了のAC、失敗、Release Gate待ち、ObservationをArchiveへ移した理由と、Issue化が必要な内容を明示します。

## 状態とReview

```text
draft → review → approved → implemented → archived
                         └→ cancelled
```

仕様・対象外・AC・互換性に影響する変更は人間レビューへ戻します。AIや`docs:check`は人間レビューを代替しません。承認済みChangeの本文を変更する場合は、PRで変更理由を明記し、必要なら再承認します。

## Finalize

実装とMerge Gateが完了し、Current Spec/ADRの意味的な同期を人間またはAIが済ませたら、feature branch/PR上で実行します。

```sh
npm run change:check
npm run change:finalize CHANGE-###
npm run change:check -- --require-empty
```

`change:finalize`は次を自動化します。

- proposal metadataとChange IDの検査
- Current Specの`related_changes`逆参照の検査
- Change内とindexの相対リンク検査
- Active/Archiveの構造確認
- proposalの`status: archived`と`outcome`の記録
- Archive directoryへの安全な移動
- active/archive indexの再生成

Current Spec本文の意味的な書換え、ADRの判断、GitHub Issue作成は自動化しません。Issueが必要な場合は人間が作成し、Archiveの`follow_up`またはPRから追跡できるようにします。

通常のfinalizeは`status: implemented`とMerge Gate成功を要求します。既存Activeの整理など、実装完了と移行を区別する必要がある場合だけ次を使います。

```sh
npm run change:finalize CHANGE-### -- --migration --outcome=follow-up --follow-up="issue-needed: 残作業"
```

Migration modeはMerge Gateの成功を捏造せず、元のValidationを保ったまま履歴をArchiveへ移します。新しい実装に通常利用しません。

## mainの境界

`docs/changes/active/`はPR中の一時成果物です。mainへマージするPRでは、実装、Current Spec/ADR同期、finalize、index更新を同じPRへ含めます。手動・GPU・Tauri・FFmpeg・After Effects確認が残る場合も、Release Gate/ObservationとしてArchive後にIssueで追跡し、mainにActiveを残しません。
