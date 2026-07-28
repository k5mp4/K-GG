# Validation

| AC | 結果 | 確認内容 |
| --- | --- | --- |
| AC-001 | pass | `docs/changes/archive`直下の07-28ディレクトリが`2026-07-28-day-bundle`の1つだけであることを確認した。 |
| AC-002 | pass | `tools/check-docs.mjs`の読み込み契約に合わせ、bundle直下へCHANGE-010の`proposal.md`、`delta.md`、`tasks.md`、`validation.md`を配置した。 |
| AC-003 | pass | CHANGE-002〜009のproposal、delta、design、tasks、validationを接頭辞付きファイルとして保持し、bundle indexから参照できることを確認した。 |
| AC-004 | pass | Archive indexとcurrent specの関連変更をCHANGE-010へ更新し、ローカルMarkdownリンクを検査した。 |
| AC-005 | pass | AGENTS.md、active index、change-workflow.mdへ、追加指示の取り込みと新規changeの分離条件を反映した。 |

## 実行結果

- `node tools/check-docs.mjs`: CI環境で実行対象。ローカル環境ではNode.jsがPATHにないため未実行。
- ローカル文書リンク検査: pass。
- `git diff --check`: pass。

## 未確認事項

ローカルのNode.js未導入またはPATH未設定のため、最終的な`npm run docs:check`はCIでの再実行が必要です。Node.jsを有効化すれば、PR作成前に同じコマンドを実行できます。
