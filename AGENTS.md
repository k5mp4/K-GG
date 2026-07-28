# K-GG repository instructions

このリポジトリでは、文書を実装とテストの一次情報として扱う。仕様の詳細とテンプレートは [`docs/development/docdd.md`](docs/development/docdd.md) を参照する。

## 作業を始める前に

1. [`docs/development/index.md`](docs/development/index.md) と [`docs/development/change-workflow.md`](docs/development/change-workflow.md)、必要に応じて [`CONTRIBUTING.md`](CONTRIBUTING.md) を読む。
2. 変更を `S`（文書整理）、`B`（不具合）、`F`（機能）、`A`（長期的な設計）、`X`（実験）に分類する。利用者、保存形式、出力、描画、UI、外部連携から観測できる動作が変わるなら、原則 `S` にはしない。
3. 対象領域の `docs/specs/current/`、関連ADR、`docs/changes/active/` を確認する。対象のcurrent specがない場合は、Legacy SPEC、コード、テストから現行動作を調査し、必要なcurrent specとchangeをレビューへ出す。
4. 今回の要求が既存changeのWhy／What／対象外／受け入れ条件に収まるなら、そのchangeへ追記する。収まらない独立要求だけ新しいactive changeを作成する。会話ターンや小さな修正ごとにディレクトリを増やさない。
5. 観測可能な変更は、`proposal.md` の `status: approved` と `human_review: completed`、レビュー済みの `delta.md` を確認してから実装する。承認状態をAIや自動検査だけで作らない。

## 文書の境界

- current specは「現在有効な動作」を記録する。current specだけを実装許可とは解釈しない。
- approved active changeは「今回実装してよい差分、対象外、受け入れ条件」を記録する。
- `design.md`は一つのchangeのHow、ADRは複数機能を拘束する長期的なWhy/Decisionとして使い分ける。
- Archiveは完了した変更の履歴であり、現行動作の根拠として先に参照しない。
- `docs/specs/SPEC-*.md`はLegacy Change Specificationである。公開リンクとIDを維持し、現在の仕様として無条件に採用しない。

## 実装ルール

- `approved` active changeの対象、受け入れ条件、禁止スコープだけを実装する。
- 1つの変更パッケージに属する関連コード、テスト、文書は、検証結果とともに1コミットへまとめられる粒度で管理する。複数コミットが必要な場合も、合理的な理由をvalidationへ記録し、changeディレクトリは増やさない。
- 過去の同日履歴を整理する場合は、元のCHANGE IDと検証記録を保持した日付bundleへまとめる。日付bundleを新しい実装changeの単位とは解釈しない。
- 新機能、UI、描画、保存、出力、外部連携など外部から観測できる変更を、承認済みchangeなしに実装しない。
- `S`区分で変更仕様を省略できるのは、利用者向け契約や外部から観測できる振る舞いを変えない文書・整理だけである。
- `B`では期待動作をcurrent specへ追記または明確化し、再現テストを追加する。対応する仕様がなければ短いcurrent specとB changeを先に作る。
- 仕様とコード、テストが矛盾した場合、どれかへ黙って合わせない。該当箇所、影響、選択肢を報告し、currentまたはchangeを再レビューする。
- `approved`後にWhy/What、スコープ、受け入れ条件を変える場合は、実装を続けず `review`へ戻して再承認する。
- `status`、`human_review`、validationの結果を、実際のレビューや確認なしに `approved`・`implemented`・`archived`・`pass`へ変更しない。手動確認をしていない場合は未確認として記録する。
- 受け入れ条件ごとに自動テストまたは再現可能な手動確認を行い、実行コマンドはchangeの `validation.md`、ファイルパスはfrontmatterの `related_code` / `related_tests`に記録する。
- commit、push、Pull Requestなどの外部Git操作は、ユーザーが明示的に依頼した場合だけ実行する。
- 完了時はdeltaをcurrent specへ統合し、関連コード・テスト・ADR・利用者向け文書を同期してからchangeをArchiveへ移動する。Archiveだけを更新してcurrentを古いままにしない。
- 仕様外の改善を同じchangeへ含めない。必要なら別のCHANGEを作る。

## 変更区分ごとの最低限の文書

| 区分 | 条件 | 最低限必要なもの |
| --- | --- | --- |
| S | 外部から観測できる契約を変えない | 対象文書、index/linkの同期、`npm run docs:check` |
| B | 期待動作との差異を修正する | `proposal.md`、`delta.md`、`tasks.md`、`validation.md`、再現テスト |
| F | 利用者向け動作を追加・変更する | `proposal.md`、`delta.md`、`tasks.md`、`validation.md` |
| A | 永続化、主要依存、層構造、配布、セキュリティ等を長期拘束する | Fの文書に加えて`design.md`とADR |
| X | 隔離した実験・技術検証 | `proposal.md`またはexperiment、`validation.md`。承認までcurrentへ統合しない |

## 参照の優先順位

```text
approved active change
→ current spec
→ accepted ADR
→ tests
→ implementation
→ Legacy Change Specification
```

これは矛盾を自動解決する規則ではない。差異を検出した場合は人間へ報告する。

## サブエージェント運用

`.agents/*.yaml` は親エージェントの判断を置き換えず、実装、テスト、セキュリティレビューを分担する補助役として使う。

- `implementation-expert`: approved change、関連current spec/ADR、対象ファイル、受け入れ条件、禁止スコープを渡して指定範囲だけを任せる。
- `test-automation-engineer`: 受け入れ条件と実装差分を渡し、VitestまたはRustテストと手動確認観点を任せる。
- `security-auditor`: Tauri/Rust、ファイル操作、外部FFmpeg、更新機構、依存関係、外部入力を触る差分で必ずレビューに使う。

結果を受け取った後、親エージェントが文書、コード、テスト、検証結果の整合を最終確認する。

## 完了条件

- changeの全受け入れ条件を検証し、`validation.md`へ結果と未確認事項を記録している。
- current spec、コード、テスト、ADR、利用者向け文書に矛盾がない。
- `npm run docs:check` と `npm run docs:build` が成功する。
- コード変更時は範囲に応じて `npm test`、`npm run lint`、`npm run build` を実行する。
- Tauri/Rust変更時は `cargo test --manifest-path src-tauri/Cargo.toml` と `cargo check --manifest-path src-tauri/Cargo.toml` を実行する。
- 完了したchangeはcurrentへ統合し、`status: archived`としてArchiveへ移動している。activeのままの場合は未完了の理由を記録する。
