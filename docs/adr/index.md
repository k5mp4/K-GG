---
title: Architecture Decision Records
---

# Architecture Decision Records

ADRは、複数の機能や将来の実装を拘束する重要な技術判断を、その背景と代替案を含めて記録します。

## 一覧

この一覧は各ADRのfrontmatterからドキュメントのビルド時に生成します。並列PRの衝突を避けるため、このファイルへ行を追記しません。

<AdrIndex />

## 作成基準

次のいずれかに該当する場合は、`npm run adr:new -- <slug> --title="判断のタイトル"`で[ADRテンプレート](./_template.md)から作成します。新しいADRのIDは`ADR-YYYYMMDD-slug`、ファイル名は`YYYYMMDD-slug.md`です。`ADR-0001`〜`ADR-0023`は連番時代の履歴IDとして有効なまま残し、新しい連番は採番しません。

- 主要ライブラリ、フレームワーク、描画方式の採否
- データ形式や永続化方式の変更
- ブラウザとTauri間の責務分割
- セキュリティ、配布、更新方式
- 後から戻すコストが高い構造上の判断

局所的な実装詳細は機能仕様の方針へ記載し、ADRを増やしすぎないようにします。
