---
type: change
id: CHANGE-042
title: Request-first開発フローへの移行
status: archived
change_kind: A
owners: [maintainer]
created: 2026-09-03
updated: 2026-09-03
current_specs: []
related_adrs: [ADR-0001, ADR-0014, ADR-0019]
related_code: [AGENTS.md, CONTRIBUTING.md, .github/pull_request_template.md, .github/ISSUE_TEMPLATE/development-request.md, .github/workflows/ci.yml, .github/workflows/release.yml, docs/.vitepress/config.ts, docs/changes/_template/proposal.md, docs/changes/_template/delta.md, docs/changes/_template/design.md, docs/changes/_template/tasks.md, docs/changes/_template/validation.md, docs/development/index.md, docs/development/workflow.md, docs/development/validation.md, docs/development/ai-development.md, docs/development/releasing.md, docs/development/change-workflow.md, docs/development/docdd.md, docs/development/development-guide.md, docs/adr/0001-documentation-source-of-truth.md, docs/adr/0014-commit-centered-change-workflow.md, docs/adr/0019-request-first-development-lifecycle.md, docs/changes/active/index.md, docs/changes/archive/index.md, tools/check-docs.mjs, tools/change-workflow.mjs, tools/change-workflow.test.mjs, package.json]
related_tests: [tools/change-workflow.test.mjs, 'manual: review Request classification, CI gates, and GitHub settings']
human_review: completed
outcome: merged
---

# CHANGE-042 Request-first開発フローへの移行

## 背景・問題

実装済みの変更が、ブラウザ・GPU・Tauriなどの手動確認を待つだけで`docs/changes/active/`に滞留している。現在の運用はIssueの有無、全変更への同じ文書セット、実装完了とRelease確認を一つの完了条件へ結び付けており、小変更の開始コストとAIの読込み量を不必要に増やしている。

## 変更理由

入力経路ではなく変更の規模と追跡必要性でworkflowを選び、機械的なMerge Gateと環境依存のRelease Gateを分離する。これにより、Issueなしの局所修正を許可しつつ、複雑な変更のWhy・仕様差分・長期判断は追跡可能なままにする。

## ゴール・成功条件

- Development RequestをIssue、PR、AI、CLI、MCP、外部サービスなど任意の入口から受け付ける。
- Quick Change、Tracked Change、Designed Changeを使い分け、Quick ChangeではIssueとChange Capsuleを必須にしない。
- IssueはWhyと継続追跡、PRはWork・Review・Validation、Current Specは現在動作、ADRは長期判断、CIは機械的判定を担う。
- Merge Gate、Release Gate、Observationを分離し、手動・実機確認だけではArchiveを阻害しない。
- `main`の`docs/changes/active/`を原則空にし、必要なCapsuleは同じPR内でCurrent Spec/ADR同期後にArchiveへfinalizeする。
- `npm run change:check`と`npm run change:finalize CHANGE-###`で構造・索引・リンク・Archive移動を再現可能にする。
- 既存Active Changeの検証記録と未確認事項を失わず、新ルールに移行する。

## 対象

- `AGENTS.md`、開発者向け文書、Issue/PRテンプレート、npm validation scripts。
- Change Capsuleの任意成果物化、finalize tooling、docs validationとindex更新。
- Merge Gate中心のCIと、変更パスに応じたrender/native追加検証。
- 2026-09-03時点の既存Active ChangeのArchive移行。

## 対象外

- 利用者向け機能、描画結果、Preset形式の変更。
- 特定Bot、GitHub App、外部サービス、Issue自動作成の必須化。
- GitHubのbranch protection/rulesetをこの作業から直接変更すること。
- 過去ArchiveとLegacy SPECの内容を書き換えて現在仕様へ再解釈すること。

## 受け入れ条件

- AC-001: Development Requestの入口がIssueに固定されず、Quick/Tracked/Designedの分類と途中昇格が文書化されている。
- AC-002: Issue、PR、Current Spec、ADR、CI、Archiveの責務とAIの標準読込み順が文書化されている。
- AC-003: Merge Gate、Release Gate、Observationが分離され、手動・実機未確認を理由にActiveを維持しないルールが文書化されている。
- AC-004: `change:check`がCapsuleの構造、metadata、index、Current Spec参照、相対リンク、main上のActive件数を検査し、`change:finalize`が安全にArchive移動とindex更新を行う。
- AC-005: npm scriptsでtypecheck、fast/merge、render、native、release validationを個別に実行でき、CIがfast/render/nativeへ責務分割されている。
- AC-006: Issue/PRテンプレートがIssueなしQuick Changeを妨げず、外部/API作成Issueも同じRequestとして扱える。
- AC-007: 既存Active Change 13件がArchiveへ移動し、検証済み事実・未確認事項・継続作業の追跡先を保持し、main相当の状態でActiveが0件になる。

## 関連ADR

- [ADR-0001 文書を開発の一次情報とする](../../../adr/0001-documentation-source-of-truth)
- [ADR-0014 コミット中心の変更workflow](../../../adr/0014-commit-centered-change-workflow)
- [ADR-0019 Request-first開発ライフサイクル](../../../adr/0019-request-first-development-lifecycle)

## 主なリスク

- Activeを早くArchiveへ移すと、未完了の継続作業が見えなくなるため、`outcome`と`follow_up`、検証Gateを明示する。
- Current Specの意味的な同期は自動判定できないため、toolingは逆参照・構造・リンクを検査し、本文の判断は人間またはAIが行う。
- 既存の古いValidation形式を一度に書き換えると履歴の証拠を損なうため、移行時は原文を保持し、Archive側で新しい分類を補足する。

## 未決定事項

なし。ユーザーが提示した「K-GG 開発フロー再設計・移行」の要求を、この変更の実装契約として承認済みとする。

## Finalization

- Finalized: 2026-09-03
- Outcome: `merged`
- Mode: normal implementation finalization.
