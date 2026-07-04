---
id: SPEC-005
title: 動画出力表示名とファイル名の整理
status: implemented
owners: [maintainer]
created: 2026-07-04
updated: 2026-07-04
depends_on: []
related_adrs: [ADR-0001]
related_code: [src/components/ExportPanel.tsx, src/adapters/browser/videoExportService.ts, docs/index.md, src/docs/help.md]
related_tests: [npm run lint, npm run build]
human_review: completed
---

# SPEC-005: 動画出力表示名とファイル名の整理

## 背景・問題

MOV出力のUIとファイル名が`Lossless MOV`、MP4ファイル名が
`h264rgb_lossless`となっており、利用者向けの形式名と内部エンコード情報が混在している。
形式を選ぶ操作と生成ファイルを簡潔に識別できる命名へ統一する。

## ゴール・成功条件

- MOV出力をUIと説明文で`MOV`として表示する。
- MOVとMP4の生成ファイル名から`lossless`接尾辞を削除する。
- エンコード方式、TauriとFFmpegの要件、After Effects連携を変更しない。

## スコープ

### 対象

- ExportパネルのMOV表示名、進捗、エラー文
- MOVとMP4の出力ファイル名
- 利用者向けガイドとブラウザ非対応エラー

### 対象外

- MOVとMP4のコーデック、品質、色変換
- ブラウザ版へのネイティブ動画エンコード追加

## 方針

内部API名は互換性のため維持し、利用者に見えるラベルと保存名だけを整理する。
MOVは`<stem>.mov`、MP4は`<stem>_h264rgb.mp4`とする。

## 代替案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| 既存名を維持する | 不採用 | UI形式名とファイル名が冗長でMP4表記も不正確になる |
| 内部API名もすべて改名する | 不採用 | 観測可能な変更に不要な改修範囲が増える |
| 表示名と保存名だけ整理する | 採用 | 出力処理を変えず利用者向け命名を統一できる |

## エラー・境界条件

- ブラウザ版では従来どおりTauriと外部FFmpegが必要であることを表示する。
- キャンセル、進捗通知、After Effects送信の状態管理を維持する。

## 受け入れ条件

- AC-001: MOVボタン、進捗、エラーが`MOV`表記になる。
- AC-002: MOVを`<stem>.mov`として保存する。
- AC-003: MP4を`<stem>_h264rgb.mp4`として保存する。
- AC-004: 利用者向け文書がUIと一致する。
- AC-005: lintとWebビルドが成功する。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001〜AC-004 | コード・文書レビュー | Exportパネル、利用者ガイド |
| AC-005 | 自動検証 | `npm run lint`, `npm run build` |

## 移行・互換性

保存済みファイルとプリセットへの影響はない。新しく出力するファイル名だけが変わる。

## 未決定事項

なし。
