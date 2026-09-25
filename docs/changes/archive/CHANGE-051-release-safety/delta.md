---
title: 配布安全性の仕様差分
---

# 仕様差分

## ADDED Requirements

- CURRENT-UI-CONTROLS / UI-027: 日英ヘルプにオフラインの第三者ライセンス本文・検索・ソースリンクを追加。UIアニメーションを標準ブラウザ機能へ置換し、動きを減らす設定を尊重する。

## MODIFIED Requirements

- CURRENT-PRESET / PRESET-008: ファイル読込前の32 MiB上限、単一manifestのZIP32、16 MiBの展開上限とCRC確認、Workerの10秒期限を追加。既存JSON・K-GG出力ZIPと追加マージは維持する。
- CURRENT-VIDEO-EXPORT / EXPORT-009: native copy前にfilesystem scopeで正規化した保存先を検証する。動画形式と生成処理は維持する。

## REMOVED Requirements

なし。各Current Spec本文へ上記を統合済み。人間レビューは未実施のためCapsuleはreview状態に置く。
