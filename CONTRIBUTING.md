# K-GGへのコントリビューション

K-GGはDocDD（Document-Driven Development）を採用しています。現在の動作はcurrent spec、今回の差分はactive change、実装方法はdesign、長期判断はADR、完了した経緯はArchiveへ分けて記録します。最初からコードを読み尽くす必要はありません。対象領域と変更IDを絞り、文書と検証を小さく同期してください。

## 最初に読む資料

- [開発者向けドキュメント](docs/development/index.md)
- [現行仕様](docs/specs/current/index.md)
- [進行中の変更](docs/changes/active/index.md)
- [DocDD運用ガイド](docs/development/docdd.md)
- [ADR一覧](docs/adr/index.md)

## 変更区分の目安

| 区分 | 使う場面 | 実装開始条件 |
| --- | --- | --- |
| S | 誤字、リンク、意味を変えない文書整理 | changeなし可。動作契約を変えないことをPRに明記 |
| B | 既存の期待動作との差異を修正 | B changeのdeltaと再現テストをレビュー済み |
| F | UI、描画、保存、出力などの機能変更 | F changeのdeltaと受け入れ条件を承認済み |
| A | 永続化、主要依存、層構造、配布、セキュリティ等の長期判断 | A changeのdesignとADRを含めて承認済み |
| X | 隔離した実験、Shader検証、性能計測 | 実験として隔離。製品仕様へ入れるときは別changeで再承認 |

外部から観測できる変更をSとして扱わないでください。迷ったときは、まず変更の影響範囲をIssueまたは相談に記録します。

## 基本フロー

1. Issueまたは相談で、解決する問題、変更区分（S/B/F/A/X）、対象外、未決定事項を明確にする。
2. 対象領域のcurrent spec、`related_adrs`に記載されたADR、active change、必要なLegacy SPECを読む。
3. current specがない場合は未移行領域として現行動作を調査し、最小限のcurrent spec候補とchangeを作る。Legacy SPECを現在の仕様として無条件に転記しない。
4. 観測可能な変更なら `docs/changes/active/CHANGE-###-short-name/` を作る。`current_specs` と要件IDで、既存changeとの重複や競合がないことを確認する。
5. `proposal.md` と `delta.md` をレビューし、人間が `status: approved` と `human_review: completed` にした後で実装する。承認後にWhy/Whatやスコープを変えるときは、再レビューする。
6. 必要に応じて `design.md` と `tasks.md` を確定する。実装方法の判断をdeltaやcurrent specへ混ぜない。
7. ACごとに自動テストまたは再現可能な手動確認を追加し、実際の結果を `validation.md` に記録する。
8. `related_code`、`related_tests`、ADR、利用者向け文書を実態に合わせる。
9. deltaをcurrent specへ統合し、changeを `docs/changes/archive/YYYY-MM-DD-short-name/` へ移動する。currentに過去の経緯を時系列で追記しない。

S区分の文書整理は変更仕様を省略できますが、変更しない契約と同期対象をPRに明記してください。X区分の結果は承認されるまでcurrentへ統合しません。

## 文書の使い分け

- `docs/specs/current/`: 現在有効な観測可能動作。変更をまたいで維持する要件IDを使う。
- `docs/changes/active/`: 今回のWhy/What、delta、対象外、How、tasks、validation。
- `docs/changes/archive/`: 完了済み変更の履歴。現在の動作を確認するときの入口ではない。
- `design.md`: 一つの変更のHow。複数機能に効く判断や再検討条件はADRへ切り出す。
- `docs/adr/`: 複数機能を拘束する技術判断、代替案、再検討条件。
- `docs/specs/SPEC-*.md`: 旧方式のLegacy Change Specification。IDとリンクを維持する。

current specは「現在の真実」、approved active changeは「今回実装する差分」です。current specだけを実装許可と解釈せず、Archiveだけを現在仕様の根拠と解釈しないでください。

## ローカル検証

文書変更では次を実行します。

```sh
npm run docs:check
npm run docs:build
```

コード変更を含む場合は必要に応じて次も実行します。

```sh
npm test
npm run lint
npm run build
```

Tauri/Rust、ファイル操作、FFmpeg、更新機構、依存関係、外部入力を変更した場合は追加します。

```sh
cargo test --manifest-path src-tauri/Cargo.toml
cargo check --manifest-path src-tauri/Cargo.toml
```

実行コマンドは変更仕様の `validation.md` のCommandsへ、ファイルパスはfrontmatterの `related_code` / `related_tests` へ分けて記載します。実行していない手動確認をpassとして記録しないでください。

## Pull Request前の確認

- [ ] 変更区分、対象current spec、Requirement ID、Change IDを記載した
- [ ] 仕様変更がある場合、deltaと受け入れ条件が承認済みである
- [ ] ACごとのテストまたは再現可能な手動確認と結果を記載した
- [ ] current spec、コード、テスト、利用者向け文書を同期した
- [ ] `npm run docs:check` と `npm run docs:build`を実行した
- [ ] 未確認事項、環境依存の失敗、既存警告を隠さず記載した

Pull Requestのテンプレートも同じ項目を確認します。仕様とコードが異なる場合は、コードだけを先にマージせず、差異を明示して再レビューします。
