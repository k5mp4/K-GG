# Validation

受け入れ条件を、実行したテストまたは再現可能な手動確認へ対応付けます。コマンドとファイルパスは別フィールドで管理します。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit / manual | `path/to/test` または確認手順 | pending |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Fast validation | `npm run check:merge` | pending |

## Release Gate

実GPU、Tauri、FFmpeg、After Effects、installer/updaterなど、正式Release前に必要な環境依存の確認を記載します。未確認でもMerge Gateを満たせばArchiveへ移動し、必要な継続作業をIssueへ移します。

## Observation

特殊GPU、狭幅UI、長時間動作、全パラメータ操作など、原則blockしない追加確認を記載します。

## Commands

- `npm run docs:check`
- `npm run change:check`
