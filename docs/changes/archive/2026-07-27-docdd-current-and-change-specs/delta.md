# Delta

## ADDED Requirements

### DOC-001 現行仕様

Gradient、Effect Stack、Presetを、過去の変更理由ではなく現在有効な観測可能動作として機能単位で参照できる。

### DOC-002 変更仕様

新しい変更は `CHANGE-###` の変更フォルダにproposal、delta、必要なdesign/tasks/validationを保持し、完了時に現行仕様へ統合してArchiveへ移動する。

### DOC-003 安定した要件ID

現行仕様の要件ID（`GRAD-*`、`EFFECT-*`、`PRESET-*`）は変更をまたいで維持し、変更仕様の受け入れ条件（`AC-*`）とは分離する。

## MODIFIED Requirements

### DOC-004 文書の優先順位

承認済みactive change → current spec → accepted ADR → tests → implementation → Legacy Change Specificationの順で参照する。ただし矛盾を検出した場合は自動的に上位へ合わせず、人間へ報告する。

### DOC-005 既存SPECの位置付け

既存の `SPEC-000`〜`SPEC-040` は削除・改番せず、Legacy Change Specificationとして履歴参照に使う。現在の動作を判断する際にLegacy SPECを必須資料にしない。

## REMOVED Requirements

### DOC-006 変更SPECを現行仕様として扱う運用

変更完了後も変更SPECを唯一の現在仕様として参照する運用を廃止する。完了時にdeltaをcurrentへ統合し、変更の経緯はArchiveへ残す。
