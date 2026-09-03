# K-GGへのコントリビューション

K-GGの開発入口はDevelopment Requestです。Requestの発生元はGitHub Issueに限らず、PR、AIエージェント、CLI/MCP、API、外部サービス、開発中の発見を利用できます。詳細な分類とライフサイクルは[開発ワークフロー](docs/development/workflow.md)を参照してください。

## 変更の分類

| 分類 | 使う場面 | 必須の入口・成果物 |
| --- | --- | --- |
| Quick Change | typo、局所CSS、明確な小修正、意味を変えない内部整理 | short-lived branch、PR、Merge Gate。Issue/Change Capsuleは不要 |
| Tracked Change | Bug、Feature request、Improvement、technical debt、複数PR、後続作業 | Issue（既存または新規）、short-lived branch、PR |
| Designed Change | Current Spec、保存・出力・描画契約、複数機能、長期設計へ影響 | Issue、必要なSpec Delta/Change Capsule/ADR、PR、finalize |

S/B/F/A/Xは補助分類です。Sは外部から観測できる契約を変えない文書整理だけに使います。

## 作業の進め方

1. Requestの問題、影響、対象外、未決定事項を確認し、分類する。
2. `docs/development/`、対象Current Spec、関連ADRを必要な範囲だけ読む。
3. Tracked/DesignedではIssueまたは既存Requestへ紐付ける。Quick ChangeにIssueを形式的に作らない。
4. mainから短命ブランチを作り、必要な場合だけChange Capsuleを作る。
5. 実装、unit/component/integration test、Merge Gateを行い、PRを作成する。
6. Current Spec/ADRと利用者向け文書を同期する。意味的な更新は人間のレビュー対象にする。
7. Designed Changeは`npm run change:check`後に`npm run change:finalize CHANGE-###`を実行し、main上のActiveを0件にする。

実装中に範囲が広がったらTracked/Designedへ昇格します。既存Requestの目的・対象外・ACに収まる追加指示は同じPR/Changeへまとめ、独立した要求だけ分離します。

## Source of Truth

- Issue: 継続的に追跡するWhy、Problem、Request、後続作業、Release Gate待ち。
- PR: Work、Review、実行したvalidation、CI結果、未確認事項、文書同期。
- `docs/specs/current/`: 現在の観測可能な動作。
- `docs/adr/`: 複数機能を長期に拘束するArchitecture Decision。
- CI: 機械的に判定できるMerge Gate。
- `docs/changes/archive/`: 過去の変更経緯。現在仕様の入口ではない。

## Validation

| 変更 | 最低限 |
| --- | --- |
| 文書、workflow、template、tooling | `npm run docs:check`、`npm run docs:build`、`npm run change:check` |
| TypeScript/React | `npm run check:merge` |
| Shader/WebGL/render/export | 上記 + `npm run check:render` + 可能な範囲のPreview/Export |
| Preset/保存形式 | 旧データ読込、新規保存、再読込、Browser/Tauri差分 |
| Rust/Tauri | `npm run check:native` + 対象デスクトップ操作 |
| Release | `npm run check:release` + installer/updater/FFmpeg/AEのRelease Gate |

Merge Gate、Release Gate、Observationの区別は[ValidationとCI](docs/development/validation.md)を一次情報とします。実行していない手動確認をpassにせず、Release Gate未確認だけでChangeをActiveに残しません。

## Pull Request

- [PR template](.github/pull_request_template.md)の分類、Request source、影響、検証、未確認事項を埋める。
- IssueがないQuick ChangeはRequest sourceに`Direct request`、`AI request`、`CLI/MCP request`などを記載する。
- Current Spec/ADRを更新したか、更新不要の理由を記載する。
- CIの機械的結果をChangeのvalidationへ全文転記しない。警告、環境依存の失敗、未確認事項だけを要約する。
- commit、push、PR、Issue作成は依頼された範囲で行う。GitHub側のbranch protectionは[Releaseと環境検証](docs/development/releasing.md)を参照する。
