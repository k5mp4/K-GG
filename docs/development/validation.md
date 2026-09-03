---
title: ValidationとCI
---

# ValidationとCI

検証は、mainへ統合できるか、正式にリリースできるか、追加観察が必要かを分けて判定します。手動確認の有無を自動検証の成功と混ぜません。

## 3つの階層

| Gate | 目的 | 例 | 未達時の扱い |
| --- | --- | --- | --- |
| Merge Gate | mainへ統合してよいことを機械的に判定 | typecheck、lint、unit/component、build、docs、対象Rust | PRをmergeしない |
| Release Gate | 正式リリース前に環境依存の品質を確認 | 実GPU WebGL、Tauri実機、FFmpeg MOV/MP4、After Effects、installer/updater | mergeは可能。Issueで追跡し、releaseを保留 |
| Observation | 追加の品質・互換性を観察 | 特殊GPU、長時間動作、狭幅UI、全パラメータ操作 | 原則blockしない。結果をPR/Issueへ記録 |

## ローカルコマンド

各コマンドはCIと同じ責務をローカルで実行するための入口です。

| 目的 | コマンド |
| --- | --- |
| 文書構造・参照 | `npm run docs:check` |
| 文書サイト | `npm run docs:build` |
| TypeScript型 | `npm run typecheck` |
| Fast / Merge Gate | `npm run check:fast` または `npm run check:merge` |
| Shader / Render Plan focused | `npm run check:render` |
| Tauri / Rust | `npm run check:native` |
| Release設定 | `npm run release:check` または `npm run check:release` |
| Change Capsule | `npm run change:check` |

`check:fast`にはfrontendのunit/component testが含まれます。描画変更では`check:render`を追加し、Tauri/Rust変更では`check:native`を追加します。`npm run verify`は互換性のために、release設定・fast・nativeをまとめて実行する入口として残します。

## Path-aware CI

Fast checkは全PRで実行します。次の変更がある場合だけ追加jobを実行します。

| 変更パス | 追加検証 |
| --- | --- |
| `src/shaders/**`、`src/lib/webgl*`、`src/lib/effect*`、`src/lib/render*`、`src/lib/export*` | render-check |
| `src-tauri/**`、`Cargo.toml`、`Cargo.lock`、Tauri設定 | native-check |
| `docs/**`、`AGENTS.md`、テンプレート、workflow | fast-check内のdocs check/build。`change:check`も実行 |
| tag `v*.*.*` | release workflowのversion、署名、bundle |

PlaywrightによるE2E、実GPU、FFmpeg、AEは現行リポジトリに再現可能なjobがないため、今回のMerge Gateへ捏造して追加しません。実環境が整った時点でRelease Gateのjobまたは手動チェックリストへ昇格します。

## 記録の境界

CIが判定できる結果をMarkdownへ重複転記しません。PRには実行したコマンド、CI job、警告、未確認事項を要約し、Change `validation.md`にはChange固有のACとGateの判断だけを残します。`partial`、`manual`、`not-run`は失敗と同じ意味ではありませんが、正式Releaseの前に必要な確認はIssueへ移します。
