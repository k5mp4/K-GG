# Validation

CHANGE-042の実装・移行結果を、Merge Gate、Release Gate、Observationに分けて記録する。CIの機械的結果を別の文書へ転記して正とせず、ここではこの変更固有の判断と未確認事項だけを残す。

## Acceptance criteria

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | 文書レビュー | `docs/development/workflow.md`、Issue/PR template | pass |
| AC-002 | 文書レビュー | `docs/development/ai-development.md`、責務表 | pass |
| AC-003 | 文書レビュー | `docs/development/validation.md`、`releasing.md` | pass |
| AC-004 | unit / CLI | `tools/change-workflow.test.mjs`、`npm run change:check`、`npm run change:finalize` | pass |
| AC-005 | command / CI review | `package.json`、`.github/workflows/ci.yml` | pass |
| AC-006 | template review | `.github/ISSUE_TEMPLATE/development-request.md`、`.github/pull_request_template.md` | pass |
| AC-007 | migration / docs check | `docs/changes/active/`、`docs/changes/archive/`、indexes | pass |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Documentation | `npm run docs:check` / `npm run docs:build` | pass |
| Fast validation | `npm run check:merge` | pass |
| Change tooling tests | `npm test -- tools/change-workflow.test.mjs` | pass (5 tests) |
| Render focused tests | `npm run check:render` | pass (14 files / 240 tests) |
| Native validation | `npm run check:native` | pass (21 Rust tests / cargo check) |
| Release configuration | `npm run release:check` | pass |
| Working tree whitespace | `git diff --check` | pass |

`check:merge`の結果は、docs check/build、typecheck、169 test files / 967 tests、lint、frontend buildを含めてexit code 0。Lintは0 errors / 42 warnings、buildは既存のchunk size・dynamic import warningを出したが成功した。`change:check`はfeature branch上でArchive 31件とActive CHANGE-042を検査して成功した。

## Release Gate

| Check | Command / owner | Status |
| --- | --- | --- |
| Release configuration | `npm run release:check` | pass |
| Aggregate local release validation | `npm run check:release` | pass |
| GitHub Ruleset、installer/updater、FFmpeg、After Effects実機 | 人間によるRelease Gate | not-run |

未確認項目はこの変更の範囲で変更・確認せず、必要な項目をArchiveの`follow_up`と最終報告の人間操作へ分離する。

## Observation

特殊GPU、狭幅UI、長時間動作、全パラメータ手動操作はMerge/Releaseを自動的にブロックしない。

## Post-finalization

`npm run change:finalize CHANGE-042`実行後に`npm run change:check -- --require-empty`を実行し、feature branch上でもActive 0件を確認する。

結果: `npm run change:check -- --require-empty` は `0 active, 32 archive entries` で成功した。

## Commands

- `npm run change:check`
- `npm run docs:check`
- `npm run docs:build`
- `npm run check:merge`
- `npm run check:render`
- `npm run check:native`
- `npm run check:release`
- `git diff --check`
