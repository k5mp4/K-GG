---
id: SPEC-006
title: 統合検証コマンド
status: implemented
owners: [maintainer]
created: 2026-07-04
updated: 2026-07-04
depends_on: [SPEC-000]
related_adrs: [ADR-0001]
related_code: [package.json, tools/verify-windows.ps1, .github/workflows/ci.yml, README.md, docs/releasing.md]
related_tests: [npm run verify]
human_review: completed
---

# SPEC-006: 統合検証コマンド

## 背景・問題

ブランチとWindows配布の検証コマンドが複数文書へ個別に列挙され、実行漏れや
手順差が発生しやすい。署名付きWindowsビルドでは秘密鍵環境変数の設定と削除も
手動で行う必要がある。

## ゴール・成功条件

- ブランチ検証を`npm run verify`で一括実行できる。
- Windows署名ビルドを`npm run verify:windows`で検証後に実行できる。
- 署名鍵のパスワードをコマンドラインへ残さず、終了時に環境変数を削除する。
- CIでも文書検証を含む必須チェックを実行する。

## スコープ

### 対象

- バージョン、文書、テスト、lint、Web、Rustの統合検証
- Windows署名鍵の対話入力、NSISビルド、資格情報クリーンアップ
- READMEとリリース手順

### 対象外

- 署名鍵の生成、GitHub Secrets登録、リリース公開の自動化
- CI上でのWindows署名ビルド

## 方針

`verify`は既存コマンドを順番に呼び出す。`verify:windows`はPowerShellスクリプトで
秘密鍵の存在とパスワードを確認し、`try/finally`で成功・失敗に関係なく環境変数を
削除する。Windowsビルド前に`verify`を必ず完了させる。

## 代替案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| 文書へ個別コマンドだけを記載 | 不採用 | 更新漏れと実行漏れを防げない |
| 署名パスワードを永続環境変数へ保存 | 不採用 | 資格情報が不要に長く残る |
| npmとPowerShellの統合コマンド | 採用 | 既存ツールを再利用し、Windows固有処理を分離できる |

## エラー・境界条件

- 秘密鍵がない、またはパスワードが空の場合はビルド前に失敗する。
- 子コマンドが失敗した場合は直ちに停止し、資格情報を削除する。
- ローカルに署名鍵がない環境では`verify`のみを実行できる。

## 受け入れ条件

- AC-001: `npm run verify`が必須の文書・フロントエンド・Rust検証を実行する。
- AC-002: `npm run verify:windows`が`verify`成功後にWindowsビルドを実行する。
- AC-003: 成功・失敗にかかわらず署名鍵環境変数を削除する。
- AC-004: CIが文書検証、テスト、lint、Webビルド、Rust検証を実行する。
- AC-005: READMEとリリース手順が統合コマンドを案内する。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001 | 自動検証 | `npm run verify` |
| AC-002, AC-003 | スクリプトレビュー、署名環境での手動実行 | `tools/verify-windows.ps1` |
| AC-004 | CI定義レビュー | `.github/workflows/ci.yml` |
| AC-005 | 文書レビュー | `README.md`, `docs/releasing.md` |

## 移行・互換性

既存の個別コマンドは維持する。統合コマンドはそれらを呼び出す追加の入口である。

## 未決定事項

なし。
