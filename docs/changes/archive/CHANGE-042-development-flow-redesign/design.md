# Design

## 採用する実装方針

既存の`docs/specs/current/`、`docs/adr/`、`docs/changes/archive/`の意味は維持し、開発入口とChangeのライフサイクルだけを軽量化する。Quick Changeにはリポジトリ内のChange成果物を要求せず、Tracked ChangeはIssueとPR、Designed ChangeはIssueと必要なCapsuleを使う。

Capsuleのmetadataは既存形式を後方互換で読み、`outcome`（`merged`、`follow-up`、`cancelled`、`superseded`）と任意の`follow_up`で、Archive後にも未完了のRelease Gateや継続作業を明示できるようにする。既存Archiveは一括書換せず、新たにfinalizeするChangeからこの情報を付ける。

## Validationと自動化の境界

`tools/check-docs.mjs`は文書metadataとCurrent Spec/ADR参照を検査する。`tools/change-workflow.mjs`はChange Capsuleの構造、相対リンク、index、main上のActive件数、finalize条件を担当する。Current Specの意味的な本文更新やGitHub Issue作成は自動化しない。

通常のfinalizeは実装済みChangeのMerge Gateを確認する。既存Activeを整理する移行だけは`--migration --outcome=follow-up`を使い、元のValidationを変更せずに履歴としてArchiveへ移す。これにより、移行と実装完了を混同しない。

## CI構成

- `fast-check`: typecheck、lint、unit/component、docs check/build、frontend build。
- `render-check`: Shader、Render Plan、WebGL export parityなど対象パスのfocused tests。
- `native-check`: `src-tauri/**`等に対するRust test/check。
- `release-check`: tag時のversion、署名、Tauri bundle、Release Gate。GPU、FFmpeg、After Effectsの実機確認はCIの成功と別に記録する。

## 変更対象の主要ファイル

- 規約: `AGENTS.md`、`CONTRIBUTING.md`、`docs/development/*.md`
- 文書検査: `tools/check-docs.mjs`、`tools/change-workflow.mjs`
- 開発入口: `package.json`、`.github/ISSUE_TEMPLATE/development-request.md`、`.github/pull_request_template.md`
- CI: `.github/workflows/ci.yml`、`.github/workflows/release.yml`
- 移行対象: `docs/changes/active/CHANGE-026`〜`CHANGE-041`（欠番を除く）

## 代替案とトレードオフ

- 全変更をIssue-firstにする案は外部連携との相性はよいが、小変更の入口を重くするため不採用。
- 全Activeを削除する案は履歴と未確認事項を失うため不採用。
- Current Specの自動生成は意味を誤る危険があり、構造・逆参照・リンク検査に限定する。
- 全PRでGPU/Native/Releaseを実行する案はWindows/GPU/署名環境への依存と待ち時間が大きいため、path/tagで分ける。

## 移行方法

1. Request-first、Gate、AIコンテキスト、GitHub設定を開発文書へ記載する。
2. toolingとnpm scriptsを追加し、現行文書を後方互換に検査できるようにする。
3. 既存ActiveのValidationを編集せず、`outcome: follow-up`を付けてArchiveへ移す。CHANGE-026/032の未完成部分、CHANGE-038の失敗、その他の実機未確認はArchiveのfollow-upとして残す。
4. CHANGE-042自身をCurrent Spec不要の運用変更としてArchiveへfinalizeする。

## 既存Activeの移行分類

| 分類 | 対象 | 移行後の扱い |
| --- | --- | --- |
| Archive可能（実装済み、追加確認はblockしない） | CHANGE-039、CHANGE-041 | Archiveへ移し、ブラウザ見た目・全操作はObservationとしてfollow-upへ残す |
| Release validation待ち | CHANGE-027、CHANGE-028、CHANGE-029、CHANGE-030、CHANGE-033、CHANGE-037、CHANGE-040 | GPU、Tauri、MCP Inspector、出力、または高解像度の確認をRelease Gateのfollow-upへ移す |
| Future work / repair | CHANGE-026、CHANGE-031、CHANGE-032、CHANGE-038 | 未完成要件、Browser/Tauri parity、既知の失敗を別Requestで追跡する |
| Truly Active | なし | 2026-09-03時点でActiveを0件にする |

## ロールバック方法

Gitでこの変更のPRをrevertすれば、文書、tooling、CI、index、Active/Archiveの配置を一組で戻せる。アプリケーションコードとPreset形式には変更がない。
