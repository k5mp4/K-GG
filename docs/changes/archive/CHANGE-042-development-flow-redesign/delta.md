# Delta

## ADDED Requirements

### FLOW-001 Request-first Development Request

変更要求は入力元ではなく、規模・追跡必要性・仕様影響でQuick Change、Tracked Change、Designed Changeへ分類する。Issueは継続追跡が必要なWhy/Problem/Requestに使い、IssueなしのQuick Changeを許可する。

### FLOW-002 Validation hierarchy

Merge Gate（mainへの統合条件）、Release Gate（正式リリース前の環境依存条件）、Observation（追加確認）を分離する。Release GateやObservationの未確認だけではChangeをActiveに残さず、必要な継続作業はIssueへ移す。

### FLOW-003 Change finalization

Change Capsuleは複雑な変更に限定し、必要な成果物だけを持つ。Current Spec/ADRを同期した後、`change:check`で構造と整合を確認し、`change:finalize`でArchiveとindexを更新する。mainのActive Changeは原則0件とする。

### FLOW-004 AI development context

通常のAI実装コンテキストは`AGENTS.md`、`docs/development/`、関連Current Spec、関連ADR、Development Request/Issueの順とし、ArchiveとLegacy SPECは必要な履歴調査時だけ読む。

### FLOW-005 CI validation surfaces

CIはfast、render、native、releaseの責務を分け、変更パスに応じて追加検証を実行する。npm scriptsはCIと同じ検証をローカルから呼び出せる名前で提供する。

## MODIFIED Requirements

### FLOW-006 DocDD package cost

従来の「観測可能な変更は常にproposal/delta/tasks/validationを作り、手動ACが残る限りActive」という運用を変更する。Quick ChangeではIssueとChange directoryを不要とし、Tracked ChangeはIssueとPRを基本とし、Designed Changeだけ必要なCapsule成果物を使う。

### FLOW-007 Source of truth boundaries

Current Specは現在の観測可能な動作、Issueは継続追跡のWhy/Problem、PRはWork/Review/Validation、ADRは長期設計、CIは機械判定、Archiveは履歴として責務を分離する。

## REMOVED Requirements

### FLOW-008 Manual validation blocking Archive

「未確認の受け入れ条件がある場合はArchiveへ移動しない」という完了条件を廃止する。未確認内容はRelease GateまたはObservationとして残し、必要ならIssueへ分離する。
