---
title: 変更仕様
---

# 変更仕様

変更仕様（Change Capsule）は、複雑なDesigned ChangeのWhy・仕様差分・設計・検証を一時的に記録します。Quick Changeと通常のTracked Changeは、必要がなければ変更フォルダを作りません。完了時には必要な差分を現行仕様へ反映し、CapsuleをArchiveへ移動します。

- [進行中の変更](./active/)
- [完了済み変更](./archive/)
- [変更仕様テンプレート](./_template/proposal)
- [現行仕様](../specs/current/)
- [DocDD運用ガイド](../development/docdd)

新しい変更IDは `CHANGE-YYYYMMDD-slug`（例: `CHANGE-20260925-export-format`）を使い、`npm run change:new -- <slug> --title="..."`で作成します。並列ブランチが同じ連番を取り合わないようにするためです。`CHANGE-001`〜`CHANGE-056`は連番時代の履歴IDとして有効なまま残し、新しい連番は採番しません。変更IDは削除・再利用しません。

進行中・完了済みの一覧は各`proposal.md`のfrontmatterからビルド時に生成します。index.mdへ行を追記しないため、並列PRが同じ表を編集して衝突することはありません。
