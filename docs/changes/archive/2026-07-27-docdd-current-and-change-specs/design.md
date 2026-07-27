# Design

## 採用する実装方針

既存の `docs/specs/SPEC-*.md` は直下に残し、`docs/specs/current/` を現在の契約、`docs/changes/active/` と `docs/changes/archive/` を変更のライフサイクルとして追加します。変更IDは既存SPECと衝突しない `CHANGE-###` とします。

## データモデル

現行仕様は `CURRENT-*` IDと安定要件IDを持ち、変更仕様のproposalは `CHANGE-*` IDと `current_specs` を持ちます。変更状態は `draft → review → approved → implemented → archived` とし、Archive後は履歴として固定します。

## 状態管理

文書の状態はfrontmatterで管理します。`approved`、`implemented`、`archived`への変更は人間レビュー完了を要求し、未完了タスクや未記録の検証結果を完了扱いにしません。

## UI構成

VitePressのナビゲーションに現行仕様、進行中変更、完了済み変更、Legacy SPEC、ADR、DocDD運用を追加します。アプリUIは変更しません。

## 描画・外部プロセス・Tauri側の変更

変更なし。現行仕様の記述だけを既存のTypeScript、GLSL、Preset、テストから確認します。

## 変更対象の主要ファイル

- 文書: `docs/specs/current/`、`docs/changes/`
- 運用: `docs/development/docdd.md`、`AGENTS.md`、`CONTRIBUTING.md`
- ナビゲーション: `docs/specs/index.md`、`docs/.vitepress/config.ts`
- 検証: `tools/check-docs.mjs`
- レビュー補助: `.github/pull_request_template.md`

## 代替案とトレードオフ

- 既存SPECを一括移動する案は、公開済みリンクを壊すため採用しません。
- 外部のSpec Kit/OpenSpecを導入する案は、依存と参入障壁を増やすため採用しません。現在仕様＋差分＋Archiveという考え方だけをMarkdownで取り入れます。
- index自動生成は将来候補とし、今回は既存VitePressの手動indexをチェッカーで検証します。

## 移行方法

まず3領域の現行仕様を作成し、各仕様から関連Legacy SPECとADRへリンクします。次の機能変更からactive changeを使用し、完了時にdeltaをcurrentへ反映します。

## ロールバック方法

文書変更のみのため、必要なら新規ディレクトリと運用文書を同一PRで戻せます。既存SPECは変更・移動していないため、既存リンクは維持されます。
