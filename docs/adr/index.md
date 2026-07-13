---
title: Architecture Decision Records
---

# Architecture Decision Records

ADRは、複数の機能や将来の実装を拘束する重要な技術判断を、その背景と代替案を含めて記録します。

## 一覧

| ID | 判断 | 状態 |
| --- | --- | --- |
| ADR-0001 | [リポジトリ内文書を開発の一次情報とする](./0001-documentation-source-of-truth.md) | accepted |
| ADR-0002 | [K-GG専用フォルダを優先してPATHからもFFmpegを検出する](./0002-ffmpeg-discovery-locations.md) | accepted |
| ADR-0003 | [画像グラデーションのアンカー影響を永続設定として分離する](./0003-image-gradient-anchor-influence.md) | accepted |
| ADR-0004 | [Postprocess Stackをping-pong FBOで描画する](./0004-postprocess-stack-rendering.md) | accepted |
| ADR-0005 | [Unified Effect Stack V2を段階別ping-pong FBOで描画する](./0005-unified-effect-stack-v2.md) | accepted |

## 作成基準

次のいずれかに該当する場合は、[ADRテンプレート](./_template.md)から作成します。

- 主要ライブラリ、フレームワーク、描画方式の採否
- データ形式や永続化方式の変更
- ブラウザとTauri間の責務分割
- セキュリティ、配布、更新方式
- 後から戻すコストが高い構造上の判断

局所的な実装詳細は機能仕様の方針へ記載し、ADRを増やしすぎないようにします。
