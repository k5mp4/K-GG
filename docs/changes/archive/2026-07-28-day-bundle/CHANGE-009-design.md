# Design

## 変更パッケージ

開発の基本単位を`request`や会話ターンではなく、承認済みの`change package`とします。パッケージには次を1組だけ持たせます。

```text
CHANGE-###-short-name/
  proposal.md   Why / What / scope / acceptance criteria
  delta.md      current specとの差分
  design.md     複数の実装判断がある場合のHow
  tasks.md      実装・検証作業
  validation.md ACごとの実行結果と未確認事項
```

追加指示は次の判定で扱います。

```text
追加指示
  ├─ 同じ目的・利用者影響・契約・対象外に収まる
  │    └─ 既存changeへ追記 → 必要なら再承認 → 同じ検証記録へ追加
  └─ 独立した目的・影響、またはAC／対象外を変更する
       └─ 新しいchange候補 → 現在の作業と分離
```

## コミットとの関係

1つのchange packageは原則1コミットへまとめられるようにします。ただし、生成物、レビュー分割、機械的整形などで複数コミットが合理的な場合は、コミットを分けてもchange packageは増やしません。ユーザーがコミットを依頼するまで、作業ツリーの整理・検証・差分確認だけを行い、commit/push/PRは行いません。

## 文書の階層

- `AGENTS.md`: 作業開始条件、禁止スコープ、承認・Git操作の境界だけを短く記載。
- `docs/development/change-workflow.md`: change packageの判定、artifact、状態遷移、追加指示、コミット準備の一次情報。
- `docs/development/docdd.md`: current/change/archiveの意味と、上記workflowへのリンク。重複する詳細手順は持たない。
- `docs/development/development-guide.md`: セットアップ、テスト、Git/PR、workflowへの入口リンク。
- `docs/changes/`: 個別パッケージのWhy/What/How/検証と履歴。

## 状態遷移

```text
draft → review → approved → implemented → archived
                         └→ cancelled
```

実装開始に必要なのは`approved`と`human_review: completed`です。承認後にスコープやACを変える場合は同じchangeを`review`へ戻し、再承認します。細かな実装手順の進捗だけでは新しいchangeを作りません。
