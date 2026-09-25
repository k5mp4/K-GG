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

## 作成とID

Capsuleは次のコマンドで作成します。

```sh
npm run change:new -- export-format --title="書き出し形式の追加"
```

`docs/changes/active/CHANGE-YYYYMMDD-slug/proposal.md`がテンプレートから作られます。`delta.md`などは必要な場合だけ`docs/changes/_template/`からコピーします。

IDとdirectory名は同じ`CHANGE-YYYYMMDD-slug`にします。slugは小文字英数字とハイフンです。連番は並列ブランチが同じ「次の番号」を取り合って衝突するため、新しいChangeには使いません。`CHANGE-001`〜`CHANGE-056`は履歴IDとして有効なまま残します（[ADR-20260925-conflict-free-doc-metadata](../adr/20260925-conflict-free-doc-metadata.md)）。

## 並列開発で衝突させない規則

複数のPRが同じ共有ファイルへ追記しないよう、Changeは自分のdirectoryだけで完結させます。

| 共有されていた情報 | 現在の正本 | PRで編集しないもの |
| --- | --- | --- |
| Active/Archive一覧 | 各`proposal.md`のfrontmatter（VitePressがビルド時に描画） | `docs/changes/active/index.md`、`docs/changes/archive/index.md` |
| Change ID | 日付+slug | 他Changeとの連番調整 |
| ChangeとCurrent Specの関係 | Changeの`current_specs` | Current Specの`related_changes`への追記 |
| ADR一覧 | 各ADRのfrontmatter（VitePressがビルド時に描画） | `docs/adr/index.md` |
| ADR ID | `ADR-YYYYMMDD-slug`（`npm run adr:new -- <slug> --title="..."`、ファイル名`YYYYMMDD-slug.md`） | 他ADRとの連番調整 |

Current Specの本文・要件の変更は同じ領域を触る並列PR同士で衝突し得ます。それは意味的な競合なので、機械的に回避せずPRで解消します。

## metadata

`proposal.md`は次のfrontmatterを使います。

```yaml
type: change
id: CHANGE-YYYYMMDD-slug
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
npm run change:finalize <CHANGE-ID>
npm run change:check -- --require-empty
```

`change:finalize`は次を自動化します。

- proposal metadataとChange IDの検査
- `current_specs`が既存Current Specを指すことの検査
- Change内の相対リンク検査
- Active/Archiveの構造とID重複の確認
- proposalの`status: archived`と`outcome`の記録
- Archive directoryへの安全な移動

indexはビルド時に生成されるため、finalizeはChange directory以外のファイルを変更しません。

Current Spec本文の意味的な書換え、ADRの判断、GitHub Issue作成は自動化しません。Issueが必要な場合は人間が作成し、Archiveの`follow_up`またはPRから追跡できるようにします。

通常のfinalizeは`status: implemented`とMerge Gate成功を要求します。既存Activeの整理など、実装完了と移行を区別する必要がある場合だけ次を使います。

```sh
npm run change:finalize <CHANGE-ID> -- --migration --outcome=follow-up --follow-up="issue-needed: 残作業"
```

Migration modeはMerge Gateの成功を捏造せず、元のValidationを保ったまま履歴をArchiveへ移します。新しい実装に通常利用しません。

## mainの境界

`docs/changes/active/`はPR中の一時成果物です。mainへマージするPRでは、実装、Current Spec/ADR同期、finalizeを同じPRへ含めます。手動・GPU・Tauri・FFmpeg・After Effects確認が残る場合も、Release Gate/ObservationとしてArchive後にIssueで追跡し、mainにActiveを残しません。
