---
title: 開発・検証ガイド
---

# 開発・検証ガイド

## 必要環境

- Node.js 22.12.0以上
- npm 10.9.0以上
- デスクトップ版を扱う場合はRust stable toolchain
- MOV/MP4出力を確認する場合はFFmpeg

## セットアップ

```sh
npm ci
npm run dev:local
```

通常のVite起動は`npm run dev`、Tauriデスクトップ版は`npm run tauri:dev`を使用します。

## ディレクトリ

```text
.
├─ docs/                 利用者・開発者ドキュメント、仕様、ADR
├─ public/               公開する静的ファイル
├─ src/
│  ├─ adapters/          ブラウザ/Tauriの差異を吸収する境界
│  ├─ components/        React UI
│  ├─ features/          独立性の高い機能領域
│  ├─ hooks/             React hooks
│  ├─ lib/               描画、評価、出力などのロジック
│  ├─ rendering/         描画バックエンドの抽象
│  ├─ shaders/           GLSL
│  ├─ store/             Zustand store
│  └─ types/             共有型
├─ src-tauri/            Tauri/Rustアプリケーション
└─ tools/                リリース・検証用スクリプト
```

## AIと人間がレビューしやすい変更方針

K-GGは生成AIによる開発参加を歓迎するため、変更の一次情報と責務の置き場所を明確にします。

- 仕様、ADR、開発者ガイドを読んでからコードを変更する。
- 観測可能な挙動を変えないリファクタリングでは、既存の契約、ファイル名、保存先、エラー文言を維持する。
- 型や型ガードを複数箇所へ複製しない。プリセット永続化の型は`src/lib/presetModel.ts`を参照する。
- Canvasから画像Blobを作る共通処理は`src/lib/exportCanvas.ts`へ集約し、ブラウザ/Tauriごとの保存処理はアダプターに残す。
- RendererからTauriコマンドへ渡る値は信頼しない。ファイルパス、外部プロセス、OS機能を扱う場合はRust側で検証する。
- 大きなUIファイルを触る場合は、まず純粋関数、hook、小さな表示コンポーネントへ分けられる範囲を探す。

## 変更時の確認範囲

| 変更 | 最低限の確認 |
| --- | --- |
| 文書のみ | `npm run docs:check`, `npm run docs:build` |
| TypeScript/React | `npm test`, `npm run lint`, `npm run build` |
| 描画・GLSL | 上記に加えて対象機能のプレビューと代表的なエクスポート |
| プリセット形式 | 旧データ読込、新規保存、再読込、ブラウザ/Tauri差分 |
| Rust/Tauri | `cargo fmt --manifest-path src-tauri/Cargo.toml --check`, `cargo test`, `cargo check`, 対象デスクトップ操作 |
| リリース/更新 | 上記に加えてリリース設定と更新ワークフローを確認 |

## GitとPull Request

- Pull Requestを作成する前に`git status`とステージ済み差分を確認し、依頼範囲に含まれる変更だけをコミットする。
- 既定ブランチから作業を始める場合は、目的が分かる短い作業ブランチを作成する。
- ユーザーがコミットまたは公開を明示的に依頼した場合、Codexは対象差分を確認してコミット・pushし、特に指定がなければドラフトPull Requestまで作成する。レビュー可能状態のPull Requestは、ユーザーが明示した場合だけ作成する。
- Pull Requestのタイトルと本文は日本語で書く。本文には`変更理由`、`変更内容`、`影響`、`検証`、`未確認事項`の見出しを使用し、英語のみの`Summary`、`Impact`、`Validation`の見出しは使用しない。
- 検証欄には実行したコマンドと結果を記載する。警告が残る場合は、エラーではないことと残っている警告の性質を明記する。
- Gitの所有者チェックなど安全設定で操作が止まった場合は、永続的なグローバル設定を変更する前に理由と影響を確認する。

## テスト方針

- 時刻評価、補間、状態遷移、ファイル変換など決定的な処理はユニットテストにする。
- 不具合修正では、可能な限り修正前に失敗する回帰テストを追加する。
- WebGLやプラットフォーム統合で自動化できない項目は、仕様の受け入れ条件に手動確認手順と期待結果を残す。
- テストは実装の内部構造ではなく、仕様の受け入れ条件を検証する。

## ドキュメント

```sh
npm run docs:dev
npm run docs:check
npm run docs:build
```

`docs:check`は仕様とADRのメタデータ、ID、依存参照を検証します。`docs:build`はVitePressの生成と内部リンクを検証します。
