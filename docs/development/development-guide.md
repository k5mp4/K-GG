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
| リリース/更新 | 上記に加えて[Windows版リリース手順](../releasing.md) |

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
