# K-GGへのコントリビューション

K-GGはDocDD（Document-Driven Development）を採用しています。コードを書く前に、変更の目的と期待動作をリポジトリ内の文書へ記録します。

## 最初に読む資料

- [開発者向けドキュメント](docs/development/index.md)
- [DocDD運用ガイド](docs/development/docdd.md)
- [仕様一覧](docs/specs/index.md)
- [ADR一覧](docs/adr/index.md)

## 基本フロー

1. Issueまたは仕様で解決する問題を明確にする。
2. 変更区分を判定し、必要なら仕様書を作成する。
3. 仕様の曖昧さ、矛盾、代替案、エッジケースをレビューする。
4. 人間の承認後に実装する。
5. 受け入れ条件に対応するテストを追加する。
6. 実装結果を仕様と照合し、関連ファイルと状態を更新する。
7. ローカル検証後にPull Requestを作成する。

新機能用の仕様は[仕様テンプレート](docs/specs/_template.md)、長期的な技術判断は[ADRテンプレート](docs/adr/_template.md)から作成してください。

## ローカル検証

```sh
npm ci
npm run docs:check
npm run docs:build
npm test
npm run lint
npm run build
```

Tauri側を変更した場合は追加で実行します。

```sh
cargo test --manifest-path src-tauri/Cargo.toml
cargo check --manifest-path src-tauri/Cargo.toml
```

## Pull Request

Pull Requestには、仕様ID、変更理由、受け入れ条件ごとの検証結果、仕様との差異を記載してください。意図的な仕様差分がある場合は、コードだけを先にマージせず仕様を再承認します。
