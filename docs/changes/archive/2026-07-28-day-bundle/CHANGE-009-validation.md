# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | document review | 変更パッケージの単位とchange作成条件 | pass |
| AC-002 | document review | 追加指示の同一change取り込み／分離基準 | pass |
| AC-003 | document review | コミット、push、PRの明示依頼境界 | pass |
| AC-004 | document review | AGENTSと開発ドキュメントの責務分離 | pass |

## Commands

- `npm run docs:check`
- `npm run docs:build`

## Results

- ドキュメントレビュー: 会話ターンごとにディレクトリを増やさず、Why／What／対象外／AC単位で既存changeへ追記する判定を`change-workflow.md`、`AGENTS.md`、`docdd.md`、`development-guide.md`へ同期しました。
- ドキュメントレビュー: 独立要求の分離、再承認条件、コミット準備単位、commit／push／PRの明示依頼境界を確認しました。
- ADR-0014を`accepted`へ更新し、ADR indexと開発運用ドキュメントから参照できることを確認しました。
- `npm run docs:check`、`npm run docs:build`: 実行環境で`npm`および`node`がPATHに存在せず、未実行。CIまたはNode.js/npmが利用可能な環境で再実行が必要です。

## Manual review

承認後に、同じ目的の追加指示を1つのchangeへ統合できること、独立した要求を別changeへ分離すること、変更パッケージ単位でコミット準備を行うこと、明示依頼なしにGit外部操作を行わないことを文書と実際の作業手順で確認します。
